import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "7px",
          color: "#ffffff",
          fontSize: "17px",
          fontWeight: 900,
          fontStyle: "italic",
          letterSpacing: "-1px",
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
