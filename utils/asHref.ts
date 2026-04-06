import type { Href } from 'expo-router';
import { router } from 'expo-router';

/** expo typed routes yeni dosyaları hemen tanımayabiliyor; yönlendirmeler için güvenli cast. */
export function asHref(path: string): Href {
  return path as unknown as Href;
}

/** Geçmiş yoksa (GO_BACK hatası) `fallbackPath` ile replace — örn. `/admin`. */
export function safeRouterBack(fallbackPath: string) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(asHref(fallbackPath));
  }
}
