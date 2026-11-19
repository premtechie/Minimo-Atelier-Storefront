import { Icon, type IconName } from "./icon";

const ITEMS: [IconName, string, string][] = [
  ["store", "Free store pickup", "Inside Honer Vivantis"],
  ["clock", "Ready in 48 h", "24 h rush if stock allows"],
  ["tag", "Name-tagged", "Wish tag on every bag"],
  ["wa", "Order on WhatsApp", "Pay after we confirm"],
];

export function Trust({ className = "" }: { className?: string }) {
  return (
    <section className={`m-trust ${className}`} aria-label="Why Minimo">
      <div className="m-trust-grid">
        {ITEMS.map(([i, t, s]) => (
          <div key={t} className="m-trust-item">
            <Icon name={i} size={20} />
            <span>
              <b>{t}</b>
              <small>{s}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
