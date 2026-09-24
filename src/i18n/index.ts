import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import type { Locale, Text } from '@/types/domain';
import en from './en';
import es from './es';

// The UI defaults to English (as in the mockups); Spanish is selectable.
// eslint-disable-next-line import/no-named-as-default-member -- i18next's documented setup API
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;

export const currentLocale = (): Locale => (i18n.language === 'es' ? 'es' : 'en');

/** Resolve bilingual seed content or plain user content. */
export const tr = (text: Text | undefined, locale: Locale = currentLocale()): string =>
  text === undefined ? '' : typeof text === 'string' ? text : (text[locale] ?? text.en);

/** Hook returning `t`, `tr` bound to the active locale and date helpers. */
export function useI18n() {
  const { t, i18n: inst } = useTranslation();
  const locale: Locale = inst.language === 'es' ? 'es' : 'en';
  const tag = locale === 'es' ? 'es-ES' : 'en-GB';
  return {
    t,
    locale,
    tr: (text: Text | undefined) => tr(text, locale),
    setLocale: (l: Locale) => inst.changeLanguage(l),
    formatDate: (iso: string) => new Date(iso).toLocaleDateString(tag, { day: '2-digit', month: '2-digit', year: 'numeric' }),
    formatTime: (iso: string) => new Date(iso).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' }),
    formatEur: (n: number) => new Intl.NumberFormat(tag, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n),
    relative: (iso: string) => {
      const diff = (Date.now() - new Date(iso).getTime()) / 60000;
      const rtf = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
      if (diff < 60) return rtf.format(-Math.max(1, Math.round(diff)), 'minute');
      if (diff < 60 * 24) return rtf.format(-Math.round(diff / 60), 'hour');
      return rtf.format(-Math.round(diff / 1440), 'day');
    },
  };
}
