import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import BrokerInvoicePreview from "../components/invoices/BrokerInvoicePreview";
import { useAppContext } from "../context/AppContext";

export default function DocumentsPage() {
  const { brokers, selectedBroker, selectedBrokerId, setSelectedBrokerId } = useAppContext();

  if (!selectedBroker) {
    return <EmptyState title="No broker selected" />;
  }

  return (
    <section className="page-grid">
      <PageHeader title="Documents" />

      <article className="panel panel--padded">
        <div className="panel__header">
          <h3>Current broker setup</h3>
          <label className="document-broker-switcher">
            <span>Broker token</span>
            <select value={selectedBrokerId} onChange={(event) => setSelectedBrokerId(event.target.value)} disabled={!brokers.length}>
              {brokers.map((broker) => (
                <option key={broker._id} value={broker._id}>
                  {broker.tokenId} - {broker.branding?.brokerageHouseName || broker.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul className="detail-list">
          <li><span>Brokerage house</span><strong>{selectedBroker.branding?.brokerageHouseName || selectedBroker.name}</strong></li>
          <li><span>Statement title</span><strong>{selectedBroker.documents?.statementTitle}</strong></li>
          <li><span>Subtitle</span><strong>{selectedBroker.documents?.statementSubtitle}</strong></li>
          <li><span>Footer</span><strong>{selectedBroker.documents?.footerText}</strong></li>
        </ul>
      </article>

      <BrokerInvoicePreview broker={selectedBroker} />
    </section>
  );
}
