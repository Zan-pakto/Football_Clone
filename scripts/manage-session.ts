import dotenv from "dotenv";
dotenv.config();

import { NerdyTipsAuthManager } from "../lib/scraper/auth";

async function main() {
  const action = process.argv[2] || "status";

  if (action === "login") {
    console.log("Logging in...");
    const username = process.env.NERDYTIPS_USERNAME || process.env.NERDYTIPS_EMAIL;
    const password = process.env.NERDYTIPS_PASSWORD;
    if (!username || !password) {
      console.error("Missing NERDYTIPS_USERNAME or NERDYTIPS_PASSWORD in .env");
      return;
    }
    const cookie = await NerdyTipsAuthManager.performLogin(username, password);
    console.log("Logged in! Saved cookie:", cookie);
  } else if (action === "logout") {
    console.log("Logging out...");
    const success = await NerdyTipsAuthManager.logout();
    console.log("Logout result:", success ? "SUCCESS" : "FAILED");
  } else {
    console.log("Current status:");
    console.log("NERDYTIPS_COOKIE in process.env:", process.env.NERDYTIPS_COOKIE ? "PRESENT" : "EMPTY");
    console.log("To log in:  npx tsx scripts/manage-session.ts login");
    console.log("To log out: npx tsx scripts/manage-session.ts logout");
  }
}

main();
