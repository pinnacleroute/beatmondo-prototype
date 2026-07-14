import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "./premium-skin.css";

const SITE_PASSWORD = "surfaceboy";
const ACCESS_KEY = "beatmondo-site-access";
const isDemoMode = new URLSearchParams(window.location.search).get("demo") === "investor";

function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => isDemoMode || sessionStorage.getItem(ACCESS_KEY) === "granted");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const unlock = (event) => {
    event.preventDefault();

    if (password === SITE_PASSWORD) {
      sessionStorage.setItem(ACCESS_KEY, "granted");
      setUnlocked(true);
      setError("");
      return;
    }

    setError("That password is incorrect. Please try again.");
    setPassword("");
  };

  if (unlocked) return children;

  return (
    <main className="site-password-gate">
      <form className="site-password-panel" onSubmit={unlock}>
        <img src="/assets/beatmondo-logo.png" alt="beatmondo" />
        <span className="site-password-kicker">Private access</span>
        <h1>Enter the private beatmondo environment.</h1>
        <p>This site is protected. Enter the password to continue.</p>
        <label htmlFor="site-password">Password</label>
        <input
          id="site-password"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError("");
          }}
          autoComplete="current-password"
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "site-password-error" : undefined}
        />
        {error && <span id="site-password-error" className="site-password-error" role="alert">{error}</span>}
        <button type="submit">Enter beatmondo</button>
        <small>Approved access only · Protected licensing environment</small>
      </form>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PasswordGate>
      <App />
    </PasswordGate>
  </React.StrictMode>,
);
