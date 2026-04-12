import { es } from './es';
import { en } from './en';

export type Lang = 'es' | 'en';
export type { Translations } from './es';

export const translations = { es, en };

export function useTranslation(lang: Lang) {
  return translations[lang] ?? translations.es;
}

export { es, en };
