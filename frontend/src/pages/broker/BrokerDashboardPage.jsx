import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/StatCard";
import { brokerApi } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import SectionTabs from "../../components/SectionTabs";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { formatCurrency, formatDate, titleCase } from "../../utils/formatters";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "recent", label: "Recent" },
  { key: "actions", label: "Actions" },
];

export default function BrokerDashboardPage() {
  const navigate = useNavigate();
  const { broker } = useBrokerAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchOverview() {
      setLoading(true);
      try {
        const response = await brokerApi.get("/api/broker-portal/dashboard/overview");
        setOverview(response.data);
        setError("");
      } catch (requestError) {
        setOverview(null);
        setError(requestError.response?.data?.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, []);

  const quickActions = useMemo(
    () => [
      {
        key: "customer",
        title: "Create customer",
        caption: "Save a customer",
        onClick: () => navigate("/broker/customers", { state: { activeTab: "create" } }),
      },
      {
        key: "trade",
        title: "View trades",
        caption: "Trade history",
        onClick: () => navigate("/broker/trades"),
      },
      {
        key: "invoice",
        title: "Generate invoice",
        caption: "Build statement",
        onClick: () => navigate("/broker/invoice", { state: { activeTab: "generate" } }),
      },
    ],
    [navigate]
  );

  return (
    <section className="page-grid">
      <PageHeader title={broker?.branding?.brokerageHouseName || broker?.name || "Dashboard"} />

      {error ? <div className="alert-strip">{error}</div> : null}
      {loading ? <div className="panel panel--padded">Loading...</div> : null}

      {!loading && overview ? (
        <>
          <SectionTabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

          {activeTab === "overview" ? (
            <section className="panel panel--padded">
              <div className="stats-grid broker-stats-grid">
                <StatCard label="Customers" value={overview.clientCount} />
                <StatCard label="Trades" value={overview.tradeCount} />
                <StatCard label="Open" value={overview.openTrades} />
                <StatCard label="Net P&L" value={formatCurrency(overview.netPnL)} tone={overview.netPnL >= 0 ? "success" : "danger"} />
              </div>
            </section>
          ) : null}

          {activeTab === "recent" ? (
            <section className="panel panel--padded">
              <div className="panel__header panel__header--stack">
                <h3>Recent trades</h3>
                <span>{overview.recentTrades?.length || 0} entries</span>
              </div>

              {overview.recentTrades?.length ? (
                <div className="mobile-entity-list">
                  {overview.recentTrades.map((trade) => (
                    <article key={trade._id} className="mobile-entity-card">
                      <div className="mobile-entity-card__header">
                        <div>
                          <strong>{trade.stockName || trade.symbol}</strong>
                          <span>{titleCase(trade.segment)} · {String(trade.side).toUpperCase()}</span>
                        </div>
                        <span className={`status-pill status-pill--${trade.status}`}>{trade.status}</span>
                      </div>

                      <div className="mobile-entity-card__meta">
                        <div>
                          <span>Customer</span>
                          <strong>{trade.clientId?.fullName || "-"}</strong>
                        </div>
                        <div>
                          <span>Date</span>
                          <strong>{formatDate(trade.tradedAt)}</strong>
                        </div>
                        <div>
                          <span>Net</span>
                          <strong className={trade.netPnL >= 0 ? "text-success" : "text-danger"}>{formatCurrency(trade.netPnL)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No trades" />
              )}
            </section>
          ) : null}

          {activeTab === "actions" ? (
            <section className="panel panel--padded">
              <div className="panel__header panel__header--stack">
                <h3>Quick actions</h3>
                <span>{broker?.tokenId || ""}</span>
              </div>

              <div className="quick-actions-grid">
                {quickActions.map((action) => (
                  <button key={action.key} type="button" className="quick-action-card" onClick={action.onClick}>
                    <strong>{action.title}</strong>
                    <span>{action.caption}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
