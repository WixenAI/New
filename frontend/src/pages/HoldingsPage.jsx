import { useEffect, useState } from "react";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAppContext } from "../context/AppContext";
import { formatCurrency, formatDate, formatNumber, titleCase } from "../utils/formatters";

export default function HoldingsPage() {
  const { selectedBroker } = useAppContext();
  const [openTrades, setOpenTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOpenTrades() {
      if (!selectedBroker?._id) {
        setOpenTrades([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/api/trades?brokerId=${selectedBroker._id}&status=open`);
        setOpenTrades(response.data);
        setError("");
      } catch (requestError) {
        setOpenTrades([]);
        setError(requestError.response?.data?.message || "Unable to load open orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOpenTrades();
  }, [selectedBroker?._id]);

  if (!selectedBroker) {
    return <EmptyState title="No broker selected" />;
  }

  return (
    <section className="page-grid">
      <PageHeader title="Open Orders" />

      <section className="panel panel--padded">
        <div className="panel__header">
          <h3>Open orders</h3>
          <span>{openTrades.length} trades</span>
        </div>

        {error ? <div className="alert-strip">{error}</div> : null}

        {loading ? <div>Loading open orders...</div> : null}

        {!loading && !openTrades.length ? <EmptyState title="No open orders" /> : null}

        {!loading && openTrades.length ? (
          <div className="responsive-data-block">
            <div className="mobile-entity-list">
              {openTrades.map((trade) => (
                <article key={trade._id} className="mobile-entity-card">
                  <div className="mobile-entity-card__header">
                    <div>
                      <strong>{trade.stockName || trade.symbol}</strong>
                      <span>{titleCase(trade.segment)} · {String(trade.side).toUpperCase()}</span>
                    </div>
                    <span className="status-pill status-pill--open">Open</span>
                  </div>

                  <div className="mobile-entity-card__meta">
                    <div>
                      <span>Client</span>
                      <strong>{trade.clientId?.fullName || "-"}</strong>
                    </div>
                    <div>
                      <span>Quantity</span>
                      <strong>{formatNumber(trade.quantity)}</strong>
                    </div>
                    <div>
                      <span>Entry</span>
                      <strong>{formatCurrency(trade.entryPrice)}</strong>
                    </div>
                    <div>
                      <span>Date</span>
                      <strong>{formatDate(trade.tradedAt)}</strong>
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
                    <th>Quantity</th>
                    <th>Entry</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {openTrades.map((trade) => (
                    <tr key={trade._id}>
                      <td>
                        <strong>{trade.stockName || trade.symbol}</strong>
                        <span>{titleCase(trade.segment)} / {String(trade.side).toUpperCase()}</span>
                      </td>
                      <td>{trade.clientId?.fullName || "-"}</td>
                      <td>{formatNumber(trade.quantity)}</td>
                      <td>{formatCurrency(trade.entryPrice)}</td>
                      <td>{formatDate(trade.tradedAt)}</td>
                      <td>
                        <span className="status-pill status-pill--open">Open</span>
                      </td>
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
