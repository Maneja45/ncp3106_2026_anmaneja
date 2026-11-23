import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Leaf } from 'lucide-react'
import Velaris from '../ui/velaris'

// ============================================
// Shared layout for the account-recovery pages:
// form on the left, animated Velaris panel on the right.
// ============================================

type AuthSplitProps = {
  children: ReactNode
  /** Big serif line on the Velaris side */
  heroTitle: ReactNode
  heroText: string
  /** Current step, e.g. 1 of 3 */
  step: number
}

const STEPS = ['Email', 'Code', 'New password']

export default function AuthSplit({ children, heroTitle, heroText, step }: AuthSplitProps) {
  return (
    <div className="auth-split">
      <style>{`
        .auth-split,
        .auth-split * {
          box-sizing: border-box;
        }

        .auth-split {
          --as-cream: #f8f8f3;
          --as-ink: #1c362b;
          --as-green: #45634d;
          --as-muted: #7b8980;
          --as-line: #dfe6dd;
          --as-field: #ffffff;
          --as-error-bg: #fff0ed;
          --as-error-line: #f2d0ca;
          --as-error: #a33e35;
          --as-ok-bg: #edf7ef;
          --as-ok-line: #bddac3;
          --as-ok: #2f6541;

          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          min-height: 100dvh;
          background: var(--as-cream);
          color: var(--as-ink);
          font-family: 'DM Sans', 'Inter', sans-serif;
          overflow: hidden;
        }

        [data-theme="dark"] .auth-split {
          --as-cream: #0f1612;
          --as-ink: #eef6e6;
          --as-green: #a9cf92;
          --as-muted: #9bab9f;
          --as-line: #2f4637;
          --as-field: #16241d;
          --as-error-bg: #3a2326;
          --as-error-line: #6b3a3f;
          --as-error: #ffb4af;
          --as-ok-bg: #1f3a2a;
          --as-ok-line: #3f6b4c;
          --as-ok: #bfe3c4;
        }

        .auth-split button,
        .auth-split input {
          font: inherit;
        }

        /* ---------- form side (left) ---------- */
        .auth-form-side {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px clamp(20px, 4vw, 70px);
          min-width: 0;
          max-height: 100dvh;
          overflow-y: auto;
        }

        .auth-form-inner {
          width: 100%;
          max-width: 420px;
        }

        .auth-steps {
          display: flex;
          gap: 6px;
          margin-bottom: 26px;
        }

        .auth-steps span {
          flex: 1;
          height: 4px;
          border-radius: 4px;
          background: var(--as-line);
          transition: background-color .3s ease;
        }

        .auth-steps span.on {
          background: var(--as-green);
        }

        .auth-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0;
          background: none;
          color: var(--as-green);
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          padding: 0;
          margin-bottom: 22px;
        }

        .auth-back:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .auth-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: color-mix(in srgb, var(--as-green) 14%, transparent);
          color: var(--as-green);
          margin-bottom: 20px;
        }

        .auth-eyebrow {
          color: var(--as-green);
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 800;
          margin: 0 0 9px;
        }

        .auth-heading {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(26px, 2.3vw, 34px);
          letter-spacing: -.9px;
          line-height: 1.2;
          margin: 0 0 10px;
        }

        .auth-subtitle {
          color: var(--as-muted);
          font-size: 13px;
          line-height: 1.7;
          margin: 0 0 24px;
        }

        .auth-subtitle strong {
          color: var(--as-ink);
        }

        .auth-label {
          display: block;
          font-size: 11px;
          font-weight: 750;
          margin-bottom: 7px;
        }

        .auth-field {
          position: relative;
          margin-bottom: 14px;
        }

        .auth-field-icon {
          position: absolute;
          top: 50%;
          left: 13px;
          transform: translateY(-50%);
          color: var(--as-muted);
          pointer-events: none;
        }

        .auth-input {
          width: 100%;
          height: 46px;
          padding: 0 42px 0 40px;
          border: 1px solid var(--as-line);
          border-radius: 11px;
          background: var(--as-field);
          color: var(--as-ink);
          outline: none;
          font-size: 13px;
          transition: border-color .2s, box-shadow .2s;
        }

        .auth-input::placeholder {
          color: var(--as-muted);
        }

        .auth-input:focus {
          border-color: var(--as-green);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--as-green) 14%, transparent);
        }

        .auth-input:disabled {
          opacity: .65;
        }

        .auth-eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: var(--as-muted);
          cursor: pointer;
          display: grid;
          place-items: center;
          padding: 5px;
        }

        .auth-code {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 16px;
        }

        .auth-code input {
          width: 100%;
          min-width: 0;
          height: 56px;
          text-align: center;
          font-size: 22px;
          font-weight: 800;
          border: 1px solid var(--as-line);
          border-radius: 12px;
          background: var(--as-field);
          color: var(--as-ink);
          outline: none;
          transition: border-color .2s, box-shadow .2s, transform .2s;
        }

        .auth-code input:focus {
          border-color: var(--as-green);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--as-green) 14%, transparent);
          transform: translateY(-2px);
        }

        .auth-code input.filled {
          border-color: color-mix(in srgb, var(--as-green) 55%, transparent);
        }

        .auth-alert,
        .auth-ok {
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.5;
          margin: 0 0 14px;
        }

        .auth-alert {
          background: var(--as-error-bg);
          border: 1px solid var(--as-error-line);
          color: var(--as-error);
        }

        .auth-ok {
          background: var(--as-ok-bg);
          border: 1px solid var(--as-ok-line);
          color: var(--as-ok);
        }

        .auth-submit {
          width: 100%;
          height: 48px;
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: none;
          border-radius: 11px;
          background: #45634d;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(69, 99, 77, .14);
          transition: background .2s, box-shadow .2s;
        }

        .auth-submit:hover:not(:disabled) {
          background: #36543f;
        }

        .auth-submit:disabled {
          opacity: .65;
          cursor: wait;
        }

        .auth-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: 100%;
          margin-top: 16px;
          border: 0;
          background: transparent;
          color: var(--as-green);
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .auth-link:disabled {
          color: var(--as-muted);
          cursor: default;
        }

        .auth-note {
          margin: 18px 0 0;
          text-align: center;
          color: var(--as-muted);
          font-size: 11px;
          line-height: 1.6;
        }

        .auth-rules {
          display: grid;
          gap: 4px;
          margin: -2px 0 14px;
          padding: 0;
          list-style: none;
          font-size: 11px;
          color: var(--as-muted);
        }

        .auth-rules li {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .auth-rules li.ok {
          color: var(--as-ok);
        }

        /* ---------- Velaris side (right) ---------- */
        .auth-hero {
          position: relative;
          isolation: isolate;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(30px, 4.5vw, 70px);
          color: #f7f8f3;
          background: radial-gradient(ellipse at 57% 42%, #315a46 0%, #1b362a 46%, #0d1b15 100%);
          overflow: hidden;
          min-height: 100dvh;
        }

        .auth-velaris-bg {
          position: absolute !important;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .auth-hero > :not(.auth-velaris-bg) {
          position: relative;
          z-index: 1;
        }

        .auth-logo {
          align-self: flex-end;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -.8px;
        }

        .auth-hero-copy {
          max-width: 520px;
          margin: auto 0 auto auto;
          padding: 35px 0;
          text-align: right;
        }

        .auth-leaf {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          margin: 0 0 26px auto;
          border-radius: 15px;
          background: rgba(255, 255, 255, .12);
          border: 1px solid rgba(255, 255, 255, .07);
          backdrop-filter: blur(10px);
        }

        .auth-hero-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          font-size: clamp(38px, 4vw, 62px);
          line-height: 1.08;
          letter-spacing: -2px;
          margin: 0 0 20px;
        }

        .auth-hero-text {
          margin: 0 0 0 auto;
          max-width: 420px;
          font-size: 14px;
          line-height: 1.9;
          color: rgba(247, 248, 243, .81);
        }

        .auth-hero-footer {
          align-self: flex-end;
          font-size: 11px;
          color: rgba(247, 248, 243, .65);
        }

        @media (max-width: 800px) {
          .auth-split {
            grid-template-columns: 1fr;
            overflow: visible;
          }

          .auth-hero {
            order: -1;
            min-height: 240px;
            padding: 28px;
          }

          .auth-hero-copy {
            padding: 20px 0;
          }

          .auth-form-side {
            max-height: none;
            padding: 30px 20px 45px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-split *,
          .auth-split *::before {
            transition: none !important;
          }
        }
      `}</style>

      {/* ============ FORM (left) ============ */}
      <main className="auth-form-side">
        <motion.div
          className="auth-form-inner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <div
            className="auth-steps"
            role="progressbar"
            aria-label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step}
          >
            {STEPS.map((name, index) => (
              <span key={name} className={index < step ? 'on' : ''} />
            ))}
          </div>

          {children}
        </motion.div>
      </main>

      {/* ============ VELARIS (right) ============ */}
      <aside className="auth-hero">
        <Velaris
          bg="#14251C"
          colors={['#45634D', '#78947A', '#253F30', '#101E16']}
          speed={1.1}
          grain={0.18}
          height="100%"
          className="auth-velaris-bg"
        >
          <span aria-hidden="true" />
        </Velaris>

        <motion.div
          className="auth-logo"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          SustansyaBox.
        </motion.div>

        <div className="auth-hero-copy">
          <motion.div
            className="auth-leaf"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Leaf size={24} strokeWidth={1.7} />
          </motion.div>

          <motion.h1
            key={step}
            className="auth-hero-title"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {heroTitle}
          </motion.h1>

          <motion.p
            className="auth-hero-text"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
          >
            {heroText}
          </motion.p>
        </div>

        <motion.div
          className="auth-hero-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Smart Nutrition for a Healthier You
        </motion.div>
      </aside>
    </div>
  )
}