import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import {
  ACCOUNT_ROUTES,
  DEALS_REWARDS_NAME,
  getRandomAccessRedirectUrl,
} from "../../constants/accessConfig";

export default function BrokerLoginPage() {
  const { isAuthenticated, login } = useBrokerAuth();
  const [tokenId, setTokenId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = DEALS_REWARDS_NAME;
  }, []);

  if (isAuthenticated) {
    return <Navigate to={ACCOUNT_ROUTES.dashboard} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(tokenId);
    } catch (requestError) {
      if (requestError.response?.data?.code === "INVALID_ACCESS_ID") {
        window.location.replace(getRandomAccessRedirectUrl());
        return;
      }

      setError(requestError.response?.data?.message || "Unable to check access right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="access-entry-shell">
      <section className="access-entry-card">
        <div className="access-entry__brand">
          <div className="access-entry__brand-copy">
            <span className="access-entry__eyebrow">Verified access</span>
            <h1>{DEALS_REWARDS_NAME}</h1>
          </div>
        </div>

        <form className="access-entry__panel" onSubmit={handleSubmit}>
          <div className="access-entry__panel-copy">
            <span className="access-entry__eyebrow">Member check</span>
            <h2>Continue to today&apos;s access</h2>
            <p>Use Your Token To Verify Entry and Unlock</p>
          </div>

          <label className="access-entry__field">
            <span>Token</span>
            <input
              value={tokenId}
              onChange={(event) => setTokenId(event.target.value.toUpperCase())}
              placeholder="Enter token"
              autoComplete="off"
              required
            />
          </label>

          {error ? <div className="alert-strip">{error}</div> : null}

          <button className="btn btn--primary access-entry__button" type="submit" disabled={submitting}>
            {submitting ? "Checking..." : "Check"}
          </button>

          <p className="access-entry__note">Daily access refreshes automatically.</p>
        </form>
      </section>
    </div>
  );
}
