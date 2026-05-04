import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import Avatar from '@/components/ui/Avatar'
import styles from './Sidebar.module.css'
import { cn } from '@/utils/cn'

interface NavItem {
  to: string
  icon: string
  label: string
  badge?: number
}

interface NavSection {
  sectionLabel?: string
  items: NavItem[]
}

const OWNER_NAV: NavSection[] = [
  {
    items: [
      { to: '/dashboard', icon: '📊', label: 'Dashboard' },
      { to: '/orders',    icon: '🛋️', label: 'Buyurtmalar' },
      { to: '/warehouse', icon: '📦', label: 'Ombor' },
    ],
  },
  {
    sectionLabel: 'Ishchilar',
    items: [
      { to: '/workers',  icon: '👷', label: 'Workerlar' },
      { to: '/earnings', icon: '💰', label: 'Maosh' },
    ],
  },
]

const WORKER_NAV: NavSection[] = [
  {
    items: [
      { to: '/check-in',      icon: '📅', label: 'Kirish / Chiqish' },
      { to: '/submit-hours',  icon: '⏱️', label: 'Soatlarni topshirish' },
      { to: '/my-earnings',   icon: '💰', label: 'Mening maoshim' },
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

const Sidebar = () => {
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

  return (
    <nav className={styles.sidebar}>
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
              className={({ isActive }) =>
                cn(styles.item, isActive && styles.active)
              }
            >
              <span className={styles.itemIcon}>{item.icon}</span>
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className={styles.itemBadge}>{item.badge}</span>
              )}
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
