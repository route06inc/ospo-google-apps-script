/**
 * Clear the specified number of columns to the bottom of the sheet based on "topLeftRange"
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet where the range is located (e.g., the sheet of 'referrer.raw')
 * @param {GoogleAppsScript.Spreadsheet.Range} topLeftRange - The range of the top-left cell (e.g., the range of 'A29')
 * @param {number} numCols - Number of columns to clear
 * @return {void}
 */
const clearColumnsFromTopLeft = ({sheet, topLeftRange, numCols} = {}) => {
  const startRow = topLeftRange.getRow();
  const startColumn = topLeftRange.getColumn();
  const numRows = sheet.getMaxRows() - startRow + 1;

  const range = sheet.getRange(startRow, startColumn, numRows, numCols);
  console.log(`[Clear] ${range.getA1Notation()}`);
  range.clearContent();
};

/**
 * Format date to the date string "YYYY-MM-DD"
 *
 * @param {Date} date
 * @return {string} - "YYYY-MM-DD"
 */
const formatDate = (date) => date.toISOString().split('T')[0];

/**
 * Get next row (line) of the cell
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - target sheet (e.g., the 'star' sheet)
 * @param {string} cell - e.g., 'A21'
 * @return {string} e.g, 'A22'
 */
const getNextRow = ({sheet, cell} = {}) => {
  const range = sheet.getRange(cell);
  return sheet.getRange(range.getRow() + 1, range.getColumn()).getA1Notation();
};

/**
 * Returns a range object starting from the given top-left cell, sized to fit the specified values
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet where the range is located (e.g., the sheet of 'giselle')
 * @param {GoogleAppsScript.Spreadsheet.Range} topLeftRange - The range of the top-left cell (e.g., the range of 'A29')
 * @param {[Date, number, number][]} rangeData - The data to determine the range size
 * @return {GoogleAppsScript.Spreadsheet.Range} The calculated range
 */
const getTargetRange = ({sheet, topLeftRange, rangeData} = {}) => {
  const numRows = rangeData.length;
  const numCols = rangeData[0].length;

  return sheet.getRange(topLeftRange.getA1Notation()).offset(0, 0, numRows, numCols);
};

/**
 * Searches the specified column vertically and returns cell matching the specified date.
 * If not found, returns the cell of the last row that has content.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet where the range is located (e.g., 'traffic' sheet)
 * @param {string} column - (e.g., 'A')
 * @param {Date} targetDate
 * @return {GoogleAppsScript.Spreadsheet.Range} - (e.g., the range of 'A31')
 */
const vlookupWithDateOrEmpty = ({sheet, column, targetDate} = {}) => {
  const values = sheet.getRange(`${column}:${column}`).getValues();

  const findRowIndex = values.findIndex((row) => {
    return row[0] instanceof Date
      && row[0].toDateString() === targetDate.toDateString();
  });

  const resultRowIndex = findRowIndex == -1 ? sheet.getLastRow() : findRowIndex;

  return sheet.getRange(`${column}${resultRowIndex + 1}`);
};

