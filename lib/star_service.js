/**
 * Update Google Sheet with the all stargazers of repository
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @param {string} sheetName - (e.g., 'star')
 * @param {string} topLeft - Top left cell of the range to be updated (e.g., 'A22')
 * @return {void}
 */
const updateSheetWithStargazers = ({repo, sheetName, topLeft} = {}) => {
  console.log('type: stargazers');
  console.log(`topLeft: ${topLeft}`);

  const stargazers = gitHubGetStargazers({repo});

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  _clearRangeForStargazers({sheet, topLeft});

  _insertHeaderForStargazers({sheet, topLeft});
  const nextTopLeft = getNextRow({sheet, cell: topLeft});

  _insertBodyForStargazers({sheet, topLeft: nextTopLeft, stargazers});
};

// The following are private functions:

/**
 * Clear the column specified by "topLeft" and the column to the right of it.
 * For example, if "A21" is specified by topLeft, the column "A:B" is cleared.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - target sheet (e.g., the 'star' sheet)
 * @param {string} topLeft - Top left cell to set the header of Stargazers (e.g., 'A21')
 * @return {void}
 */
const _clearRangeForStargazers = ({sheet, topLeft} = {}) => {
  const startColumn = topLeft.replace(/\d/g, ''); // e.g., 'A21' -> 'A'

  const topLeftRange = sheet.getRange(topLeft);
  const colIndex = topLeftRange.getColumn();
  const endColumn = sheet.getRange(1, colIndex + 1).getA1Notation().replace(/\d/g, ''); // e.g., 'A' -> 'B'

  console.log(`[Clear] ${startColumn}:${endColumn}`);
  sheet.getRange(`${startColumn}:${endColumn}`).clearContent();
};

/**
 * Set header to the Google Sheet for Stargazers
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - target sheet (e.g., the 'star' sheet)
 * @param {string} topLeft - Top left cell to set the header of Stargazers (e.g., 'A21')
 * @return {void}
 */
const _insertHeaderForStargazers = ({sheet, topLeft} = {}) => {
  const topLeftRange = sheet.getRange(topLeft);
  const range = sheet.getRange(topLeftRange.getRow(), topLeftRange.getColumn(), 1, 2); // e.g, 'A21:B21'
  range.setValues([['Date (UTC)', 'User']]);
};

/**
 * Set header to the Google Sheet for Stargazers
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - target sheet (e.g., the 'star' sheet)
 * @param {string} topLeft - Top left cell to set the header of Stargazers (e.g., 'A21')
 * @param {Object[]} stargazers - Stargazers retrieved from GitHub API
 * @return {void}
 */
const _insertBodyForStargazers = ({sheet, topLeft, stargazers} = {}) => {
  const normalized = _normalizeStargazers(stargazers);
  const twoDArray = _convertTo2DArrayForStargazers(normalized);
  const range = getTargetRange({sheet, topLeftRange: sheet.getRange(topLeft), rangeData: twoDArray});

  _consoleLogTwoDArrayForStargazers(twoDArray);
  range.setValues(twoDArray);
};

/**
 * Normalize Stargazers data retrieved from GitHub
 *
 * @param {Object[]} data
 * @return {Array.<{starred_at: string, user: string}>}
 */
const _normalizeStargazers = (data) => {
  return data.map((item) => ({
    starred_at: formatDate(new Date(item.starred_at)), // 'YYYY-MM-DD'
    user: item.user.login,
  }));
};

/**
 * Converts an array of objects to a 2D array
 *
 * @param {Array.<{starred_at: string, user: string}>} data
 * @return {[string, string][]} - 2D array with values from input objects
 */
const _convertTo2DArrayForStargazers = (data) => {
  return data.map(({ starred_at, user }) => [starred_at, user]);
};

/**
 * console.log the 2D array with values
 *
 * @param {[string, string][]} twoDArray - 2D array with values
 * @return {void}
 */
const _consoleLogTwoDArrayForStargazers = (twoDArray) => {
  twoDArray.forEach((row) => {
    const [starred_at, user] = row;
    console.log(`[Write] starred_at: ${starred_at}, user: ${user}`);
  });
};
