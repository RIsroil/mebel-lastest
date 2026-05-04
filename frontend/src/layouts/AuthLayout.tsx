import { Outlet } from 'react-router-dom'

// TODO: Bosqich 2 da dizayn qo'shiladi
const AuthLayout = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Outlet />
  </div>
)

export default AuthLayout
