const REPO = 'org2/repo2';

const TARGET_STARGAZERS = {
  repo: REPO,
  sheetName: 'star',
  topLeft: 'A21',
};

const TARGET_VIEWS = {
  repo: REPO,
  sheetName: 'traffic',
  column: 'A',
};

const TARGET_CLONES = {
  repo: REPO,
  sheetName: 'traffic',
  column: 'E',
};

const TARGET_REFERRERS = {
  repo: REPO,
  sheetName: 'referrer.raw',
  column: 'A',
};

const main = () => {
  updateSheetWithStargazers(TARGET_STARGAZERS);
  updateSheetWithLatestTrafficViews(TARGET_VIEWS);
  updateSheetWithLatestTrafficClones(TARGET_CLONES);
  updateSheetWithLatestTrafficReferrers(TARGET_REFERRERS);
};
