import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle,
  Copy,
  DeviceMobile,
  Envelope,
  Eye,
  EyeSlash,
  GearSix,
  Key,
  LockKey,
  SignOut,
  ShieldCheck,
  UserCircle,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "./AuthContext.jsx";
import {
  DEMO_ACCOUNTS,
  ROLE_PERMISSIONS,
  defaultDestinationFor,
} from "./mockAuthData.js";

const logo = "/assets/beatmondo-logo.png";
const VERIFY_USER_KEY = "beatmondo-auth-verify-user";
const RESET_TOKEN_KEY = "beatmondo-auth-reset-token";

export const AUTH_VIEWS = new Set([
  "login",
  "register",
  "signup",
  "forgot",
  "forgot-password",
  "reset-password",
  "verify-email",
  "verification-success",
  "mfa",
  "account-locked",
  "account-suspended",
  "session-expired",
  "access-denied",
  "profile",
  "security",
  "notifications",
  "admin-users",
]);

export function passwordChecks(password) {
  return {
    length: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function passwordStrength(password) {
  const score = Object.values(passwordChecks(password)).filter(Boolean).length;
  if (score <= 2) return "Weak";
  if (score <= 4) return "Fair";
  return "Strong";
}

export function AuthLayout({
  navigate,
  kicker = "Private platform access",
  title,
  description,
  children,
  compact = false,
}) {
  return (
    <section className={`auth-module-page ${compact ? "is-compact" : ""}`}>
      <header className="auth-module-header">
        <button
          type="button"
          onClick={() => navigate("home")}
          aria-label="beatmondo home"
        >
          <img src={logo} alt="beatmondo" />
        </button>
        <div>
          <button type="button" onClick={() => navigate("contact")}>
            Help
          </button>
          <button type="button" onClick={() => navigate("login")}>
            Sign In
          </button>
        </div>
      </header>
      <div className="auth-module-shell">
        <aside className="auth-module-story">
          <span className="eyebrow">{kicker}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <ul>
            <li>
              <ShieldCheck size={18} /> Rights-aware access
            </li>
            <li>
              <LockKey size={18} /> Protected workspace data
            </li>
            <li>
              <CheckCircle size={18} /> Role-based permissions
            </li>
          </ul>
        </aside>
        <main className="auth-module-card">{children}</main>
      </div>
    </section>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = "current-password",
  id,
  errorId,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label htmlFor={id}>
      {label}
      <span className="auth-password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-describedby={errorId}
        />
        <button
          type="button"
          onClick={() => setVisible((state) => !state)}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeSlash /> : <Eye />}
        </button>
      </span>
    </label>
  );
}

export function PasswordStrength({ password, confirmPassword = null }) {
  const checks = passwordChecks(password);
  const strength = passwordStrength(password);
  return (
    <div
      className={`password-strength strength-${strength.toLowerCase()}`}
      aria-live="polite"
    >
      <div>
        <span>Password strength</span>
        <strong>{strength}</strong>
      </div>
      <div className="strength-rail">
        <span />
      </div>
      <ul>
        <li className={checks.length ? "met" : ""}>10 or more characters</li>
        <li className={checks.upper ? "met" : ""}>One uppercase letter</li>
        <li className={checks.lower ? "met" : ""}>One lowercase letter</li>
        <li className={checks.number ? "met" : ""}>One number</li>
        <li className={checks.special ? "met" : ""}>One special character</li>
        {confirmPassword !== null && (
          <li className={password && password === confirmPassword ? "met" : ""}>
            Passwords match
          </li>
        )}
      </ul>
    </div>
  );
}

function ErrorSummary({ message }) {
  if (!message) return null;
  return (
    <div className="auth-error-summary" role="alert">
      <WarningCircle size={19} />
      <span>{message}</span>
    </div>
  );
}

export function DemoAccountPanel({ onSelect, loading }) {
  return (
    <details className="demo-account-panel">
      <summary>Demo access accounts</summary>
      <p>Use the same validation and redirect flow as a normal sign-in.</p>
      <div>
        {DEMO_ACCOUNTS.map((account) => (
          <button
            type="button"
            key={account.id}
            onClick={() => onSelect(account)}
            disabled={loading}
          >
            <span>
              <strong>{account.label}</strong>
              <small>{account.email}</small>
            </span>
            <span>
              {account.destination}
              <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </details>
  );
}

export function LoginPage({ navigate, showToast }) {
  const { user, login, setIntendedView } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState(null);

  useEffect(() => {
    if (success && user && redirectTarget) navigate(redirectTarget);
  }, [success, user, redirectTarget]);

  const submitCredentials = async (
    nextEmail = email,
    nextPassword = password,
  ) => {
    setError("");
    if (!nextEmail || !/^\S+@\S+\.\S+$/.test(nextEmail) || !nextPassword) {
      setError("Enter a valid work email and password.");
      return;
    }
    setLoading(true);
    const result = await login({
      email: nextEmail,
      password: nextPassword,
      rememberMe,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      if (result.code === "ACCOUNT_SUSPENDED") navigate("account-suspended");
      if (result.code === "ACCOUNT_LOCKED") navigate("account-locked");
      if (result.code === "EMAIL_UNVERIFIED" && result.userId) {
        window.localStorage.setItem(VERIFY_USER_KEY, result.userId);
        navigate("verify-email");
      }
      return;
    }
    if (result.requiresMfa) {
      navigate("mfa");
      return;
    }
    setSuccess(true);
    showToast(`Welcome back, ${result.user.name}.`);
    setRedirectTarget(result.destination || defaultDestinationFor(result.user));
  };

  const quickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setIntendedView(null);
    submitCredentials(account.email, account.password);
  };

  return (
    <AuthLayout
      navigate={navigate}
      title="Private access for serious sync work."
      description="Access your private music discovery, licensing, catalog, or administration workspace."
    >
      <span className="eyebrow">Approved account login</span>
      <h2>Welcome back to beatmondo</h2>
      <p>Sign in with your approved work account.</p>
      <ErrorSummary message={error} />
      <form
        className="auth-module-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitCredentials();
        }}
        noValidate
      >
        <label htmlFor="login-email">
          Work email
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="name@company.com"
          />
        </label>
        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div className="auth-form-row">
          <label className="auth-check">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />{" "}
            Remember me
          </label>
          <button
            type="button"
            className="auth-text-link"
            onClick={() => navigate("forgot-password")}
          >
            Forgot password?
          </button>
        </div>
        <button
          className={`auth-primary ${loading ? "is-loading" : ""} ${success ? "is-success" : ""}`}
          disabled={loading || success}
          type="submit"
          aria-busy={loading}
        >
          {loading
            ? "Verifying account…"
            : success
              ? "Access approved"
              : "Sign In"}
        </button>
      </form>
      <div className="auth-inline-switch">
        Need an account?{" "}
        <button type="button" onClick={() => navigate("register")}>
          Request Access
        </button>
      </div>
      <DemoAccountPanel onSelect={quickLogin} loading={loading} />
    </AuthLayout>
  );
}

const emptyRegistration = {
  accountType: "buyer",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  country: "United States",
  phone: "",
  terms: false,
  privacy: false,
  organization: "",
  jobTitle: "",
  website: "",
  buyerType: "Music Supervisor",
  usage: "Film / TV",
  requestedTier: "Discovery Access",
  artistName: "",
  professionalRole: "Artist Representative",
  representation: "Self-represented",
  submissionObjective: "Submit selected tracks for rights review",
  invitationCode: "",
};

export function RegistrationWizard({ navigate, showToast }) {
  const { authService } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyRegistration);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const checks = passwordChecks(form.password);
  const steps = [
    "Account type",
    "Personal details",
    "Professional details",
    "Review",
  ];

  const next = () => {
    setError("");
    if (
      step === 0 &&
      form.accountType === "team" &&
      form.invitationCode !== "BEATMONDO-TEAM"
    ) {
      setError(
        "Internal team accounts are invitation-only. Enter the demo invitation code BEATMONDO-TEAM.",
      );
      return;
    }
    if (
      step === 1 &&
      (!form.name ||
        !/^\S+@\S+\.\S+$/.test(form.email) ||
        !Object.values(checks).every(Boolean) ||
        form.password !== form.confirmPassword ||
        !form.terms ||
        !form.privacy)
    ) {
      setError(
        "Complete every required field, meet the password rules, and accept the Terms and Privacy Policy.",
      );
      return;
    }
    if (
      step === 2 &&
      form.accountType === "buyer" &&
      (!form.organization || !form.jobTitle)
    ) {
      setError("Company and job title are required for buyer verification.");
      return;
    }
    if (
      step === 2 &&
      form.accountType === "artist" &&
      (!form.artistName || !form.professionalRole)
    ) {
      setError("Artist or catalog name and professional role are required.");
      return;
    }
    setStep((value) => Math.min(3, value + 1));
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    const result = await authService.register(form);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    window.localStorage.setItem(VERIFY_USER_KEY, result.user.id);
    showToast("Account created. Verify your email to continue.");
    navigate("verify-email");
  };

  return (
    <AuthLayout
      navigate={navigate}
      kicker="New account request"
      title="Request a beatmondo workspace."
      description="Choose the workspace that matches your role, then complete a controlled verification request."
    >
      <div className="registration-heading">
        <span className="eyebrow">Step {step + 1} of 4</span>
        <h2>{steps[step]}</h2>
      </div>
      <ol className="auth-stepper">
        {steps.map((label, index) => (
          <li
            key={label}
            className={
              index === step ? "active" : index < step ? "complete" : ""
            }
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <ErrorSummary message={error} />
      {step === 0 && (
        <div className="account-type-grid">
          {[
            [
              "buyer",
              "Music Buyer",
              "Discovery, projects, licensing and delivery",
            ],
            [
              "artist",
              "Artist / Rightsholder",
              "Catalog submissions and rights requests",
            ],
            [
              "team",
              "beatmondo Team Member",
              "Invitation-only internal access",
            ],
          ].map(([value, label, text]) => (
            <button
              type="button"
              key={value}
              className={form.accountType === value ? "active" : ""}
              onClick={() => update("accountType", value)}
            >
              <UsersThree size={23} />
              <strong>{label}</strong>
              <span>{text}</span>
            </button>
          ))}
          {form.accountType === "team" && (
            <label className="full-field">
              Invitation code
              <input
                value={form.invitationCode}
                onChange={(event) =>
                  update("invitationCode", event.target.value)
                }
                placeholder="BEATMONDO-TEAM"
              />
            </label>
          )}
        </div>
      )}
      {step === 1 && (
        <div className="auth-module-form registration-form">
          <label>
            Full name
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              autoComplete="name"
            />
          </label>
          <label>
            Work email
            <input
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              autoComplete="email"
            />
          </label>
          <PasswordField
            id="register-password"
            label="Password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            autoComplete="new-password"
          />
          <PasswordField
            id="register-confirm"
            label="Confirm password"
            value={form.confirmPassword}
            onChange={(event) => update("confirmPassword", event.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength
            password={form.password}
            confirmPassword={form.confirmPassword}
          />
          <label>
            Country
            <input
              value={form.country}
              onChange={(event) => update("country", event.target.value)}
              autoComplete="country-name"
            />
          </label>
          <label>
            Phone <small>Optional</small>
            <input
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              autoComplete="tel"
            />
          </label>
          <label className="auth-check full-field">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(event) => update("terms", event.target.checked)}
            />{" "}
            I accept the Terms of Access.
          </label>
          <label className="auth-check full-field">
            <input
              type="checkbox"
              checked={form.privacy}
              onChange={(event) => update("privacy", event.target.checked)}
            />{" "}
            I accept the Privacy Policy.
          </label>
        </div>
      )}
      {step === 2 && (
        <div className="auth-module-form registration-form">
          {form.accountType === "buyer" ? (
            <>
              <label>
                Company
                <input
                  value={form.organization}
                  onChange={(event) =>
                    update("organization", event.target.value)
                  }
                />
              </label>
              <label>
                Job title
                <input
                  value={form.jobTitle}
                  onChange={(event) => update("jobTitle", event.target.value)}
                />
              </label>
              <label>
                Company website
                <input
                  value={form.website}
                  onChange={(event) => update("website", event.target.value)}
                />
              </label>
              <label>
                Buyer type
                <select
                  value={form.buyerType}
                  onChange={(event) => update("buyerType", event.target.value)}
                >
                  <option>Music Supervisor</option>
                  <option>Creative Producer</option>
                  <option>Agency</option>
                  <option>Brand</option>
                  <option>Studio</option>
                </select>
              </label>
              <label>
                Intended usage
                <select
                  value={form.usage}
                  onChange={(event) => update("usage", event.target.value)}
                >
                  <option>Film / TV</option>
                  <option>Advertising</option>
                  <option>Streaming</option>
                  <option>Games</option>
                  <option>Brand content</option>
                </select>
              </label>
              <label>
                Requested tier
                <select
                  value={form.requestedTier}
                  onChange={(event) =>
                    update("requestedTier", event.target.value)
                  }
                >
                  <option>Discovery Access</option>
                  <option>Professional Buyer</option>
                  <option>VIP Sync Access</option>
                </select>
              </label>
            </>
          ) : form.accountType === "artist" ? (
            <>
              <label>
                Artist or catalog name
                <input
                  value={form.artistName}
                  onChange={(event) => update("artistName", event.target.value)}
                />
              </label>
              <label>
                Professional role
                <input
                  value={form.professionalRole}
                  onChange={(event) =>
                    update("professionalRole", event.target.value)
                  }
                />
              </label>
              <label>
                Website or profile
                <input
                  value={form.website}
                  onChange={(event) => update("website", event.target.value)}
                />
              </label>
              <label>
                Representation
                <select
                  value={form.representation}
                  onChange={(event) =>
                    update("representation", event.target.value)
                  }
                >
                  <option>Self-represented</option>
                  <option>Manager</option>
                  <option>Label</option>
                  <option>Publisher</option>
                </select>
              </label>
              <label className="full-field">
                Submission objective
                <textarea
                  value={form.submissionObjective}
                  onChange={(event) =>
                    update("submissionObjective", event.target.value)
                  }
                />
              </label>
            </>
          ) : (
            <div className="invite-only-note full-field">
              <ShieldCheck size={24} />
              <strong>Internal invitation recognized</strong>
              <p>
                Your account will still require administrator approval before
                permissions are assigned.
              </p>
            </div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="registration-review">
          <section>
            <span>Account</span>
            <strong>
              {form.accountType === "buyer"
                ? "Music Buyer"
                : form.accountType === "artist"
                  ? "Artist / Rightsholder"
                  : "beatmondo Team Member"}
            </strong>
          </section>
          <section>
            <span>Name</span>
            <strong>{form.name}</strong>
          </section>
          <section>
            <span>Email</span>
            <strong>{form.email}</strong>
          </section>
          <section>
            <span>Organization</span>
            <strong>
              {form.organization || form.artistName || "Invitation pending"}
            </strong>
          </section>
          <section>
            <span>Access state</span>
            <strong>
              {form.accountType === "artist"
                ? "Artist application pending"
                : "Discovery Access · Verification pending"}
            </strong>
          </section>
        </div>
      )}
      <div className="wizard-actions">
        {step > 0 && (
          <button
            type="button"
            className="auth-secondary"
            onClick={() => setStep((value) => value - 1)}
          >
            Back
          </button>
        )}
        <button
          type="button"
          className="auth-primary"
          onClick={step === 3 ? submit : next}
          disabled={loading}
        >
          {loading
            ? "Creating account…"
            : step === 3
              ? "Create account request"
              : "Continue"}
        </button>
      </div>
    </AuthLayout>
  );
}

export function VerifyEmailPage({ navigate, showToast }) {
  const { authService } = useAuth();
  const [userId] = useState(() => window.localStorage.getItem(VERIFY_USER_KEY));
  const state = authService.getState();
  const user = state.users.find((item) => item.id === userId);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!countdown) return;
    const timer = window.setInterval(
      () => setCountdown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [countdown]);
  const verify = async () => {
    const result = await authService.verifyEmail(userId);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    showToast("Email verified successfully.");
    navigate("verification-success");
  };
  const resend = async () => {
    const result = await authService.resendVerification(userId);
    setMessage(
      result.ok
        ? "A new demo verification message is available."
        : result.message,
    );
    if (result.ok) setCountdown(30);
  };
  return (
    <AuthLayout
      navigate={navigate}
      compact
      title="Verify your email."
      description="Email verification protects access to private catalog, project, and administration workspaces."
    >
      <Envelope size={34} className="auth-feature-icon" />
      <span className="eyebrow">Verification pending</span>
      <h2>Check your demo messages</h2>
      <p>
        We sent a verification action to{" "}
        <strong>{user ? maskEmail(user.email) : "your work email"}</strong>.
      </p>
      <ErrorSummary
        message={message && !message.startsWith("A new") ? message : ""}
      />
      {message && message.startsWith("A new") && (
        <p className="auth-success-note" role="status">
          {message}
        </p>
      )}
      <button className="auth-primary" type="button" onClick={verify}>
        Demo verification link
      </button>
      <button
        className="auth-secondary"
        type="button"
        onClick={resend}
        disabled={countdown > 0}
      >
        {countdown
          ? `Resend available in ${countdown}s`
          : "Resend verification email"}
      </button>
      <button
        className="auth-text-link"
        type="button"
        onClick={() => navigate("notifications")}
      >
        Open Demo Messages
      </button>
    </AuthLayout>
  );
}

export function VerificationSuccessPage({ navigate }) {
  return (
    <AuthLayout
      navigate={navigate}
      compact
      title="Email verified."
      description="Your identity check is complete and the appropriate onboarding workspace is ready."
    >
      <CheckCircle size={42} className="auth-feature-icon success" />
      <span className="eyebrow">Verification successful</span>
      <h2>Your beatmondo account is ready</h2>
      <p>
        Buyer accounts begin with Discovery Access and verification under
        review. Artist accounts begin with limited submission access.
      </p>
      <button className="auth-primary" onClick={() => navigate("login")}>
        Continue to Sign In
      </button>
    </AuthLayout>
  );
}

export function ForgotPasswordPage({ navigate }) {
  const { authService } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage("Enter a valid work email.");
      return;
    }
    setLoading(true);
    const result = await authService.requestPasswordReset(email);
    setLoading(false);
    setMessage(result.message);
    setToken(result.token);
    if (result.token)
      window.localStorage.setItem(RESET_TOKEN_KEY, result.token);
  };
  return (
    <AuthLayout
      navigate={navigate}
      compact
      title="Recover private access."
      description="Request a secure password-reset action without exposing whether an account exists."
    >
      <span className="eyebrow">Account recovery</span>
      <h2>Reset your password</h2>
      <form className="auth-module-form" onSubmit={submit}>
        <label>
          Work email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <button className="auth-primary" disabled={loading}>
          {loading ? "Sending instructions…" : "Send reset instructions"}
        </button>
      </form>
      {message && (
        <p className="auth-success-note" role="status">
          {message}
        </p>
      )}
      {token && (
        <button
          className="auth-secondary"
          onClick={() => navigate("reset-password")}
        >
          Open demo reset link
        </button>
      )}
      <button className="auth-text-link" onClick={() => navigate("login")}>
        Return to Sign In
      </button>
    </AuthLayout>
  );
}

export function ResetPasswordPage({ navigate, showToast }) {
  const { authService } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (
      !Object.values(passwordChecks(password)).every(Boolean) ||
      password !== confirm
    ) {
      setError(
        "Meet every password requirement and confirm the same password.",
      );
      return;
    }
    const token = window.localStorage.getItem(RESET_TOKEN_KEY);
    const result = await authService.resetPassword(token, password);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    window.localStorage.removeItem(RESET_TOKEN_KEY);
    setComplete(true);
    showToast("Password updated successfully.");
  };
  return (
    <AuthLayout
      navigate={navigate}
      compact
      title="Choose a new password."
      description="The recovery action is single-use and updates the persisted demo credential immediately."
    >
      {complete ? (
        <>
          <CheckCircle size={42} className="auth-feature-icon success" />
          <h2>Password updated</h2>
          <p>You can now sign in with your new password.</p>
          <button className="auth-primary" onClick={() => navigate("login")}>
            Return to Sign In
          </button>
        </>
      ) : (
        <>
          <span className="eyebrow">Secure account recovery</span>
          <h2>Set a new password</h2>
          <ErrorSummary message={error} />
          <form className="auth-module-form" onSubmit={submit}>
            <PasswordField
              id="reset-password"
              label="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            <PasswordField
              id="reset-confirm"
              label="Confirm new password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
            />
            <PasswordStrength password={password} confirmPassword={confirm} />
            <button className="auth-primary">Reset password</button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export function MfaChallengePage({ navigate, showToast }) {
  const { user: authenticatedUser, verifyMfa, authService } = useAuth();
  const challenge = authService.getPendingMfa();
  const state = authService.getState();
  const user = state.users.find((item) => item.id === challenge?.userId);
  const [code, setCode] = useState("");
  const [trust, setTrust] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState(null);
  useEffect(() => {
    if (authenticatedUser && redirectTarget) navigate(redirectTarget);
  }, [authenticatedUser, redirectTarget]);
  const submit = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code.");
      return;
    }
    setLoading(true);
    const result = await verifyMfa(code, trust);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    showToast("Security challenge complete.");
    setRedirectTarget(result.destination || defaultDestinationFor(result.user));
  };
  return (
    <AuthLayout
      navigate={navigate}
      compact
      title="Confirm it’s you."
      description="A second factor protects sensitive administrative, rights, and delivery controls."
    >
      <ShieldCheck size={40} className="auth-feature-icon" />
      <span className="eyebrow">Multi-factor authentication</span>
      <h2>Enter your six-digit code</h2>
      <p>
        Code sent to{" "}
        {user ? maskEmail(user.email) : "your verified destination"}. Demo code:{" "}
        <strong>246810</strong>
      </p>
      <ErrorSummary message={error} />
      <form className="auth-module-form" onSubmit={submit}>
        <label>
          Verification code
          <input
            className="mfa-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            autoComplete="one-time-code"
          />
        </label>
        <label className="auth-check">
          <input
            type="checkbox"
            checked={trust}
            onChange={(event) => setTrust(event.target.checked)}
          />{" "}
          Trust this device for 30 days
        </label>
        <button className="auth-primary" disabled={loading}>
          {loading ? "Checking code…" : "Verify and continue"}
        </button>
      </form>
      <button className="auth-secondary" onClick={() => setResent(true)}>
        {resent ? "New demo code sent" : "Resend code"}
      </button>
      <button
        className="auth-text-link"
        onClick={() => {
          authService.cancelMfa();
          navigate("login");
        }}
      >
        Back to Sign In
      </button>
    </AuthLayout>
  );
}

export function AuthStatusPage({ view, navigate, reason }) {
  const content = {
    "account-locked": [
      "Account temporarily locked",
      "Five unsuccessful attempts triggered a temporary protection lock.",
    ],
    "account-suspended": [
      "Account access unavailable",
      "This account is currently unavailable. Contact beatmondo support for a private access review.",
    ],
    "session-expired": [
      "Your session expired",
      "Sign in again and beatmondo will return you to the private page you requested.",
    ],
    "access-denied": [
      "Access denied",
      reason ||
        "Your current role or membership does not permit access to this workspace.",
    ],
  }[view] || [
    "Access unavailable",
    reason || "This private workspace is not currently available.",
  ];
  const { user, authService, refresh } = useAuth();
  return (
    <AuthLayout
      navigate={navigate}
      compact
      title={content[0]}
      description={content[1]}
    >
      <WarningCircle size={42} className="auth-feature-icon warning" />
      <span className="eyebrow">Protected workspace</span>
      <h2>{content[0]}</h2>
      <p>{content[1]}</p>
      {view === "account-locked" && (
        <button
          className="auth-secondary"
          onClick={() => {
            const target =
              user ||
              authService.getState().users.find((item) => item.lockedUntil);
            if (target) authService.unlockAccount(target.id);
            refresh();
            navigate("login");
          }}
        >
          Unlock demo account
        </button>
      )}
      <button
        className="auth-primary"
        onClick={() =>
          navigate(view === "account-suspended" ? "contact" : "login")
        }
      >
        {view === "account-suspended" ? "Contact support" : "Sign In"}
      </button>
      <button className="auth-text-link" onClick={() => navigate("home")}>
        Return to homepage
      </button>
    </AuthLayout>
  );
}

export function ProfilePage({ navigate, showToast }) {
  const { user, authService, refresh } = useAuth();
  const [form, setForm] = useState(() => ({
    name: user?.name || "",
    organization: user?.organization || "",
    jobTitle: user?.jobTitle || "",
    phone: user?.phone || "",
    country: user?.country || "",
    website: user?.website || "",
    bio: user?.bio || "",
    notificationPreferences: user?.notificationPreferences || {},
  }));
  const [saved, setSaved] = useState(true);
  if (!user) return null;
  const update = (field, value) => {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  };
  const save = () => {
    authService.updateProfile(user.id, form);
    refresh();
    setSaved(true);
    showToast("Profile changes saved.");
  };
  return (
    <section className="account-page">
      <div className="account-page-heading">
        <div>
          <span className="eyebrow">Account profile</span>
          <h2>{user.name}</h2>
          <p>
            Keep professional identity and notification preferences current.
          </p>
        </div>
        <div className="profile-completion">
          <span>{user.profileCompletion}%</span>
          <small>Profile complete</small>
        </div>
      </div>
      <div className="account-status-row">
        <span>Email Verified</span>
        <span>{user.roleLabel}</span>
        <span>{user.membershipTier}</span>
        <span>Account {user.accountStatus}</span>
      </div>
      <div className="account-panel">
        <div className="profile-avatar-large">{user.avatar}</div>
        <div className="auth-module-form profile-form">
          <label>
            Full name
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </label>
          <label>
            Organization
            <input
              value={form.organization}
              onChange={(event) => update("organization", event.target.value)}
            />
          </label>
          <label>
            Job title
            <input
              value={form.jobTitle}
              onChange={(event) => update("jobTitle", event.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </label>
          <label>
            Country
            <input
              value={form.country}
              onChange={(event) => update("country", event.target.value)}
            />
          </label>
          <label>
            Website
            <input
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
            />
          </label>
          <label className="full-field">
            Professional summary
            <textarea
              value={form.bio}
              onChange={(event) => update("bio", event.target.value)}
            />
          </label>
          <fieldset className="full-field notification-preferences">
            <legend>Notification preferences</legend>
            {Object.entries(form.notificationPreferences).map(
              ([key, value]) => (
                <label className="auth-check" key={key}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(event) =>
                      update("notificationPreferences", {
                        ...form.notificationPreferences,
                        [key]: event.target.checked,
                      })
                    }
                  />{" "}
                  {key[0].toUpperCase() + key.slice(1)}
                </label>
              ),
            )}
          </fieldset>
        </div>
        <div className="account-form-actions">
          <button
            className="auth-secondary"
            onClick={() => navigate(defaultDestinationFor(user))}
          >
            Cancel
          </button>
          <button className="auth-primary" onClick={save} disabled={saved}>
            {saved ? "Changes saved" : "Save changes"}
          </button>
        </div>
        {!saved && (
          <p className="unsaved-warning" role="status">
            You have unsaved profile changes.
          </p>
        )}
      </div>
    </section>
  );
}

export function SecurityPage({ navigate, showToast }) {
  const { user, authService, refresh, logout, setIntendedView } = useAuth();
  const [sessions, setSessions] = useState(() =>
    authService.getSessions(user?.id),
  );
  const [events, setEvents] = useState(() =>
    authService.getSecurityEvents(user?.id),
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  if (!user) return null;
  const reload = () => {
    setSessions(authService.getSessions(user.id));
    setEvents(authService.getSecurityEvents(user.id));
    refresh();
  };
  const changePassword = async (event) => {
    event.preventDefault();
    if (
      !Object.values(passwordChecks(newPassword)).every(Boolean) ||
      newPassword !== confirm
    ) {
      setMessage("Meet every password rule and confirm the same new password.");
      return;
    }
    const result = await authService.changePassword(
      user.id,
      currentPassword,
      newPassword,
    );
    setMessage(result.ok ? "Password changed successfully." : result.message);
    if (result.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      reload();
    }
  };
  const toggleMfa = () => {
    if (!user.mfaEnabled && mfaCode !== "246810") {
      setMessage("Enter demo setup code 246810 to enable MFA.");
      return;
    }
    const result = authService.setMfa(user.id, !user.mfaEnabled);
    setRecoveryCodes(result.recoveryCodes || []);
    setMessage(`MFA ${user.mfaEnabled ? "disabled" : "enabled"}.`);
    reload();
  };
  return (
    <section className="account-page security-page">
      <div className="account-page-heading">
        <div>
          <span className="eyebrow">Account security</span>
          <h2>Security & sessions</h2>
          <p>
            Manage passwords, MFA, trusted devices, active sessions, and recent
            access activity.
          </p>
        </div>
        <span className="security-state">
          <ShieldCheck /> {user.mfaEnabled ? "MFA Enabled" : "MFA Optional"}
        </span>
      </div>
      <div className="security-grid">
        <section className="account-panel">
          <h3>Change password</h3>
          <form className="auth-module-form" onSubmit={changePassword}>
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
            />
            <PasswordStrength
              password={newPassword}
              confirmPassword={confirm}
            />
            <button className="auth-primary">Update password</button>
          </form>
        </section>
        <section className="account-panel">
          <h3>Multi-factor authentication</h3>
          <p>
            {user.mfaEnabled
              ? "A six-digit code is required on untrusted devices."
              : "Add a second factor to protect this workspace."}
          </p>
          {!user.mfaEnabled && (
            <label className="auth-inline-field">
              Demo setup code
              <input
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                placeholder="246810"
              />
            </label>
          )}
          <button className="auth-secondary" onClick={toggleMfa}>
            {user.mfaEnabled ? "Disable MFA" : "Enable MFA"}
          </button>
          {recoveryCodes.length > 0 && (
            <div className="recovery-codes">
              <strong>Recovery codes</strong>
              {recoveryCodes.map((code) => (
                <code key={code}>{code}</code>
              ))}
            </div>
          )}
        </section>
      </div>
      {message && (
        <p className="auth-success-note" role="status">
          {message}
        </p>
      )}
      <section className="account-panel">
        <div className="panel-heading-row">
          <div>
            <h3>Active sessions</h3>
            <p>Revoke devices that no longer need access.</p>
          </div>
          <button
            className="auth-secondary"
            onClick={() => {
              authService.revokeOtherSessions(user.id);
              reload();
              showToast("Other sessions revoked.");
            }}
          >
            Sign out all other sessions
          </button>
        </div>
        <div className="session-list">
          {sessions.map((session) => (
            <article key={session.id}>
              <DeviceMobile size={23} />
              <div>
                <strong>
                  {session.device} · {session.browser}
                </strong>
                <span>
                  {session.location} · {session.lastActive}
                </span>
              </div>
              {session.current ? (
                <em>Current session</em>
              ) : (
                <button
                  onClick={() => {
                    authService.revokeSession(user.id, session.id);
                    reload();
                  }}
                >
                  Revoke
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="account-panel">
        <h3>Recent security activity</h3>
        <div className="security-event-list">
          {events.slice(0, 8).map((event) => (
            <article key={event.id}>
              <ShieldCheck />
              <div>
                <strong>{event.description}</strong>
                <span>
                  {new Date(event.timestamp).toLocaleString()} · {event.device}
                </span>
              </div>
              <em>{event.status}</em>
            </article>
          ))}
        </div>
      </section>
      <div className="security-danger-zone">
        <button
          onClick={() => {
            setIntendedView("security");
            authService.expireSession();
            setTimeout(() => {
              refresh();
              navigate("session-expired");
            }, 10);
          }}
        >
          Simulate session expiry
        </button>
        <button
          onClick={() => {
            logout(true);
            showToast("Signed out from all devices.");
            navigate("login");
          }}
        >
          Logout from all devices
        </button>
        <button
          onClick={() => {
            authService.resetDemoData();
            refresh();
            showToast("Authentication demo data reset.");
            navigate("login");
          }}
        >
          Reset authentication demo
        </button>
      </div>
    </section>
  );
}

export function NotificationsPage({ navigate }) {
  const { user, authService, revision } = useAuth();
  const messages = useMemo(
    () =>
      user
        ? authService.getMessages(user.id)
        : authService.getState().messages.slice(0, 8),
    [user, authService, revision],
  );
  return (
    <section className="account-page">
      <div className="account-page-heading">
        <div>
          <span className="eyebrow">Demo messages</span>
          <h2>Notification Centre</h2>
          <p>
            Authentication emails and security events are simulated here for
            demonstrations.
          </p>
        </div>
        <Bell size={32} />
      </div>
      <div className="message-list">
        {messages.length ? (
          messages.map((message) => (
            <button
              key={message.id}
              className={message.read ? "read" : ""}
              onClick={() => {
                authService.markMessageRead(message.id);
                if (message.action) navigate(message.action);
              }}
            >
              <span className="message-icon">
                <Envelope />
              </span>
              <span>
                <strong>{message.title}</strong>
                <small>{message.body}</small>
                <time>{new Date(message.createdAt).toLocaleString()}</time>
              </span>
              {!message.read && <em>New</em>}
            </button>
          ))
        ) : (
          <div className="account-panel">
            <h3>No demo messages</h3>
            <p>
              Verification, reset, login, MFA, and security messages will appear
              here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export function MembershipPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <section className="account-page">
      <div className="account-page-heading">
        <div>
          <span className="eyebrow">Membership overview</span>
          <h2>{user.membershipTier}</h2>
          <p>
            Access, verification, and delivery permissions for this account.
          </p>
        </div>
        <span className="tier-badge vip">{user.membershipTier}</span>
      </div>
      {user.verificationStatus !== "approved" && (
        <div className="account-status-banner warning">
          <WarningCircle />
          <div>
            <strong>Professional verification under review</strong>
            <span>
              Discovery and saved-track access remain available. Projects,
              quotes, and secure delivery unlock after approval.
            </span>
          </div>
        </div>
      )}
      <div className="membership-grid">
        <article>
          <strong>Email</strong>
          <span>{user.emailVerified ? "Verified" : "Pending"}</span>
        </article>
        <article>
          <strong>Account</strong>
          <span>{user.accountStatus}</span>
        </article>
        <article>
          <strong>Professional verification</strong>
          <span>{user.verificationStatus.replace("_", " ")}</span>
        </article>
        <article>
          <strong>Secure delivery</strong>
          <span>
            {user.permissions.includes("delivery.view") ||
            user.permissions.includes("*")
              ? "Available when approved"
              : "Restricted"}
          </span>
        </article>
      </div>
    </section>
  );
}

export function AdminUsersPage({ showToast }) {
  const { user: actor, authService, refresh, revision } = useAuth();
  const users = useMemo(
    () => authService.getState().users,
    [authService, revision],
  );
  const [selected, setSelected] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const apply = () => {
    if (!selected || !pendingAction) return;
    const result = authService.adminUpdateUser(
      actor.id,
      selected.id,
      pendingAction.updates,
      pendingAction.description,
    );
    if (result.ok) {
      showToast(pendingAction.description);
      setSelected(result.user);
      refresh();
    }
    setPendingAction(null);
  };
  return (
    <section className="account-page admin-users-page">
      <div className="account-page-heading">
        <div>
          <span className="eyebrow">Super administrator</span>
          <h2>User & role management</h2>
          <p>
            Manage prototype account state, permissions, membership, MFA, and
            sessions.
          </p>
        </div>
        <span className="security-state">
          <ShieldCheck /> Super Administrator
        </span>
      </div>
      <div className="admin-user-table-wrap">
        <table className="admin-user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Organization</th>
              <th>Role</th>
              <th>Membership</th>
              <th>Verification</th>
              <th>Status</th>
              <th>MFA</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.id}>
                <td>
                  <strong>{account.name}</strong>
                  <small>{account.email}</small>
                </td>
                <td>{account.organization}</td>
                <td>{account.roleLabel}</td>
                <td>{account.membershipTier}</td>
                <td>
                  {account.emailVerified ? "Email verified" : "Email pending"}
                  <small>{account.verificationStatus}</small>
                </td>
                <td>{account.accountStatus}</td>
                <td>{account.mfaEnabled ? "Enabled" : "Disabled"}</td>
                <td>
                  <button onClick={() => setSelected(account)}>Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div
          className="admin-user-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={`Manage ${selected.name}`}
        >
          <button
            className="drawer-close"
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            <X />
          </button>
          <span className="eyebrow">Account management</span>
          <h3>{selected.name}</h3>
          <p>
            {selected.email} · {selected.organization}
          </p>
          <div className="admin-user-facts">
            <span>
              Last login
              <strong>
                {selected.lastLoginAt
                  ? new Date(selected.lastLoginAt).toLocaleString()
                  : "Never"}
              </strong>
            </span>
            <span>
              Profile<strong>{selected.profileCompletion}%</strong>
            </span>
            <span>
              Role<strong>{selected.roleLabel}</strong>
            </span>
            <span>
              Status<strong>{selected.accountStatus}</strong>
            </span>
          </div>
          <div className="admin-action-grid">
            <button
              onClick={() =>
                setPendingAction({
                  description: `${selected.accountStatus === "suspended" ? "Activated" : "Suspended"} ${selected.name}.`,
                  updates: {
                    accountStatus:
                      selected.accountStatus === "suspended"
                        ? "active"
                        : "suspended",
                  },
                })
              }
            >
              {selected.accountStatus === "suspended"
                ? "Activate account"
                : "Suspend account"}
            </button>
            <button
              onClick={() => {
                authService.unlockAccount(selected.id);
                refresh();
                showToast("Account unlocked.");
              }}
            >
              Unlock account
            </button>
            <button
              onClick={() =>
                setPendingAction({
                  description: `Updated email verification for ${selected.name}.`,
                  updates: { emailVerified: !selected.emailVerified },
                })
              }
            >
              {selected.emailVerified
                ? "Mark email pending"
                : "Mark email verified"}
            </button>
            <button
              onClick={() =>
                setPendingAction({
                  description: `Updated MFA requirement for ${selected.name}.`,
                  updates: { mfaEnabled: !selected.mfaEnabled },
                })
              }
            >
              {selected.mfaEnabled ? "Remove MFA requirement" : "Require MFA"}
            </button>
            <label>
              Membership
              <select
                value={selected.membershipTier}
                onChange={(event) =>
                  setPendingAction({
                    description: `Changed ${selected.name} membership to ${event.target.value}.`,
                    updates: { membershipTier: event.target.value },
                  })
                }
              >
                <option>Discovery Access</option>
                <option>Professional Buyer</option>
                <option>VIP Sync Access</option>
                <option>Artist Workspace</option>
                <option>Internal</option>
              </select>
            </label>
            <label>
              Role
              <select
                value={selected.role}
                onChange={(event) =>
                  setPendingAction({
                    description: `Changed ${selected.name} role.`,
                    updates: { role: event.target.value },
                  })
                }
              >
                {Object.keys(ROLE_PERMISSIONS).map((role) => (
                  <option key={role} value={role}>
                    {role.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                authService.revokeOtherSessions(selected.id);
                refresh();
                showToast("Sessions revoked.");
              }}
            >
              Revoke sessions
            </button>
            <button
              onClick={() => showToast("Demo password reset message created.")}
            >
              Reset password
            </button>
          </div>
        </div>
      )}
      {pendingAction && (
        <ConfirmationModal
          title="Confirm sensitive account change"
          message={pendingAction.description}
          onCancel={() => setPendingAction(null)}
          onConfirm={apply}
        />
      )}
    </section>
  );
}

export function ConfirmationModal({ title, message, onCancel, onConfirm }) {
  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);
  return (
    <div
      className="auth-confirm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-confirm-title"
    >
      <div className="auth-confirm-modal">
        <WarningCircle size={32} />
        <h3 id="auth-confirm-title">{title}</h3>
        <p>{message}</p>
        <div>
          <button className="auth-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="auth-primary" onClick={onConfirm}>
            Confirm change
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserMenu({ navigate, compact = false }) {
  const { user, logout, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user)
    return (
      <div className="logged-out-actions">
        <button onClick={() => navigate("login")}>Sign In</button>
        <button onClick={() => navigate("register")}>Request Access</button>
      </div>
    );
  const dashboard = defaultDestinationFor(user);
  return (
    <div className={`user-menu ${compact ? "compact" : ""}`}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen((state) => !state)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>{user.avatar}</span>
        <span>
          <strong>{user.name}</strong>
          <small>{user.membershipTier || user.roleLabel}</small>
        </span>
      </button>
      {open && (
        <div className="user-menu-popover" role="menu">
          <div>
            <span className="user-menu-avatar">{user.avatar}</span>
            <span>
              <strong>{user.name}</strong>
              <small>{user.organization}</small>
              <em>{user.roleLabel}</em>
            </span>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              navigate(dashboard);
              setOpen(false);
            }}
          >
            <UserCircle /> Dashboard
          </button>
          <button
            role="menuitem"
            onClick={() => {
              navigate("profile");
              setOpen(false);
            }}
          >
            <UserCircle /> Profile
          </button>
          <button
            role="menuitem"
            onClick={() => {
              navigate("security");
              setOpen(false);
            }}
          >
            <ShieldCheck /> Security
          </button>
          {user.userType === "buyer" && (
            <button
              role="menuitem"
              onClick={() => {
                navigate("membership");
                setOpen(false);
              }}
            >
              <Key /> Membership
            </button>
          )}
          <button
            role="menuitem"
            onClick={() => {
              navigate("notifications");
              setOpen(false);
            }}
          >
            <Bell /> Demo Messages
          </button>
          {hasPermission("users.manage") && (
            <button
              role="menuitem"
              onClick={() => {
                navigate("admin-users");
                setOpen(false);
              }}
            >
              <GearSix /> User management
            </button>
          )}
          <button
            role="menuitem"
            className="logout"
            onClick={() => {
              logout();
              setOpen(false);
              navigate("login");
            }}
          >
            <SignOut /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function renderAuthView(view, props) {
  const { navigate, showToast, reason } = props;
  if (view === "login")
    return <LoginPage navigate={navigate} showToast={showToast} />;
  if (view === "register" || view === "signup")
    return <RegistrationWizard navigate={navigate} showToast={showToast} />;
  if (view === "forgot" || view === "forgot-password")
    return <ForgotPasswordPage navigate={navigate} />;
  if (view === "reset-password")
    return <ResetPasswordPage navigate={navigate} showToast={showToast} />;
  if (view === "verify-email")
    return <VerifyEmailPage navigate={navigate} showToast={showToast} />;
  if (view === "verification-success")
    return <VerificationSuccessPage navigate={navigate} />;
  if (view === "mfa")
    return <MfaChallengePage navigate={navigate} showToast={showToast} />;
  if (
    [
      "account-locked",
      "account-suspended",
      "session-expired",
      "access-denied",
    ].includes(view)
  )
    return <AuthStatusPage view={view} navigate={navigate} reason={reason} />;
  if (view === "profile")
    return <ProfilePage navigate={navigate} showToast={showToast} />;
  if (view === "security")
    return <SecurityPage navigate={navigate} showToast={showToast} />;
  if (view === "notifications")
    return <NotificationsPage navigate={navigate} />;
  if (view === "admin-users") return <AdminUsersPage showToast={showToast} />;
  return null;
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, name.length - 2))}@${domain}`;
}
