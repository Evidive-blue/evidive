/**
 * Full Test Suite Runner
 *
 * This script:
 * 1. Seeds test accounts (if needed)
 * 2. Runs all E2E tests
 * 3. Generates report
 *
 * Run with: pnpm tsx scripts/run-full-tests.ts
 *
 * Options:
 *   --seed       Force re-seed test accounts
 *   --headed     Run with visible browser
 *   --debug      Run in debug mode
 *   --project    Run specific project (chromium, firefox, webkit)
 */

import { execSync, spawn } from "child_process";
import * as readline from "readline";

const args = process.argv.slice(2);
const shouldSeed = args.includes("--seed");
const isHeaded = args.includes("--headed");
const isDebug = args.includes("--debug");
const project = args.find((a) => a.startsWith("--project="))?.split("=")[1];

function log(message: string, type: "info" | "success" | "error" | "warning" = "info") {
  const icons = {
    info: "ℹ️",
    success: "✅",
    error: "❌",
    warning: "⚠️",
  };
  console.log(`${icons[type]} ${message}`);
}

function runCommand(command: string, description: string): boolean {
  log(`${description}...`, "info");
  try {
    execSync(command, { stdio: "inherit" });
    log(`${description} completed`, "success");
    return true;
  } catch (error) {
    log(`${description} failed`, "error");
    return false;
  }
}

async function askQuestion(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function main() {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           EviDive Full E2E Test Suite Runner                 ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Step 1: Seed test accounts if requested
  if (shouldSeed) {
    log("Seeding test accounts...", "info");
    if (!runCommand("pnpm tsx scripts/seed-test-accounts.ts", "Seed test accounts")) {
      log("Failed to seed test accounts. Continue anyway? (y/n)", "warning");
      const continueAnyway = await askQuestion("Continue without seeding?");
      if (!continueAnyway) {
        process.exit(1);
      }
    }
  }

  // Step 2: Check if dev server is running
  log("Checking if dev server is running...", "info");
  try {
    const response = await fetch("http://localhost:3000");
    if (response.ok) {
      log("Dev server is running", "success");
    }
  } catch {
    log("Dev server not detected. Playwright will start it automatically.", "warning");
  }

  // Step 3: Build playwright command
  let playwrightCommand = "pnpm playwright test";

  if (isHeaded) {
    playwrightCommand += " --headed";
  }

  if (isDebug) {
    playwrightCommand += " --debug";
  }

  if (project) {
    playwrightCommand += ` --project=${project}`;
  }

  // Step 4: Run tests
  console.log("\n");
  log("Running E2E tests...", "info");
  console.log(`Command: ${playwrightCommand}`);
  console.log("\n");

  const testProcess = spawn(playwrightCommand, {
    shell: true,
    stdio: "inherit",
  });

  testProcess.on("close", (code) => {
    console.log("\n");

    if (code === 0) {
      log("All tests passed!", "success");
    } else {
      log(`Tests completed with ${code} failures`, "error");
    }

    // Step 5: Generate summary
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                         Test Summary                           ");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("\n");

    log("Results saved to: test-results/", "info");
    log("View HTML report: pnpm test:e2e:report", "info");
    log("Screenshots: test-results/*.png", "info");

    console.log("\n");

    process.exit(code || 0);
  });
}

main().catch((error) => {
  log(`Unexpected error: ${error}`, "error");
  process.exit(1);
});
