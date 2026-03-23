import PageHeader from "../../components/PageHeader";
import { useBrokerAuth } from "../../context/BrokerAuthContext";

export default function BrokerProfilePage() {
  const { broker, logout } = useBrokerAuth();

  return (
    <section className="page-grid">
      <PageHeader title="Profile" />

      <div className="content-grid content-grid--two broker-profile-grid">
        <section className="panel panel--padded">
          <div className="panel__header panel__header--stack">
            <h3>Broker details</h3>
            <span>{broker?.status || "active"}</span>
          </div>

          <ul className="detail-list">
            <li><span>Brokerage house</span><strong>{broker?.branding?.brokerageHouseName || broker?.name || "-"}</strong></li>
            <li><span>Broker name</span><strong>{broker?.name || "-"}</strong></li>
            <li><span>Token ID</span><strong>{broker?.tokenId || "-"}</strong></li>
            <li><span>Legal name</span><strong>{broker?.legalName || "-"}</strong></li>
          </ul>
        </section>

        <section className="panel panel--padded">
          <div className="panel__header panel__header--stack">
            <h3>Contact</h3>
            <span>Current setup</span>
          </div>

          <ul className="detail-list">
            <li><span>Email</span><strong>{broker?.contact?.email || "-"}</strong></li>
            <li><span>Phone</span><strong>{broker?.contact?.phone || "-"}</strong></li>
            <li><span>Website</span><strong>{broker?.contact?.website || "-"}</strong></li>
            <li><span>Support</span><strong>{broker?.contact?.supportDesk || "-"}</strong></li>
          </ul>
        </section>
      </div>

      <section className="panel panel--padded broker-profile-actions">
        <div className="panel__header panel__header--stack">
          <h3>Session</h3>
        </div>

        <div className="form-actions-row">
          <button className="btn btn--danger" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </section>
    </section>
  );
}
