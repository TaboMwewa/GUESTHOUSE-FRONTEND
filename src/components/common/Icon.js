// src/components/common/Icon.js
import * as Icons from 'lucide-react';

const iconMap = {
  // Navigation icons
  'overview': Icons.LayoutDashboard,
  'rooms': Icons.Bed,
  'checkin': Icons.CalendarCheck,
  'guests': Icons.Users,
  'payments': Icons.CreditCard,
  'budgets': Icons.FileText,
  'requests': Icons.Inbox,
  
  // Sidebar branding & actions
  'logo': Icons.Building2,
  'logout': Icons.LogOut,
  
  // Stats cards
  'revenue': Icons.TrendingUp,
  'occupied': Icons.DoorOpen,
  'available': Icons.DoorClosed,
  'pending': Icons.Clock,
  'active-guests': Icons.UserCheck,
  'transactions': Icons.Receipt,
  'approved-budget': Icons.CheckCircle,
  'awaiting-approval': Icons.Hourglass,
  'rooms-count': Icons.Hotel,
  
  // Action buttons
  'edit': Icons.Pencil,
  'delete': Icons.Trash2,
  'trash': Icons.Trash2,
  'view': Icons.Eye,
  'review': Icons.Star,
  'checkout': Icons.LogOut,
  'submit': Icons.Send,
  'approve': Icons.ThumbsUp,
  'reject': Icons.ThumbsDown,
  'add': Icons.Plus,
  'plus': Icons.Plus,
  'close': Icons.X,
  'save': Icons.Save,
  
  // Room related
  'bed': Icons.Bed,
  'room-standard': Icons.Bed,
  'room-deluxe': Icons.BedDouble,
  'room-suite': Icons.LayoutTemplate,
  'maintenance': Icons.Wrench,
  
  // Budget related
  'budget-draft': Icons.File,
  'budget-pending': Icons.Clock,
  'budget-approved': Icons.CheckCircle2,
  'budget-rejected': Icons.XCircle,
  
  // Payment methods
  'cash': Icons.Coins,
  'card': Icons.CreditCard,
  'credit-card': Icons.CreditCard,
  'mobile': Icons.Smartphone,
  
  // Modal and Form icons
  'calendar': Icons.Calendar,
  'list': Icons.List,
  'purpose': Icons.FileText,
  'comment': Icons.MessageSquare,
  'alert-circle': Icons.AlertCircle,
  'check-circle': Icons.CheckCircle,
  'user': Icons.User,
  'phone': Icons.Phone,
  'users': Icons.Users,
  'info': Icons.Info,
  'calculator': Icons.Calculator,

  'lock': Icons.Lock,
  'log-in': Icons.LogIn,
  'shield': Icons.Shield,
  'clock': Icons.Clock,
};

export default function Icon({ name, size = 20, className = '', color = '' }) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found, using fallback`);
    return <span className={className}>🔸</span>;
  }
  
  const style = color ? { color } : {};
  return <IconComponent size={size} className={className} style={style} strokeWidth={1.5} />;
}