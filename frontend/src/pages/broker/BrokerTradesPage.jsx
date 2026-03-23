import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { brokerApi } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import SectionTabs from "../../components/SectionTabs";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { resolveAssetUrl } from "../../utils/assets";
import { formatCurrency, formatNumber } from "../../utils/formatters";

const tradeModeOptions = [
  { value: "mis", label: "Intraday - MIS" },
  { value: "nrml", label: "Holdings - NRML" },
  { value: "cnc", label: "Carryforward - CNC" },
];

function getDateTimeInputValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return getDateTimeInputValue(new Date());
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

const initialForm = {
  clientId: "",
  status: "closed",
  side: "buy",
  tradeMode: "mis",
  stockName: "",
  quantity: 1,
  buyPrice: "",
  sellPrice: "",
  tradedAt: getDateTimeInputValue(),
  brokeragePercent: "0.10",
};

function isTradeOpen(status) {
  return String(status || "").toLowerCase() === "open";
}

function getSecondaryPriceLabel(status) {
  return isTradeOpen(status) ? "Current LTP" : "Exit Price";
}

function formatTradePrice(value) {
  return value === "" || value === null || value === undefined ? "-" : formatCurrency(value);
}

function formatSignedCurrency(value) {
  const amount = Number(value || 0);

  if (amount > 0) {
    return `+ ${formatCurrency(amount)}`;
  }

  if (amount < 0) {
    return `- ${formatCurrency(Math.abs(amount))}`;
  }

  return formatCurrency(0);
}

function getCurrentTradeValue(trade) {
  const exitValue = trade.sellPrice ?? trade.exitPrice;

  if (exitValue === "" || exitValue === null || exitValue === undefined) {
    return "-";
  }

  if (trade.totalSell !== "" && trade.totalSell !== null && trade.totalSell !== undefined && Number(trade.totalSell)) {
    return formatCurrency(trade.totalSell);
  }

  return formatCurrency(Number(trade.quantity || 0) * Number(exitValue || 0));
}

function getTradeModeLabel(tradeMode) {
  return tradeModeOptions.find((option) => option.value === tradeMode)?.label || "Intraday - MIS";
}

function formatTradeDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TradeHistoryCard({ trade, brokerageHouseName, brokerLogoUrl, brokerLogoText, onModify, onExit }) {
  const openTrade = isTradeOpen(trade.status);
  const tradeSide = String(trade.side || "buy").toLowerCase();
  const customerName = trade.clientId?.fullName || "-";
  const customerId = trade.clientId?.idCode || trade.clientId?.clientCode || "-";
  const tradeDateTime = formatTradeDateTime(trade.tradedAt);
  const detailRows = [
    { label: "Product Type", value: <span className={tradeSide === "buy" ? "trade-record-card__product-text trade-record-card__product-text--buy" : "trade-record-card__product-text trade-record-card__product-text--sell"}>{tradeSide.toUpperCase()}</span> },
    { label: "Quantity", value: <strong>{formatNumber(trade.quantity)}</strong> },
    { label: "Entry Price", value: <strong>{formatTradePrice(trade.buyPrice ?? trade.entryPrice)}</strong> },
    { label: getSecondaryPriceLabel(trade.status), value: <strong>{formatTradePrice(trade.sellPrice ?? trade.exitPrice)}</strong> },
    { label: "Current Value", value: <strong>{getCurrentTradeValue(trade)}</strong> },
    { label: "Brokerage", value: <strong>{formatCurrency(trade.charges?.brokerage)}</strong> },
    { label: "Net P&L", value: <strong className={Number(trade.netPnL) >= 0 ? "text-success" : "text-danger"}>{formatSignedCurrency(trade.netPnL)}</strong> },
  ];

  return (
    <article className="trade-record-card">
      <div className="trade-record-card__topbar">
        <div className="trade-record-card__brand">
          <div className="trade-record-card__brand-row">
            <strong>{brokerageHouseName}</strong>
            {brokerLogoUrl ? (
              <img src={brokerLogoUrl} alt={`${brokerageHouseName} logo`} className="trade-record-card__logo" />
            ) : (
              <div className="trade-record-card__logo trade-record-card__logo--fallback">{String(brokerLogoText || "BR").slice(0, 2)}</div>
            )}
          </div>
          <span>{customerName} ({customerId})</span>
        </div>

        <div className="trade-record-card__meta-stack">
          <span className={openTrade ? "status-pill status-pill--open" : "status-pill status-pill--closed"}>
            {openTrade ? "Open" : "Closed"}
          </span>
          <span className="trade-record-card__date">{tradeDateTime}</span>
        </div>
      </div>

      <div className="trade-record-card__headline">
        <div className="trade-record-card__symbol-block">
          <strong>{trade.stockName || trade.symbol}</strong>
        </div>

        <div className="trade-record-card__order-type">
          <span>Order Type</span>
          <strong>{getTradeModeLabel(trade.tradeMode)}</strong>
        </div>
      </div>

      <div className="trade-record-card__details">
        {detailRows.map((item) => (
          <div key={item.label} className="trade-record-card__row">
            <span>{item.label}</span>
            <div className="trade-record-card__value">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="trade-record-card__footer">
        {openTrade ? (
          <>
            <button className="trade-record-card__action trade-record-card__action--buy" type="button" onClick={onModify}>
              Modify
            </button>
            <button className="trade-record-card__action trade-record-card__action--sell" type="button" onClick={onExit}>
              Exit
            </button>
          </>
        ) : (
          <>
            <div className="trade-record-card__action trade-record-card__action--buy is-active">
              BUY
            </div>
            <div className="trade-record-card__action trade-record-card__action--sell is-active">
              SELL
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function TradeForm({ clients, form, setForm, saving, onSubmit, onCancel, isEditing }) {
  const secondaryPriceLabel = getSecondaryPriceLabel(form.status);

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>
        Status
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </label>

      <label>
        Customer
        <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.fullName} ({client.idCode})
            </option>
          ))}
        </select>
      </label>

      <label>
        Product Type
        <select value={form.side} onChange={(event) => setForm({ ...form, side: event.target.value })}>
          <option value="buy">BUY</option>
          <option value="sell">SELL</option>
        </select>
      </label>

      <label>
        Order Type
        <select value={form.tradeMode} onChange={(event) => setForm({ ...form, tradeMode: event.target.value })}>
          {tradeModeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        SYMBOL
        <input
          value={form.stockName}
          onChange={(event) => setForm({ ...form, stockName: event.target.value.toUpperCase() })}
          required
        />
      </label>

      <label>
        Quantity
        <input
          type="number"
          min="1"
          value={form.quantity}
          onChange={(event) => setForm({ ...form, quantity: event.target.value })}
          required
        />
      </label>

      <label>
        Avg. Price (Entry)
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.buyPrice}
          onChange={(event) => setForm({ ...form, buyPrice: event.target.value })}
          required
        />
      </label>

      <label>
        {secondaryPriceLabel}
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.sellPrice}
          onChange={(event) => setForm({ ...form, sellPrice: event.target.value })}
          required={!isTradeOpen(form.status)}
        />
      </label>

      <label>
        Date &amp; time
        <input
          type="datetime-local"
          value={form.tradedAt}
          onChange={(event) => setForm({ ...form, tradedAt: event.target.value })}
          required
        />
      </label>

      <label>
        Brokerage %
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.brokeragePercent}
          onChange={(event) => setForm({ ...form, brokeragePercent: event.target.value })}
        />
      </label>

      <div className="form-actions-row form-grid__span-2">
        <button className="btn btn--primary" type="submit" disabled={saving || !form.clientId}>
          {saving ? "Saving..." : isEditing ? "Update trade" : "Create trade"}
        </button>
        {isEditing ? (
          <button className="btn btn--ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function BrokerTradesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { broker } = useBrokerAuth();
  const [clients, setClients] = useState([]);
  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingTradeId, setEditingTradeId] = useState("");
  const [activeTab, setActiveTab] = useState("new");
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

  useEffect(() => {
    if (!form.clientId && clients.length) {
      setForm((current) => ({ ...current, clientId: clients[0]._id }));
    }
  }, [clients, form.clientId]);

  const buildFormFromTrade = useCallback((trade) => ({
    clientId: trade.clientId?._id || "",
    status: trade.status || "closed",
    side: trade.side || "buy",
    tradeMode: trade.tradeMode || "mis",
    stockName: trade.stockName || trade.symbol || "",
    quantity: trade.quantity || 1,
    buyPrice: trade.buyPrice ?? trade.entryPrice ?? "",
    sellPrice: trade.sellPrice ?? trade.exitPrice ?? "",
    tradedAt: getDateTimeInputValue(trade.tradedAt),
    brokeragePercent: trade.brokeragePercent ?? "0.10",
  }), []);

  const startEdit = useCallback((trade) => {
    setEditingTradeId(trade._id);
    setForm(buildFormFromTrade(trade));
    setActiveTab("new");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [buildFormFromTrade]);

  useEffect(() => {
    const stateTrade = location.state?.tradeToEdit;
    const requestedTab = location.state?.activeTab;

    if (requestedTab === "new" || requestedTab === "history") {
      setActiveTab(requestedTab);
    }

    if (stateTrade) {
      startEdit(stateTrade);
    }

    if (requestedTab || stateTrade) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, startEdit]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const matchesStatus = statusFilter === "all" ? true : trade.status === statusFilter;
      const matchesClient = clientFilter === "all" ? true : trade.clientId?._id === clientFilter;
      return matchesStatus && matchesClient;
    });
  }, [clientFilter, statusFilter, trades]);

  const tabs = useMemo(
    () => [
      { key: "new", label: editingTradeId ? "Edit trade" : "Create trade" },
      { key: "history", label: "Trade history", badge: trades.length },
    ],
    [editingTradeId, trades.length]
  );

  const brokerageHouseName = broker?.branding?.brokerageHouseName || broker?.name || "Brokerage House";
  const brokerLogoUrl = resolveAssetUrl(broker?.branding?.logoUrl);
  const brokerLogoText = broker?.branding?.logoText || broker?.name || "BR";

  function resetForm() {
    setForm({ ...initialForm, clientId: clients[0]?._id || "", tradedAt: getDateTimeInputValue() });
    setEditingTradeId("");
    setActiveTab("new");
    setError("");
  }

  function startExit(trade) {
    setEditingTradeId(trade._id);
    setForm({
      ...buildFormFromTrade(trade),
      status: "closed",
    });
    setActiveTab("new");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (!isTradeOpen(form.status) && !String(form.sellPrice || "").trim()) {
      setSaving(false);
      setError("Exit Price is required for closed trades.");
      return;
    }

    const payload = {
      clientId: form.clientId,
      stockName: form.stockName,
      tradeMode: form.tradeMode,
      side: form.side,
      quantity: Number(form.quantity),
      buyPrice: Number(form.buyPrice),
      sellPrice: String(form.sellPrice || "").trim() ? Number(form.sellPrice) : undefined,
      brokeragePercent: Number(form.brokeragePercent || 0),
      status: form.status,
      tradedAt: form.tradedAt,
    };

    try {
      await (editingTradeId
        ? brokerApi.patch(`/api/broker-portal/trades/${editingTradeId}`, payload)
        : brokerApi.post("/api/broker-portal/trades", payload));

      setMessage(editingTradeId ? "Trade updated." : "Trade created.");
      await loadData();

      if (editingTradeId) {
        setEditingTradeId("");
        setActiveTab("history");
      }

      setForm({ ...initialForm, clientId: clients[0]?._id || "", tradedAt: getDateTimeInputValue() });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save trade.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tradeId) {
    if (!window.confirm("Delete this trade?")) {
      return;
    }

    try {
      await brokerApi.delete(`/api/broker-portal/trades/${tradeId}`);
      setMessage("Trade deleted.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete trade.");
    }
  }

  return (
    <section className="page-grid">
      <PageHeader
        title="Trades"
        description={broker?.branding?.brokerageHouseName || broker?.name || "Broker trade terminal"}
      />

      {error ? <div className="alert-strip">{error}</div> : null}
      {message ? <div className="alert-strip alert-strip--success">{message}</div> : null}

      <SectionTabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === "new" ? (
        <section className="panel panel--padded">
          <div className="panel__header panel__header--stack">
            <h3>{editingTradeId ? "Edit trade" : "Create a trade"}</h3>
            <span>{editingTradeId ? "Update an existing trade" : "Record a customer trade"}</span>
          </div>

          {!clients.length && !loading ? (
            <EmptyState title="No customers" description="Create a customer first." />
          ) : loading ? (
            <div>Loading form...</div>
          ) : (
            <TradeForm
              clients={clients}
              form={form}
              setForm={setForm}
              saving={saving}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              isEditing={Boolean(editingTradeId)}
            />
          )}
        </section>
      ) : null}

      {activeTab === "history" ? (
        <section className="panel panel--padded">
          <div className="panel__header panel__header--stack">
            <div>
              <h3>Trade history</h3>
              <span>{filteredTrades.length} records</span>
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
          {!loading && !filteredTrades.length ? <EmptyState title="No trades" description="No trades found for the selected filters." /> : null}

          {!loading && filteredTrades.length ? (
            <div className="trade-history-list">
              {filteredTrades.map((trade) => (
                <div key={trade._id} className="trade-history-entry">
                  <TradeHistoryCard
                    trade={trade}
                    brokerageHouseName={brokerageHouseName}
                    brokerLogoUrl={brokerLogoUrl}
                    brokerLogoText={brokerLogoText}
                    onModify={() => startEdit(trade)}
                    onExit={() => startExit(trade)}
                  />

                  <div className="trade-history-entry__utility">
                    <button className="trade-history-entry__delete" type="button" onClick={() => handleDelete(trade._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
