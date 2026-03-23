import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAppContext } from "../context/AppContext";
import { resolveAssetUrl } from "../utils/assets";
import { titleCase } from "../utils/formatters";

const initialForm = {
  name: "",
  tokenId: "",
  legalName: "",
  brokerageHouseName: "",
  contactEmail: "",
  contactPhone: "",
};

function getBrandingStatus(broker) {
  if (broker?.branding?.logoUrl && broker?.branding?.signatureUrl && broker?.branding?.brokerageHouseName) {
    return "Complete";
  }

  if (broker?.branding?.brokerageHouseName || broker?.branding?.logoUrl) {
    return "Needs assets";
  }

  return "Needs setup";
}

export default function BrokersPage() {
  const navigate = useNavigate();
  const { brokers, selectedBrokerId, setSelectedBrokerId, createBroker, deleteBroker, updateBroker } = useAppContext();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [togglingBrokerId, setTogglingBrokerId] = useState("");
  const [error, setError] = useState("");
  const [isBrokerListOpen, setIsBrokerListOpen] = useState(true);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const hasBrokers = useMemo(() => brokers.length > 0, [brokers]);
  const selectedBroker = useMemo(
    () => brokers.find((broker) => broker._id === selectedBrokerId) || null,
    [brokers, selectedBrokerId]
  );

  useEffect(() => {
    async function loadClients() {
      if (!selectedBrokerId) {
        setClients([]);
        setClientsLoading(false);
        return;
      }

      setClientsLoading(true);
      try {
        const response = await api.get(`/api/clients?brokerId=${selectedBrokerId}`);
        setClients(response.data);
      } catch {
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    }

    loadClients();
  }, [selectedBrokerId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createBroker({
        name: form.name,
        tokenId: form.tokenId,
        legalName: form.legalName,
        contact: {
          email: form.contactEmail,
          phone: form.contactPhone,
        },
        branding: {
          brokerageHouseName: form.brokerageHouseName || form.name,
          shortName: form.name,
          logoText: (form.name || "BR").slice(0, 2).toUpperCase(),
        },
      });
      setForm(initialForm);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create broker.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(brokerId) {
    if (!window.confirm("Delete this broker and all its records?")) {
      return;
    }

    await deleteBroker(brokerId);
  }

  async function handleToggleBrokerStatus(broker) {
    const isActive = broker.status !== "inactive";
    const nextStatus = isActive ? "inactive" : "active";

    if (!window.confirm(`${isActive ? "Block" : "Unblock"} ${broker.name}?`)) {
      return;
    }

    setError("");
    setTogglingBrokerId(broker._id);

    try {
      await updateBroker(broker._id, { status: nextStatus });
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to ${isActive ? "block" : "unblock"} broker.`);
    } finally {
      setTogglingBrokerId("");
    }
  }

  function openSettings(brokerId) {
    setSelectedBrokerId(brokerId);
    navigate("/admin/settings");
  }

  function openTemplate(brokerId) {
    setSelectedBrokerId(brokerId);
    navigate("/admin/documents");
  }

  return (
    <section className="page-grid">
      <PageHeader title="Brokers" />

      <div className="content-grid content-grid--two">
        <details className="panel broker-list-panel" open={isBrokerListOpen} onToggle={(event) => setIsBrokerListOpen(event.currentTarget.open)}>
          <summary className="broker-list-panel__summary">
            <div className="broker-list-panel__summary-text">
              <h3>Broker list</h3>
              <span>{brokers.length} brokers</span>
            </div>
            <span className="broker-list-panel__toggle">{isBrokerListOpen ? "Collapse" : "Expand"}</span>
          </summary>

          <div className="broker-list-panel__content">
            {hasBrokers ? (
              <div className="broker-card-list">
                {brokers.map((broker) => {
                  const logoUrl = resolveAssetUrl(broker?.branding?.logoUrl);
                  const brandingStatus = getBrandingStatus(broker);

                  return (
                    <article
                      key={broker._id}
                      className={broker._id === selectedBrokerId ? "broker-card broker-card--active" : "broker-card"}
                    >
                      <div className="broker-card__top">
                        {logoUrl ? (
                          <img src={logoUrl} alt={`${broker.name} logo`} className="broker-card__logo" />
                        ) : (
                          <div className="broker-card__swatch">
                            {broker.branding?.logoText || "BR"}
                          </div>
                        )}

                        <div>
                          <h4>{broker.name}</h4>
                          <p>{broker.branding?.brokerageHouseName || broker.legalName || broker.name}</p>
                        </div>
                      </div>

                      <div className="broker-card__meta broker-card__meta--stack">
                        <span>Token ID</span>
                        <strong>{broker.tokenId}</strong>
                      </div>

                      <div className="broker-card__meta">
                        <span>{brandingStatus}</span>
                        <span className={`status-pill status-pill--${broker.status === "inactive" ? "inactive" : "active"}`}>
                          {titleCase(broker.status || "active")}
                        </span>
                      </div>

                      <div className="broker-card__actions broker-card__actions--wrap">
                        <button
                          className={broker.status === "inactive" ? "btn btn--primary" : "btn btn--danger"}
                          type="button"
                          onClick={() => handleToggleBrokerStatus(broker)}
                          disabled={togglingBrokerId === broker._id}
                        >
                          {togglingBrokerId === broker._id
                            ? broker.status === "inactive"
                              ? "Unblocking..."
                              : "Blocking..."
                            : broker.status === "inactive"
                              ? "Unblock Broker"
                              : "Block Broker"}
                        </button>
                        <button className="btn btn--ghost" type="button" onClick={() => openSettings(broker._id)}>
                          Branding
                        </button>
                        <button className="btn btn--ghost" type="button" onClick={() => openTemplate(broker._id)}>
                          Template
                        </button>
                        <button className="btn btn--danger" type="button" onClick={() => handleDelete(broker._id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No brokers configured" />
            )}
          </div>
        </details>

        <section className="panel panel--padded">
          <div className="panel__header">
            <h3>Create broker</h3>
            <span>New broker</span>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Broker name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              Token ID
              <input
                value={form.tokenId}
                onChange={(event) => setForm({ ...form, tokenId: event.target.value.toUpperCase() })}
                placeholder="Ex: 109080"
                required
              />
            </label>
            <label>
              Legal name
              <input value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} />
            </label>
            <label>
              Brokerage house name
              <input
                value={form.brokerageHouseName}
                onChange={(event) => setForm({ ...form, brokerageHouseName: event.target.value })}
                placeholder="Shown in invoice header"
              />
            </label>
            <label>
              Contact email
              <input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} />
            </label>
            <label>
              Contact phone
              <input value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
            </label>

            {error ? <div className="alert-strip form-grid__span-2">{error}</div> : null}

            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Broker"}
            </button>
          </form>
        </section>
      </div>

      <section className="panel panel--padded">
        <div className="panel__header panel__header--stack">
          <div>
            <h3>Broker clients</h3>
            <span>{selectedBroker ? selectedBroker.branding?.brokerageHouseName || selectedBroker.name : "No broker selected"}</span>
          </div>
          <span>{clients.length} clients</span>
        </div>

        {clientsLoading ? <div>Loading clients...</div> : null}
        {!clientsLoading && !clients.length ? <EmptyState title="No clients" /> : null}

        {!clientsLoading && clients.length ? (
          <div className="responsive-data-block">
            <div className="mobile-entity-list">
              {clients.map((client) => (
                <article key={client._id} className="mobile-entity-card">
                  <div className="mobile-entity-card__header">
                    <div>
                      <strong>{client.fullName}</strong>
                      <span>{client.clientCode || client.idCode || "-"}</span>
                    </div>
                    <span className="status-pill status-pill--draft">{titleCase(client.status || "active")}</span>
                  </div>

                  <div className="mobile-entity-card__meta">
                    <div>
                      <span>Segment</span>
                      <strong>{titleCase(client.segment || "-")}</strong>
                    </div>
                    <div>
                      <span>Phone</span>
                      <strong>{client.phone || "-"}</strong>
                    </div>
                    <div>
                      <span>Email</span>
                      <strong>{client.email || "-"}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="table-wrap desktop-data-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Code</th>
                    <th>Segment</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client._id}>
                      <td>{client.fullName}</td>
                      <td>{client.clientCode || client.idCode || "-"}</td>
                      <td>{titleCase(client.segment || "-")}</td>
                      <td>{client.phone || "-"}</td>
                      <td>{client.email || "-"}</td>
                      <td>{titleCase(client.status || "active")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </section>
  );
}
