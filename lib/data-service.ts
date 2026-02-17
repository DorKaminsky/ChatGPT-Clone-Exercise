import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';
import type { DataColumn, DataSchema, ParsedData } from './types.js';

// Global data store that persists across hot reloads
const globalDataStore = globalThis as typeof globalThis & {
  __dataStore?: Map<string, ParsedData>;
};

if (!globalDataStore.__dataStore) {
  globalDataStore.__dataStore = new Map();
}

/**
 * In-memory data storage and parsing service
 */
class DataService {
  private dataStore: Map<string, ParsedData> = globalDataStore.__dataStore!;

  /**
   * Parse Excel file buffer and infer column types
   */
  parseExcelFile(buffer: Buffer, fileName: string): ParsedData {
    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false, // Don't use raw values, format dates/numbers
      defval: null // Use null for empty cells
    });

    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in Excel file');
    }

    // Extract column names from first row
    const columnNames = Object.keys(rawData[0]);

    // Infer column types by sampling data
    const columns: DataColumn[] = columnNames.map(name => {
      const samples = rawData
        .slice(0, Math.min(100, rawData.length)) // Sample first 100 rows
        .map(row => row[name])
        .filter(val => val !== null && val !== undefined && val !== '');

      const type = this.inferColumnType(samples);
      const sampleValues = samples.slice(0, 3); // Keep first 3 samples

      return {
        name,
        type,
        sample: sampleValues
      };
    });

    // Create schema
    const schema: DataSchema = {
      columns,
      rowCount: rawData.length
    };

    // Generate unique ID
    const id = randomUUID();

    // Create preview (first 5 rows)
    const preview = rawData.slice(0, 5);

    const parsedData: ParsedData = {
      id,
      fileName,
      schema,
      data: rawData,
      preview
    };

    return parsedData;
  }

  /**
   * Infer column type from sample values
   */
  private inferColumnType(samples: any[]): 'string' | 'number' | 'date' | 'boolean' {
    if (samples.length === 0) {
      return 'string';
    }

    // Check for booleans
    const booleanCount = samples.filter(val =>
      typeof val === 'boolean' ||
      val === 'true' ||
      val === 'false' ||
      val === 'TRUE' ||
      val === 'FALSE' ||
      val === 'yes' ||
      val === 'no' ||
      val === 'YES' ||
      val === 'NO'
    ).length;

    if (booleanCount / samples.length > 0.8) {
      return 'boolean';
    }

    // Check for numbers
    const numberCount = samples.filter(val => {
      if (typeof val === 'number') return true;
      if (typeof val === 'string') {
        // Remove common number formatting
        const cleaned = val.replace(/[$,\s%]/g, '');
        return !isNaN(parseFloat(cleaned)) && isFinite(cleaned as any);
      }
      return false;
    }).length;

    if (numberCount / samples.length > 0.8) {
      return 'number';
    }

    // Check for dates
    const dateCount = samples.filter(val => {
      if (val instanceof Date) return true;
      if (typeof val === 'string') {
        // Try to parse as date
        const parsed = new Date(val);
        return !isNaN(parsed.getTime()) && val.match(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/);
      }
      return false;
    }).length;

    if (dateCount / samples.length > 0.8) {
      return 'date';
    }

    // Default to string
    return 'string';
  }

  /**
   * Store parsed data in memory
   */
  storeData(parsedData: ParsedData): string {
    this.dataStore.set(parsedData.id, parsedData);
    return parsedData.id;
  }

  /**
   * Retrieve data by ID
   */
  getData(id: string): ParsedData | undefined {
    return this.dataStore.get(id);
  }

  /**
   * Get all stored data sources (useful for debugging)
   */
  getAllDataSources(): ParsedData[] {
    return Array.from(this.dataStore.values());
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    this.dataStore.clear();
  }

  /**
   * Delete specific data source
   */
  deleteData(id: string): boolean {
    return this.dataStore.delete(id);
  }
}

// Singleton instance
export const dataService = new DataService();
