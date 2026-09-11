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
        gap: 2,
        background: "rgba(15,15,26,0.95)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 9,
        padding: "3px",
        overflowX: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", padding: "0 8px", color: "#484858" }}>
        <Calendar style={{ width: 13, height: 13 }} />
      </div>
      {DATE_OPTIONS.map((item) => {
        const isActive = currentD === item.d;
        return (
          <button
            key={item.d}
            onClick={() => onSelectD(item.d)}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#09090f" : "#8a8a9a",
              background: isActive ? "#c9a84c" : "transparent",
              border: isActive ? "1px solid #c9a84c" : "1px solid transparent",
              boxShadow: isActive ? "0 2px 12px rgba(201,168,76,0.3)" : "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              flexShrink: 0,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
