import { useLanguage } from '../i18n/LanguageContext';
import type { PaymentSettings } from '../types/building';

/**
 * "2026-10" -> "October 2026" in the app's language. In the dev-only test mode the backend sends a
 * full time ("2026-10-22T09:05:00.000Z", a 5-minute "month") -> "22 Oct, 12:05".
 */
export function useMonthLabel() {
  const { language } = useLanguage();
  return (month: string) => {
    if (month.includes('T')) {
      return new Date(month).toLocaleString(language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
    const [year, m] = month.split('-').map(Number);
    return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString(language, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  };
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = { openMode: 'manual', openDay: 1, defaultFee: null, defaultMethod: 'card' };

export const paymentSettingsValid = (s: PaymentSettings) =>
  Number.isInteger(s.openDay) && s.openDay >= 1 && s.openDay <= 28 && (s.defaultFee === null || s.defaultFee >= 0);
