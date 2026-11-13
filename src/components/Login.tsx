
import {
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from "motion/react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
} from "lucide-react";

import Velaris from "../ui/velaris";

export type LoginProps = {
  onLogin?: (
    email: string,
    password: string
  ) => void | Promise<void>;
  onRegister?: () => void;
  onForgotPassword?: () => void;
  onGoogleLogin?: () => void | Promise<void>;
};

export default function Login({
  onLogin,
  onRegister,
  onForgotPassword,
  onGoogleLogin,
}: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const reduceMotion = useReducedMotion();

  // Subtle 3D floating card effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(
    mouseY,
    [-260, 260],
    [5, -5]
  );

  const rotateY = useTransform(
    mouseX,
    [-260, 260],
    [-5, 5]
  );

  const handleMouseMove = (
    event: MouseEvent<HTMLDivElement>
  ) => {
    if (reduceMotion) return;

    const rect =
      event.currentTarget.getBoundingClientRect();

    mouseX.set(
      event.clientX - rect.left - rect.width / 2
    );

    mouseY.set(
      event.clientY - rect.top - rect.height / 2
    );
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!onLogin) {
      setError(
        "Email authentication has not been connected yet."
      );
      return;
    }

    try {
      setLoading(true);
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");

    if (!onGoogleLogin) {
      setError(
        "Google Sign-In has not been configured yet."
      );
      return;
    }

    try {
      setGoogleLoading(true);
      await onGoogleLogin();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google Sign-In failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Velaris
      bg="#14251C"
      colors={[
        "#45634D",
        "#78947A",
        "#253F30",
        "#101E16",
      ]}
      speed={1.1}
      grain={0.18}
      height="100dvh"
      className="sb-velaris-background"
    >
      <main className="sb-login-page">
        <style>{`
          /* =====================================
             FULL-SCREEN LOGIN LAYOUT
             VELARIS ANIMATED BACKGROUND
          ===================================== */

          .sb-velaris-background {
            min-height: 100vh;
            min-height: 100dvh;
          }

          .sb-login-page {
            --sb-forest: #1d4b30;
            --sb-deep: #153823;
            --sb-border: rgba(57, 128, 70, 0.4);

            min-height: 100vh;
            min-height: 100dvh;
            width: 100%;

            position: relative;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 80px 20px 60px;

            overflow: hidden;

            color: var(--sb-deep);
            background: transparent;

            font-family:
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .sb-login-page * {
            box-sizing: border-box;
          }

          .sb-login-page button,
          .sb-login-page input {
            font-family: inherit;
          }

          /* =====================================
             SUSTANSYABOX BRANDING
          ===================================== */

          .sb-login-brand {
            position: absolute;

            top: 30px;
            left: clamp(22px, 5vw, 78px);

            font-size: 21px;
            font-weight: 750;
            letter-spacing: -0.8px;

            color: #f5f5eb;
          }

          /* =====================================
             WHITE FROSTED GLASS CARD
             STATIC SAGE-GREEN BORDER
          ===================================== */

          .sb-login-shell {
            position: relative;
            z-index: 2;

            width: min(100%, 490px);

            perspective: 1500px;
          }

          .sb-login-card {
            position: relative;
            isolation: isolate;
            overflow: hidden;

            padding: 37px 40px 33px;
            border-radius: 28px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.83),
                rgba(246, 252, 244, 0.66)
              );

            border:
              1.5px solid
              rgba(57, 128, 70, 0.4);

            box-shadow:
              0 20px 65px rgba(0, 0, 0, 0.2),
              0 0 18px rgba(57, 128, 70, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);

            -webkit-backdrop-filter:
              blur(28px) saturate(145%);

            backdrop-filter:
              blur(28px) saturate(145%);

            transition:
              border-color 0.3s,
              box-shadow 0.3s;
          }

          .sb-login-card:hover {
            border-color: #38864a;

            box-shadow:
              0 24px 75px rgba(0, 0, 0, 0.23),
              0 0 22px rgba(57, 128, 70, 0.12);
          }

          .sb-login-card::before {
            content: "";

            position: absolute;
            inset: 0;
            z-index: -1;

            border-radius: inherit;
            pointer-events: none;

            background:
              radial-gradient(
                circle at 50% 0%,
                rgba(219, 241, 213, 0.42),
                transparent 52%
              );
          }

          /* =====================================
             LOGIN HEADING
          ===================================== */

          .sb-login-heading {
            position: relative;
            text-align: center;
            margin-bottom: 28px;
          }

          .sb-login-logo {
            width: 54px;
            height: 54px;

            margin: 0 auto 17px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 17px;
            color: #347245;

            background:
              rgba(222, 241, 219, 0.83);

            border:
              1px solid
              rgba(85, 151, 94, 0.2);

            box-shadow:
              0 5px 15px rgba(50, 108, 61, 0.1);
          }

          .sb-login-heading h1 {
            margin: 0 0 9px;

            color: #153c24;

            font-family:
              Georgia,
              "Times New Roman",
              serif;

            font-size: 37px;
            font-weight: 700;
            letter-spacing: -1.3px;
          }

          .sb-login-heading p {
            margin: 0;
            color: #677a6b;
            font-size: 13px;
            line-height: 1.6;
          }

          /* =====================================
             EMAIL AND PASSWORD FIELDS
          ===================================== */

          .sb-login-field {
            position: relative;
            margin-bottom: 18px;
          }

          .sb-login-field label {
            display: block;
            margin-bottom: 9px;

            color: #244d31;

            font-size: 12px;
            font-weight: 700;
          }

          .sb-login-input-wrap {
            position: relative;

            display: flex;
            align-items: center;

            border:
              1.5px solid
              rgba(57, 128, 70, 0.4);

            border-radius: 12px;

            background:
              rgba(255, 255, 255, 0.57);

            transition:
              background 0.25s,
              border-color 0.25s,
              box-shadow 0.25s;
          }

          .sb-login-input-wrap:focus-within {
            background:
              rgba(255, 255, 255, 0.9);

            border-color: #38864a;

            box-shadow:
              0 0 0 4px
              rgba(76, 157, 88, 0.11);
          }

          .sb-login-input-icon {
            position: absolute;
            left: 15px;

            color: #477d53;
            pointer-events: none;
          }

          .sb-login-input-wrap input {
            width: 100%;
            height: 50px;

            padding: 0 44px;

            outline: none;
            border: 0;
            background: transparent;

            color: #173b24;
            font-size: 13px;
          }

          .sb-login-input-wrap input::placeholder {
            color: #84958a;
          }

          /* =====================================
             PASSWORD VISIBILITY
          ===================================== */

          .sb-login-eye {
            position: absolute;
            right: 10px;

            display: flex;
            align-items: center;
            justify-content: center;

            width: 32px;
            height: 32px;

            border: 0;
            border-radius: 8px;

            background: transparent;
            color: #4e7757;

            cursor: pointer;
          }

          .sb-login-eye:hover {
            background:
              rgba(70, 137, 81, 0.09);

            color: #1d4b30;
          }

          /* =====================================
             REMEMBER ME / FORGOT PASSWORD
          ===================================== */

          .sb-login-options {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 12px;
            margin: 8px 0 24px;

            font-size: 12px;
            color: #435c49;
          }

          .sb-login-remember {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            cursor: pointer;
          }

          .sb-login-remember input {
            width: 16px;
            height: 16px;

            accent-color: #2b7140;
            cursor: pointer;
          }

          .sb-login-link {
            border: 0;
            padding: 0;

            background: none;
            color: #27673a;

            font-size: inherit;
            font-weight: 700;

            cursor: pointer;
          }

          .sb-login-link:hover {
            color: #17482a;
            text-decoration: underline;
            text-underline-offset: 4px;
          }

          /* =====================================
             SIGN IN BUTTON
          ===================================== */

          .sb-login-submit {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;

            width: 100%;
            height: 51px;

            border: 0;
            border-radius: 12px;

            background:
              linear-gradient(
                100deg,
                #27683b,
                #1b4c2d
              );

            color: white;

            font-size: 14px;
            font-weight: 750;

            cursor: pointer;

            box-shadow:
              0 8px 22px
              rgba(39, 104, 59, 0.18);
          }

          .sb-login-submit:hover:not(:disabled) {
            box-shadow:
              0 10px 28px
              rgba(39, 104, 59, 0.28);
          }

          .sb-login-submit:disabled,
          .sb-login-google:disabled {
            opacity: 0.7;
            cursor: wait;
          }

          /* =====================================
             DIVIDER
          ===================================== */

          .sb-login-divider {
            display: flex;
            align-items: center;
            gap: 13px;

            margin: 20px 0;

            color: #7b8c80;
            font-size: 11px;
          }

          .sb-login-divider::before,
          .sb-login-divider::after {
            content: "";

            height: 1px;
            flex: 1;

            background:
              rgba(60, 126, 72, 0.2);
          }

          /* =====================================
             GOOGLE SIGN IN WITH ICON
          ===================================== */

          .sb-login-google {
            width: 100%;
            height: 49px;

            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;

            border:
              1.5px solid
              rgba(57, 128, 70, 0.4);

            border-radius: 12px;

            background:
              rgba(255, 255, 255, 0.57);

            color: #255735;
            font-size: 13px;
            font-weight: 700;

            cursor: pointer;

            transition:
              background 0.2s,
              border-color 0.2s,
              box-shadow 0.2s;
          }

          .sb-login-google:hover:not(:disabled) {
            background:
              rgba(232, 245, 228, 0.9);

            border-color: #38864a;

            box-shadow:
              0 5px 17px
              rgba(39, 104, 59, 0.08);
          }

          .sb-login-google-icon {
            width: 19px;
            height: 19px;
            flex-shrink: 0;
          }

          /* =====================================
             FOOTER
          ===================================== */

          .sb-login-footer {
            margin: 24px 0 0;

            text-align: center;
            font-size: 12px;
            color: #697b6e;
          }

          .sb-login-footer .sb-login-link {
            margin-left: 5px;
          }

          .sb-login-error {
            margin: 0 0 13px;

            font-size: 12px;
            line-height: 1.5;
            color: #b12d3b;
          }

          .sb-login-tagline {
            position: absolute;
            bottom: 23px;
            left: 0;

            width: 100%;

            text-align: center;
            color: #b4cbb7;
            font-size: 11px;
          }

          .sb-login-page button:focus-visible,
          .sb-login-page input:focus-visible {
            outline: 2px solid #2e8a45;
            outline-offset: 3px;
          }

          /* =====================================
             RESPONSIVE DESIGN
          ===================================== */

          @media (max-width: 540px) {
            .sb-login-page {
              padding: 78px 15px 50px;
            }

            .sb-login-brand {
              top: 23px;
              left: 23px;
            }

            .sb-login-card {
              padding: 30px 24px;
              border-radius: 23px;
            }

            .sb-login-heading h1 {
              font-size: 32px;
            }
          }

          @media (max-height: 790px) {
            .sb-login-page {
              overflow-y: auto;
              justify-content: flex-start;
            }

            .sb-login-shell {
              margin: auto;
            }

            .sb-login-tagline {
              display: none;
            }
          }
        `}</style>

        {/* SustansyaBox branding */}
        <motion.div
          className="sb-login-brand"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          SustansyaBox.
        </motion.div>

        {/* Floating glass login card */}
        <motion.div
          className="sb-login-shell"
          initial={{
            opacity: 0,
            y: 25,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.75,
            ease: "easeOut",
          }}
        >
          <motion.div
            style={
              reduceMotion
                ? undefined
                : { rotateX, rotateY }
            }
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="sb-login-card">
              {/* Header */}
              <div className="sb-login-heading">
                <motion.div
                  className="sb-login-logo"
                  initial={{
                    opacity: 0,
                    scale: 0.5,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    type: "spring",
                    delay: 0.2,
                  }}
                >
                  <Leaf
                    size={25}
                    strokeWidth={1.8}
                  />
                </motion.div>

                <motion.h1
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{ delay: 0.25 }}
                >
                  Welcome Back
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  Sign in to continue your nutrition journey.
                </motion.p>
              </div>

              {/* Login form */}
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <motion.div
                  className="sb-login-field"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{ delay: 0.4 }}
                >
                  <label htmlFor="sb-login-email">
                    Email address
                  </label>

                  <motion.div
                    className="sb-login-input-wrap"
                    whileHover={{ scale: 1.008 }}
                    animate={{
                      scale:
                        focused === "email"
                          ? 1.012
                          : 1,
                    }}
                  >
                    <Mail
                      className="sb-login-input-icon"
                      size={18}
                    />

                    <input
                      id="sb-login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      onFocus={() =>
                        setFocused("email")
                      }
                      onBlur={() =>
                        setFocused(null)
                      }
                      required
                    />
                  </motion.div>
                </motion.div>

                {/* Password */}
                <motion.div
                  className="sb-login-field"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{ delay: 0.47 }}
                >
                  <label htmlFor="sb-login-password">
                    Password
                  </label>

                  <motion.div
                    className="sb-login-input-wrap"
                    whileHover={{ scale: 1.008 }}
                    animate={{
                      scale:
                        focused === "password"
                          ? 1.012
                          : 1,
                    }}
                  >
                    <LockKeyhole
                      className="sb-login-input-icon"
                      size={18}
                    />

                    <input
                      id="sb-login-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      onFocus={() =>
                        setFocused("password")
                      }
                      onBlur={() =>
                        setFocused(null)
                      }
                      required
                    />

                    <button
                      className="sb-login-eye"
                      type="button"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </motion.div>
                </motion.div>

                {/* Remember me and forgot password */}
                <motion.div
                  className="sb-login-options"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                >
                  <label className="sb-login-remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(
                          e.target.checked
                        )
                      }
                    />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="sb-login-link"
                    onClick={() =>
                      onForgotPassword
                        ? onForgotPassword()
                        : setError(
                            "Password recovery is not connected yet."
                          )
                    }
                  >
                    Forgot password?
                  </button>
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      className="sb-login-error"
                      role="alert"
                      initial={{
                        opacity: 0,
                        y: -5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{ opacity: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Sign In button */}
                <motion.button
                  type="submit"
                  className="sb-login-submit"
                  disabled={
                    loading || googleLoading
                  }
                  whileHover={{ scale: 1.018 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Signing in...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="ready"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        Sign In
                        <ArrowRight size={17} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Divider */}
                <div className="sb-login-divider">
                  <span>or continue with</span>
                </div>

                {/* Google Sign In with colored icon */}
                <motion.button
                  type="button"
                  className="sb-login-google"
                  disabled={
                    loading || googleLoading
                  }
                  onClick={handleGoogleLogin}
                  whileHover={{ scale: 1.018 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {googleLoading ? (
                    "Connecting to Google..."
                  ) : (
                    <>
                      <svg
                        className="sb-login-google-icon"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.88 46.98 24.55z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>

                      <span>Continue with Google</span>
                    </>
                  )}
                </motion.button>

                {/* Create account */}
                <motion.p
                  className="sb-login-footer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.65 }}
                >
                  Don't have an account?

                  <button
                    type="button"
                    className="sb-login-link"
                    onClick={() =>
                      onRegister
                        ? onRegister()
                        : setError(
                            "Registration navigation is not connected yet."
                          )
                    }
                  >
                    Create an account
                  </button>
                </motion.p>
              </form>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom tagline */}
        <div className="sb-login-tagline">
          Smart Nutrition for a Healthier You
        </div>
      </main>
    </Velaris>
  );
}
