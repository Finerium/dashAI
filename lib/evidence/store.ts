import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ViolationEvent } from "./types";

/**
 * Local-first evidence store (IndexedDB). dashAI keeps the owner's evidence on
 * their own device by default — a privacy-by-design choice. The server only ever
 * sees a payload when the user explicitly seals/reports an event.
 */
interface DashAIDB extends DBSchema {
  events: {
    key: string;
    value: ViolationEvent;
    indexes: { "by-time": number };
  };
}

let dbPromise: Promise<IDBPDatabase<DashAIDB>> | null = null;

function getDb(): Promise<IDBPDatabase<DashAIDB>> | null {
  if (typeof indexedDB === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<DashAIDB>("dashai", 1, {
      upgrade(db) {
        const store = db.createObjectStore("events", { keyPath: "id" });
        store.createIndex("by-time", "capturedAt");
      },
    });
  }
  return dbPromise;
}

export async function saveEvent(e: ViolationEvent): Promise<void> {
  const db = getDb();
  if (!db) return;
  await (await db).put("events", e);
}

export async function getAllEvents(): Promise<ViolationEvent[]> {
  const db = getDb();
  if (!db) return [];
  const all = await (await db).getAllFromIndex("events", "by-time");
  return all.reverse(); // newest first
}

export async function getEvent(id: string): Promise<ViolationEvent | undefined> {
  const db = getDb();
  if (!db) return undefined;
  return (await db).get("events", id);
}

export async function deleteEvent(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await (await db).delete("events", id);
}

export async function clearEvents(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await (await db).clear("events");
}
