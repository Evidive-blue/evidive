'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { type Locale, isValidLocale } from './config';
import { setLocale as setLocaleCookie } from './get-locale';

interface LocaleContextValue {
  locale: Locale;
  messages: Record<string, unknown>;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale: Locale;
  initialMessages: Record<string, unknown>;
}

export function LocaleProvider({
  children,
  initialLocale,
  initialMessages,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>(initialMessages);

  const setLocale = useCallback(async (newLocale: Locale) => {
    if (!isValidLocale(newLocale) || newLocale === locale) return;

    // Set cookie
    setLocaleCookie(newLocale);

    // Load new messages
    try {
      const newMessages = (await import(`@/messages/${newLocale}.json`)).default;
      setMessages(newMessages);
      setLocaleState(newLocale);

      // Refresh page to update server components
      window.location.reload();
    } catch (error) {
      console.error('Failed to load messages for locale:', newLocale, error);
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, messages, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
