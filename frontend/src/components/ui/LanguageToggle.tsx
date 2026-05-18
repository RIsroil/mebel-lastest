import { useLanguageStore, type Language } from '@/store/language.store'
import styles from './LanguageToggle.module.css'

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'uz', label: 'O\'zbekcha', flag: '🇺🇿' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'uz-cyrillic', label: 'Ўзбекча', flag: '🇺🇿' },
]

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguageStore()

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
  }

  return (
    <div className={styles.toggleContainer}>
      <div className={styles.toggleLabel}>🌐 Til:</div>
      <div className={styles.toggleOptions}>
        {languages.map((lang) => (
          <button
            key={lang.value}
            type="button"
            className={`${styles.toggleBtn} ${language === lang.value ? styles.active : ''}`}
            onClick={() => handleLanguageChange(lang.value)}
            title={lang.label}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    </div>
  )
}

export default LanguageToggle
