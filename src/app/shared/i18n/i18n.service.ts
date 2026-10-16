import { effect, Injectable, signal } from '@angular/core';
import { en, ru, TranslationKey, uz } from './translations';

export type Lang = 'uz' | 'ru' | 'en';

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
];

const STORAGE_KEY = 'simsim.admin.lang';
const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { en, uz, ru };

/**
 * UI language. The choice is remembered per browser; first-time visitors get their browser's
 * language when it is one we support, otherwise Uzbek.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(initialLang());

  constructor() {
    effect(() => {
      const lang = this.lang();
      document.documentElement.lang = lang;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // Storage can be blocked (private mode); the choice then lasts for this visit only.
      }
    });
  }

  setLang(lang: Lang) {
    this.lang.set(lang);
  }

  /**
   * Translates `key`, filling `{name}` placeholders from `params`. A value written as
   * "one|other" (or "one|few|many" in Russian) is picked by `params.count`.
   */
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const lang = this.lang();
    let text: string = DICTIONARIES[lang][key] ?? en[key] ?? key;
    if (params && 'count' in params && text.includes('|')) {
      text = pickPlural(text.split('|'), Number(params['count']), lang);
    }
    if (params) {
      text = text.replace(/\{(\w+)\}/g, (match, name) =>
        name in params ? String(params[name]) : match,
      );
    }
    return text;
  }
}

function pickPlural(forms: string[], count: number, lang: Lang): string {
  if (forms.length === 3) {
    const rule = new Intl.PluralRules('ru').select(count);
    return rule === 'one' ? forms[0] : rule === 'few' ? forms[1] : forms[2];
  }
  return new Intl.PluralRules(lang).select(count) === 'one' ? forms[0] : forms[forms.length - 1];
}

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved;
  } catch {
    // Fall through to the browser language.
  }
  const browser = (navigator.language || '').slice(0, 2).toLowerCase();
  return browser === 'ru' || browser === 'en' ? browser : 'uz';
}
