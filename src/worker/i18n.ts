export type Locale = 'en' | 'de';

export const resolveLocale = (acceptLanguage?: string): Locale => {
    if (!acceptLanguage) {
        return 'en';
    }

    const normalized = acceptLanguage.toLowerCase();
    // Accept both "de" and regional variants like "de-DE".
    if (/(^|,|\s)de(?:-|;|,|$)/.test(normalized)) {
        return 'de';
    }

    return 'en';
};

export const t = (locale: Locale, en: string, de: string): string => {
    return locale === 'de' ? de : en;
};
