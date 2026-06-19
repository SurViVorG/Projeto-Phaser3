import pt from '../../locales/pt.json';
import en from '../../locales/en.json';

const TRANSLATIONS = { pt, en };

class I18n {
  constructor() {
    this.lang = localStorage.getItem('kr_lang') || 'pt';
  }

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('kr_lang', lang);
  }

  getLang() { return this.lang; }

  // t('hud.gold') → string
  t(key) {
    const parts = key.split('.');
    let val = TRANSLATIONS[this.lang];
    for (const part of parts) {
      if (!val) return key;
      val = val[part];
    }
    return val || key;
  }

  availableLangs() { return Object.keys(TRANSLATIONS); }
}

export default new I18n();
