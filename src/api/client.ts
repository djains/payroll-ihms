import { apiConfig, API_ENDPOINTS } from './config';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

class ApiClient {
  private csrfToken: string | null = null;
  private sessionCookie: string | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public setCsrfToken(token: string) {
    this.csrfToken = token;
  }

  public async ensureCsrfToken(): Promise<string | null> {
    if (this.csrfToken) {
      return this.csrfToken;
    }
    try {
      const url = apiConfig.getEndpoint(API_ENDPOINTS.CSRF);
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.csrfToken) {
          this.csrfToken = data.csrfToken;
          return this.csrfToken;
        }
      }
    } catch (e) {
      console.warn('[ApiClient] Failed to auto-fetch CSRF token:', e);
    }
    return null;
  }

  public getCsrfToken(): string | null {
    return this.csrfToken;
  }

  public setSessionCookie(cookie: string) {
    this.sessionCookie = cookie;
  }

  public getSessionCookie(): string | null {
    return this.sessionCookie;
  }

  /**
   * Helper to build authenticated Image source for React Native <Image source={...} />
   * Resolves localhost/relative URLs to base backend and attaches Cookie for protected_media.
   */
  public getImageSource(urlOrPath?: string): { uri: string; headers?: Record<string, string> } | null {
    if (!urlOrPath || !urlOrPath.trim()) return null;
    const base = apiConfig.getBaseUrl().replace(/\/+$/, '');
    let resolvedUri = '';

    if (urlOrPath.startsWith('data:image')) {
      return { uri: urlOrPath };
    }

    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      if (urlOrPath.includes('127.0.0.1') || urlOrPath.includes('localhost')) {
        const pathPart = urlOrPath.replace(/^https?:\/\/[^\/]+/, '');
        resolvedUri = `${base}${pathPart.startsWith('/') ? pathPart : `/${pathPart}`}`;
      } else {
        resolvedUri = urlOrPath;
      }
    } else {
      const mediaIdx = urlOrPath.indexOf('/media/');
      if (mediaIdx !== -1) {
        resolvedUri = `${base}${urlOrPath.substring(mediaIdx)}`;
      } else if (urlOrPath.startsWith('media/')) {
        resolvedUri = `${base}/${urlOrPath}`;
      } else {
        const clean = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
        resolvedUri = `${base}/media${clean.startsWith('/media') ? clean.substring(6) : clean}`;
      }
    }

    const headers: Record<string, string> = {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    };
    if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }

    return { uri: resolvedUri, headers };
  }

  private buildHeaders(isFormData: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.csrfToken) {
      headers['X-CSRFToken'] = this.csrfToken;
    }

    if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }

    return headers;
  }

  public async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      (options.method || 'GET').toUpperCase()
    );

    if (isWrite && !this.csrfToken) {
      await this.ensureCsrfToken();
    }

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const defaultHeaders = this.buildHeaders(isFormData);
    const headers = { ...defaultHeaders, ...(options.headers as Record<string, string>) };

    const url = apiConfig.getEndpoint(path);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const rawCookie = response.headers.get('set-cookie');
      if (rawCookie) {
        const match = rawCookie.match(/sessionid=([^;]+)/);
        if (match) {
          this.sessionCookie = `sessionid=${match[1]}`;
        }
      }

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('application/pdf')) {
        data = await response.blob();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // ONLY auto-logout on 401 Unauthorized (authentic session expired / unauthenticated).
        // Standard 403 Forbidden means logged in, but specific permission level denied (DO NOT logout).
        // Only trigger logout on 403 if response explicitly indicates session invalidation/missing cookie.
        const isSessionExpired =
          response.status === 401 ||
          (response.status === 403 &&
            data &&
            typeof data === 'object' &&
            (data.detail?.includes('authentication credentials') ||
              data.detail?.includes('Session') ||
              data.error?.includes('session expired')));

        if (isSessionExpired) {
          if (this.onUnauthorizedCallback && !path.includes('/api/auth/login')) {
            console.warn(`[ApiClient] Authentic session expired (status ${response.status}). Triggering auto-logout.`);
            this.onUnauthorizedCallback();
          }
        }

        let errorMsg = '';
        if (typeof data === 'string') {
          if (data.includes('<!DOCTYPE') || data.includes('<html') || data.includes('Traceback') || data.length > 250) {
            errorMsg = `Server error (${response.status}). Please try again.`;
          } else {
            errorMsg = data;
          }
        } else if (Array.isArray(data)) {
          errorMsg = data
            .map((item) =>
              typeof item === 'string'
                ? item
                : typeof item === 'object' && item !== null
                ? Object.values(item).flat().join(', ')
                : String(item)
            )
            .join('\n');
        } else if (data && typeof data === 'object') {
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (typeof data.error === 'string') {
            errorMsg = data.error;
          } else if (typeof data.message === 'string') {
            errorMsg = data.message;
          } else {
            // Extract field-level serializer errors e.g. { client_code: ["Please Select Client."] }
            const fieldErrors = Object.entries(data)
              .map(([field, err]) => {
                const msg = Array.isArray(err) ? err.join(', ') : String(err);
                return `${field}: ${msg}`;
              })
              .join('\n');
            errorMsg = fieldErrors || `Request failed with status ${response.status}`;
          }
        } else {
          errorMsg = `Request failed with status ${response.status}`;
        }

        // Clean sanitize: never leak massive raw SQL / Python tracebacks into toasts
        if (
          errorMsg.includes('Traceback (most recent call last)') ||
          errorMsg.includes('OperationalError') ||
          errorMsg.includes('pymysql.err') ||
          errorMsg.includes('Unknown column') ||
          errorMsg.length > 300
        ) {
          errorMsg = 'Database server error. Please verify server schema or try again.';
        }

        return {
          success: false,
          error: errorMsg,
          statusCode: response.status,
          data,
        };
      }

      return {
        success: true,
        data,
        statusCode: response.status,
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Network connection error. Is backend running?';
      console.warn(`[ApiClient] Request to ${url} failed:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
        statusCode: 0,
      };
    }
  }

  public get<T = any>(path: string, headers?: Record<string, string>) {
    return this.request<T>(path, { method: 'GET', headers });
  }

  public post<T = any>(path: string, body?: any, headers?: Record<string, string>) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body || {}),
      headers,
    });
  }

  public put<T = any>(path: string, body?: any, headers?: Record<string, string>) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body || {}),
      headers,
    });
  }

  public patch<T = any>(path: string, body?: any, headers?: Record<string, string>) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body || {}),
      headers,
    });
  }

  public delete<T = any>(path: string, headers?: Record<string, string>) {
    return this.request<T>(path, { method: 'DELETE', headers });
  }

  public upload<T = any>(path: string, formData: FormData, headers?: Record<string, string>) {
    return this.request<T>(path, {
      method: 'POST',
      body: formData,
      headers,
    });
  }
}

export const apiClient = new ApiClient();

