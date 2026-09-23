"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
  borderColor: string;
}

export default function ProgressPage() {
  const [stats, setStats] = useState({
    recordDate: "2026-09-22",
    recordDateFormatted: "Sep 22, 2026",
    overallRate: "66.6%",
    overallSub: "185,747 of 278,849 graded correctly",
    bankersRate: "72.5%",
    bankersSub: "1,111 of 1,533 since 2026",
    matchesPredicted: "278,849",
    daysTracked: "1,877",
    monthlyBreakdown: [
      { month: "September 2026", bkRate: "76.7%", bkCount: "159 banker picks", ovRate: "67.2%", ovCount: "7,471 predictions" },
      { month: "August 2026", bkRate: "69.8%", bkCount: "139 banker picks", ovRate: "67%", ovCount: "9,186 predictions" },
      { month: "July 2026", bkRate: "72.2%", bkCount: "115 banker picks", ovRate: "65.5%", ovCount: "4,405 predictions" },
      { month: "June 2026", bkRate: "68%", bkCount: "100 banker picks", ovRate: "68.4%", ovCount: "3,139 predictions" },
      { month: "May 2026", bkRate: "65.8%", bkCount: "196 banker picks", ovRate: "66.6%", ovCount: "9,039 predictions" },
      { month: "April 2026", bkRate: "77.5%", bkCount: "200 banker picks", ovRate: "67.4%", ovCount: "10,568 predictions" },
      { month: "March 2026", bkRate: "74.6%", bkCount: "201 banker picks", ovRate: "67.1%", ovCount: "9,699 predictions" },
      { month: "February 2026", bkRate: "74.4%", bkCount: "211 banker picks", ovRate: "67%", ovCount: "8,089 predictions" },
      { month: "January 2026", bkRate: "70.8%", bkCount: "212 banker picks", ovRate: "66.8%", ovCount: "6,004 predictions" },
      { month: "December 2025", bkRate: "78.8%", bkCount: "132 banker picks", ovRate: "67%", ovCount: "3,888 predictions" },
      { month: "November 2025", bkRate: "72.9%", bkCount: "181 banker picks", ovRate: "66.9%", ovCount: "5,970 predictions" },
      { month: "October 2025", bkRate: "67.5%", bkCount: "200 banker picks", ovRate: "66.9%", ovCount: "6,152 predictions" },
    ],
  });

  useEffect(() => {
    fetch("/api/progress")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setStats((prev) => ({
            ...prev,
            recordDate: d.recordDate || prev.recordDate,
            recordDateFormatted: d.recordDate
              ? new Date(d.recordDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : prev.recordDateFormatted,
            overallRate: d.overallRate || prev.overallRate,
            overallSub:
              d.overallCorrect && d.overallTotal
                ? `${d.overallCorrect.toLocaleString()} of ${d.overallTotal.toLocaleString()} graded correctly`
                : prev.overallSub,
            bankersRate: d.bankersRate || prev.bankersRate,
            bankersSub:
              d.bankersCorrect && d.bankersTotal
                ? `${d.bankersCorrect.toLocaleString()} of ${d.bankersTotal.toLocaleString()} since 2026`
                : prev.bankersSub,
            matchesPredicted: d.matchesPredicted ? d.matchesPredicted.toLocaleString() : prev.matchesPredicted,
            daysTracked: d.daysTracked ? d.daysTracked.toLocaleString() : prev.daysTracked,
            monthlyBreakdown:
              Array.isArray(d.monthlyBreakdown) && d.monthlyBreakdown.length > 0
                ? d.monthlyBreakdown
                : prev.monthlyBreakdown,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: "",
    x: 0,
    y: 0,
    borderColor: "rgba(139,127,245,0.45)",
  });

  const chart1Ref = useRef<HTMLDivElement>(null);
  const chart2Ref = useRef<HTMLDivElement>(null);

  const handleDotOver = (
    e: React.PointerEvent<SVGCircleElement>,
    tipText: string,
    color: string,
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (!containerRef.current) return;
    const dotRect = (e.target as SVGCircleElement).getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const x = Math.max(10, Math.min(dotRect.left - containerRect.left + dotRect.width / 2, containerRect.width - 10));
    const y = dotRect.top - containerRect.top - 12;

    const borderColor = color.startsWith("rgb(")
      ? color.replace("rgb(", "rgba(").replace(")", ", 0.45)")
      : color;

    setTooltip({
      visible: true,
      text: tipText,
      x,
      y,
      borderColor,
    });
  };

  const handleDotOut = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="min-h-screen bg-[#0a081d] text-[#d4cde3] font-sans selection:bg-[#7c6cf5]/30">
      <Navbar />

      <main id="main" className="relative">
        <section className="relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="nt-glow pointer-events-none absolute left-1/2 top-0 -z-0 h-[520px] w-[1100px] max-w-full -translate-x-1/2"></div>

          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-10 lg:py-14">
            
            {/* Header Badge, H1 & Description */}
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#a79fff]/20 bg-[#a79fff]/[0.06] px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#a79fff]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300/70"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#6ee7b0]"></span>
                </span>
                Data proves us right.
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight text-[#f1eff8] sm:text-[40px]">
                Our AI performance
              </h1>

              <p className="pg-lead mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#a8a0ba]">
                Every one of our{" "}
                <Link href="/" className="text-[#a79fff] underline underline-offset-2 hover:text-[#c9bef8]">
                  AI football predictions
                </Link>{" "}
                is graded against the final score and counted here, won or lost. Follow the month-by-month trend and download the full history to check the numbers yourself.
              </p>
            </div>

            {/* 4 KPI Cards */}
            <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              
              {/* Card 1: Overall */}
              <div className="pg-kpi">
                <span
                  className="pg-kpi__ic"
                  style={{
                    color: "rgb(139,127,245)",
                    background: "rgba(139,127,245,.12)",
                    borderColor: "rgba(139,127,245,.22)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 17l6-6 4 4 8-8" />
                    <path d="M15 6h6v6" />
                  </svg>
                </span>
                <div className="pg-kpi__val" style={{ color: "rgb(139,127,245)" }}>
                  {stats.overallRate}
                </div>
                <div className="pg-kpi__lab">Overall</div>
                <div className="pg-kpi__sub">{stats.overallSub}</div>
              </div>

              {/* Card 2: Bankers */}
              <div className="pg-kpi">
                <span
                  className="pg-kpi__ic"
                  style={{
                    color: "rgb(240,190,110)",
                    background: "rgba(240,190,110,.12)",
                    borderColor: "rgba(240,190,110,.22)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1 1 5.79L12 16.77l-5.2 2.74 1-5.79-4.22-4.1 5.82-.85L12 3.5Z" />
                  </svg>
                </span>
                <div className="pg-kpi__val" style={{ color: "rgb(240,190,110)" }}>
                  {stats.bankersRate}
                </div>
                <div className="pg-kpi__lab">Bankers</div>
                <div className="pg-kpi__sub">{stats.bankersSub}</div>
              </div>

              {/* Card 3: Matches predicted */}
              <div className="pg-kpi">
                <span
                  className="pg-kpi__ic"
                  style={{
                    color: "rgb(201,188,255)",
                    background: "rgba(201,188,255,.12)",
                    borderColor: "rgba(201,188,255,.22)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
                  </svg>
                </span>
                <div className="pg-kpi__val" style={{ color: "rgb(201,188,255)" }}>
                  {stats.matchesPredicted}
                </div>
                <div className="pg-kpi__lab">Matches predicted</div>
                <div className="pg-kpi__sub">Since May 2021, across 700+ leagues</div>
              </div>

              {/* Card 4: Tracked daily */}
              <div className="pg-kpi">
                <span
                  className="pg-kpi__ic"
                  style={{
                    color: "rgb(110,220,180)",
                    background: "rgba(110,220,180,.12)",
                    borderColor: "rgba(110,220,180,.22)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
                    <path d="M8 3v4M16 3v4M3.5 10h17" />
                  </svg>
                </span>
                <div className="pg-kpi__val" style={{ color: "rgb(110,220,180)" }}>
                  5+ yrs
                </div>
                <div className="pg-kpi__lab">Tracked daily</div>
                <div className="pg-kpi__sub">{stats.daysTracked} days in the record</div>
              </div>
            </div>

            {/* Record last updated notification */}
            <p className="pg-upd">
              <time dateTime={stats.recordDate}>
                Record last updated {stats.recordDateFormatted}. New results are added every day, once the previous day&apos;s matches are settled.
              </time>
            </p>

            {/* 2 Interactive Charts Grid */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-5 lg:grid-cols-2">
              
              {/* Chart 1: Monthly win rate */}
              <div className="pg-card">
                <div className="pg-card__head">
                  <div>
                    <h2 className="pg-card__title">Monthly win rate</h2>
                    <p className="pg-card__sub">Last 12 months</p>
                  </div>
                  <div className="pg-legend">
                    <span className="pg-legend__i">
                      <i style={{ background: "rgb(240,190,110)" }}></i>Bankers
                    </span>
                    <span className="pg-legend__i">
                      <i style={{ background: "rgb(139,127,245)" }}></i>Overall
                    </span>
                  </div>
                </div>

                <div className="pg-card__body" ref={chart1Ref}>
                  <svg viewBox="0 0 640 300" className="pg-svg" role="img" aria-label="Monthly win rate" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="g_m_0" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="rgba(139,127,245,.30)" />
                        <stop offset="1" stopColor="rgba(139,127,245,.02)" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="30" y1="272" x2="626" y2="272" className="pg-grid" />
                    <text x="23" y="275" className="pg-ylab">55</text>
                    <line x1="30" y1="208" x2="626" y2="208" className="pg-grid" />
                    <text x="23" y="211" className="pg-ylab">64</text>
                    <line x1="30" y1="144" x2="626" y2="144" className="pg-grid" />
                    <text x="23" y="147" className="pg-ylab">73</text>
                    <line x1="30" y1="80" x2="626" y2="80" className="pg-grid" />
                    <text x="23" y="83" className="pg-ylab">81</text>
                    <line x1="30" y1="16" x2="626" y2="16" className="pg-grid" />
                    <text x="23" y="19" className="pg-ylab">90</text>

                    {/* Overall Area & Path */}
                    <path
                      d="M 30 184.96 C 39.03 184.96, 66.12 185.08, 84.18 184.96 C 102.24 184.84, 120.3 184.11, 138.36 184.23 C 156.42 184.35, 174.48 185.69, 192.55 185.69 C 210.61 185.69, 228.67 184.59, 246.73 184.23 C 264.79 183.86, 282.85 183.98, 300.91 183.5 C 318.97 183.01, 337.03 180.69, 355.09 181.3 C 373.15 181.91, 391.21 188.37, 409.27 187.15 C 427.33 185.94, 445.39 172.65, 463.45 173.99 C 481.52 175.33, 499.58 193.49, 517.64 195.2 C 535.7 196.91, 553.76 186.3, 571.82 184.23 C 589.88 182.16, 616.97 183.01, 626 182.77 L 626 272 L 30 272 Z"
                      fill="url(#g_m_0)"
                    />
                    <path
                      d="M 30 184.96 C 39.03 184.96, 66.12 185.08, 84.18 184.96 C 102.24 184.84, 120.3 184.11, 138.36 184.23 C 156.42 184.35, 174.48 185.69, 192.55 185.69 C 210.61 185.69, 228.67 184.59, 246.73 184.23 C 264.79 183.86, 282.85 183.98, 300.91 183.5 C 318.97 183.01, 337.03 180.69, 355.09 181.3 C 373.15 181.91, 391.21 188.37, 409.27 187.15 C 427.33 185.94, 445.39 172.65, 463.45 173.99 C 481.52 175.33, 499.58 193.49, 517.64 195.2 C 535.7 196.91, 553.76 186.3, 571.82 184.23 C 589.88 182.16, 616.97 183.01, 626 182.77"
                      fill="none"
                      stroke="rgb(139,127,245)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Bankers Line */}
                    <path
                      d="M 30 180.57 C 39.03 173.99, 66.12 154.85, 84.18 141.07 C 102.24 127.3, 120.3 95.36, 138.36 97.92 C 156.42 100.48, 174.48 151.07, 192.55 156.43 C 210.61 161.8, 228.67 134.74, 246.73 130.1 C 264.79 125.47, 282.85 132.42, 300.91 128.64 C 318.97 124.86, 337.03 96.7, 355.09 107.43 C 373.15 118.16, 391.21 181.42, 409.27 193.01 C 427.33 204.59, 445.39 184.72, 463.45 176.91 C 481.52 169.11, 499.58 148.39, 517.64 146.19 C 535.7 144, 553.76 169.23, 571.82 163.75 C 589.88 158.26, 616.97 121.69, 626 113.28"
                      fill="none"
                      stroke="rgb(240,190,110)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Overall Dots */}
                    {[
                      { cx: 30, cy: 184.96, tip: "October 2025 · 66.9% (6,152)" },
                      { cx: 84.18, cy: 184.96, tip: "November 2025 · 66.9% (5,970)" },
                      { cx: 138.36, cy: 184.23, tip: "December 2025 · 67% (3,888)" },
                      { cx: 192.55, cy: 185.69, tip: "January 2026 · 66.8% (6,004)" },
                      { cx: 246.73, cy: 184.23, tip: "February 2026 · 67% (8,089)" },
                      { cx: 300.91, cy: 183.5, tip: "March 2026 · 67.1% (9,699)" },
                      { cx: 355.09, cy: 181.3, tip: "April 2026 · 67.4% (10,568)" },
                      { cx: 409.27, cy: 187.15, tip: "May 2026 · 66.6% (9,039)" },
                      { cx: 463.45, cy: 173.99, tip: "June 2026 · 68.4% (3,139)" },
                      { cx: 517.64, cy: 195.2, tip: "July 2026 · 65.5% (4,405)" },
                      { cx: 571.82, cy: 184.23, tip: "August 2026 · 67% (9,186)" },
                      { cx: 626, cy: 182.77, tip: "September 2026 · 67.2% (7,471)" },
                    ].map((d, i) => (
                      <circle
                        key={`m_ov_${i}`}
                        cx={d.cx}
                        cy={d.cy}
                        r="3.5"
                        fill="rgb(139,127,245)"
                        stroke="#0b0726"
                        strokeWidth="1.5"
                        className="pg-dot"
                        onPointerOver={(e) => handleDotOver(e, d.tip, "rgb(139,127,245)", chart1Ref)}
                        onPointerOut={handleDotOut}
                      />
                    ))}

                    {/* Bankers Dots */}
                    {[
                      { cx: 30, cy: 180.57, tip: "October 2025 · 67.5% (200)" },
                      { cx: 84.18, cy: 141.07, tip: "November 2025 · 72.9% (181)" },
                      { cx: 138.36, cy: 97.92, tip: "December 2025 · 78.8% (132)" },
                      { cx: 192.55, cy: 156.43, tip: "January 2026 · 70.8% (212)" },
                      { cx: 246.73, cy: 130.1, tip: "February 2026 · 74.4% (211)" },
                      { cx: 300.91, cy: 128.64, tip: "March 2026 · 74.6% (201)" },
                      { cx: 355.09, cy: 107.43, tip: "April 2026 · 77.5% (200)" },
                      { cx: 409.27, cy: 193.01, tip: "May 2026 · 65.8% (196)" },
                      { cx: 463.45, cy: 176.91, tip: "June 2026 · 68% (100)" },
                      { cx: 517.64, cy: 146.19, tip: "July 2026 · 72.2% (115)" },
                      { cx: 571.82, cy: 163.75, tip: "August 2026 · 69.8% (139)" },
                      { cx: 626, cy: 113.28, tip: "September 2026 · 76.7% (159)" },
                    ].map((d, i) => (
                      <circle
                        key={`m_bk_${i}`}
                        cx={d.cx}
                        cy={d.cy}
                        r="3.5"
                        fill="rgb(240,190,110)"
                        stroke="#0b0726"
                        strokeWidth="1.5"
                        className="pg-dot"
                        onPointerOver={(e) => handleDotOver(e, d.tip, "rgb(240,190,110)", chart1Ref)}
                        onPointerOut={handleDotOut}
                      />
                    ))}

                    {/* X-axis Month Labels */}
                    {[
                      { x: 30, label: "Oct" },
                      { x: 84.18, label: "Nov" },
                      { x: 138.36, label: "Dec" },
                      { x: 192.55, label: "Jan" },
                      { x: 246.73, label: "Feb" },
                      { x: 300.91, label: "Mar" },
                      { x: 355.09, label: "Apr" },
                      { x: 409.27, label: "May" },
                      { x: 463.45, label: "Jun" },
                      { x: 517.64, label: "Jul" },
                      { x: 571.82, label: "Aug" },
                      { x: 626, label: "Sep" },
                    ].map((l, i) => (
                      <text key={i} x={l.x} y="291" className="pg-xlab">
                        {l.label}
                      </text>
                    ))}
                  </svg>

                  {/* Tooltip Overlay */}
                  {tooltip.visible && (
                    <div
                      className="pg-tip is-on"
                      style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        borderColor: tooltip.borderColor,
                        transform: "translate(-50%, -100%)",
                      }}
                    >
                      {tooltip.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 2: Recent form */}
              <div className="pg-card">
                <div className="pg-card__head">
                  <div>
                    <h2 className="pg-card__title">Recent form</h2>
                    <p className="pg-card__sub">Overall win rate, last 14 days</p>
                  </div>
                  <span className="pg-legend__i">
                    <i style={{ background: "rgb(139,127,245)" }}></i>Overall
                  </span>
                </div>

                <div className="pg-card__body" ref={chart2Ref}>
                  <svg viewBox="0 0 640 300" className="pg-svg" role="img" aria-label="Recent form" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="g_o_0" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="rgba(139,127,245,.30)" />
                        <stop offset="1" stopColor="rgba(139,127,245,.02)" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="30" y1="272" x2="626" y2="272" className="pg-grid" />
                    <text x="23" y="275" className="pg-ylab">50</text>
                    <line x1="30" y1="208" x2="626" y2="208" className="pg-grid" />
                    <text x="23" y="211" className="pg-ylab">59</text>
                    <line x1="30" y1="144" x2="626" y2="144" className="pg-grid" />
                    <text x="23" y="147" className="pg-ylab">68</text>
                    <line x1="30" y1="80" x2="626" y2="80" className="pg-grid" />
                    <text x="23" y="83" className="pg-ylab">76</text>
                    <line x1="30" y1="16" x2="626" y2="16" className="pg-grid" />
                    <text x="23" y="19" className="pg-ylab">85</text>

                    {/* Form Area & Path */}
                    <path
                      d="M 30 112.9 C 37.64 124.54, 60.56 176.38, 75.85 182.73 C 91.13 189.08, 106.41 154.74, 121.69 150.99 C 136.97 147.24, 152.26 159.16, 167.54 160.23 C 182.82 161.3, 198.1 167.38, 213.38 157.4 C 228.67 147.42, 243.95 101.56, 259.23 100.34 C 274.51 99.12, 289.79 143.62, 305.08 150.09 C 320.36 156.57, 335.64 136.6, 350.92 139.16 C 366.21 141.72, 381.49 170.65, 396.77 165.45 C 412.05 160.25, 427.33 111.01, 442.62 107.97 C 457.9 104.93, 473.18 138.07, 488.46 147.22 C 503.74 156.36, 519.03 162.77, 534.31 162.84 C 549.59 162.91, 564.87 157.17, 580.15 147.66 C 595.44 138.14, 618.36 112.75, 626 105.77 L 626 272 L 30 272 Z"
                      fill="url(#g_o_0)"
                    />
                    <path
                      d="M 30 112.9 C 37.64 124.54, 60.56 176.38, 75.85 182.73 C 91.13 189.08, 106.41 154.74, 121.69 150.99 C 136.97 147.24, 152.26 159.16, 167.54 160.23 C 182.82 161.3, 198.1 167.38, 213.38 157.4 C 228.67 147.42, 243.95 101.56, 259.23 100.34 C 274.51 99.12, 289.79 143.62, 305.08 150.09 C 320.36 156.57, 335.64 136.6, 350.92 139.16 C 366.21 141.72, 381.49 170.65, 396.77 165.45 C 412.05 160.25, 427.33 111.01, 442.62 107.97 C 457.9 104.93, 473.18 138.07, 488.46 147.22 C 503.74 156.36, 519.03 162.77, 534.31 162.84 C 549.59 162.91, 564.87 157.17, 580.15 147.66 C 595.44 138.14, 618.36 112.75, 626 105.77"
                      fill="none"
                      stroke="rgb(139,127,245)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Dots for Recent Form */}
                    {[
                      { cx: 30, cy: 112.9, tip: "Sep 9 · 71.8% (177)" },
                      { cx: 75.85, cy: 182.73, tip: "Sep 10 · 62.2% (127)" },
                      { cx: 121.69, cy: 150.99, tip: "Sep 11 · 66.5% (272)" },
                      { cx: 167.54, cy: 160.23, tip: "Sep 12 · 65.3% (890)" },
                      { cx: 213.38, cy: 157.4, tip: "Sep 13 · 65.7% (734)" },
                      { cx: 259.23, cy: 100.34, tip: "Sep 14 · 73.5% (147)" },
                      { cx: 305.08, cy: 150.09, tip: "Sep 15 · 66.7% (162)" },
                      { cx: 350.92, cy: 139.16, tip: "Sep 16 · 68.2% (223)" },
                      { cx: 396.77, cy: 165.45, tip: "Sep 17 · 64.6% (127)" },
                      { cx: 442.62, cy: 107.97, tip: "Sep 18 · 72.4% (272)" },
                      { cx: 488.46, cy: 147.22, tip: "Sep 19 · 67.1% (847)" },
                      { cx: 534.31, cy: 162.84, tip: "Sep 20 · 64.9% (727)" },
                      { cx: 580.15, cy: 147.66, tip: "Sep 21 · 67% (100)" },
                      { cx: 626, cy: 105.77, tip: "Sep 22 · 72.7% (110)" },
                    ].map((d, i) => (
                      <circle
                        key={`form_${i}`}
                        cx={d.cx}
                        cy={d.cy}
                        r="3.5"
                        fill="rgb(139,127,245)"
                        stroke="#0b0726"
                        strokeWidth="1.5"
                        className="pg-dot"
                        onPointerOver={(e) => handleDotOver(e, d.tip, "rgb(139,127,245)", chart2Ref)}
                        onPointerOut={handleDotOut}
                      />
                    ))}

                    {/* X-axis Day Labels */}
                    {[
                      { x: 30, label: "Sep 9" },
                      { x: 75.85, label: "Sep 10" },
                      { x: 121.69, label: "Sep 11" },
                      { x: 167.54, label: "Sep 12" },
                      { x: 213.38, label: "Sep 13" },
                      { x: 259.23, label: "Sep 14" },
                      { x: 305.08, label: "Sep 15" },
                      { x: 350.92, label: "Sep 16" },
                      { x: 396.77, label: "Sep 17" },
                      { x: 442.62, label: "Sep 18" },
                      { x: 488.46, label: "Sep 19" },
                      { x: 534.31, label: "Sep 20" },
                      { x: 580.15, label: "Sep 21" },
                      { x: 626, label: "Sep 22" },
                    ].map((l, i) => (
                      <text key={i} x={l.x} y="291" className="pg-xlab">
                        {l.label}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="pg-card mt-4 lg:mt-5">
              <div className="pg-card__head">
                <div>
                  <h2 className="pg-card__title" id="pg-rec">
                    Monthly breakdown
                  </h2>
                  <p className="pg-card__sub">Every rate beside the sample it is measured over</p>
                </div>
              </div>

              <div className="pg-mtwrap">
                <table className="pg-mt" aria-labelledby="pg-rec">
                  <thead>
                    <tr>
                      <th scope="col">Month</th>
                      <th scope="col">
                        <span className="pg-mt__cell">
                          <span>Bankers</span>
                          <span className="pg-mt__lane" aria-hidden="true"></span>
                        </span>
                      </th>
                      <th scope="col">
                        <span className="pg-mt__cell">
                          <span>Overall</span>
                          <span className="pg-mt__lane" aria-hidden="true"></span>
                        </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {stats.monthlyBreakdown.map((row, idx) => (
                      <tr key={idx}>
                        <th scope="row">{row.month}</th>
                        <td>
                          <span className="pg-mt__cell">
                            <span className="pg-mt__vwrap">
                              <span className="pg-mt__v" style={{ color: "rgb(240,190,110)" }}>
                                {row.bkRate}
                              </span>
                              <span className="pg-mt__n">{row.bkCount}</span>
                            </span>
                            <span className="pg-mt__track" aria-hidden="true">
                              <span
                                className="pg-mt__fill"
                                style={{ width: row.bkRate, background: "rgb(240,190,110)" }}
                              ></span>
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="pg-mt__cell">
                            <span className="pg-mt__vwrap">
                              <span className="pg-mt__v" style={{ color: "rgb(139,127,245)" }}>
                                {row.ovRate}
                              </span>
                              <span className="pg-mt__n">{row.ovCount}</span>
                            </span>
                            <span className="pg-mt__track" aria-hidden="true">
                              <span
                                className="pg-mt__fill"
                                style={{ width: row.ovRate, background: "rgb(139,127,245)" }}
                              ></span>
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Download Buttons Section */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/downloads/progress.csv"
                download="progress.csv"
                className="pg-dl"
                title="Download full daily historical record"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
                Download Historical Stats
              </a>

              <a
                href="/downloads/allMatches.xlsx"
                download="allMatches.xlsx"
                className="pg-dl"
                title="Download all matches archive"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
                Download All Matches
              </a>
            </div>

            {/* Questions about this page (FAQ Accordions) */}
            <section className="mt-10 lg:mt-12">
              <h2 className="pg-faq__h">Questions about this page</h2>

              <div className="mt-5 flex flex-col gap-2.5">
                
                <details className="pg-faq">
                  <summary className="pg-faq__q">
                    <h3 className="pg-faq__qt">What do the numbers on this page count?</h3>
                    <svg viewBox="0 0 24 24" className="pg-faq__chev" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="pg-faq__a">
                    <p>
                      Every football prediction NT Apex publishes goes into this record before the match is played, and stays in it once the result is in. Two rates come out of that archive: Bankers counted by themselves, and every prediction taken together.
                    </p>
                    <p>
                      The charts, the monthly table and the download files are three views of the same rows, so a match cannot be counted in one and missing from another. Nothing is added to the record after a result is known.
                    </p>
                  </div>
                </details>

                <details className="pg-faq">
                  <summary className="pg-faq__q">
                    <h3 className="pg-faq__qt">How long has this record been running?</h3>
                    <svg viewBox="0 0 24 24" className="pg-faq__chev" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="pg-faq__a">
                    <p>
                      The first settled day is May 19, 2021 and the most recent is September 22, 2026, which puts 1,877 days of football in between. Each of those days is one line in the archive, with its counts beside it.
                    </p>
                    <p>
                      The table on this page shows the last 12 months. The file behind the download button starts at the first day and keeps the bad runs in with everything else.
                    </p>
                  </div>
                </details>

                <details className="pg-faq">
                  <summary className="pg-faq__q">
                    <h3 className="pg-faq__qt">Why are Bankers and Overall counted separately?</h3>
                    <svg viewBox="0 0 24 24" className="pg-faq__chev" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="pg-faq__a">
                    <p>
                      Bankers sit at the top of the confidence scale, the few matches a day the model rates nine or better out of ten. Counted over 2026, that is 1,533 picks with 1,111 winners, a rate of 72.5%.
                    </p>
                    <p>
                      Overall is the full output: 278,849 settled predictions, 185,747 of them correct, 66.6%. A strict selection should land more often than everything the model says, and putting the two side by side is how you can see whether it does. One blended figure would hide it.
                    </p>
                  </div>
                </details>

                <details className="pg-faq">
                  <summary className="pg-faq__q">
                    <h3 className="pg-faq__qt">How do you decide whether a prediction won or lost?</h3>
                    <svg viewBox="0 0 24 24" className="pg-faq__chev" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="pg-faq__a">
                    <p>
                      Correct tips divided by settled tips. Each rated match carries one main tip, published before kickoff and settled on the final score. A fixture that is postponed or abandoned never reaches a final score, so it drops out of the count instead of going down as a loss.
                    </p>
                    <p>
                      The headline rates weigh matches, not days, so a full Saturday card counts for more than three midweek fixtures. A tip is right or it is wrong: nothing is part-won and nothing is voided.
                    </p>
                  </div>
                </details>

                <details className="pg-faq">
                  <summary className="pg-faq__q">
                    <h3 className="pg-faq__qt">When do new results appear here?</h3>
                    <svg viewBox="0 0 24 24" className="pg-faq__chev" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="pg-faq__a">
                    <p>
                      Once a day, after the previous day&apos;s matches have finished and been settled. That is why the last complete day here is September 22, 2026 rather than today, whose fixtures are still open.
                    </p>
                    <p>
                      Every panel on the page reads the same daily file, so they cannot drift apart. A day is written once, with the result it had, and it is not re-graded or quietly tidied up afterwards.
                    </p>
                  </div>
                </details>

                <details className="pg-faq">
                  <summary className="pg-faq__q">
                    <h3 className="pg-faq__qt">What do the two downloads contain?</h3>
                    <svg viewBox="0 0 24 24" className="pg-faq__chev" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="pg-faq__a">
                    <p>
                      The CSV holds the daily record in raw form: one row per day with the date, how many Bankers settled that day and what share of them came in, then the same pair of columns for all predictions. Every chart above can be rebuilt from those five columns.
                    </p>
                    <p>
                      The spreadsheet goes a level deeper, one row per match with the competition, both teams, the tip we published and how the match ended. Neither asks for an account. To spot-check the last few days without downloading anything,{" "}
                      <Link href="/all-matches" className="text-[#a79fff] underline underline-offset-2 hover:text-[#c9bef8]">
                        All Matches
                      </Link>{" "}
                      shows the same fixtures beside their results.
                    </p>
                  </div>
                </details>

                <details className="pg-faq">
                  <summary className="pg-faq__q">
                    <h3 className="pg-faq__qt">Why does the daily line jump around so much?</h3>
                    <svg viewBox="0 0 24 24" className="pg-faq__chev" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="pg-faq__a">
                    <p>
                      Because a day is a tiny sample. On a quiet day the model rates only four matches highly enough to be Bankers, and four picks can land on five values: none, one, two, three or all four. A late equaliser moves the whole day.
                    </p>
                    <p>
                      A rate gets steadier the more matches it covers, which is why the monthly table and the all-time figures are printed here too, each one next to the sample it came from. Read the month before you read the day.
                    </p>
                  </div>
                </details>

                <details className="pg-faq">
                  <summary className="pg-faq__q">
                    <h3 className="pg-faq__qt">Which football competitions are counted here?</h3>
                    <svg viewBox="0 0 24 24" className="pg-faq__chev" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="pg-faq__a">
                    <p>
                      All of them, more than 700 across a year: top divisions in Europe and beyond, second and third tiers, domestic cups and two-legged continental ties. A title race and a midweek third-division fixture carry the same weight in these totals.
                    </p>
                    <p>
                      Nothing is filtered. No country is dropped, no competition is set aside and no month is left out because it went badly.
                    </p>
                  </div>
                </details>

                <details className="pg-faq">
                  <summary className="pg-faq__q">
                    <h3 className="pg-faq__qt">How do I check the numbers for myself?</h3>
                    <svg viewBox="0 0 24 24" className="pg-faq__chev" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="pg-faq__a">
                    <p>
                      Download the two files and count again. Everything printed on this page comes out of those rows, so any figure here can be checked against the source instead of taken on trust.
                    </p>
                    <p>
                      You can also go back to the pages the picks were published on:{" "}
                      <Link href="/all-matches" className="text-[#a79fff] underline underline-offset-2 hover:text-[#c9bef8]">
                        All Matches
                      </Link>{" "}
                      keeps recent fixtures beside their results, and the day&apos;s strongest picks stay on{" "}
                      <Link href="/bet-of-the-day" className="text-[#a79fff] underline underline-offset-2 hover:text-[#c9bef8]">
                        Bet of the Day
                      </Link>{" "}
                      after kickoff. Losing tips are never deleted. They stay in the daily, monthly and all-time counts alongside the winners.
                    </p>
                  </div>
                </details>

              </div>
            </section>

          </div>
        </section>
      </main>
    </div>
  );
}
