"use client";

interface DateSelectorProps {
  currentD: string;
  onSelectD: (d: string) => void;
}

function getDateLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

// Build dates: -2, -1, 0(today), +1, +2, +3, +4
// with "Yesterday", "Today", "Tomorrow" labels for -1, 0, +1
const DATE_OPTIONS = [
  { d: "-2", label: getDateLabel(-2) },
  { d: "-1", label: "Yesterday" },
  { d: "0", label: "Today" },
  { d: "1", label: "Tomorrow" },
  { d: "2", label: getDateLabel(2) },
  { d: "3", label: getDateLabel(3) },
  { d: "4", label: getDateLabel(4) },
];

export default function DateSelector({ currentD, onSelectD }: DateSelectorProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 2,
      background: "#0d1220",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      padding: "4px",
      overflowX: "auto",
    }}>
      {DATE_OPTIONS.map((item) => {
        const isActive = currentD === item.d;
        return (
          <button
            key={item.d}
            onClick={() => onSelectD(item.d)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#fff" : "#64748b",
              background: isActive ? "#1e2d44" : "transparent",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.12s",
              flexShrink: 0,
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
