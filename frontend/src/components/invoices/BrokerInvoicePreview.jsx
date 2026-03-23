import { formatCurrency, formatDate } from "../../utils/formatters";
import { resolveAssetUrl } from "../../utils/assets";

const sampleRows = [
  { tradedAt: "2026-03-11", stockName: "TCS", side: "buy", quantity: 12, buyPrice: 3924.4, sellPrice: 3988.35, charges: { total: 43.55 }, netPnL: 723.85 },
  { tradedAt: "2026-03-13", stockName: "RELIANCE", side: "sell", quantity: 18, buyPrice: 2460.15, sellPrice: 2418.2, charges: { total: 51.2 }, netPnL: 704.9 },
  { tradedAt: "2026-03-16", stockName: "HDFCBANK", side: "buy", quantity: 10, buyPrice: 1668.75, sellPrice: 1641.35, charges: { total: 34.8 }, netPnL: -308.8 },
];

function formatTimestampValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

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

function buildSupportLine(broker) {
  const supportText = broker?.documents?.supportText || "For support, contact your broker operations desk. All figures are in INR.";
  const contactParts = [broker?.contact?.supportDesk, broker?.contact?.phone, broker?.contact?.email].filter(Boolean);

  return contactParts.length ? `${supportText} ${contactParts.join(" | ")}` : supportText;
}

function buildDerivedSummary(trades, suppliedSummary) {
  if (suppliedSummary) {
    return suppliedSummary;
  }

  return trades.reduce(
    (acc, trade) => {
      acc.totalTrades += 1;
      acc.totalBrokerage += trade.charges?.total || 0;
      acc.grossPnL += trade.grossPnL || 0;
      acc.netPnL += trade.netPnL || 0;
      return acc;
    },
    { totalTrades: 0, totalBrokerage: 0, grossPnL: 0, netPnL: 0 }
  );
}

export default function BrokerInvoicePreview({
  broker,
  client,
  trades,
  filters,
  summary,
  statementNumber,
}) {
  const invoiceTrades = trades?.length ? trades : sampleRows;
  const invoiceSummary = buildDerivedSummary(invoiceTrades, summary);
  const logoUrl = resolveAssetUrl(broker?.branding?.logoUrl);
  const trademarkUrl = resolveAssetUrl(broker?.branding?.trademarkUrl);

  const brokerageHouseName = broker?.branding?.brokerageHouseName || broker?.name || "Brokerage House";
  const currentStatementNumber = statementNumber || `${broker?.documents?.statementPrefix || "ST"}-${Date.now().toString().slice(-6)}`;
  const clientName = client?.fullName || "Client Name";
  const clientId = client?.idCode || client?.clientCode || "-";
  const clientPhone = client?.phone || "-";
  const fromDate = filters?.fromDate ? formatDate(filters.fromDate) : "-";
  const toDate = filters?.toDate ? formatDate(filters.toDate) : "-";
  const generatedAt = formatTimestampValue();
  const footerText = broker?.documents?.footerText || "This is a system-generated statement and does not require a signature.";
  const supportLine = buildSupportLine(broker);

  return (
    <div className="invoice-preview-shell print-section">
      <div className="invoice-preview-card invoice-preview-card--official">
        <header className="invoice-preview__header invoice-preview__header--official">
          <div className="invoice-preview__left-head">
            <div className="invoice-preview__brand-row invoice-preview__brand-row--compact">
              {logoUrl ? (
                <img src={logoUrl} alt={`${brokerageHouseName} logo`} className="invoice-preview__logo" />
              ) : (
                <div className="invoice-preview__logo invoice-preview__logo--fallback">{broker?.branding?.logoText || "BP"}</div>
              )}

              <div>
                <h3>{brokerageHouseName}</h3>
              </div>
            </div>

            <h4>{broker?.documents?.statementTitle || "Closed Trade Statement"}</h4>
            <span className="invoice-preview__tag">{broker?.documents?.statementSubtitle || "Portfolio P&L Report"}</span>
          </div>

          <div className="invoice-preview__identity invoice-preview__identity--official">
            <div><span>Client</span><strong>{clientName}</strong></div>
            <div><span>Contact</span><strong>{clientPhone}</strong></div>
            <div><span>ID</span><strong>{clientId}</strong></div>
            <div><span>Statement No</span><strong>{currentStatementNumber}</strong></div>
          </div>
        </header>

        <div className="invoice-preview__period-bar">
          <div><span>From Date</span><strong>{fromDate}</strong></div>
          <div><span>To Date</span><strong>{toDate}</strong></div>
        </div>

        <div className="invoice-preview__mobile-list">
          {invoiceTrades.map((row) => (
            <article key={row._id || `${row.stockName}-${row.tradedAt}`} className="invoice-preview__mobile-card">
              <div className="invoice-preview__mobile-card-top">
                <div>
                  <strong>{row.stockName || row.symbol}</strong>
                  <span>{formatDate(row.tradedAt)}</span>
                </div>
                <span>{String(row.side || "buy").toUpperCase()}</span>
              </div>

              <div className="invoice-preview__mobile-grid">
                <div><span>Qty</span><strong>{row.quantity}</strong></div>
                <div><span>Entry</span><strong>{formatCurrency(row.buyPrice ?? row.entryPrice)}</strong></div>
                <div><span>Exit</span><strong>{formatCurrency(row.sellPrice ?? row.exitPrice)}</strong></div>
                <div><span>Brokerage</span><strong>{formatCurrency(row.charges?.total)}</strong></div>
                <div><span>Net P&L</span><strong className={row.netPnL >= 0 ? "text-success" : "text-danger"}>{formatCurrency(row.netPnL)}</strong></div>
              </div>
            </article>
          ))}
        </div>

        <div className="invoice-preview__table-wrap">
          <table className="invoice-preview__table invoice-preview__table--official">
            <thead>
              <tr>
                <th>DATE</th>
                <th>SYMBOL</th>
                <th className="invoice-preview__cell--center">SIDE</th>
                <th className="invoice-preview__cell--right">QTY</th>
                <th className="invoice-preview__cell--right">ENTRY</th>
                <th className="invoice-preview__cell--right">EXIT</th>
                <th className="invoice-preview__cell--right">BROKERAGE</th>
                <th className="invoice-preview__cell--right">NET P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {invoiceTrades.map((row) => (
                <tr key={row._id || `${row.stockName}-${row.tradedAt}`}>
                  <td>{formatDate(row.tradedAt)}</td>
                  <td>{row.stockName || row.symbol}</td>
                  <td className="invoice-preview__cell--center">{String(row.side || "buy").toUpperCase()}</td>
                  <td className="invoice-preview__cell--right">{row.quantity}</td>
                  <td className="invoice-preview__cell--right">{formatCurrency(row.buyPrice ?? row.entryPrice)}</td>
                  <td className="invoice-preview__cell--right">{formatCurrency(row.sellPrice ?? row.exitPrice)}</td>
                  <td className="invoice-preview__cell--right">{formatCurrency(row.charges?.total)}</td>
                  <td className={row.netPnL >= 0 ? "invoice-preview__cell--right text-success" : "invoice-preview__cell--right text-danger"}>{formatCurrency(row.netPnL)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-preview__summary-wrap invoice-preview__summary-wrap--compact">
          <div className="invoice-preview__summary">
            <div><span>Total Trades</span><strong>{invoiceSummary.totalTrades}</strong></div>
            <div><span>Brokerage</span><strong>{formatCurrency(invoiceSummary.totalBrokerage)}</strong></div>
            <div><span>Gross P&amp;L</span><strong className={invoiceSummary.grossPnL >= 0 ? "text-success" : "text-danger"}>{formatCurrency(invoiceSummary.grossPnL)}</strong></div>
            <div className="invoice-preview__summary-total"><span>Net P&amp;L</span><strong className={invoiceSummary.netPnL >= 0 ? "text-success" : "text-danger"}>{formatCurrency(invoiceSummary.netPnL)}</strong></div>
          </div>
        </div>

        <footer className="invoice-preview__footer invoice-preview__footer--official">
          <div className="invoice-preview__footer-copy">
            <p>{footerText}</p>
            <p>{supportLine}</p>
            <p className="invoice-preview__footer-meta">Generated on {generatedAt}</p>
          </div>

          <div className="invoice-preview__registered-mark">
            <span>{broker?.branding?.trademarkLabel || "Registered Mark"}</span>
            {trademarkUrl ? <img src={trademarkUrl} alt="Trademark" className="invoice-preview__mark-image" /> : <div className="invoice-preview__mark-line" />}
          </div>
        </footer>
      </div>
    </div>
  );
}
