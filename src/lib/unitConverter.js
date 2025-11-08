/**
 * Unit conversion utilities for converting between pixels (px), millimeters (mm), and centimeters (cm)
 * 
 * Standard web/print DPI: 96 DPI (dots per inch)
 * 1 inch = 25.4 mm = 2.54 cm
 * Therefore: 1 px = 25.4 / 96 mm ≈ 0.264583 mm
 *           1 px = 2.54 / 96 cm ≈ 0.0264583 cm
 */

const PX_TO_MM_RATIO = 25.4 / 96; // ~0.264583
const MM_TO_PX_RATIO = 96 / 25.4; // ~3.7795
const PX_TO_CM_RATIO = 2.54 / 96; // ~0.0264583
const CM_TO_PX_RATIO = 96 / 2.54; // ~37.795

/**
 * Convert pixels to millimeters
 * @param {number} px - Value in pixels
 * @param {number} precision - Number of decimal places (default: 1)
 * @returns {number} Value in millimeters
 */
export function pxToMm(px, precision = 1) {
  const mm = px * PX_TO_MM_RATIO;
  return Number(mm.toFixed(precision));
}

/**
 * Convert millimeters to pixels
 * @param {number} mm - Value in millimeters
 * @param {boolean} round - Whether to round to nearest integer (default: true)
 * @returns {number} Value in pixels
 */
export function mmToPx(mm, round = true) {
  const px = mm * MM_TO_PX_RATIO;
  return round ? Math.round(px) : px;
}

/**
 * Convert pixels to centimeters
 * @param {number} px - Value in pixels
 * @param {number} precision - Number of decimal places (default: 1)
 * @returns {number} Value in centimeters
 */
export function pxToCm(px, precision = 1) {
  const cm = px * PX_TO_CM_RATIO;
  return Number(cm.toFixed(precision));
}

/**
 * Convert centimeters to pixels
 * @param {number} cm - Value in centimeters
 * @param {boolean} round - Whether to round to nearest integer (default: true)
 * @returns {number} Value in pixels
 */
export function cmToPx(cm, round = true) {
  const px = cm * CM_TO_PX_RATIO;
  return round ? Math.round(px) : px;
}

/**
 * Format a pixel value for display based on current unit preference
 * @param {number} px - Value in pixels
 * @param {'px'|'mm'|'cm'} unit - Target display unit
 * @param {number} precision - Decimal places for mm/cm (default: 1)
 * @returns {string} Formatted string with unit suffix
 */
export function formatValue(px, unit = 'px', precision) {
  if (unit === 'mm') {
    return `${pxToMm(px, precision ?? 1)}mm`;
  }
  if (unit === 'cm') {
    return `${pxToCm(px, precision ?? 1)}cm`;
  }
  return `${px}px`;
}

/**
 * Format a value without unit suffix for input fields
 * @param {number} px - Value in pixels
 * @param {'px'|'mm'|'cm'} unit - Target display unit
 * @param {number} precision - Decimal places for mm/cm (default: 1)
 * @returns {number} Value in selected unit
 */
export function formatValueNumber(px, unit = 'px', precision) {
  if (unit === 'mm') {
    return pxToMm(px, precision ?? 1);
  }
  if (unit === 'cm') {
    return pxToCm(px, precision ?? 1);
  }
  return px;
}

/**
 * Parse user input and convert to pixels
 * @param {string|number} value - User input value
 * @param {'px'|'mm'|'cm'} unit - Current unit being displayed
 * @returns {number} Value in pixels
 */
export function parseValueToPx(value, unit = 'px') {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 0;
  }
  
  if (unit === 'mm') {
    return mmToPx(numValue, true);
  }
  
  if (unit === 'cm') {
    return cmToPx(numValue, true);
  }
  
  return Math.round(numValue);
}

/**
 * Get appropriate min/max/step values for an input based on unit
 * @param {'px'|'mm'|'cm'} unit - Current display unit
 * @param {object} pxConstraints - Constraints in pixels {min, max, step}
 * @returns {object} Constraints in display unit {min, max, step}
 */
export function getInputConstraints(unit, pxConstraints) {
  const { min = 1, max = 100, step = 1 } = pxConstraints;
  
  if (unit === 'mm') {
    return {
      min: pxToMm(min, 1),
      max: pxToMm(max, 1),
      step: pxToMm(step, 1),
    };
  }
  
  if (unit === 'cm') {
    return {
      min: pxToCm(min, 2),
      max: pxToCm(max, 2),
      step: 0.1, // Use 0.1cm step for better slider usability
    };
  }
  
  return { min, max, step };
}

/**
 * Supported display units
 */
export const UNITS = {
  PX: 'px',
  MM: 'mm',
  CM: 'cm',
};

/**
 * Unit display labels
 */
export const UNIT_LABELS = {
  [UNITS.PX]: 'Pixels',
  [UNITS.MM]: 'Millimeters',
  [UNITS.CM]: 'Centimeters',
};

/**
 * Default unit preference
 */
export const DEFAULT_UNIT = UNITS.PX;
