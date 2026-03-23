import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useBrokerAuth } from "../../context/BrokerAuthContext";

export default function BrokerLoginPage() {
  const { isAuthenticated, login } = useBrokerAuth();
  const [tokenId, setTokenId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/broker/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(tokenId);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Broker login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell broker-auth-shell">
      <section className="auth-card broker-auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__logo">BR</div>
          <div>
            <h1>Welcome</h1>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Broker Token ID
            <input
              value={tokenId}
              onChange={(event) => setTokenId(event.target.value.toUpperCase())}
              placeholder="Enter your token ID"
              autoComplete="off"
            />
          </label>

          {error ? <div className="alert-strip">{error}</div> : null}

          <button className="btn btn--primary auth-form__submit" type="submit" disabled={submitting}>
            {submitting ? "Opening..." : "Enter Broker Panel"}
          </button>
        </form>
      </section>
    </div>
  );
}
