import { LanguageCode, SUPPORTED_LANGUAGES } from '../types/language';

const STORAGE_KEY = 'buildy_language';

// The resident's chosen app language, persisted independently of the
// rest of the onboarding profile so it can be changed at any time (in
// onboarding, or later from the account menu) and takes effect
// immediately.
export function getLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return 'en';
}

export function saveLanguage(code: LanguageCode): void {
  localStorage.setItem(STORAGE_KEY, code);
}
