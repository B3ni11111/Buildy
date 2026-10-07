import { OnboardingData } from '../types/onboarding';

const STORAGE_KEY = 'buildy_onboarding_profile';

export function saveOnboardingData(data: OnboardingData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getOnboardingData(): OnboardingData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as OnboardingData;
    // Profiles saved before 2026-10-06 also carry a userType — ignored now.
    if (!parsed.language || !parsed.name) return null;
    return { language: parsed.language, name: parsed.name };
  } catch {
    return null;
  }
}

export function clearOnboardingData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
