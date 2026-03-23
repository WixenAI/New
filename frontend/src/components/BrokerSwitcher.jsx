import { useAppContext } from "../context/AppContext";

export default function BrokerSwitcher() {
  const { brokers, selectedBrokerId, setSelectedBrokerId } = useAppContext();

  return (
    <label className="broker-switcher">
      <span>Broker Workspace</span>
      <select
        value={selectedBrokerId}
        onChange={(event) => setSelectedBrokerId(event.target.value)}
        disabled={!brokers.length}
      >
        {!brokers.length ? <option value="">No brokers yet</option> : null}
        {brokers.map((broker) => (
          <option key={broker._id} value={broker._id}>
            {broker.name} ({broker.tokenId})
          </option>
        ))}
      </select>
    </label>
  );
}
