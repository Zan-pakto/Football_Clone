import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
          borderRadius: "36px",
          color: "#ffffff",
          fontSize: "92px",
          fontWeight: 900,
          fontStyle: "italic",
          letterSpacing: "-4px",
          transform: "skew(-4deg)",
        }}
      >
        JT
      </div>
    ),
    {
      ...size,
    }
  );
}
