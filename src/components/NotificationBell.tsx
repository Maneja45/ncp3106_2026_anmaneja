
import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  CheckCheck,
  X,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  UtensilsCrossed,
  Cpu,
} from 'lucide-react'

type NoticeType =
  | 'info'
  | 'warning'
  | 'critical'
  | 'success'
  | 'meal'
  | 'device'

type Notice = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: NoticeType
}

type NotificationBellProps = {
  caloriesConsumed?: number
  caloriesGoal?: number
  sugarConsumed?: number
  sugarGoal?: number
  sodiumConsumed?: number
  sodiumGoal?: number
}

const STORAGE_KEY = 'sustansyabox_notifications_v2'

const initialNotices: Notice[] = [
  {
    id: 'welcome',
    title: 'Welcome to SustansyaBox!',
    message:
      'Track your meals, monitor nutrition, and manage your smart lunchbox in one place.',
    time: 'Welcome',
    read: false,
    type: 'success',
  },
  {
    id: 'preview',
    title: 'Frontend Preview Mode',
    message:
      'Nutrition values are currently for demonstration. Physical device readings will be available after integration.',
    time: 'System',
    read: false,
    type: 'info',
  },
]

function loadNotices(): Notice[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) return initialNotices

    const parsed: unknown = JSON.parse(stored)

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is Notice =>
          item !== null &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          typeof item.message === 'string' &&
          typeof item.read === 'boolean' &&
          typeof item.type === 'string'
      )
    }
  } catch {
    // Use default notifications if storage is unavailable.
  }

  return initialNotices
}

function createNutritionNotice(
  name: string,
  consumed: number | undefined,
  goal: number | undefined,
  unit: string
): Notice | null {
  if (
    consumed === undefined ||
    goal === undefined ||
    !Number.isFinite(consumed) ||
    !Number.isFinite(goal) ||
    goal <= 0
  ) {
    return null
  }

  const percentage = (consumed / goal) * 100

  if (percentage < 80) return null

  const exceeded = percentage > 100
  const reached = percentage === 100

  const status = exceeded
    ? 'exceeded'
    : reached
      ? 'reached'
      : 'warning'

  const title = exceeded
    ? `${name} Goal Exceeded`
    : reached
      ? `${name} Goal Reached`
      : `${name} Intake Warning`

  const message = exceeded
    ? `Your ${name.toLowerCase()} intake is ${consumed.toLocaleString()} ${unit}, exceeding your daily goal of ${goal.toLocaleString()} ${unit}.`
    : reached
      ? `You have reached your daily ${name.toLowerCase()} goal of ${goal.toLocaleString()} ${unit}.`
      : `You have used ${Math.round(percentage)}% of your daily ${name.toLowerCase()} goal.`

  return {
    id: `nutrition-${name.toLowerCase()}-${status}-${goal}`,
    title,
    message: `${message} (Preview data)`,
    time: 'Nutrition preview',
    read: false,
    type: exceeded ? 'critical' : 'warning',
  }
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertTriangle,
  success: CheckCircle2,
  meal: UtensilsCrossed,
  device: Cpu,
}

export default function NotificationBell({
  caloriesConsumed,
  caloriesGoal,
  sugarConsumed,
  sugarGoal,
  sodiumConsumed,
  sodiumGoal,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notices, setNotices] = useState<Notice[]>(loadNotices)
  const rootRef = useRef<HTMLDivElement>(null)

  const unread = notices.filter((notice) => !notice.read).length

  // Save notifications when their state changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notices))
    } catch {
      // Browser storage may be unavailable.
    }
  }, [notices])

  // Generate warnings from available nutrition preview values.
  useEffect(() => {
    const generated = [
      createNutritionNotice(
        'Calories',
        caloriesConsumed,
        caloriesGoal,
        'kcal'
      ),
      createNutritionNotice(
        'Sugar',
        sugarConsumed,
        sugarGoal,
        'g'
      ),
      createNutritionNotice(
        'Sodium',
        sodiumConsumed,
        sodiumGoal,
        'mg'
      ),
    ].filter((notice): notice is Notice => notice !== null)

    if (generated.length === 0) return

    setNotices((previous) => {
      const existing = new Set(previous.map((item) => item.id))
      const newNotices = generated.filter(
        (item) => !existing.has(item.id)
      )

      if (newNotices.length === 0) return previous

      return [...newNotices, ...previous]
    })
  }, [
    caloriesConsumed,
    caloriesGoal,
    sugarConsumed,
    sugarGoal,
    sodiumConsumed,
    sodiumGoal,
  ])

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const markAsRead = (id: string) => {
    setNotices((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    )
  }

  const markAllAsRead = () => {
    setNotices((previous) =>
      previous.map((item) => ({
        ...item,
        read: true,
      }))
    )
  }

  const deleteNotice = (id: string) => {
    setNotices((previous) =>
      previous.filter((item) => item.id !== id)
    )
  }

  const clearRead = () => {
    setNotices((previous) =>
      previous.filter((item) => !item.read)
    )
  }

  return (
    <div ref={rootRef} className="sb-notification-root">
      <button
        type="button"
        className="sb-theme-button sb-notification-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        aria-controls="sb-notification-panel"
        title="Notifications"
      >
        <Bell size={20} />

        {unread > 0 && (
          <span className="sb-notification-count">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <section
          id="sb-notification-panel"
          className="sb-notification-panel"
          aria-label="Notifications"
        >
          <div className="sb-notification-heading">
            <div>
              <h3>Notifications</h3>
              <p>
                {unread > 0
                  ? `${unread} unread notification${unread === 1 ? '' : 's'}`
                  : 'All caught up!'}
              </p>
            </div>

            <button
              type="button"
              className="sb-notification-icon-button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>

          <div className="sb-notification-items">
            {notices.length === 0 ? (
              <div className="sb-notification-empty">
                <CheckCircle2 size={28} />
                <strong>You're all caught up!</strong>
                <p>No notifications to display.</p>
              </div>
            ) : (
              notices.map((notice) => {
                const Icon = typeIcons[notice.type]

                return (
                  <div
                    key={notice.id}
                    className={`sb-notification-item ${
                      notice.read ? '' : 'is-unread'
                    }`}
                  >
                    <div
                      className={`sb-notification-type-icon type-${notice.type}`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="sb-notification-body">
                      <div className="sb-notification-item-top">
                        <strong>{notice.title}</strong>

                        {!notice.read && (
                          <span className="sb-notification-unread-dot" />
                        )}
                      </div>

                      <p className="sb-notification-message">
                        {notice.message}
                      </p>

                      <div className="sb-notification-bottom">
                        <span className="sb-notification-time">
                          {notice.time}
                        </span>

                        <div className="sb-notification-actions">
                          {!notice.read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notice.id)}
                              title="Mark as read"
                              aria-label={`Mark ${notice.title} as read`}
                            >
                              <CheckCheck size={15} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteNotice(notice.id)}
                            title="Delete notification"
                            aria-label={`Delete ${notice.title}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {notices.length > 0 && (
            <div className="sb-notification-footer">
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unread === 0}
              >
                <CheckCheck size={15} />
                Mark all as read
              </button>

              <button
                type="button"
                onClick={clearRead}
                disabled={!notices.some((item) => item.read)}
              >
                <Trash2 size={14} />
                Clear read
              </button>
            </div>
          )}

          <p className="sb-notification-preview-note">
            Nutrition alerts currently use preview data.
          </p>
        </section>
      )}

      <style>{`
        .sb-notification-root {
          position: relative;
          flex-shrink: 0;
          z-index: 60;
          font-family: 'DM Sans', sans-serif;
        }

        .sb-notification-trigger {
          position: relative;
        }

        .sb-notification-trigger:hover {
          transform: translateY(-2px);
        }

        .sb-notification-count {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 99px;
          display: grid;
          place-items: center;
          background: #a8c589;
          color: #213b2c;
          font-family: 'Manrope', sans-serif;
          font-size: 10px;
          font-weight: 800;
          border: 2px solid var(--surface);
        }

        .sb-notification-panel {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: min(390px, calc(100vw - 32px));
          max-height: min(520px, calc(100dvh - 110px));
          display: flex;
          flex-direction: column;
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: var(--surface);
          color: var(--text);
          box-shadow: 0 18px 55px rgba(0,0,0,.16);
          animation: sb-notification-enter .18s ease-out;
        }

        @keyframes sb-notification-enter {
          from {
            opacity: 0;
            transform: translateY(-7px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .sb-notification-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 15px;
        }

        .sb-notification-heading h3 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 19px;
          color: var(--text);
        }

        .sb-notification-heading p {
          font-size: 12px;
          margin: 4px 0 0;
          color: var(--muted);
        }

        .sb-notification-icon-button {
          background: transparent;
          color: var(--text);
          border: 0;
          cursor: pointer;
          padding: 4px;
          display: grid;
          place-items: center;
        }

        .sb-notification-items {
          display: grid;
          gap: 8px;
          overflow-y: auto;
          min-height: 0;
        }

        .sb-notification-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px;
          background: var(--surface);
        }

        .sb-notification-item.is-unread {
          background: rgba(149,181,117,.12);
        }

        .sb-notification-type-icon {
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          border-radius: 9px;
          display: grid;
          place-items: center;
          background: rgba(149,181,117,.16);
          color: var(--primary);
        }

        .sb-notification-type-icon.type-warning {
          background: rgba(197,138,99,.14);
          color: #b77d4d;
        }

        .sb-notification-type-icon.type-critical {
          background: rgba(191,94,85,.13);
          color: #bf655c;
        }

        .sb-notification-body {
          flex: 1;
          min-width: 0;
        }

        .sb-notification-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .sb-notification-item-top strong {
          font-size: 12px;
          line-height: 1.4;
          color: var(--text);
        }

        .sb-notification-unread-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #91b06f;
        }

        .sb-notification-message {
          font-size: 11px;
          line-height: 1.55;
          color: var(--muted);
          margin: 5px 0 8px;
        }

        .sb-notification-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .sb-notification-time {
          font-size: 10px;
          color: var(--muted);
        }

        .sb-notification-actions {
          display: flex;
          gap: 4px;
        }

        .sb-notification-actions button {
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
        }

        .sb-notification-actions button:hover {
          background: var(--border);
        }

        .sb-notification-empty {
          padding: 30px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
          color: var(--muted);
        }

        .sb-notification-empty strong {
          font-size: 13px;
          color: var(--text);
        }

        .sb-notification-empty p {
          margin: 0;
          font-size: 11px;
        }

        .sb-notification-footer {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          margin-top: 10px;
          border-top: 1px solid var(--border);
        }

        .sb-notification-footer button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid var(--border);
          border-radius: 9px;
          padding: 9px 6px;
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        }

        .sb-notification-footer button:disabled {
          opacity: .4;
          cursor: default;
        }

        .sb-notification-preview-note {
          font-size: 10px;
          color: var(--muted);
          text-align: center;
          margin: 10px 0 0;
        }

        @media (max-width: 480px) {
          .sb-notification-panel {
            width: min(350px, calc(100vw - 110px));
          }
        }
      `}</style>
    </div>
  )
}
