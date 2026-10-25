import { LanguageCode } from '../types/language';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  /** Not every screen is translated yet: the rest falls back to English, and the picker says so. */
  partial?: boolean;
}

// Selectable app-language options. Native names are shown as-is (they're
// not translated); the English label is a small secondary caption.
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', partial: true },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', partial: true },
  { code: 'fr', label: 'French', nativeLabel: 'Français', partial: true },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', partial: true },
];


// Purely decorative — the multilingual "hello" cycle on the greeting
// screen. Unrelated to the language the resident ultimately selects.
export const GREETING_WORDS = [
  'Hello',
  'שלום',
  'مرحبا',
  'Bonjour',
  'Hola',
  'Ciao',
  'Hallo',
  'Привет',
  'こんにちは',
  '안녕하세요',
  'Olá',
  'Namaste',
];
