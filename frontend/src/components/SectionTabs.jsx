export default function SectionTabs({ items, activeKey, onChange }) {
  return (
    <div className="section-tabs" role="tablist" aria-label="Page sections">
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            className={isActive ? "section-tabs__item is-active" : "section-tabs__item"}
            onClick={() => onChange(item.key)}
          >
            <span>{item.label}</span>
            {item.badge !== undefined ? <strong>{item.badge}</strong> : null}
          </button>
        );
      })}
    </div>
  );
}
