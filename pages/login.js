// pages/login.js
// Password gate for the &Soul Performance Dashboard.
// Matches the dashboard's dark theme with gold accent.

import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        router.push("/");
      } else {
        setError(data.error || "Incorrect password");
        setPassword("");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>&Soul Dashboard · Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #0a0a0f;
          color: #e0e0e0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <style jsx>{`
        .login-container {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          background: #16161e;
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .logo {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #c8a455;
          letter-spacing: 0.5px;
        }

        .logo p {
          font-size: 0.85rem;
          color: #888;
          margin-top: 0.4rem;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-group {
          position: relative;
        }

        .input-group label {
          display: block;
          font-size: 0.8rem;
          color: #999;
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #0e0e14;
          border: 1px solid #2a2a3a;
          border-radius: 8px;
          color: #e0e0e0;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .input-group input:focus {
          border-color: #c8a455;
        }

        .input-group input::placeholder {
          color: #555;
        }

        .error-msg {
          background: rgba(220, 50, 50, 0.1);
          border: 1px solid rgba(220, 50, 50, 0.3);
          border-radius: 6px;
          padding: 0.6rem 0.8rem;
          font-size: 0.85rem;
          color: #e55;
        }

        .submit-btn {
          padding: 0.75rem 1rem;
          background: #c8a455;
          color: #0a0a0f;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          margin-top: 0.5rem;
        }

        .submit-btn:hover {
          background: #d4b366;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .footer {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: #555;
        }
      `}</style>

      <div className="login-container">
        <div className="logo">
          <h1>&Soul</h1>
          <p>Performance Dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter dashboard password"
              autoFocus
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading || !password}>
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>

        <div className="footer">
          Protected access · &Soul Property Management
        </div>
      </div>
    </>
  );
}
