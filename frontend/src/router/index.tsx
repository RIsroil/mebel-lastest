import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

import AuthLayout from '@/layouts/AuthLayout'
import AppLayout from '@/layouts/AppLayout'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import BlockedPage from '@/pages/auth/BlockedPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

import DashboardPage from '@/pages/owner/DashboardPage'
import OrdersPage from '@/pages/owner/OrdersPage'
import OrderDetailPage from '@/pages/owner/OrderDetailPage'
import WarehousePage from '@/pages/owner/WarehousePage'
import WarehouseDetailPage from '@/pages/owner/WarehouseDetailPage'
import WorkersPage from '@/pages/owner/WorkersPage'
import WorkshopsPage from '@/pages/owner/WorkshopsPage'
import EarningsPage from '@/pages/owner/EarningsPage'
import LogsPage from '@/pages/owner/LogsPage'
import SavesPage from '@/pages/owner/SavesPage'

import CheckInPage from '@/pages/worker/CheckInPage'
import SubmitHoursPage from '@/pages/worker/SubmitHoursPage'
import MyEarningsPage from '@/pages/worker/MyEarningsPage'
import WeeklyAttendancePage from '@/pages/worker/WeeklyAttendancePage'
import WorkerTasksPage from '@/pages/worker/WorkerTasksPage'

import UsersPage from '@/pages/admin/UsersPage'

const RoleHome = () => {
  const role = useAuthStore((s) => s.user?.role)
  if (role === 'WORKER') return <Navigate to="/weekly-attendance" replace />
  if (role === 'ADMIN')  return <Navigate to="/admin/users" replace />
  return <Navigate to="/dashboard" replace />
}

export const router = createBrowserRouter([
  // ── Public sahifalar (auth kerak emas) ──────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/blocked', element: <BlockedPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // ── Himoyalangan sahifalar (login talab qilinadi) ──────────────────────────
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Default redirect — rol bo'yicha yo'naltirish
          { path: '/', element: <RoleHome /> },

          // OWNER sahifalari
          {
            element: <RoleRoute allowed={['OWNER']} />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/orders', element: <OrdersPage /> },
              { path: '/orders/:id', element: <OrderDetailPage /> },
              { path: '/warehouse', element: <WarehousePage /> },
              { path: '/warehouse/:id', element: <WarehouseDetailPage /> },
              { path: '/workers',   element: <WorkersPage /> },
              { path: '/workshops', element: <WorkshopsPage /> },
              { path: '/earnings',  element: <EarningsPage /> },
              { path: '/logs',      element: <LogsPage /> },
              { path: '/saves',     element: <SavesPage /> },
            ],
          },

          // WORKER sahifalari
          {
            element: <RoleRoute allowed={['WORKER']} />,
            children: [
              { path: '/my-tasks',           element: <WorkerTasksPage /> },
              { path: '/check-in',          element: <CheckInPage /> },
              { path: '/submit-hours',       element: <SubmitHoursPage /> },
              { path: '/my-earnings',        element: <MyEarningsPage /> },
              { path: '/weekly-attendance',  element: <WeeklyAttendancePage /> },
            ],
          },

          // ADMIN sahifalari
          {
            element: <RoleRoute allowed={['ADMIN']} />,
            children: [
              { path: '/admin/users', element: <UsersPage /> },
            ],
          },
        ],
      },
    ],
  },

  // ── Topilmagan va ruxsat yo'q sahifalar ───────────────────────────────────
  { path: '/unauthorized', element: <div style={{ padding: 24 }}>Ruxsat yo'q</div> },
  { path: '*', element: <Navigate to="/" replace /> },
])
