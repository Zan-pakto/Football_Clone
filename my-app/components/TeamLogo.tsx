"use client";

import React, { useState, useEffect } from "react";
import { toCachedLogoUrl, getTeamInitials } from "@/lib/logo-utils";

interface TeamLogoProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
}

export default function TeamLogo({
  src,
  name,
  size = 20,
  className,
  style,
  loading = "lazy",
}: TeamLogoProps) {
  const [hasError, setHasError] = useState(false);
  const cachedSrc = toCachedLogoUrl(src);

  // Reset error state if the src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = getTeamInitials(name);
  const fontSize = Math.max(8, Math.round(size * 0.42));

  if (!cachedSrc || hasError) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1b183d 0%, #141132 100%)",
          border: "1px solid rgba(167, 159, 255, 0.25)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 800,
          color: "#a79fff",
          flexShrink: 0,
          userSelect: "none",
          ...style,
        }}
        title={name}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={cachedSrc}
      alt={name}
      width={size}
      height={size}
      loading={loading}
      className={className}
      onError={() => setHasError(true)}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
