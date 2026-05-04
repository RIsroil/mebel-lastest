import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { ToastProvider } from '@/context/ToastContext'
import Toast from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ErrorBoundary'

const App = () => (
  <ErrorBoundary>
    <ToastProvider>
      <RouterProvider router={router} />
      <Toast />
    </ToastProvider>
  </ErrorBoundary>
)

export default App
