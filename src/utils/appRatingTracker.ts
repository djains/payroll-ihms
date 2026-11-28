import * as Keychain from 'react-native-keychain';

const APP_RATING_SERVICE = 'ihms_app_rating_state';

export interface AppRatingState {
  punchInCount: number;
  hasRated: boolean;
  neverAskAgain: boolean;
  lastPromptedCount: number;
}

/**
 * Loads current rating tracking state from Keychain.
 */
export async function getAppRatingState(): Promise<AppRatingState> {
  try {
    const creds = await Keychain.getGenericPassword({ service: APP_RATING_SERVICE });
    if (creds && creds.password) {
      const parsed = JSON.parse(creds.password);
      return {
        punchInCount: Number(parsed.punchInCount || parsed.loginCount) || 0,
        hasRated: Boolean(parsed.hasRated),
        neverAskAgain: Boolean(parsed.neverAskAgain),
        lastPromptedCount: Number(parsed.lastPromptedCount) || 0,
      };
    }
  } catch {}

  return {
    punchInCount: 0,
    hasRated: false,
    neverAskAgain: false,
    lastPromptedCount: 0,
  };
}

/**
 * Saves rating tracking state into Keychain.
 */
async function saveAppRatingState(state: AppRatingState): Promise<void> {
  try {
    await Keychain.setGenericPassword('rating_state', JSON.stringify(state), {
      service: APP_RATING_SERVICE,
    });
  } catch {}
}

/**
 * Increments Punch IN counter after a successful shift punch IN.
 * Returns true if the user has reached their 5th Punch IN (or every 10 punches thereafter if postponed)
 * and has not yet rated or dismissed permanently.
 */
export async function trackPunchInAndCheckPrompt(): Promise<{ shouldPrompt: boolean; currentCount: number }> {
  const current = await getAppRatingState();
  const nextCount = current.punchInCount + 1;

  if (current.hasRated || current.neverAskAgain) {
    await saveAppRatingState({ ...current, punchInCount: nextCount });
    return { shouldPrompt: false, currentCount: nextCount };
  }

  // Trigger on exact 5th Punch IN, or every 10 punches thereafter if postponed
  const shouldPrompt = nextCount === 5 || (nextCount > 5 && (nextCount - current.lastPromptedCount) >= 10);

  const updated: AppRatingState = {
    ...current,
    punchInCount: nextCount,
    lastPromptedCount: shouldPrompt ? nextCount : current.lastPromptedCount,
  };

  await saveAppRatingState(updated);
  return { shouldPrompt, currentCount: nextCount };
}

/**
 * Marks that user completed rating (e.g. redirected to Play Store or Complaint screen).
 */
export async function markAppAsRated(): Promise<void> {
  const current = await getAppRatingState();
  await saveAppRatingState({ ...current, hasRated: true });
}

/**
 * Marks that user chose "Don't ask again".
 */
export async function markNeverAskAgain(): Promise<void> {
  const current = await getAppRatingState();
  await saveAppRatingState({ ...current, neverAskAgain: true });
}
