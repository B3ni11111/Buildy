export type LanguageCode = 'en' | 'he' | 'ar' | 'ru' | 'fr' | 'es';

export const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'he', 'ar', 'ru', 'fr', 'es'];

export const RTL_LANGUAGES: LanguageCode[] = ['he', 'ar'];

export function isRtl(language: LanguageCode): boolean {
  return RTL_LANGUAGES.includes(language);
}
