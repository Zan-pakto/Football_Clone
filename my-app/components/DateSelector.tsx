"use client";

import { Calendar } from "lucide-react";

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
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: "rgba(20, 25, 56, 0.92)",
      border: "1px solid rgba(168, 85, 247, 0.24)",
      borderRadius: 10,
      padding: "4px",
      overflowX: "auto",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4), 0 0 16px rgba(139, 92, 246, 0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 6px", color: "#c084fc" }}>
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
              fontWeight: isActive ? 800 : 600,
              color: isActive ? "#ffffff" : "#a5b4fc",
              background: isActive ? "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" : "transparent",
              border: isActive ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid transparent",
              boxShadow: isActive ? "0 2px 12px rgba(139, 92, 246, 0.4)" : "none",
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
