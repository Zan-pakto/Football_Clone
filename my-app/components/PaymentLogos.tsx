import React from "react";

export function PayPalLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PayPal"
    >
      <rect width="100" height="100" rx="20" fill="#003087" />
      {/* Front lighter P */}
      <path
        d="M36 22H54C63.4 22 69 26.8 67.2 35.5C65.3 44.5 58.2 49.5 49.2 49.5H41.8L37.2 73H28L36 22Z"
        fill="#0079C1"
      />
      {/* Back overlapping P */}
      <path
        d="M44 32H62C71.4 32 77 36.8 75.2 45.5C73.3 54.5 66.2 59.5 57.2 59.5H49.8L45.2 83H36L44 32Z"
        fill="#00457C"
        opacity="0.85"
      />
      <path
        d="M49.8 59.5H57.2C66.2 59.5 73.3 54.5 75.2 45.5C76 41.5 74.8 38.3 72.1 36.2C70.2 44.5 63.8 49.5 54.5 49.5H47.2L42.8 72H47.3L49.8 59.5Z"
        fill="#0079C1"
      />
    </svg>
  );
}

export function OPayLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OPay"
    >
      <rect width="100" height="100" rx="20" fill="#00B875" />
      {/* OPay signature geometric circle & loop */}
      <circle cx="50" cy="50" r="26" stroke="#ffffff" strokeWidth="12" fill="none" />
      <circle cx="50" cy="50" r="10" fill="#ffffff" />
    </svg>
  );
}

export function MpesaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="M-Pesa"
    >
      <rect width="100" height="100" rx="20" fill="#008837" />
      {/* M-PESA red slash and typography */}
      <path d="M22 74V26L38 52L54 26V74H44V44L38 54L32 44V74H22Z" fill="#ffffff" />
      <rect x="58" y="47" width="8" height="6" rx="2" fill="#E31B23" />
      <path
        d="M68 40H80C85 40 88 43 88 47C88 51 85 54 80 54H74V74H68V40ZM74 49H79C81 49 82 48 82 47C82 46 81 45 79 45H74V49Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function ApplePayLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Apple Pay"
    >
      <rect width="100" height="100" rx="20" fill="#000000" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      {/* Apple leaf */}
      <path
        d="M46.8 30C48.6 27.8 49.8 24.8 49.5 22C47 22.1 43.8 23.7 42.1 25.8C40.6 27.6 39.3 30.6 39.7 33.4C42.4 33.6 45.3 32 46.8 30Z"
        fill="#ffffff"
      />
      {/* Apple body */}
      <path
        d="M49.4 34.6C45.3 34.4 41.8 36.8 39.8 36.8C37.8 36.8 34.9 34.7 31.8 34.7C27.6 34.8 23.7 37.2 21.6 40.9C17.2 48.4 20.5 59.6 24.7 65.7C26.8 68.7 29.2 72 32.5 71.9C35.7 71.7 36.9 69.8 40.8 69.8C44.6 69.8 45.7 71.9 49.1 71.8C52.5 71.7 54.6 68.8 56.6 65.8C59 62.4 60 59.1 60.2 58.7C60 58.6 54.4 56.4 54.3 50C54.3 44.7 58.7 42.1 58.9 42C56.4 38.4 52.6 35 49.4 34.6Z"
        fill="#ffffff"
      />
      {/* Pay text */}
      <path
        d="M66 43H74C78 43 80.5 45.2 80.5 48.8C80.5 52.4 78 54.6 74 54.6H69.5V64H66V43ZM69.5 51.6H73.5C75.8 51.6 77 50.5 77 48.8C77 47.1 75.8 46 73.5 46H69.5V51.6Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function GooglePayLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Google Pay"
    >
      <rect width="100" height="100" rx="20" fill="#ffffff" />
      {/* Google G logo with 4 colors */}
      <path
        d="M42 49.5C42 47.7 41.8 46.3 41.5 45H28V53.8H36C35.5 56.3 34 58.3 31.7 59.8V64.8H38.5C42.5 61.1 42 53.6 42 49.5Z"
        fill="#4285F4"
      />
      <path
        d="M28 65C32.1 65 35.5 63.6 38.5 60.8L31.7 55.8C29.8 57.1 27.4 57.9 24.6 57.9C19.2 57.9 14.6 54.3 13 49.4H6V54.7C9.5 61.3 18.2 65 28 65Z"
        fill="#34A853"
      />
      <path
        d="M13 49.4C12.5 48.1 12.2 46.6 12.2 45C12.2 43.4 12.5 41.9 13 40.6V35.3H6C3.9 39.2 2.7 42.1 2.7 45C2.7 47.9 3.9 50.8 6 54.7L13 49.4Z"
        fill="#FBBC05"
      />
      <path
        d="M28 32.1C31.5 32.1 34.6 33.3 37.1 35.6L43.4 29.3C39.4 25.6 34.2 23.3 28 23.3C18.2 23.3 9.5 27 6 33.6L13 38.9C14.6 34 19.2 32.1 28 32.1Z"
        fill="#EA4335"
      />
      {/* Pay text */}
      <path
        d="M54 36H63.5C68.5 36 71.5 39 71.5 43.5C71.5 48 68.5 51 63.5 51H58.5V64H54V36ZM58.5 47H63C65.8 47 67 45.7 67 43.5C67 41.3 65.8 40 63 40H58.5V47Z"
        fill="#5F6368"
      />
      <path
        d="M74 44H78V64H74V44Z"
        fill="#5F6368"
      />
    </svg>
  );
}
