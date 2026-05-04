import { useTopbar } from '@/context/TopbarContext'
import styles from './Topbar.module.css'

const Topbar = () => {
  const { title, actions } = useTopbar()

  return (
    <header className={styles.topbar}>
      <span className={styles.title}>{title}</span>
      <div className={styles.right}>{actions}</div>
    </header>
  )
}

export default Topbar
