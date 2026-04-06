import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase ortam değişkenleri eksik. .env içinde EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlayın; EAS için expo.dev üzerinde aynı değişkenleri ekleyin.'
  );
}

/** Expo web SSR (Node) ortamında `window` yok; AsyncStorage burada patlıyor. Web’de localStorage + SSR güvenli. */
function createAuthStorage() {
  if (Platform.OS !== 'web') {
    return AsyncStorage;
  }
  return {
    getItem: (key: string) => {
      if (typeof window === 'undefined') return Promise.resolve(null);
      return Promise.resolve(window.localStorage.getItem(key));
    },
    setItem: (key: string, value: string) => {
      if (typeof window === 'undefined') return Promise.resolve();
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return Promise.resolve();
      window.localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
