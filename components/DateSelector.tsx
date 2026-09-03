"use client";

import { Calendar } from "lucide-react";

interface DateSelectorProps {
  currentD: string;
  onSelectD: (d: string) => void;
}

const dates = [
  { label: "Yesterday", d: "-1" },
  { label: "Today", d: "0" },
  { label: "Tomorrow", d: "1" },
  { label: "+2 Days", d: "2" },
  { label: "+3 Days", d: "3" },
];

export default function DateSelector({ currentD, onSelectD }: DateSelectorProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b", fontWeight: 600, flexShrink: 0 }}>
        <Calendar style={{ width: 13, height: 13, color: "#10b981" }} />
        <span>Date:</span>
      </div>
      {dates.map((item) => {
        const isActive = currentD === item.d;
        return (
          <button
            key={item.d}
            onClick={() => onSelectD(item.d)}
            style={{
              padding: "6px 14px", borderRadius: 9,
              fontSize: 12, fontWeight: isActive ? 800 : 600,
              color: isActive ? "#34d399" : "#64748b",
              background: isActive ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
              border: isActive ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.15s",
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
