/**
 * Update Google Sheet with latest traffic views
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @param {string} sheetName - (e.g., 'traffic')
 * @param {string} column - (e.g., 'A')
 * @return {void}
 */
const updateSheetWithLatestTrafficViews = ({repo, sheetName, column} = {}) => {
  console.log('type: traffic views');
  const trafficViews = gitHubGetTrafficViews(repo);
  const normalized = _normalizeTrafficData(trafficViews.views);
  const fixed = _applyWorkaround(normalized);
  _updateSheetWithTrafficData({trafficData: fixed, sheetName, column});
};

/**
 * Update Google Sheet with latest traffic clones
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @param {string} sheetName - (e.g., 'traffic')
 * @param {string} column - (e.g., 'E')
 * @return {void}
 */
const updateSheetWithLatestTrafficClones = ({repo, sheetName, column} = {}) => {
  console.log('type: traffic clones');
  const trafficClones = gitHubGetTrafficClones(repo);
  const normalized = _normalizeTrafficData(trafficClones.clones);
  const fixed = _applyWorkaround(normalized);
  _updateSheetWithTrafficData({trafficData: fixed, sheetName, column});
};

/**
 * Update Google Sheet with latest traffic referrers
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @param {string} sheetName - (e.g., 'referrer.raw')
 * @param {string} column - (e.g., 'A')
 * @return {void}
 */
const updateSheetWithLatestTrafficReferrers = ({repo, sheetName, column} = {}) => {
  console.log('type: traffic referrers');
  const trafficReferrers = gitHubGetTrafficReferrers(repo);

  if (trafficReferrers.length == 0) {
    console.log('traffic referrers is empty.');
    return;
  }

  _updateSheetWithTrafficReferrers({trafficReferrers, sheetName, column});
};

// The following are private functions:

/**
 * Update Google Sheet with latest traffic views or clones
 *
 * @param {Array.<{date: Date, count: number, uniques: number}>} trafficData
 * @param {string} sheetName - (e.g., 'traffic')
 * @param {string} column - (e.g., 'E')
 * @return {void}
 */
const _updateSheetWithTrafficData = ({trafficData, sheetName, column} = {}) => {
  if (trafficData.length == 0) {
    console.log('traffic data is empty.');
    return;
  }

  const earliestDate = _getEarliestDate(trafficData);
  const blankData = _buildBlankData(earliestDate);
  const completeData = _mergeActualAndBlank(trafficData, blankData);
  const twoDArray = _convertTrafficDataTo2DArray(completeData);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const topLeftRange = vlookupWithDateOrEmpty({sheet, column, targetDate: earliestDate});
  const targetRange = getTargetRange({sheet, topLeftRange, rangeData: twoDArray});

  console.log(`topLeft: ${topLeftRange.getA1Notation()}`);
  _consoleLogTwoDArrayForTrafficData(twoDArray);

  targetRange.setValues(twoDArray);
};

/**
 * Update Google Sheet with latest traffic referrers
 *
 * @param {Array.<{referrer: string, count: number, uniques: number}>} trafficReferrers
 * @param {string} sheetName - (e.g., 'referrer.raw')
 * @param {string} column - (e.g., 'E')
 * @return {void}
 */
const _updateSheetWithTrafficReferrers = ({trafficReferrers, sheetName, column} = {}) => {
  const today = new Date();
  const normalized = _normalizeTrafficReferrers({data: trafficReferrers, targetDate: today});
  const twoDArray = _convertTrafficReferrersTo2DArray(normalized);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const topLeftRange = vlookupWithDateOrEmpty({sheet, column, targetDate: today});
  const numCols = twoDArray[0].length;
  clearColumnsFromTopLeft({sheet, topLeftRange, numCols});

  console.log(`topLeft: ${topLeftRange.getA1Notation()}`);
  _consoleLogTwoDArrayForTrafficReferrers(twoDArray);

  const targetRange = getTargetRange({sheet, topLeftRange, rangeData: twoDArray});
  targetRange.setValues(twoDArray);
};

/**
 * Normalize Traffic views or clones retrieved from GitHub
 *
 * @param {Array.<{timestamp: string, count: number, uniques: number}>} data
 * @return {Array.<{date: Date, count: number, uniques: number}>}
 */
const _normalizeTrafficData = (data) => {
  return data.map((item) => ({
    date: new Date(item.timestamp),
    count: item.count,
    uniques: item.uniques,
  }));
};

/**
 * Normalize Traffic referrers retrieved from GitHub
 *
 * @param {Array.<{referrer: string, count: number, uniques: number}>} data
 * @param {Date} targetDate
 * @return {Array.<{date: Date, referrer: string, count: number, uniques: number}>}
 */
const _normalizeTrafficReferrers = ({data, targetDate} = {}) => {
  return data.map((item) => ({
    date: targetDate,
    referrer: item.referrer,
    count: item.count,
    uniques: item.uniques,
  }));
};

/**
 * Apply workaround
 *
 * Of the 14 days of data, since GitHub returns the value of the oldest date to be smaller,
 * we will fall on the safe side and use only the data from the last 10 days.
 *
 * @param {Array.<{date: Date, count: number, uniques: number}>} data - Data for 14 days
 * @return {Array.<{date: Date, count: number, uniques: number}>} Data for the last 10 days
 *
 * @description
 * I contacted GitHub support and received the following reply:
 * > Our engineers have stated the API is no longer under active development, and internally is in a "keep the lights
 * > on" (KTLO) state. This means that the only items that are likely to be worked on are those related to security,
 * > critical bugs or those prioritised for other reasons. For now, that unfortunately means this will be more a long
 * > term fix; however, we simply can't state an ETA on when that'll occur.
 */
const _applyWorkaround = (data) => {
  if (data.length === 0) {
    return data;
  }

  const retainDays = 10;

  const retainDate = new Date();
  retainDate.setDate(retainDate.getDate() - retainDays);

  return data.filter((item) => {
    const isRetained = item.date >= retainDate;

    if (!isRetained) {
      console.log(`[Workaround] Delete {date: ${formatDate(item.date)}, count: ${item.count}, uniques: ${item.uniques}} from traffic data`);
    }

    return isRetained;
  });
};

/**
 * Merge actual data and blank data
 *
 * @param {Array.<{date: Date, count: number, uniques: number}>} actual
 * @param {Array.<{date: Date, count: 0, uniques: 0}>} blank
 * @return {Array.<{date: Date, count: number, uniques: number}>}
 */
const _mergeActualAndBlank = (actual, blank) => {
  return blank.map((blankItem) => {
    // Find data matching date in `actual`
    const actualItem = actual.find((a) => a.date.toDateString() === blankItem.date.toDateString());
    // If `actual` data is available, it is given priority; otherwise, `blank` data is used.
    return actualItem || blankItem;
  });
};

/**
 * Get earliest date
 *
 * @param {Array.<{date: Date, count: number, uniques: number}>} data
 * @return {Date}
 */
const _getEarliestDate = (data) => {
  return new Date(
    data.reduce(
      (first, current) => current.date < first ? current.date : first,
      data[0].date
    )
  );
};

/**
 * Build blank data
 *
 * @param {Date} inStartDate
 * @return {Array.<{date: Date, count: 0, uniques: 0}>}
 */
const _buildBlankData = (inStartDate) => {
  const result = [];
  const today = new Date();
  const startDate = new Date(inStartDate); // Don't let the argument values change

  for (let i = startDate; i < today; i.setDate(i.getDate() + 1)) {
    result.push({ date: new Date(i), count: 0, uniques: 0 });
  }

  return result;
};

/**
 * Converts an array of Traffic views or clones to a 2D array
 *
 * @param {Array.<{date: Date, count: number, uniques: number}>} inputData
 * @return {[Date, number, number][]} - 2D array with values from input objects
 */
const _convertTrafficDataTo2DArray = (inputData) => {
  return inputData.map(({ date, count, uniques }) => [date, count, uniques]);
};

/**
 * Converts an array of Traffic referrers to a 2D array
 *
 * @param {Array.<{date: Date, referrer: string, count: number, uniques: number}>} inputData
 * @return {[Date, string, number, number][]} - 2D array with values from input objects
 */
const _convertTrafficReferrersTo2DArray = (inputData) => {
  return inputData.map(({ date, referrer, count, uniques }) => [date, referrer, count, uniques]);
};

/**
 * console.log the 2D array of traffice views or clones
 *
 * @param {[Date, number, number][]} twoDArray - 2D array with values
 * @return {void}
 */
const _consoleLogTwoDArrayForTrafficData = (twoDArray) => {
  twoDArray.forEach((row) => {
    const [date, count, uniques] = row;
    console.log(`[Write] date: ${formatDate(date)}, count: ${count}, uniques: ${uniques}`);
  });
};

/**
 * console.log the 2D array of traffice referrers
 *
 * @param {[Date, string, number, number][]} twoDArray
 * @return {void}
 */
const _consoleLogTwoDArrayForTrafficReferrers = (twoDArray) => {
  twoDArray.forEach((row) => {
    const [date, referrer, count, uniques] = row;
    console.log(`[Write] date: ${formatDate(date)}, referrer: ${referrer}, count: ${count}, uniques: ${uniques}`);
  });
};
