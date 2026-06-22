const ITEMS = [
  "EMV CHIP",
  "CONTACTLESS",
  "TAP TO MOBILE",
  "CERTIFICAÇÃO L1/L2",
  "BTGPAY POS",
  "FLUTTER MOBILE",
  "PCI SCOPE",
  "SOFTPOS",
];

export function MarqueeStrip() {
  const items = [...ITEMS, ...ITEMS];
  return (
    <div
      className="border-y-2 border-ink bg-accent py-4 overflow-hidden"
      aria-hidden="true"
    >
      <div className="marquee-track">
        {items.map((m, i) => (
          <span
            key={i}
            className="font-mono text-xs tracking-[0.3em] text-accent-foreground mx-8 whitespace-nowrap"
          >
            {m} ·
          </span>
        ))}
      </div>
    </div>
  );
}
