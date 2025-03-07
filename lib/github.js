const GITHUB_APP_ID = PropertiesService.getScriptProperties().getProperty('GITHUB_APP_ID');
const GITHUB_APP_PRIVATE_KEY = PropertiesService.getScriptProperties().getProperty('GITHUB_APP_PRIVATE_KEY');

/**
 * Get stargazers
 *
 * Recursively retrieves all Stargazers for a given GitHub repository.
 * Supports GitHub API pagination, fetching 100 stargazers per request.
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @param {string} page - [optional] The current page number (default: 1, used for recursion)
 * @param {Object[]} allStargazers - [optional] Accumulated list of stargazers (default: [], used for recursion)
 * @return {Object[]}
 * @see https://docs.github.com/rest/activity/starring?apiVersion=2022-11-28#list-stargazers
 */
const gitHubGetStargazers = ({repo, page = 1, stargazers = []} = {}) => {
  const response = _gitHubApiGet({
    repo: repo,
    path: `/repos/${repo}/stargazers?per_page=100&page=${page}`,
    accept: 'application/vnd.github.star+json', // for including a timestamp of when the star was created.
  });

  if (!response || response.length === 0) {
    return stargazers;
  }

  return gitHubGetStargazers({repo, page: page + 1, stargazers: stargazers.concat(response)});
};

/**
 * Get traffic views
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @return {Object}
 * @see https://docs.github.com/rest/metrics/traffic?apiVersion=2022-11-28#get-page-views
 */
const gitHubGetTrafficViews = (repo) => {
  return _gitHubApiGet({
    repo: repo,
    path: `/repos/${repo}/traffic/views`,
  });
};

/**
 * Get traffic clones
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @return {Object}
 * @see https://docs.github.com/rest/metrics/traffic?apiVersion=2022-11-28#get-repository-clones
 */
const gitHubGetTrafficClones = (repo) => {
  return _gitHubApiGet({
    repo: repo,
    path: `/repos/${repo}/traffic/clones`,
  });
};

/**
 * Get top referral sources
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @return {Object}
 * @see https://docs.github.com/rest/metrics/traffic?apiVersion=2022-11-28#get-top-referral-sources
 */
const gitHubGetTrafficReferrers = (repo) => {
  return _gitHubApiGet({
    repo: repo,
    path: `/repos/${repo}/traffic/popular/referrers`,
  });
};

// The following are private functions:

/**
 * Call [GET] GitHub API
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @param {string} path - the API path (e.g., /repos/giselles-ai/giselle/traffic/views)
 * @param {string} accept - [optional] 'Accept' field in request header (default: 'application/vnd.github+json')
 * @return {Object}
 */
const _gitHubApiGet = ({repo, path, accept = 'application/vnd.github+json'} = {}) => {
  const token = _createGitHubAppToken(repo);

  console.log(`[GET] ${path}`);

  const response = UrlFetchApp.fetch(
    `https://api.github.com${path}`,
    {
      method: 'GET',
      headers: {
        'Accept': accept,
        'Authorization': `token ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  return JSON.parse(response);
};

/**
 * Create GitHub App installation access token
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @return {string}
 * @see https://docs.github.com/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
 * @see https://docs.github.com/rest/apps/apps?apiVersion=2022-11-28#create-an-installation-access-token-for-an-app
 * @note Use Closure to cache the App Tokens by repo
 */
const _createGitHubAppToken = (() => {
  const tokenCache = new Map();

  return (repo) => {
    if (tokenCache.has(repo)) {
      console.log(`Hit the cache for the GitHub App Token for repo ${repo} `);
      return tokenCache.get(repo);
    }

    const jwt = _createJwt({
      app_id: GITHUB_APP_ID,
      private_key: GITHUB_APP_PRIVATE_KEY,
    });

    const installationID = _getGitHubAppInstallationId({repo, jwt});
    console.log(`repo: ${repo}, installationID: ${installationID}`);

    const response = UrlFetchApp.fetch(
      `https://api.github.com/app/installations/${installationID}/access_tokens`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${jwt}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    const token = JSON.parse(response.getContentText()).token;
    tokenCache.set(repo, token);
    console.log(`Cached GitHub App Token for repo ${repo}`);

    return token;
  };
})();

/**
 * Create JWT
 *
 * @param {string} app_id - GitHub App ID
 * @param {string} private_key - GitHub App private key
 * @return {string}
 * @see https://docs.github.com/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app
 */
const _createJwt = ({app_id, private_key} = {}) => {
  const now = Math.floor(new Date().getTime() / 1000);
  const iat = now - 60;  // Issues 60 seconds in the past
  const exp = now + 600; // Expires 10 minutes in the future

  const headerJSON = {
    typ: 'JWT',
    alg: 'RS256',
  };
  const header = Utilities.base64EncodeWebSafe(JSON.stringify(headerJSON));

  const payloadJSON = {
    iat: iat,
    exp: exp,
    iss: app_id,
  };
  const payload = Utilities.base64EncodeWebSafe(JSON.stringify(payloadJSON));

  const headerPayload = `${header}.${payload}`;
  const signature = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(headerPayload, private_key));

  return `${headerPayload}.${signature}`;
};

/**
 * Get a repository installation ID for the authenticated app
 *
 * @param {string} repo - GitHub Repository name (e.g., 'giselles-ai/giselle')
 * @param {string} jwt
 * @return {string}
 * @see https://docs.github.com/rest/apps/apps?apiVersion=2022-11-28#get-a-repository-installation-for-the-authenticated-app
 */
const _getGitHubAppInstallationId = ({repo, jwt} = {}) => {
  const response = UrlFetchApp.fetch(
    `https://api.github.com/repos/${repo}/installation`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${jwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  return JSON.parse(response.getContentText()).id;
};
