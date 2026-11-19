import { create } from './createStore';
import * as Keychain from 'react-native-keychain';

export interface PublishedSlipItem {
  emp_code: string;
  emp_name: string;
  job_type?: string;
  unit_code: string;
  month: number;
  year: number;
  present_days: string | number;
  month_days: string | number;
  tot_earnings: string | number;
  tot_deductions: string | number;
  net_salary: string | number;
  de_head1?: string | number;
  de_head2?: string | number;
  de_head3?: string | number;
  de_head4?: string | number;
  pf_employee?: string | number;
  esic_employee?: string | number;
  professional_tax?: string | number;
  lwf?: string | number;
  ctc_amount?: string | number;
  absent_attendance_total?: string | number;
  gross_salary?: string | number;
  published_at: string;
  published_by?: string;
  [key: string]: any;
}

interface SalarySlipState {
  publishedSlips: Record<string, PublishedSlipItem>; // Key: `${emp_code}_${month}_${year}`
  isHydrated: boolean;

  // Actions
  publishSlip: (slip: PublishedSlipItem) => void;
  publishMultipleSlips: (slips: PublishedSlipItem[]) => void;
  getPublishedSlip: (empCode: string, month: number, year: number) => PublishedSlipItem | null;
  getPublishedSlipsForEmp: (empCode: string) => PublishedSlipItem[];
  isSlipPublished: (empCode: string, month: number, year: number) => boolean;
  hydrateSlips: () => Promise<void>;
}

const KEYCHAIN_KEY = 'ihms_published_salary_slips';

export const useSalarySlipStore = create<SalarySlipState>((set, get) => ({
  publishedSlips: {},
  isHydrated: false,

  hydrateSlips: async () => {
    try {
      const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_KEY });
      if (creds && creds.password) {
        const parsed = JSON.parse(creds.password);
        if (parsed && typeof parsed === 'object') {
          set({ publishedSlips: parsed, isHydrated: true });
          return;
        }
      }
    } catch (e) {
      console.warn('[salarySlipStore] Hydration error:', e);
    }
    set({ isHydrated: true });
  },

  publishSlip: (slip: PublishedSlipItem) => {
    const key = `${slip.emp_code.trim().toUpperCase()}_${slip.month}_${slip.year}`;
    const nextSlips = {
      ...get().publishedSlips,
      [key]: slip,
    };
    set({ publishedSlips: nextSlips });

    // Persist to secure storage so app close / re-login preserves it forever
    Keychain.setGenericPassword('slips', JSON.stringify(nextSlips), {
      service: KEYCHAIN_KEY,
    }).catch(() => {});
  },

  publishMultipleSlips: (slips: PublishedSlipItem[]) => {
    const nextSlips = { ...get().publishedSlips };
    for (const slip of slips) {
      const key = `${slip.emp_code.trim().toUpperCase()}_${slip.month}_${slip.year}`;
      nextSlips[key] = slip;
    }
    set({ publishedSlips: nextSlips });

    // Persist batch to secure storage
    Keychain.setGenericPassword('slips', JSON.stringify(nextSlips), {
      service: KEYCHAIN_KEY,
    }).catch(() => {});
  },

  getPublishedSlip: (empCode: string, month: number, year: number) => {
    const cleanCode = empCode.trim().toUpperCase();
    const key = `${cleanCode}_${month}_${year}`;
    const direct = get().publishedSlips[key];
    if (direct) return direct;

    const unpadded = cleanCode.replace(/^0+/, '');
    const all = Object.values(get().publishedSlips);
    return (
      all.find(
        (s) =>
          Number(s.month) === Number(month) &&
          Number(s.year) === Number(year) &&
          (s.emp_code.trim().toUpperCase() === cleanCode ||
            s.emp_code.replace(/^0+/, '').toUpperCase() === unpadded)
      ) || null
    );
  },

  getPublishedSlipsForEmp: (empCode: string) => {
    const cleanCode = empCode.trim().toUpperCase();
    const unpadded = cleanCode.replace(/^0+/, '');
    const all = Object.values(get().publishedSlips);
    return all.filter((s) => {
      const sCode = s.emp_code.trim().toUpperCase();
      return sCode === cleanCode || sCode.replace(/^0+/, '') === unpadded;
    });
  },

  isSlipPublished: (empCode: string, month: number, year: number) => {
    return Boolean(get().getPublishedSlip(empCode, month, year));
  },
}));

// Auto-hydrate on bundle load
useSalarySlipStore.getState().hydrateSlips();

