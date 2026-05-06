import { createBrowserRouter, Navigate } from 'react-router-dom'

import AuthLayout from '@/layouts/AuthLayout'
import AppLayout from '@/layouts/AppLayout'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import BlockedPage from '@/pages/auth/BlockedPage'

import DashboardPage from '@/pages/owner/DashboardPage'
import OrdersPage from '@/pages/owner/OrdersPage'
import OrderDetailPage from '@/pages/owner/OrderDetailPage'
import WarehousePage from '@/pages/owner/WarehousePage'
import WarehouseDetailPage from '@/pages/owner/WarehouseDetailPage'
import WorkersPage from '@/pages/owner/WorkersPage'
import WorkshopsPage from '@/pages/owner/WorkshopsPage'
import EarningsPage from '@/pages/owner/EarningsPage'
import LogsPage from '@/pages/owner/LogsPage'

import CheckInPage from '@/pages/worker/CheckInPage'
import SubmitHoursPage from '@/pages/worker/SubmitHoursPage'
import MyEarningsPage from '@/pages/worker/MyEarningsPage'

import UsersPage from '@/pages/admin/UsersPage'

export const router = createBrowserRouter([
  // ── Public sahifalar (auth kerak emas) ──────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/blocked', element: <BlockedPage /> },
    ],
  },

  // ── Himoyalangan sahifalar (login talab qilinadi) ──────────────────────────
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Default redirect — login bo'lgandan so'ng rol bo'yicha yo'naltirish
          { path: '/', element: <Navigate to="/dashboard" replace /> },

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
            ],
          },

          // WORKER sahifalari
          {
            element: <RoleRoute allowed={['WORKER']} />,
            children: [
              { path: '/check-in', element: <CheckInPage /> },
              { path: '/submit-hours', element: <SubmitHoursPage /> },
              { path: '/my-earnings', element: <MyEarningsPage /> },
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
