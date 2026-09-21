import { FootballDataProvider } from "./provider";
import { mockFootballProvider } from "./mock-provider";
import { apiFootballProvider } from "./api-provider";
import { bzzoiroFootballProvider } from "./bzzoiro-provider";
import { scraperFootballProvider } from "./scraper-provider";

export * from "./types";
export * from "./provider";
export * from "./mock-provider";
export * from "./api-provider";
export * from "./bzzoiro-provider";
export * from "./scraper-provider";

const providerType = process.env.FOOTBALL_PROVIDER || "nerdytips";

export const footballProvider: FootballDataProvider =
  providerType === "bzzoiro" && process.env.BZZOIRO_API_KEY
    ? bzzoiroFootballProvider
    : providerType === "api-football" && process.env.API_FOOTBALL_KEY
      ? apiFootballProvider
      : providerType === "mock"
        ? mockFootballProvider
        : scraperFootballProvider;

