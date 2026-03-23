import { useEffect, useState } from "react";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { useAppContext } from "../context/AppContext";
import { formatCurrency, formatDate, titleCase } from "../utils/formatters";

export default function DashboardPage() {
  const { selectedBroker } = useAppContext();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOverview() {
      if (!selectedBroker?._id) {
        setOverview(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/api/dashboard/overview?brokerId=${selectedBroker._id}`);
        setOverview(response.data);
        setError("");
      } catch (requestError) {
        setOverview(null);
        setError(requestError.response?.data?.message || "Unable to load dashboard overview.");
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, [selectedBroker?._id]);

  if (!selectedBroker) {
    return <EmptyState title="No brokers available" />;
  }

  return (
    <section className="page-grid">
      <PageHeader title="Dashboard" />

      {loading ? <div className="panel">Loading overview...</div> : null}
      {!loading && error ? <div className="alert-strip">{error}</div> : null}

      {!loading && overview ? (
        <>
          <div className="stats-grid dashboard-stats-grid">
            <StatCard label="Clients" value={overview.clientCount} />
            <StatCard label="Trades" value={overview.tradeCount} />
            <StatCard label="Open Positions" value={overview.openTrades} />
          </div>

          <div className="content-grid content-grid--two">
            <section className="panel panel--padded">
              <div className="panel__header">
                <h3>Recent trades</h3>
                <span>Latest activity for {selectedBroker.name}</span>
              </div>

              {overview.recentTrades.length ? (
                <div className="responsive-data-block">
                  <div className="mobile-entity-list">
                    {overview.recentTrades.map((trade) => (
                      <article key={trade._id} className="mobile-entity-card">
                        <div className="mobile-entity-card__header">
                          <div>
                            <strong>{trade.symbol}</strong>
                            <span>{titleCase(trade.segment)} / {trade.side.toUpperCase()}</span>
                          </div>
                          <span className={`status-pill status-pill--${trade.status}`}>{trade.status}</span>
                        </div>

                        <div className="mobile-entity-card__meta">
                          <div>
                            <span>Client</span>
                            <strong>{trade.clientId?.fullName || "Unknown client"}</strong>
                          </div>
                          <div>
                            <span>Date</span>
                            <strong>{formatDate(trade.tradedAt)}</strong>
                          </div>
                          <div>
                            <span>Net P&L</span>
                            <strong className={trade.netPnL >= 0 ? "text-success" : "text-danger"}>{formatCurrency(trade.netPnL)}</strong>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="table-wrap desktop-data-table">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Trade</th>
                          <th>Client</th>
                          <th>Status</th>
                          <th>P&L</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.recentTrades.map((trade) => (
                          <tr key={trade._id}>
                            <td>
                              <strong>{trade.symbol}</strong>
                              <span>{titleCase(trade.segment)} / {trade.side.toUpperCase()}</span>
                            </td>
                            <td>{trade.clientId?.fullName || "Unknown client"}</td>
                            <td>
                              <span className={`status-pill status-pill--${trade.status}`}>{trade.status}</span>
                            </td>
                            <td className={trade.netPnL >= 0 ? "text-success" : "text-danger"}>
                              {formatCurrency(trade.netPnL)}
                            </td>
                            <td>{formatDate(trade.tradedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState title="No trades yet" />
              )}
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
