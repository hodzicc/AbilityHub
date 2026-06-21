import {
  BookOpen,
  Calculator,
  MessageCircle,
  Palette,
  Clock,
  Gamepad2,
  AppWindow,
  type LucideIcon,
} from 'lucide-react'

// Maps an application's `iconName` (set by the backend/admin form) to its
// Lucide component. Adding a new icon choice means adding one entry here —
// no other file needs to change.
export const APP_ICON_MAP: Record<string, LucideIcon> = {
  BookOpen, Calculator, MessageCircle, Palette, Clock, Gamepad2, AppWindow,
}

export function getAppIcon(iconName: string | undefined): LucideIcon {
  return (iconName && APP_ICON_MAP[iconName]) || AppWindow
}
