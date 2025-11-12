/**
 * Dexie.js database configuration for Sashiko Pattern Designer
 * 
 * This provides:
 * - Better performance with large datasets
 * - Structured querying and indexing
 * - Larger storage capacity (~50MB+)
 * - Future cloud sync capability via Dexie Cloud
 */

import Dexie from 'dexie';

export const db = new Dexie('SashikoPatternDesigner');

// Database schema
db.version(1).stores({
  // Patterns table - stores all saved patterns
  patterns: '++id, name, createdAt, updatedAt, isStarterPattern',
  
  // Settings table - stores user preferences and UI state
  settings: 'key',
  
  // Current pattern - stores the active working pattern (auto-save)
  currentPattern: 'key',
});

// Pattern data model
export class Pattern {
  constructor(data) {
    this.id = data.id;
    this.name = data.name || 'Untitled Pattern';
    this.description = data.description || '';
    this.tileSize = data.tileSize;
    this.gridSize = data.gridSize;
    this.patternTiles = data.patternTiles;
    this.stitches = data.stitches || [];
    this.stitchColors = data.stitchColors || new Map();
    this.uiState = data.uiState || {};
    this.isStarterPattern = data.isStarterPattern || false;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }
}

/**
 * Initialize database
 */
export async function initializeDatabase() {
  try {
    // Open the database
    await db.open();
    console.log('Database opened successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return { success: false, error: error.message };
  }
}

export default db;
