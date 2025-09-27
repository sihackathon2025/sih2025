// android/lib/database.js

import * as SQLite from 'expo-sqlite/next';

const db = SQLite.openDatabaseSync('healthreports.db');

export const initDatabase = async () => {
  try {
    // Table for caching reports fetched from the server
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY NOT NULL,
        patient_name TEXT NOT NULL,
        age INTEGER,
        symptoms TEXT,
        severity TEXT,
        date_of_reporting TEXT,
        water_source TEXT
      );
    `);

    // Table for storing new reports created while offline
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payload TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0
      );
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error", error);
  }
};

// --- Functions for Cached Reports ---

export const saveReportsToCache = async (reports) => {
  try {
    // Clear old cache
    await db.runAsync('DELETE FROM reports');
    
    // Using a transaction for performance
    await db.withTransactionAsync(async () => {
      for (const report of reports) {
        // Use the report ID from the server as the primary key
        await db.runAsync(
          'INSERT INTO reports (id, patient_name, age, symptoms, severity, date_of_reporting, water_source) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [report.report_id, report.patient_name, report.age, report.symptoms, report.severity, report.date_of_reporting, report.water_source]
        );
      }
    });
  } catch (error) {
    console.error("Error saving reports to cache", error);
  }
};

export const getCachedReports = async () => {
  try {
    const allRows = await db.getAllAsync('SELECT * FROM reports ORDER BY date_of_reporting DESC');
    return allRows;
  } catch (error) {
    console.error("Error getting cached reports", error);
    return [];
  }
};

// --- Functions for Offline Outbox ---

export const saveReportToOutbox = async (reportData) => {
  try {
    const payload = JSON.stringify(reportData);
    await db.runAsync('INSERT INTO outbox (payload, is_synced) VALUES (?, 0)', [payload]);
    console.log("Report saved to outbox for syncing later.");
  } catch (error) {
    console.error("Error saving report to outbox", error);
  }
};

export const getPendingReports = async () => {
  try {
    const pending = await db.getAllAsync('SELECT * FROM outbox WHERE is_synced = 0');
    return pending;
  } catch (error) {
    console.error("Error getting pending reports", error);
    return [];
  }
};

export const markReportAsSynced = async (id) => {
  try {
    await db.runAsync('DELETE FROM outbox WHERE id = ?', [id]);
    console.log(`Synced and removed report ${id} from outbox.`);
  } catch (error) {
    console.error("Error marking report as synced", error);
  }
};