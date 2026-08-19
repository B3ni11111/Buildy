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
    if (!parsed.language || !parsed.name || !parsed.userType) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOnboardingData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
