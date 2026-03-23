import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAppContext } from "../context/AppContext";
import { formatCurrency, formatDate, formatNumber, titleCase } from "../utils/formatters";

export default function TradesPage() {
  const { selectedBroker } = useAppContext();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadTrades = useCallback(async () => {
    if (!selectedBroker?._id) {
      setTrades([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/api/trades?brokerId=${selectedBroker._id}`);
      setTrades(response.data);
      setError("");
    } catch (requestError) {
      setTrades([]);
      setError(requestError.response?.data?.message || "Unable to load trades.");
    } finally {
      setLoading(false);
    }
  }, [selectedBroker?._id]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const filteredTrades = useMemo(() => {
    if (statusFilter === "all") {
      return trades;
    }

    return trades.filter((trade) => trade.status === statusFilter);
  }, [statusFilter, trades]);

  if (!selectedBroker) {
    return <EmptyState title="No broker selected" />;
  }

  return (
    <section className="page-grid">
      <PageHeader title="Trades" />

      <section className="panel panel--padded">
        <div className="panel__header panel__header--stack">
          <div>
            <h3>Trade history</h3>
            <span>{selectedBroker.branding?.brokerageHouseName || selectedBroker.name}</span>
          </div>

          <div className="trade-history-actions">
            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All trades</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>
        </div>

        {error ? <div className="alert-strip">{error}</div> : null}
        {loading ? <div>Loading trades...</div> : null}
        {!loading && !filteredTrades.length ? <EmptyState title={statusFilter === "all" ? "No trades" : `No ${statusFilter} trades`} /> : null}

        {!loading && filteredTrades.length ? (
          <div className="responsive-data-block">
            <div className="mobile-entity-list">
              {filteredTrades.map((trade) => (
                <article key={trade._id} className="mobile-entity-card">
                  <div className="mobile-entity-card__header">
                    <div>
                      <strong>{trade.stockName || trade.symbol}</strong>
                      <span>{titleCase(trade.segment)} / {String(trade.side).toUpperCase()}</span>
                    </div>
                    <span className={`status-pill status-pill--${trade.status}`}>{trade.status}</span>
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
                      <span>Charges</span>
                      <strong>{formatCurrency(trade.charges?.total)}</strong>
                    </div>
                    <div>
                      <span>Net P&amp;L</span>
                      <strong className={trade.netPnL >= 0 ? "text-success" : "text-danger"}>{formatCurrency(trade.netPnL)}</strong>
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
                    <th>Qty</th>
                    <th>Entry</th>
                    <th>Charges</th>
                    <th>Net P&amp;L</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((trade) => (
                    <tr key={trade._id}>
                      <td>
                        <strong>{trade.stockName || trade.symbol}</strong>
                        <span>{titleCase(trade.segment)} / {String(trade.side).toUpperCase()}</span>
                      </td>
                      <td>{trade.clientId?.fullName || "-"}</td>
                      <td>{formatNumber(trade.quantity)}</td>
                      <td>{formatCurrency(trade.entryPrice)}</td>
                      <td>{formatCurrency(trade.charges?.total)}</td>
                      <td className={trade.netPnL >= 0 ? "text-success" : "text-danger"}>{formatCurrency(trade.netPnL)}</td>
                      <td>{formatDate(trade.tradedAt)}</td>
                      <td>
                        <span className={`status-pill status-pill--${trade.status}`}>{trade.status}</span>
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
