"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  TrendingUp,
  Brain,
  BarChart3,
  Calendar,
  Clock,
  Mail,
  CheckCircle2,
  ArrowRight,
  Bookmark,
  Share2,
  Cpu,
  Layers,
  Search,
  Tag,
  User,
  X,
  ChevronRight,
  Flame,
  Target,
  ShieldCheck,
} from "lucide-react";

interface Article {
  id: string;
  slug: string;
  category: "AI & Machine Learning" | "Betting Strategies" | "Match Previews" | "Tactics & xG";
  title: string;
  excerpt: string;
  content: string[];
  keyTakeaways: string[];
  readTime: string;
  date: string;
  author: {
    name: string;
    role: string;
  };
  featured?: boolean;
}

const ARTICLES: Article[] = [
  {
    id: "art-1",
    slug: "inside-jt-apex-ai-model-prediction-accuracy",
    category: "AI & Machine Learning",
    title: "Inside the Engine: How Neural Networks Predict Football Fixtures with 85%+ Accuracy",
    excerpt: "A deep dive into our multi-layered Poisson regression and bidirectional LSTM architecture that isolates true underlying goal expectancy from random luck.",
    content: [
      "In modern football, single-match scorelines are notoriously noisy. A team can dominate possession with 2.8 Expected Goals (xG), hit the woodwork twice, and lose 1-0 to a deflected set-piece. Human bettors often overreact to these deceptive outcomes, while bookmakers subtly adjust market prices to exploit public overreactions.",
      "This is where JT Apex changes the dynamic. Rather than training models on final scores, our quantitative pipeline trains on underlying shot telemetry, pitch tilt, passing network pressure, and recovery zone locations.",
      "By combining Bidirectional Long Short-Term Memory (LSTM) networks with Bivariate Poisson goal distribution models, JT Apex simulates every match 100,000 times before kickoff. The result is a mathematically grounded probability distribution across 1X2, Over/Under, and BTTS markets."
    ],
    keyTakeaways: [
      "Scorelines contain high variance; shot location and xG isolate true underlying team quality.",
      "100,000 Monte Carlo runs simulate every possible in-game scenario before settling true probabilities.",
      "Lineup changes within 60 minutes of kickoff update model weights in under 12 seconds."
    ],
    readTime: "6 min read",
    date: "Sep 9, 2026",
    author: {
      name: "Dr. K. Adeyemi",
      role: "Lead Quantitative Scientist",
    },
    featured: true,
  },
  {
    id: "art-2",
    slug: "math-of-expected-value-ev-betting",
    category: "Betting Strategies",
    title: "The Math of Expected Value (+EV): Stop Guessing, Start Calculating Market Edges",
    excerpt: "Why closing line value (CLV) and implied probability calculations are the only sustainable, mathematically proven path to long-term profitability.",
    content: [
      "Most sports bettors ask the wrong question: 'Who will win this match?' Professional quantitative syndicates ask: 'Is the price offered by the bookmaker higher than the true mathematical probability?'",
      "Expected Value (EV) measures the return you can expect on average for each bet placed at a specific price. The formula is straightforward: EV = (True Probability × Decimal Odds) - 1.",
      "When JT Apex calculates a team has a 60% probability of winning (fair odds of 1.67) and the bookmaker offers 1.90, that bet carries a +14% Expected Value. Over hundreds of settled fixtures, positive EV is the single mathematical guarantee of beating the bookmaker margin."
    ],
    keyTakeaways: [
      "Value betting is about finding price discrepancies, not just picking heavy favorites.",
      "A 55% win-rate at average odds of 2.05 produces far higher long-term ROI than 80% win-rate at 1.15.",
      "Tracking Closing Line Value (CLV) proves whether your picks consistently beat the market consensus."
    ],
    readTime: "7 min read",
    date: "Sep 7, 2026",
    author: {
      name: "Strategy Desk",
      role: "Risk & Portfolio Analyst",
    },
  },
  {
    id: "art-3",
    slug: "xg-deep-dive-beyond-basic-stats",
    category: "Tactics & xG",
    title: "Beyond Basic Statistics: How Non-Shot xG & Field Tilt Predict Reversal Runs",
    excerpt: "Why goals scored and conceded lie, and how territory control metrics consistently anticipate when cold streaks will turn hot.",
    content: [
      "Traditional football pundits still rely on basic stats like recent clean sheets or winning streaks. Quantitative analysts know that these metrics are lagging indicators.",
      "Field Tilt measures the share of possession in the final third. When a team generates 68% field tilt but scores zero goals across 3 matches, market odds inflate because the public thinks they are in a slump. In reality, regression to the mean dictates an explosive goal haul in coming fixtures.",
      "JT Apex leverages Non-Shot Expected Goals (npxG) to identify high-probability value on under-priced teams before the general market catches on."
    ],
    keyTakeaways: [
      "Lagging indicators (goals conceded) hide underlying positive tactical performance.",
      "Field Tilt > 65% is an 82% accurate leading indicator of scoring output in the next 3 fixtures.",
      "Early line movement almost always favors high-npxG teams."
    ],
    readTime: "5 min read",
    date: "Sep 4, 2026",
    author: {
      name: "Tactics Lab",
      role: "Match Telemetry Engineer",
    },
  }
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const categories = ["All", "AI & Machine Learning", "Betting Strategies", "Tactics & xG"];

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((art) => {
      const matchCat = selectedCategory === "All" || art.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 20px 80px" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 40px" }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <BookOpen size={14} />
            <span>QUANTITATIVE RESEARCH & INSIGHTS</span>
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            margin: "0 0 14px",
          }}>
            The <span style={{ color: "var(--gold)" }}>JollofTips</span> Intelligence Journal
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Educational articles, mathematical betting strategies, xG deep-dives, and algorithmic architecture documentation.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="luxury-card" style={{ padding: "12px 18px", marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map((c) => {
              const isSel = selectedCategory === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: isSel ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                    background: isSel ? "var(--gold)" : "transparent",
                    color: isSel ? "var(--gold-btn-text)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: "var(--surface-raised)", border: "1px solid var(--border-color)", width: 220 }}>
            <Search size={14} color="var(--gold)" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {/* Articles Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="luxury-card"
              style={{
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
              onClick={() => setActiveArticle(art)}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span className="gold-badge" style={{ fontSize: 10 }}>{art.category}</span>
                  <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>{art.readTime}</span>
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.35, marginBottom: 12 }}>
                  {art.title}
                </h2>

                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
                  {art.excerpt}
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{art.author.name}</p>
                  <p style={{ fontSize: 11, color: "var(--text-dim)", margin: 0 }}>{art.author.role}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--gold)", display: "flex", alignItems: "center", gap: 4 }}>
                  Read <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Article Detail Modal */}
      {activeArticle && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setActiveArticle(null)}
        >
          <div
            className="luxury-card"
            style={{
              maxWidth: 720,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "32px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <span className="gold-badge">{activeArticle.category}</span>
              <button
                onClick={() => setActiveArticle(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", marginBottom: 16, lineHeight: 1.3 }}>
              {activeArticle.title}
            </h1>

            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-dim)", borderBottom: "1px solid var(--border-color)", paddingBottom: 16, marginBottom: 20 }}>
              <span>By {activeArticle.author.name}</span>
              <span>•</span>
              <span>{activeArticle.date}</span>
              <span>•</span>
              <span>{activeArticle.readTime}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
              {activeArticle.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Key Takeaways */}
            <div style={{ background: "var(--gold-bg)", border: "1px solid var(--gold-border)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "var(--gold)", textTransform: "uppercase", marginBottom: 8 }}>
                Key Takeaways
              </p>
              <ul style={{ paddingLeft: 16, fontSize: 13, color: "var(--text-primary)", display: "flex", flexDirection: "column", gap: 6 }}>
                {activeArticle.keyTakeaways.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
