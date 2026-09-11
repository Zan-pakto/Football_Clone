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
    avatarGradient: string;
  };
  tagColor: string;
  accentBg: string;
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
      avatarGradient: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    },
    tagColor: "#818cf8",
    accentBg: "rgba(99, 102, 241, 0.12)",
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
      avatarGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    tagColor: "#34d399",
    accentBg: "rgba(16, 185, 129, 0.12)",
  },
  {
    id: "art-3",
    slug: "arsenal-chelsea-tactical-breakdown-ai-forecast",
    category: "Match Previews",
    title: "Arsenal vs Chelsea: High-Press Analytics & AI Model Tactical Forecast",
    excerpt: "Tactical breakdown of the upcoming London Derby, analyzing defensive transitions, midfield recoveries, and why the model favors Arsenal Win & Over 1.5 Goals.",
    content: [
      "When Arsenal host Chelsea at the Emirates Stadium, tactical matchups will dictate the rhythm. Arsenal's high-turnover recovery metric (averaging 7.4 high regains per 90) clashes directly with Chelsea's progressive build-up play under pressure.",
      "Historical telemetry shows that when Chelsea face top-4 opponents away from home, their defensive line concedes an average of 1.74 xG against quick central transitions.",
      "JT Apex projects Arsenal with a 58.4% win probability and a 78.2% probability of Over 1.5 total match goals, signaling a strong statistical consensus for Arsenal Win & Over 1.5 Goals at 1.72."
    ],
    keyTakeaways: [
      "Arsenal's home xG generation (2.15/game) provides a commanding attacking floor.",
      "Chelsea's transition vulnerabilities suggest high likelihood of multiple second-half chances.",
      "Model consensus: Arsenal Win & Over 1.5 Goals @ 1.72 (89% Confidence)."
    ],
    readTime: "5 min read",
    date: "Sep 6, 2026",
    author: {
      name: "T. Okafor",
      role: "Senior Match Analyst",
      avatarGradient: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
    },
    tagColor: "#fb923c",
    accentBg: "rgba(249, 115, 22, 0.12)",
  },
  {
    id: "art-4",
    slug: "understanding-xg-vs-xt-expected-threat",
    category: "Tactics & xG",
    title: "Beyond xG: How Expected Threat (xT) and Pitch Tilt Unlock Hidden Value",
    excerpt: "Expected Goals only measures shots. Expected Threat (xT) evaluates every pass, dribble, and territory gain leading up to the penalty box.",
    content: [
      "While Expected Goals (xG) has become mainstream, it has an inherent limitation: it only registers events when an actual shot is taken. A dangerous cross that barely misses a sliding striker counts for 0.00 xG, despite being a 90% goal-scoring opportunity.",
      "Expected Threat (xT) fixes this by dividing the pitch into an 8x12 spatial grid. Every pass or carry that moves the ball from a low-probability zone to a high-probability zone earns an xT score.",
      "By incorporating xT into the JT Apex data pipeline, our AI detects dominant attacking momentum 2 to 3 weeks before it shows up in traditional scorelines, giving subscribers a massive pricing headstart."
    ],
    keyTakeaways: [
      "xG measures shots; xT measures dangerous territorial dominance and ball progression.",
      "Teams with high xT but low actual goal conversion are prime candidates for positive regression.",
      "JT Apex blends xT, PPDA (pressing intensity), and box entry counts into its pre-match ratings."
    ],
    readTime: "6 min read",
    date: "Sep 4, 2026",
    author: {
      name: "Tactics & Scouting Desk",
      role: "Spatial Data Engineering",
      avatarGradient: "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)",
    },
    tagColor: "#38bdf8",
    accentBg: "rgba(56, 189, 248, 0.12)",
  },
  {
    id: "art-5",
    slug: "bankroll-management-kelly-criterion",
    category: "Betting Strategies",
    title: "Bankroll Management & The Fractional Kelly Criterion: Surviving Variance",
    excerpt: "Even an 85% accurate forecasting model will experience losing runs. Here is how professional syndicates protect capital with dynamic staking.",
    content: [
      "The biggest reason profitable prediction models fail in amateur hands is not bad predictions — it is reckless bankroll management. Overbetting on a single game turns temporary variance into fatal account drawdowns.",
      "The Kelly Criterion is a formula created by mathematician John Kelly Jr. to optimize bet sizing based on your quantified edge: Fraction = (Edge) / (Odds - 1).",
      "In sports betting, professional funds use a 'Fractional Kelly' (typically Quarter Kelly, 25%). This dramatically smooths variance while maximizing compound growth over hundreds of weekly bets."
    ],
    keyTakeaways: [
      "Never wager more than 2% to 4% of total bankroll on any individual fixture.",
      "Scale stake sizes in proportion to model confidence (e.g. 1 unit on 75% confidence, 2.5 units on 90%+ confidence).",
      "Sticking to a mathematical staking plan prevents tilt and emotional chasing after bad beats."
    ],
    readTime: "8 min read",
    date: "Sep 2, 2026",
    author: {
      name: "Quantitative Strategy Team",
      role: "Capital Allocation",
      avatarGradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    },
    tagColor: "#f472b6",
    accentBg: "rgba(244, 114, 182, 0.12)",
  },
  {
    id: "art-6",
    slug: "npfl-and-underdog-market-inefficiencies",
    category: "Match Previews",
    title: "Underdog Inefficiencies: Why Emerging & Mid-Tier Leagues Deliver the Highest ROI",
    excerpt: "Bookmakers focus 90% of their pricing resources on the Premier League and Champions League. Here is where the quantitative models find massive mispricings.",
    content: [
      "In ultra-liquid markets like Real Madrid vs Barcelona, global bookmakers employ teams of traders and high-frequency algorithms to balance liquidity. Edges exist, but they are typically 2% to 5%.",
      "In regional or mid-tier leagues — such as the NPFL (Nigeria), Portuguese Primeira Liga, or Dutch Eredivisie — bookmaker algorithms rely on generic rating models without accounting for intense home crowd dynamics, pitch condition variations, or short turnaround times.",
      "JT Apex tracks 120+ leagues with uniform computational depth. This creates extraordinary value on Double Chance (1X/X2) and Draw markets where bookmakers misprice home underdogs by 15% to 25%."
    ],
    keyTakeaways: [
      "Major leagues have tighter margins; mid-tier leagues offer larger statistical mispricings.",
      "Home turf advantages in regional leagues regularly flip heavy favorite odds upside down.",
      "JT Apex analyzes all 120+ leagues with identical mathematical rigor."
    ],
    readTime: "5 min read",
    date: "Aug 30, 2026",
    author: {
      name: "JollofTips Editorial",
      role: "African & European Football Desk",
      avatarGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    tagColor: "#fbbf24",
    accentBg: "rgba(245, 158, 11, 0.12)",
  },
];

const CATEGORIES = [
  "All Articles",
  "AI & Machine Learning",
  "Betting Strategies",
  "Match Previews",
  "Tactics & xG",
] as const;

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Articles");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // Newsletter State
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((art) => {
      const matchesCat = selectedCategory === "All Articles" || art.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const featuredArticle = ARTICLES.find((a) => a.featured) || ARTICLES[0];

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", color: "var(--foreground)" }}>
      <Navbar />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "110px 16px 80px", position: "relative" }}>
        
        {/* Top Ambient Glow */}
        <div
          style={{
            position: "absolute",
            top: "6%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse at center, rgba(129, 140, 248, 0.15) 0%, rgba(168, 85, 247, 0.1) 40%, transparent 70%)",
            filter: "blur(90px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ── Page Header ── */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1, marginBottom: 44 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "#a5b4fc",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.15)",
            }}
          >
            <BookOpen style={{ width: 14, height: 14, color: "#818cf8" }} />
            <span>RESEARCH & QUANTITATIVE BLOG</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 54px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              margin: "0 0 16px",
              lineHeight: 1.15,
            }}
          >
            Football Analytics, AI Models & <br />
            <span
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Strategic Match Intelligence
            </span>
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "clamp(15px, 1.8vw, 17px)",
              maxWidth: 680,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Tactical breakdowns, Expected Goals (xG) tutorials, quantitative betting math, and model engineering research.
          </p>
        </div>

        {/* ── Featured Hero Story Card ── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(21, 26, 56, 0.95) 0%, rgba(15, 18, 42, 0.98) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.35)",
            borderRadius: 20,
            padding: "36px 32px",
            marginBottom: 44,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#f87171",
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Flame style={{ width: 13, height: 13 }} />
              FEATURED ANALYSIS
            </span>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: featuredArticle.accentBg,
                color: featuredArticle.tagColor,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {featuredArticle.category}
            </span>
          </div>

          <h2
            style={{
              fontSize: "clamp(22px, 3.2vw, 32px)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              margin: "0 0 14px",
              lineHeight: 1.25,
            }}
          >
            {featuredArticle.title}
          </h2>

          <p
            style={{
              color: "#94a3b8",
              fontSize: 15,
              lineHeight: 1.65,
              maxWidth: 820,
              margin: "0 0 24px",
            }}
          >
            {featuredArticle.excerpt}
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: featuredArticle.author.avatarGradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                {featuredArticle.author.name.slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{featuredArticle.author.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {featuredArticle.author.role} • {featuredArticle.date} • {featuredArticle.readTime}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveArticle(featuredArticle)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 24px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 800,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 18px rgba(112, 101, 240, 0.4)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>Read Full Research Paper</span>
              <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        {/* ── Category Filters & Search Bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {/* Category Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: selectedCategory === cat ? "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)" : "rgba(21, 26, 56, 0.8)",
                  border: selectedCategory === cat ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid rgba(99, 102, 241, 0.2)",
                  color: selectedCategory === cat ? "#ffffff" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: selectedCategory === cat ? "0 4px 14px rgba(112, 101, 240, 0.35)" : "none",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 10,
              background: "rgba(21, 26, 56, 0.8)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              minWidth: 260,
            }}
          >
            <Search style={{ width: 16, height: 16, color: "#818cf8" }} />
            <input
              type="text"
              placeholder="Search topics, xG, tactics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: 13,
                outline: "none",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>

        {/* ── Articles Grid ── */}
        {filteredArticles.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 24,
              marginBottom: 56,
            }}
          >
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => setActiveArticle(article)}
                style={{
                  background: "linear-gradient(180deg, rgba(21, 26, 56, 0.85) 0%, rgba(14, 17, 39, 0.95) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  borderRadius: 18,
                  padding: "26px",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.55)";
                  e.currentTarget.style.boxShadow = "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(139, 92, 246, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.35)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: article.accentBg,
                      color: article.tagColor,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {article.category}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    {article.readTime}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.35,
                    marginBottom: 10,
                  }}
                >
                  {article.title}
                </h3>

                <p
                  style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    lineHeight: 1.6,
                    margin: "0 0 20px",
                    flex: 1,
                  }}
                >
                  {article.excerpt}
                </p>

                {/* Card Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 16,
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: article.author.avatarGradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {article.author.name.slice(0, 2)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>
                      {article.author.name}
                    </span>
                  </div>

                  <span
                    style={{
                      color: "#818cf8",
                      fontSize: 13,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>Read</span>
                    <ChevronRight style={{ width: 14, height: 14 }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "rgba(21, 26, 56, 0.5)",
              borderRadius: 16,
              border: "1px solid rgba(99, 102, 241, 0.2)",
              marginBottom: 56,
            }}
          >
            <BookOpen style={{ width: 36, height: 36, color: "#818cf8", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>
              No articles found
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
              Try adjusting your search query or selecting a different category.
            </p>
          </div>
        )}

        {/* ── Newsletter Box ── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 37, 85, 0.9) 0%, rgba(18, 22, 54, 0.95) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: 20,
            padding: "36px",
            textAlign: "center",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
            maxWidth: 820,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(139, 92, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a78bfa",
              margin: "0 auto 16px",
            }}
          >
            <Mail style={{ width: 22, height: 22 }} />
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 900, color: "#ffffff", margin: "0 0 8px" }}>
            Subscribe to the Weekly Quantitative Digest
          </h3>
          <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 540, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Receive exclusive expected value breakdowns, tactical deep dives, and mathematical betting guides delivered directly to your inbox every Friday.
          </p>

          {!subscribed ? (
            <form onSubmit={handleSubscribe} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", maxWidth: 500, margin: "0 auto" }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                style={{
                  flex: 1,
                  minWidth: 240,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(10, 13, 34, 0.8)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "#ffffff",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(112, 101, 240, 0.4)",
                  cursor: "pointer",
                }}
              >
                Join Free
              </button>
            </form>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", fontSize: 14, fontWeight: 700 }}>
              <CheckCircle2 style={{ width: 18, height: 18 }} />
              <span>You are subscribed! We will send you our next analytical report.</span>
            </div>
          )}
        </div>

      </main>

      {/* ── Interactive Article Reader Modal ── */}
      {activeArticle && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(6, 8, 20, 0.85)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
          }}
          onClick={() => setActiveArticle(null)}
        >
          <div
            style={{
              background: "linear-gradient(180deg, #151a38 0%, #0c0f24 100%)",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              borderRadius: 20,
              maxWidth: 780,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "36px 32px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.2)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveArticle(null)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>

            {/* Category & Metadata */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: activeArticle.accentBg,
                  color: activeArticle.tagColor,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {activeArticle.category}
              </span>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {activeArticle.date} • {activeArticle.readTime}
              </span>
            </div>

            <h2
              style={{
                fontSize: "clamp(24px, 3.5vw, 32px)",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
                marginBottom: 20,
              }}
            >
              {activeArticle.title}
            </h2>

            {/* Author Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: activeArticle.author.avatarGradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 900,
                }}
              >
                {activeArticle.author.name.slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>{activeArticle.author.name}</div>
                <div style={{ fontSize: 12, color: "#818cf8" }}>{activeArticle.author.role}</div>
              </div>
            </div>

            {/* Main Article Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18, fontSize: 15, lineHeight: 1.75, color: "#cbd5e1", marginBottom: 32 }}>
              {activeArticle.content.map((p, idx) => (
                <p key={idx} style={{ margin: 0 }}>
                  {p}
                </p>
              ))}
            </div>

            {/* Key Takeaways Box */}
            <div
              style={{
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: 14,
                padding: "20px 24px",
                marginBottom: 28,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Target style={{ width: 16, height: 16 }} />
                <span>Executive Summary & Key Takeaways</span>
              </div>
              <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#cbd5e1" }}>
                {activeArticle.keyTakeaways.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Modal Bottom CTA */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, paddingTop: 20, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <Link
                href="/all-matches"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <span>View Today&apos;s Live Matches</span>
                <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>

              <button
                onClick={() => setActiveArticle(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#cbd5e1",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
