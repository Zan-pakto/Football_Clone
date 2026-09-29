export default function GlobalLoading() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        zIndex: 9999999,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "linear-gradient(90deg, #7c6cf5, #2fd08a, #7c6cf5)",
          backgroundSize: "200% 100%",
          boxShadow: "0 0 10px rgba(124, 108, 245, 0.6)",
          animation: "loaderShimmer 1.2s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes loaderShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
