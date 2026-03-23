import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { brokerApi } from "../../api/client";
import BrokerInvoicePreview from "../../components/invoices/BrokerInvoicePreview";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import SectionTabs from "../../components/SectionTabs";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { downloadBrokerInvoicePdf } from "../../utils/invoicePdf";
import { formatAmount, formatDate, formatRupee } from "../../utils/formatters";

export default function BrokerInvoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { broker } = useBrokerAuth();
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    clientId: "",
    fromDate: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    toDate: new Date().toISOString().slice(0, 10),
  });
  const [invoiceData, setInvoiceData] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("generate");

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const response = await brokerApi.get("/api/broker-portal/clients");
      setCustomers(response.data);
      setFilters((current) => ({ ...current, clientId: current.clientId || response.data[0]?._id || "" }));
      setError("");
    } catch (requestError) {
      setCustomers([]);
      setError(requestError.response?.data?.message || "Unable to load customers.");
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const requestedTab = location.state?.activeTab;
    if (!requestedTab) {
      return;
    }

    setActiveTab(requestedTab);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!invoiceData && activeTab !== "generate") {
      setActiveTab("generate");
    }
  }, [activeTab, invoiceData]);

  const statementNumber = useMemo(() => {
    const client = customers.find((item) => item._id === filters.clientId);
    const prefix = broker?.documents?.statementPrefix || "ST";
    const idCode = client?.idCode || "BROKER";
    return `${prefix}-${idCode}-${filters.fromDate?.replaceAll("-", "") || ""}`;
  }, [broker?.documents?.statementPrefix, customers, filters.clientId, filters.fromDate]);

  const tabs = useMemo(
    () => [
      { key: "generate", label: "Generate" },
      { key: "preview", label: "Preview", disabled: !invoiceData },
      { key: "trades", label: "Included trades", badge: invoiceData?.trades?.length || 0, disabled: !invoiceData },
    ],
    [invoiceData]
  );

  async function handlePreview(event) {
    event.preventDefault();
    setLoadingPreview(true);
    setError("");

    try {
      const response = await brokerApi.get(
        `/api/broker-portal/invoices/preview?clientId=${filters.clientId}&fromDate=${filters.fromDate}&toDate=${filters.toDate}`
      );
      setInvoiceData(response.data);
      setActiveTab("preview");
    } catch (requestError) {
      setInvoiceData(null);
      setError(requestError.response?.data?.message || "Unable to generate invoice.");
    } finally {
      setLoadingPreview(false);
    }
  }

  function handleDownloadPdf() {
    if (!invoiceData) {
      return;
    }

    downloadBrokerInvoicePdf({
      broker: invoiceData.broker,
      client: invoiceData.client,
      trades: invoiceData.trades,
      filters: invoiceData.filters,
      summary: invoiceData.summary,
      statementNumber,
    });
  }

  return (
    <section className="page-grid broker-invoice-page">
      <PageHeader title="Invoice" />

      {error ? <div className="alert-strip">{error}</div> : null}

      <SectionTabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === "generate" ? (
        <section className="panel panel--padded no-print">
          <div className="panel__header panel__header--stack">
            <h3>Generate</h3>
            <span>Customer and period</span>
          </div>

          {!customers.length && !loadingCustomers ? (
            <EmptyState title="No customers" />
          ) : (
            <form className="form-grid" onSubmit={handlePreview}>
              <label>
                Customer
                <select value={filters.clientId} onChange={(event) => setFilters({ ...filters, clientId: event.target.value })}>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.fullName} ({customer.idCode})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                From
                <input type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} />
              </label>
              <label>
                To
                <input type="date" value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} />
              </label>

              <div className="form-actions-row form-grid__span-2">
                <button className="btn btn--primary" type="submit" disabled={!filters.clientId || loadingPreview}>
                  {loadingPreview ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      {activeTab === "preview" ? (
        <section className="page-grid">
          {invoiceData ? (
            <>
              <div className="invoice-toolbar no-print">
                <button className="btn btn--primary" type="button" onClick={handleDownloadPdf}>
                  Download PDF
                </button>
                <button className="btn btn--ghost" type="button" onClick={() => setActiveTab("trades")}>
                  View trades
                </button>
              </div>

              <BrokerInvoicePreview
                broker={invoiceData.broker}
                client={invoiceData.client}
                trades={invoiceData.trades}
                filters={invoiceData.filters}
                summary={invoiceData.summary}
                statementNumber={statementNumber}
              />
            </>
          ) : (
            <EmptyState title="No preview" />
          )}
        </section>
      ) : null}

      {activeTab === "trades" ? (
        <section className="panel panel--padded no-print">
          <div className="panel__header panel__header--stack">
            <h3>Included trades</h3>
            <span>{invoiceData?.trades?.length || 0} items</span>
          </div>

          {!invoiceData ? (
            <EmptyState title="No trades" />
          ) : invoiceData.trades.length ? (
            <div className="mobile-entity-list">
              {invoiceData.trades.map((trade) => (
                <article key={trade._id} className="mobile-entity-card">
                  <div className="mobile-entity-card__header">
                    <div>
                      <strong>{trade.stockName || trade.symbol}</strong>
                      <span>{formatDate(trade.tradedAt)} · {String(trade.side).toUpperCase()}</span>
                    </div>
                    <strong className={trade.netPnL >= 0 ? "text-success" : "text-danger"}>{formatRupee(trade.netPnL)}</strong>
                  </div>

                  <div className="mobile-entity-card__meta">
                    <div>
                      <span>Qty</span>
                      <strong>{trade.quantity}</strong>
                    </div>
                    <div>
                      <span>Buy</span>
                      <strong>{formatAmount(trade.buyPrice ?? trade.entryPrice)}</strong>
                    </div>
                    <div>
                      <span>Sell</span>
                      <strong>{formatAmount(trade.sellPrice ?? trade.exitPrice)}</strong>
                    </div>
                    <div>
                      <span>Charges</span>
                      <strong>{formatAmount(trade.charges?.total)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No trades in this period" />
          )}
        </section>
      ) : null}
    </section>
  );
}
