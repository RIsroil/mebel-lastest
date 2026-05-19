import {
  Calendar,
  Edit2,
  Trash2,
  Search,
  Image,
  X,
  DollarSign,
  CheckCircle,
  Clock,
  Moon,
  Home,
  Settings,
  Users,
  ShoppingCart,
  BookOpen,
  Warehouse,
  Package,
  BarChart3,
  LogOut,
  Menu,
  Plus,
  ChevronDown,
  Eye,
  Copy,
  AlertCircle,
  Mail,
  Phone,
  type LucideIcon,
} from 'lucide-react'

export const IconMap: Record<string, LucideIcon> = {
  '📅': Calendar,
  '✏️': Edit2,
  '✎': Edit2,
  '🗑️': Trash2,
  '🔍': Search,
  '📸': Image,
  '✕': X,
  '💰': DollarSign,
  '✅': CheckCircle,
  '⏳': Clock,
  '🌙': Moon,
  '🏠': Home,
  '⚙️': Settings,
  '👥': Users,
  '🛒': ShoppingCart,
  '📖': BookOpen,
  '📦': Warehouse,
  '📊': BarChart3,
  '🚪': LogOut,
  '☰': Menu,
  '➕': Plus,
  '▼': ChevronDown,
  '👁️': Eye,
  '📋': Copy,
  '⚠️': AlertCircle,
  '✉️': Mail,
  '📞': Phone,
}

export const getIcon = (emoji: string): LucideIcon => {
  return IconMap[emoji] || Home
}

interface IconProps {
  emoji: string
  size?: number
  className?: string
}

export const Icon = ({ emoji, size = 20, className = '' }: IconProps) => {
  const IconComponent = getIcon(emoji)
  return <IconComponent size={size} className={className} />
}
