import { Outlet } from 'react-router-dom'

// TODO: Bosqich 3 da Sidebar va Topbar qo'shiladi
const AppLayout = () => (
  <div style={{ display: 'flex', height: '100%', background: 'var(--bg)' }}>
    <aside style={{ width: 'var(--sidebar-w)', background: 'var(--text)', flexShrink: 0 }}>
      {/* Sidebar — Bosqich 3 */}
    </aside>
    <main style={{ flex: 1, overflow: 'auto' }}>
      <Outlet />
    </main>
  </div>
)

export default AppLayout
