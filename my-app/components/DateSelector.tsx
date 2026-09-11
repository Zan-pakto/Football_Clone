"use client";

import { Calendar } from "lucide-react";

interface DateSelectorProps {
  currentD: string;
  onSelectD: (d: string) => void;
}

function getDateLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

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
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: 10,
        padding: "3px",
        overflowX: "auto",
        boxShadow: "var(--shadow-subtle)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", padding: "0 8px", color: "var(--text-dim)" }}>
        <Calendar style={{ width: 14, height: 14 }} />
      </div>
      {DATE_OPTIONS.map((item) => {
        const isActive = currentD === item.d;
        return (
          <button
            key={item.d}
            onClick={() => onSelectD(item.d)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: isActive ? 800 : 500,
              color: isActive ? "var(--gold-btn-text)" : "var(--text-secondary)",
              background: isActive ? "var(--gold)" : "transparent",
              border: isActive ? "1px solid var(--gold)" : "1px solid transparent",
              boxShadow: isActive ? "0 2px 10px var(--gold-glow)" : "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
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
