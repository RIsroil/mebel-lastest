import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import Avatar from '@/components/ui/Avatar'
import styles from './Sidebar.module.css'
import { cn } from '@/utils/cn'

interface Props {
  isOpen:  boolean
  onClose: () => void
}

interface NavItem {
  to:     string
  icon:   string
  label:  string
}

interface NavSection {
  sectionLabel?: string
  items:         NavItem[]
}

const OWNER_NAV: NavSection[] = [
  {
    items: [
      { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
      { to: '/orders',     icon: '🛋️', label: 'Buyurtmalar' },
      { to: '/warehouse',  icon: '📦', label: 'Ombor' },
      { to: '/workshops',  icon: '🏭', label: 'Korxonalar' },
    ],
  },
  {
    sectionLabel: 'Ishchilar',
    items: [
      { to: '/workers',  icon: '👷', label: 'Workerlar' },
      { to: '/earnings', icon: '💰', label: 'Maosh' },
    ],
  },
  {
    sectionLabel: 'Hisobot',
    items: [
      { to: '/logs', icon: '📋', label: 'Moliyaviy jurnal' },
    ],
  },
]

const WORKER_NAV: NavSection[] = [
  {
    items: [
      { to: '/check-in',     icon: '📅', label: 'Kirish / Chiqish' },
      { to: '/submit-hours', icon: '⏱️', label: 'Soatlarni topshirish' },
      { to: '/my-earnings',  icon: '💰', label: 'Mening maoshim' },
    ],
  },
]

const ADMIN_NAV: NavSection[] = [
  {
    items: [
      { to: '/admin/users', icon: '👥', label: 'Foydalanuvchilar' },
    ],
  },
]

const ROLE_LABEL: Record<string, string> = {
  OWNER:  'Owner',
  WORKER: 'Worker',
  ADMIN:  'Admin',
}

const Sidebar = ({ isOpen, onClose }: Props) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  if (!user) return null

  const navSections =
    user.role === 'OWNER'  ? OWNER_NAV  :
    user.role === 'WORKER' ? WORKER_NAV :
    ADMIN_NAV

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleNavClick = () => {
    // Mobilda nav item bosilganda sidebarni yopish
    onClose()
  }

  return (
    <nav className={cn(styles.sidebar, isOpen && styles.sidebarOpen)}>
      {/* Mobile close button */}
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Yopish"
      >
        ×
      </button>

      <div className={styles.logo}>
        <div className={styles.logoText}>✦ Mebel MS</div>
        {user.workshopName && (
          <div className={styles.logoSub}>{user.workshopName}</div>
        )}
      </div>

      {navSections.map((section, i) => (
        <div key={i} className={styles.section}>
          {section.sectionLabel && (
            <div className={styles.sectionLabel}>{section.sectionLabel}</div>
          )}
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(styles.item, isActive && styles.active)
              }
            >
              <span className={styles.itemIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className={styles.bottom}>
        <div className={styles.userRow}>
          <Avatar
            name={user.fullName || user.username}
            role={user.role}
            size="md"
          />
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {user.fullName || user.username}
            </div>
            <div className={styles.userRole}>{ROLE_LABEL[user.role]}</div>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Chiqish"
            type="button"
          >
            ⏻
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Sidebar
