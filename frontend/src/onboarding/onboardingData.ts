import { LanguageCode } from '../types/language';
import { TranslationKey } from '../i18n/translations';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

// Selectable app-language options. Native names are shown as-is (they're
// not translated); the English label is a small secondary caption.
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
];

export type UserTypeIcon = 'home' | 'key' | 'group' | 'admin';
export type UserTypeValue = 'owner' | 'tenant' | 'committee' | 'manager';

export interface UserTypeOption {
  value: UserTypeValue;
  icon: UserTypeIcon;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
}

// More resident types can be appended here later without touching the
// step component itself — just add an entry and its two translation
// keys (`userType.<value>.label` / `.description`) to every language in
// src/i18n/translations.ts.
export const USER_TYPE_OPTIONS: UserTypeOption[] = [
  { value: 'owner', icon: 'home', labelKey: 'userType.owner.label', descriptionKey: 'userType.owner.description' },
  { value: 'tenant', icon: 'key', labelKey: 'userType.tenant.label', descriptionKey: 'userType.tenant.description' },
  {
    value: 'committee',
    icon: 'group',
    labelKey: 'userType.committee.label',
    descriptionKey: 'userType.committee.description',
  },
  {
    value: 'manager',
    icon: 'admin',
    labelKey: 'userType.manager.label',
    descriptionKey: 'userType.manager.description',
  },
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
