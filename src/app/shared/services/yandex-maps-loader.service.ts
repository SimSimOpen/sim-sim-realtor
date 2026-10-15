import { Injectable } from '@angular/core';
import { EnvironmentTs } from '../../environments/environment';

/** Read from window each time: the global only appears once the script has run. */
const getYmaps3 = (): any => (window as any).ymaps3;

const SCRIPT_TIMEOUT_MS = 15000;

/**
 * Loads the Yandex Maps JS API v3 once, on first use, instead of on every page from index.html.
 * The promise rejects (rather than waiting forever) when the script fails to load - which is what
 * happens when the API key rejects the current domain.
 */
@Injectable({
  providedIn: 'root',
})
export class YandexMapsLoaderService {
  private loading?: Promise<any>;

  load(): Promise<any> {
    if (!this.loading) {
      this.loading = this.injectScript().catch((err) => {
        this.loading = undefined; // allow a retry on the next map
        throw err;
      });
    }
    return this.loading;
  }

  private injectScript(): Promise<any> {
    const existing = getYmaps3();
    if (existing) {
      return existing.ready.then(() => existing);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${EnvironmentTs.YANDEX_MAPS_API_KEY}&lang=en_US`;
      script.async = true;

      const timer = setTimeout(() => reject(new Error('Yandex Maps script timed out')), SCRIPT_TIMEOUT_MS);
      script.onload = () => {
        const ymaps3 = getYmaps3();
        if (!ymaps3) {
          clearTimeout(timer);
          reject(new Error('Yandex Maps script loaded but ymaps3 is missing (check the API key)'));
          return;
        }
        ymaps3.ready.then(
          () => {
            clearTimeout(timer);
            resolve(ymaps3);
          },
          (err: unknown) => {
            clearTimeout(timer);
            reject(err);
          },
        );
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error('Yandex Maps script failed to load (key rejected for this domain?)'));
      };
      document.head.appendChild(script);
    });
  }
}
