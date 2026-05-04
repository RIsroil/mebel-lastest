import { useTopbar } from '@/context/TopbarContext'
import styles from './Topbar.module.css'

const Topbar = () => {
  const { title, actions, setSidebarOpen } = useTopbar()

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.hamburger}
        onClick={() => setSidebarOpen(true)}
        aria-label="Menyuni ochish"
      >
        <span />
        <span />
        <span />
      </button>
      <span className={styles.title}>{title}</span>
      <div className={styles.right}>{actions}</div>
    </header>
  )
}

export default Topbar
