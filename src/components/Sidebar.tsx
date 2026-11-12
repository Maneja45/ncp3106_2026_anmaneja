
import { useState } from 'react'
import {
  LayoutDashboard,
  Scale,
  History,
  CalendarDays,
  BookOpen,
  ChartNoAxesColumn,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  UsersRound,
} from 'lucide-react'

// Smart Lunchbox is now the first navigation item.
const navigation = [
  { label: 'Smart Lunchbox', icon: Scale },
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Meal History', icon: History },
  { label: 'Meal Planner', icon: CalendarDays },
  { label: 'Recipes', icon: BookOpen },
  { label: 'Nutrition Reports', icon: ChartNoAxesColumn },
  { label: 'About Us', icon: UsersRound },
  { label: 'Settings', icon: Settings },
]

type SidebarProps = {
  activePage?: string
  onNavigate?: (page: string) => void
}

export default function Sidebar({
  activePage = 'Smart Lunchbox',
  onNavigate,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const handleNavigate = (page: string) => {
    onNavigate?.(page)
  }

  return (
    <aside
      style={{
        width: collapsed ? 84 : 260,
        minWidth: collapsed ? 84 : 260,
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        transition:
          'width 0.3s ease, min-width 0.3s ease',
      }}
    >
      {/* Brand and collapse button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 42,
          padding: '0 8px',
          gap: 8,
        }}
      >
        {!collapsed && (
          <span
            style={{
              color: 'var(--primary)',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-1px',
              whiteSpace: 'nowrap',
            }}
          >
            SustansyaBox.
          </span>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={
            collapsed ? 'Expand sidebar' : 'Collapse sidebar'
          }
          title={
            collapsed ? 'Expand sidebar' : 'Collapse sidebar'
          }
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text)',
            padding: 8,
            display: 'flex',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--border)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {collapsed ? (
            <PanelLeftOpen size={21} />
          ) : (
            <PanelLeftClose size={21} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {navigation.map(({ label, icon: Icon }) => {
          const active = activePage === label

          return (
            <button
              key={label}
              type="button"
              title={collapsed ? label : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={() => handleNavigate(label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed
                  ? 'center'
                  : 'flex-start',
                gap: 14,
                width: '100%',
                padding: '14px 13px',
                border: 'none',
                borderRadius: 12,
                background: active
                  ? 'var(--primary)'
                  : 'transparent',
                color: active
                  ? 'var(--bg)'
                  : 'var(--text)',
                fontWeight: active ? 700 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition:
                  'background 0.25s ease, color 0.25s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  'translateX(3px)'

                if (!active) {
                  e.currentTarget.style.background =
                    'var(--border)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  'translateX(0)'

                if (!active) {
                  e.currentTarget.style.background =
                    'transparent'
                }
              }}
            >
              <Icon
                size={20}
                strokeWidth={1.9}
                style={{ flexShrink: 0 }}
              />

              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User profile */}
      <button
        type="button"
        onClick={() => handleNavigate('Settings')}
        title={collapsed ? 'My Account' : undefined}
        aria-label="Open My Profile"
        style={{
          marginTop: 'auto',
          border: 'none',
          borderTop: '1px solid var(--border)',
          padding: '20px 0 0',
          background: 'transparent',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed
            ? 'center'
            : 'flex-start',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--secondary)',
            color: '#26382E',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <UserRound size={20} />
        </div>

        {!collapsed && (
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              My Account
            </div>

            <div
              style={{
                fontSize: 12,
                color: 'var(--muted)',
              }}
            >
              Profile & preferences
            </div>
          </div>
        )}
      </button>
    </aside>
  )
}
