import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LANGUAGE_KEY = 'app.language';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly supported = ['en', 'fr', 'es', 'ar'];

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('en');
  }

  init(): void {
    const saved = localStorage.getItem(LANGUAGE_KEY) || 'en';
    this.use(saved);
  }

  setLanguage(lang: string): void {
    this.use(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  }

  getLanguage(): string {
    return this.translate.currentLang || 'en';
  }

  private use(lang: string): void {
    const next = this.supported.includes(lang) ? lang : 'en';
    this.translate.use(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  }
}
