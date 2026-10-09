"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Check,
  Database,
  Globe2,
  Layers,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import styles from "./LandingSections.module.css";

const leagues = [
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Champions League",
  "Europa League",
  "Eredivisie",
  "Championship",
];

const workflow = [
  {
    title: "Collect match data",
    description:
      "xG, team form, player fatigue, team rotation, and match context become structured inputs for each fixture.",
    kind: "data",
  },
  {
    title: "Run the model",
    description:
      "Poisson analysis and 10,000 Monte Carlo simulations estimate likely scorelines and outcomes.",
    kind: "model",
  },
  {
    title: "Compare the markets",
    description:
      "Review 1X2, goals, and BTTS probabilities alongside odds and the model’s confidence.",
    kind: "markets",
  },
];

const plans = [
  {
    name: "Free Starter",
    description: "Explore daily football predictions with standard confidence access.",
    price: "$0",
    features: [
      "Free match predictions",
      "Standard 1X2 predictions",
      "Live scores and match minutes",
      "Public track record access",
    ],
    action: "Browse free picks",
    href: "/all-matches",
    featured: false,
  },
  {
    name: "Premium Pro",
    description: "Full algorithm access, banker tips, and value odds edges.",
    price: "$9.99",
    features: [
      "Banker of the Day access",
      "Monte Carlo probabilities",
      "Value edge alerts",
      "Acca Bet Builder",
      "Verified track record access",
    ],
    action: "View Premium Pro",
    href: "/pricing",
    featured: true,
  },
  {
    name: "VIP Pro",
    description: "Premium access with VIP alerts and priority banker picks.",
    price: "$19.99",
    features: [
      "Everything in Premium Pro",
      "VIP Telegram alerts",
      "Priority banker picks",
      "Accumulator strategy guides",
      "Dedicated VIP support",
    ],
    action: "View VIP Pro",
    href: "/pricing",
    featured: false,
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`${styles.sectionHeading} ${centered ? styles.centered : ""}`}>
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function WorkflowArtwork({ kind }: { kind: string }) {
  if (kind === "data") {
    return (
      <div className={`${styles.workflowArt} ${styles.dataArt}`} aria-hidden="true">
        <div className={styles.dataInputs}>
          <span>xG</span>
          <span>FORM</span>
          <span>TEAM</span>
        </div>
        <div className={styles.dataConnector} />
        <div className={styles.dataCore}>
          <Database size={20} strokeWidth={1.6} />
          <span>FIXTURE</span>
        </div>
      </div>
    );
  }

  if (kind === "model") {
    return (
      <div className={`${styles.workflowArt} ${styles.modelArt}`} aria-hidden="true">
        <div className={styles.modelTopline}>
          <span>10,000 RUNS</span>
          <Activity size={16} />
        </div>
        <div className={styles.modelBars}>
          {[28, 46, 34, 62, 42, 72, 52, 80, 58, 68, 38, 56].map((height, index) => (
            <i key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className={styles.modelAxis}>
          <span>SCENARIO</span>
          <span>OUTCOME RANGE</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.workflowArt} ${styles.marketArt}`} aria-hidden="true">
      <div className={styles.marketNode}>
        <Target size={18} />
        <span>MODEL</span>
      </div>
      <div className={styles.marketLines}>
        <span>1X2</span>
        <span>GOALS</span>
        <span>BTTS</span>
      </div>
      <div className={styles.marketOutput}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function LeagueCoverageStrip() {
  return (
    <section className={styles.leagueStrip} aria-label="Leagues covered">
      <div className={styles.leagueInner}>
        <span className={styles.stripLabel}>LEAGUES IN FOCUS</span>
        <div className={styles.leagueList}>
          {leagues.map((league) => (
            <span className={styles.leagueChip} key={league}>
              <i aria-hidden="true" />
              {league}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrackRecordSection() {
  const milestones = [
    {
      value: "Since 2021",
      title: "A model built around match data",
      description: "JollofTips has developed its own quantitative football prediction model.",
    },
    {
      value: "274,510+",
      title: "Matches simulated",
      description: "Historical match analysis spans 711 leagues.",
    },
    {
      value: "Open record",
      title: "Results stay reviewable",
      description: "Explore graded predictions in the public performance tracker.",
    },
  ];

  return (
    <section className={styles.trackSection}>
      <div className={styles.container}>
        <SectionHeading
          eyebrow="WELCOME TO JOLLOFTIPS"
          title="Our track record since 2021"
          description="A quantitative model, built over time and open for you to explore."
          centered
        />
        <div className={styles.trackGrid}>
          <ol className={styles.timeline}>
            {milestones.map((milestone) => (
              <li key={milestone.value}>
                <span className={styles.timelineValue}>{milestone.value}</span>
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </li>
            ))}
          </ol>

          <div className={styles.modelPanel} aria-label="Illustration of the JollofTips prediction process">
            <div className={styles.panelHeader}>
              <span className={styles.panelDot} />
              <span>JOLLOFTIPS MODEL</span>
              <span className={styles.panelState}>MATCH ANALYSIS</span>
            </div>
            <div className={styles.panelFlow}>
              <div className={styles.panelStage}>
                <span className={styles.stageNumber}>01</span>
                <div>
                  <strong>Match context</strong>
                  <small>xG · team form · odds</small>
                </div>
              </div>
              <div className={styles.panelLink} aria-hidden="true" />
              <div className={`${styles.panelStage} ${styles.panelStageActive}`}>
                <span className={styles.stageNumber}>02</span>
                <div>
                  <strong>10,000 simulations</strong>
                  <small>Monte Carlo · Poisson</small>
                </div>
              </div>
              <div className={styles.panelLink} aria-hidden="true" />
              <div className={styles.marketOutputRow}>
                <span>1X2</span>
                <span>GOALS</span>
                <span>BTTS</span>
              </div>
            </div>
            <p className={styles.panelFootnote}>From match inputs to probability-led picks</p>
          </div>
        </div>
        <div className={styles.trackLinkRow}>
          <span>Explore the public performance tracker</span>
          <Link href="/progress" className={styles.textLink}>
            View the ledger <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ExploreRail() {
  const links = [
    { title: "All matches", href: "/all-matches", icon: Globe2 },
    { title: "How it works", href: "/how-it-works", icon: Layers },
    { title: "Performance tracker", href: "/progress", icon: TrendingUp },
    { title: "VIP plans", href: "/pricing", icon: ShieldCheck },
  ];

  return (
    <nav className={styles.exploreRail} aria-label="Explore JollofTips">
      <div className={styles.exploreInner}>
        <span className={styles.stripLabel}>EXPLORE THE PLATFORM</span>
        <div className={styles.exploreLinks}>
          {links.map(({ title, href, icon: Icon }) => (
            <Link href={href} key={title} className={styles.exploreLink}>
              <Icon size={15} strokeWidth={1.8} />
              <span>{title}</span>
              <ArrowRight size={13} className={styles.exploreArrow} />
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function PredictionsSimpleSection() {
  return (
    <section className={styles.simpleSection}>
      <div className={`${styles.container} ${styles.simpleGrid}`}>
        <div className={styles.simpleCopy}>
          <SectionHeading
            eyebrow="MATCH INTELLIGENCE, MADE CLEAR"
            title="Football predictions made simple"
            description="See the pick, the market, and the match context together. Open a fixture when you want the full analysis."
          />
          <Link href="/all-matches" className={styles.primaryLink}>
            Explore all matches <ArrowRight size={16} />
          </Link>
        </div>
        <div className={styles.simpleFeatures}>
          <article className={styles.simpleFeature}>
            <div className={styles.featureIcon}><Target size={18} /></div>
            <div>
              <h3>Every pick, with context</h3>
              <p>Read probabilities, confidence, and odds beside the fixture they belong to.</p>
            </div>
          </article>
          <article className={styles.simpleFeature}>
            <div className={styles.featureIcon}><Activity size={18} /></div>
            <div>
              <h3>Follow the result</h3>
              <p>Move from upcoming picks to graded matches and the public performance tracker.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function PredictionWorkflowSection() {
  return (
    <section id="how-it-works" className={styles.workflowSection}>
      <div className={styles.container}>
        <SectionHeading
          eyebrow="FROM FIXTURE TO FORECAST"
          title="How our AI football predictions work"
          description="Three stages turn match information into probabilities you can inspect."
          centered
        />
        <div className={styles.workflowGrid}>
          {workflow.map((step, index) => (
            <article className={styles.workflowCard} key={step.title}>
              <WorkflowArtwork kind={step.kind} />
              <div className={styles.workflowCopy}>
                <span className={styles.workflowIndex}>0{index + 1} / 03</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PredictionProofSection() {
  const details = [
    {
      title: "Model probabilities",
      description: "Compare 1X2, goals, and BTTS markets with the model’s confidence for each fixture.",
      action: "Browse predictions",
      href: "/all-matches",
      icon: Target,
    },
    {
      title: "Market context",
      description: "See the selection and available odds together, with value edges surfaced in the analysis.",
      action: "See all matches",
      href: "/all-matches",
      icon: Activity,
    },
    {
      title: "Historical outcomes",
      description: "Review graded picks and the model’s published track record over time.",
      action: "Open performance tracker",
      href: "/progress",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className={styles.proofSection}>
      <div className={styles.container}>
        <SectionHeading
          eyebrow="OPEN BY DESIGN"
          title="See what sits behind every pick"
          description="Explore the predictions, the market details, and the results in the places they belong."
          centered
        />
        <div className={styles.proofGrid}>
          {details.map(({ title, description, action, href, icon: Icon }) => (
            <article className={styles.proofCard} key={title}>
              <div className={styles.proofIcon}><Icon size={17} strokeWidth={1.8} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <Link href={href} className={styles.textLink}>
                {action} <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PlansSection() {
  return (
    <section className={styles.plansSection}>
      <div className={styles.container}>
        <SectionHeading
          eyebrow="SUBSCRIPTION OPTIONS"
          title="Our plans"
          description="Start with free match picks or choose the level of analysis you need."
          centered
        />
        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <article
              className={`${styles.planCard} ${plan.featured ? styles.planFeatured : ""}`}
              key={plan.name}
            >
              {plan.featured && <span className={styles.popularTag}>MOST POPULAR</span>}
              <div>
                <h3>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
                <div className={styles.priceLine}>
                  <strong>{plan.price}</strong>
                  <span>/ month</span>
                </div>
                <ul className={styles.planFeatures}>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={15} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={plan.href}
                className={plan.featured ? styles.primaryLink : styles.secondaryLink}
              >
                {plan.action} <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
