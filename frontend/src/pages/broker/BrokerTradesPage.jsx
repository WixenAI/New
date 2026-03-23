import { useCallback, useEffect, useMemo, useState } from "react";
import { brokerApi } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import SectionTabs from "../../components/SectionTabs";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { formatCurrency, formatDate, formatNumber, titleCase } from "../../utils/formatters";

export default function BrokerTradesPage() {
  const { broker } = useBrokerAuth();
  const [clients, setClients] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientResponse, tradeResponse] = await Promise.all([
        brokerApi.get("/api/broker-portal/clients"),
        brokerApi.get("/api/broker-portal/trades"),
      ]);
      setClients(clientResponse.data);
      setTrades(tradeResponse.data);
      setError("");
    } catch (requestError) {
      setClients([]);
      setTrades([]);
      setError(requestError.response?.data?.message || "Unable to load trades.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const matchesStatus = statusFilter === "all" ? true : trade.status === statusFilter;
      const matchesClient = clientFilter === "all" ? true : trade.clientId?._id === clientFilter;
      return matchesStatus && matchesClient;
    });
  }, [clientFilter, statusFilter, trades]);

  const tabs = useMemo(
    () => [
      { key: "all", label: "All", badge: trades.length },
      { key: "open", label: "Open", badge: trades.filter((trade) => trade.status === "open").length },
      { key: "closed", label: "Closed", badge: trades.filter((trade) => trade.status === "closed").length },
    ],
    [trades]
  );

  return (
    <section className="page-grid">
      <PageHeader title="Trades" />

      {error ? <div className="alert-strip">{error}</div> : null}

      <SectionTabs items={tabs} activeKey={statusFilter} onChange={setStatusFilter} />

      <section className="panel panel--padded">
        <div className="panel__header panel__header--stack">
          <div>
            <h3>Trade history</h3>
            <span>{broker?.branding?.brokerageHouseName || broker?.name || "Broker"}</span>
          </div>

          <div className="trade-history-actions">
            <label>
              Customer
              <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                <option value="all">All customers</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.fullName} ({client.idCode})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading ? <div>Loading trades...</div> : null}
        {!loading && !filteredTrades.length ? <EmptyState title="No trades" /> : null}

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
                      <span>Customer</span>
                      <strong>{trade.clientId?.fullName || "-"}</strong>
                    </div>
                    <div>
                      <span>Quantity</span>
                      <strong>{formatNumber(trade.quantity)}</strong>
                    </div>
                    <div>
                      <span>Entry</span>
                      <strong>{formatCurrency(trade.buyPrice ?? trade.entryPrice)}</strong>
                    </div>
                    <div>
                      <span>Exit</span>
                      <strong>{trade.sellPrice ?? trade.exitPrice ? formatCurrency(trade.sellPrice ?? trade.exitPrice) : "-"}</strong>
                    </div>
                    <div>
                      <span>Brokerage</span>
                      <strong>{formatCurrency(trade.charges?.brokerage)}</strong>
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
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Brokerage</th>
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
                      <td>{formatCurrency(trade.buyPrice ?? trade.entryPrice)}</td>
                      <td>{trade.sellPrice ?? trade.exitPrice ? formatCurrency(trade.sellPrice ?? trade.exitPrice) : "-"}</td>
                      <td>{formatCurrency(trade.charges?.brokerage)}</td>
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
