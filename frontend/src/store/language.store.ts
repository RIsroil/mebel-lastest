import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'uz' | 'ru' | 'en' | 'uz-cyrillic'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

const getDefaultLanguage = (): Language => {
  const stored = localStorage.getItem('mebel-language')
  if (stored === 'uz' || stored === 'ru' || stored === 'en' || stored === 'uz-cyrillic') {
    return stored
  }
  return 'uz'
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: getDefaultLanguage(),
      setLanguage: (lang: Language) => set({ language: lang }),
    }),
    {
      name: 'mebel-language',
      partialize: (state) => ({ language: state.language }),
    }
  )
)
