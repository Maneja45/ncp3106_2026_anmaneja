
import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'

type Notification = {
  id: number
  title: string
  message: string
  time: string
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: 'Welcome to SustansyaBox!',
    message: 'Start tracking your daily nutrition.',
    time: 'Just now',
    read: false,
  },
  {
    id: 2,
    title: 'Meal reminder',
    message: 'Remember to log your meals today.',
    time: 'Today',
    read: false,
  },
]

export default function NotificationBell() {
  const [open, setOpen] = useState(false)

  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications)

  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(
    notification => !notification.read
  ).length

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )
    }
  }, [])

  const markAllRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({
        ...notification,
        read: true,
      }))
    )
  }

  const markRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* =====================================
          NOTIFICATION BUTTON
          Matches the theme toggle
          ===================================== */}

      <button
        type="button"
        className="sb-theme-button"
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          position: 'relative',
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Bell size={20} />

        {/* Unread notification indicator */}

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              minWidth: 18,
              height: 18,
              borderRadius: 20,
              background: '#A7BF86',
              color: '#253C2C',
              fontSize: 10,
              fontWeight: 700,
              display: 'grid',
              placeItems: 'center',
              padding: '0 3px',
              border: '2px solid var(--surface)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* =====================================
          NOTIFICATION DROPDOWN
          ===================================== */}

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: 'absolute',
            top: 52,
            right: 0,
            width: 'min(350px, calc(100vw - 32px))',
            maxHeight: 420,
            overflowY: 'auto',
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 16px 45px rgba(0,0,0,0.16)',
            padding: 16,
            animation: 'notificationFadeIn 0.2s ease-out',
          }}
        >
          <style>
            {`
              @keyframes notificationFadeIn {
                from {
                  opacity: 0;
                  transform: translateY(-8px) scale(0.98);
                }

                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
            `}
          </style>

          {/* DROPDOWN HEADER */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div>
              <strong
                style={{
                  fontSize: 16,
                  display: 'block',
                }}
              >
                Notifications
              </strong>

              <span
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                }}
              >
                {unreadCount === 0
                  ? 'All caught up!'
                  : `${unreadCount} unread notifications`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              style={{
                border: 0,
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                padding: 5,
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* NOTIFICATION ITEMS */}

          {notifications.length === 0 ? (
            <p
              style={{
                opacity: 0.65,
                fontSize: 13,
                textAlign: 'center',
                padding: 20,
              }}
            >
              No notifications yet.
            </p>
          ) : (
            notifications.map(notification => (
              <button
                type="button"
                key={notification.id}
                onClick={() => markRead(notification.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  background: notification.read
                    ? 'transparent'
                    : 'rgba(159, 190, 126, 0.14)',
                  padding: 12,
                  marginBottom: 7,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <strong style={{ fontSize: 13 }}>
                    {notification.title}
                  </strong>

                  {!notification.read && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#88a96c',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>

                <p
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    margin: '6px 0',
                    lineHeight: 1.5,
                  }}
                >
                  {notification.message}
                </p>

                <small
                  style={{
                    opacity: 0.55,
                    fontSize: 10,
                  }}
                >
                  {notification.time}
                </small>
              </button>
            ))
          )}

          {/* MARK ALL AS READ */}

          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              width: '100%',
              marginTop: 8,
              padding: 10,
              border: '1px solid var(--border)',
              borderRadius: 10,
              background: 'rgba(159, 190, 126, 0.17)',
              color: 'var(--text)',
              cursor: unreadCount
                ? 'pointer'
                : 'default',
              opacity: unreadCount ? 1 : 0.5,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <CheckCheck size={15} />
            Mark all as read
          </button>
        </div>
      )}
    </div>
  )
}
