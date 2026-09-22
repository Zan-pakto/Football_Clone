"use client";

import React, { useState, useEffect } from "react";
import { getCountryFlagUrl, slugifyCountry } from "@/lib/flags";

interface CountryFlagProps {
  country?: string | null;
  flagUrl?: string | null;
  size?: number; // height in pixels
  className?: string;
  style?: React.CSSProperties;
}

export default function CountryFlag({
  country,
  flagUrl: customFlagUrl,
  size = 14,
  className = "",
  style = {},
}: CountryFlagProps) {
  const [attempt, setAttempt] = useState(0);

  // Reset attempt if country or flagUrl changes
  useEffect(() => {
    setAttempt(0);
  }, [country, customFlagUrl]);

  const width = Math.round(size * 1.45);
  const localFlag = getCountryFlagUrl(country);

  // Resolution cascade:
  // attempt 0: custom flagUrl if provided, else local stored flag
  // attempt 1: local stored flag (if custom failed)
  // attempt 2: flagcdn CDN fallback using slug
  // attempt 3: fallback text badge
  let activeSrc: string | null = null;
  if (attempt === 0) {
    activeSrc = customFlagUrl && customFlagUrl.trim() !== "" ? customFlagUrl : localFlag;
  } else if (attempt === 1) {
    activeSrc = localFlag;
  } else if (attempt === 2) {
    const slug = slugifyCountry(country || "");
    activeSrc = `https://flagcdn.com/w80/${slug}.png`;
  }

  const handleError = () => {
    setAttempt((prev) => prev + 1);
  };

  if (attempt >= 3 || !activeSrc || !country) {
    const fallbackText = (country || "GL").slice(0, 2).toUpperCase();
    return (
      <span
        className={className}
        style={{
          width,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 3,
          background: "rgba(167, 159, 255, 0.18)",
          border: "1px solid rgba(167, 159, 255, 0.25)",
          fontSize: Math.max(9, Math.round(size * 0.65)),
          fontWeight: 800,
          color: "#8b7ff5",
          flexShrink: 0,
          userSelect: "none",
          fontFamily: "var(--font-mono, monospace)",
          ...style,
        }}
        title={country || "International"}
      >
        {fallbackText}
      </span>
    );
  }

  return (
    <img
      key={activeSrc}
      src={activeSrc}
      alt={country}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={className}
      style={{
        width,
        height: size,
        borderRadius: 3,
        objectFit: "cover",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.35)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        ...style,
      }}
      title={country}
    />
  );
}
