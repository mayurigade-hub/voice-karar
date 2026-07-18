import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AgreementStructuredData } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, "db.json");

export interface SavedAgreement {
  id: string;
  transcript: string;
  detected_language: string;
  structured_data: AgreementStructuredData;
  missing_fields: string[];
  agreement: string;
  output_language: string;
  created_at: string;
}

const LOCK_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 Hours

/**
 * Loads all agreements from the local db.json file
 */
export function loadAgreements(): Record<string, SavedAgreement> {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      return {};
    }
    const rawData = fs.readFileSync(DB_FILE_PATH, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Failed to read from JSON DB, returning empty state:", error);
    return {};
  }
}

/**
 * Saves a single agreement to the JSON file
 */
export function saveAgreement(agreement: SavedAgreement): void {
  try {
    const db = loadAgreements();
    db[agreement.id] = agreement;
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to save agreement to JSON DB:", error);
    throw new Error("Internal database save operation failed.");
  }
}

/**
 * Checks if the agreement editing window is closed (Locked after 24 hours)
 */
export function isAgreementLocked(agreement: SavedAgreement): { locked: boolean; timeRemainingMs: number } {
  const createdAtTime = new Date(agreement.created_at).getTime();
  const timeElapsed = Date.now() - createdAtTime;
  const timeRemainingMs = Math.max(0, LOCK_PERIOD_MS - timeElapsed);
  return {
    locked: timeElapsed > LOCK_PERIOD_MS,
    timeRemainingMs
  };
}
