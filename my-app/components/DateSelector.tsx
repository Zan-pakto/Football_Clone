"use client";

import React from "react";

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
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px",
        overflowX: "auto",
        maxWidth: "100%",
      }}
    >
      {DATE_OPTIONS.map((item) => {
        const isActive = currentD === item.d;
        return (
          <button
            key={item.d}
            onClick={() => onSelectD(item.d)}
            style={{
              padding: "7px 18px",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#FFFFFF" : "var(--text-secondary)",
              background: isActive ? "var(--accent-indigo)" : "transparent",
              border: "none",
              boxShadow: isActive ? "0 4px 18px var(--accent-indigo-glow)" : "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.background = "var(--surface-raised)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
