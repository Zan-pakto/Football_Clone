import type { SVGProps } from "react";

type BrandMarkProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  width?: number;
  height?: number;
};

export default function BrandMark({ width = 32, height = 30, ...props }: BrandMarkProps) {
  const gradientId = "jt-mark";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="60" y1="8" x2="60" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ED101B" />
          <stop offset="1" stopColor="#A90717" />
        </linearGradient>
      </defs>
      <path d="M6 0h94L90 17H0L6 0Z" fill={`url(#${gradientId})`} />
      <path d="M26 15h18v52c0 18-11 33-31 33H0l5-17h8c8 0 13-5 13-15V15Z" fill={`url(#${gradientId})`} />
      <path d="M61 15h18v85H58l3-85Z" fill={`url(#${gradientId})`} />
    </svg>
  );
}
