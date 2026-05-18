import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'uz'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

const getDefaultLanguage = (): Language => {
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
