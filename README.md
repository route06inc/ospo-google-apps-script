# OSPO Google Apps Script by ROUTE06, Inc.

<p>
  <a href="https://github.com/route06inc/ospo-google-apps-script/actions/workflows/codeql.yml?query=branch%3Amain" target="_blank">
    <img alt="CodeQL Status" src="https://img.shields.io/github/actions/workflow/status/route06inc/ospo-google-apps-script/.github%2Fworkflows%2Fcodeql.yml?branch=main&style=flat-square&logo=githubactions&label=CodeQL">
  </a>
</p>

<p>
  <a href="./README.md"><img alt="README in English" src="https://img.shields.io/badge/English-d9d9d9"></a>
  <a href="./README_ja.md"><img alt="日本語のREADME" src="https://img.shields.io/badge/日本語-d9d9d9"></a>
</p>

## Overview

A Google Apps Script (GAS) that collects and stores various GitHub repository metrics in a Google Spreadsheet.

| Metrics name | GitHub API |
|---|---|
| Stargazers | [List stargazers](https://docs.github.com/rest/activity/starring?apiVersion=2022-11-28#list-stargazers) |
| Traffic views | [Get traffic views](https://docs.github.com/rest/metrics/traffic?apiVersion=2022-11-28#get-page-views) |
| Traffic clones | [Get traffic clones](https://docs.github.com/rest/metrics/traffic?apiVersion=2022-11-28#get-repository-clones) |
| Traffic referrers | [Get top referral sources](https://docs.github.com/rest/metrics/traffic?apiVersion=2022-11-28#get-top-referral-sources) |

As an example, this script collects metrics from the following fictitious repositories:

* https://github.com/org1/repo1
* https://github.com/org2/repo2

Each repository corresponds to the following directories:

* [repo1/](./repo1)
* [repo2/](./repo2)

## Initial Setup

### 1. Creating a GitHub App

1. Follow [Registering a GitHub App](https://docs.github.com/apps/creating-github-apps/registering-a-github-app/registering-a-github-app) to create a GitHub App
    * `WebHook`:
        * Uncheck the "Active" option
    * `Permissions`:
        * Administration Read-only
        * Metadata Read-only
1. Take note of the App ID
1. In the "General" settings, under "Private keys" generate a Private Key and download it to your local environment

### 2. Setting up clasp

Manage GAS code using [@google/clasp](https://www.npmjs.com/package/@google/clasp).

1. Enable the Google Apps Script API at https://script.google.com/home/usersettings
1. Install clasp:

    ```console
    npm i
    ```

1. Log in to script.google.com using clasp:

    ```console
    npx clasp login
    ```

### 3. Creating a Google Spreadsheet and GAS Project

1. Navigate to the working directory:

    ```console
    cd repo1
    ```

1. Create a Google Spreadsheet corresponding to org1/repo1 and and a GAS project associated with it:

    ```console
    npx clasp create --type sheets --title "Repo1 repo metrics"
    ```

1. Check the files to be pushed to the GAS project:

    ```console
    npx clasp status
    ```

1. Push local files to the GAS project:

    ```console
    npx clasp push
    ```

1. In the GAS side menu, click "Project Settings" and set the correct time zone
1. Reflect the changes in appsscript.json:

    ```console
    npx clasp pull
    ```

> [!TIP]
> If developing in a team, remove the `rootDir` field from `.clasp.json`. The default value is the current directory.

> [!TIP]
> Since `.clasp.json` and `appsscript.json` do not contain sensitive information, you can commit to git.

### 4. Configuring GAS Script Properties

In the GAS side menu, click "Project Settings" and create the following script properties:

* `GITHUB_APP_ID`:
    * The previously noted App ID
* `GITHUB_APP_PRIVATE_KEY`:
    * The previously downloaded Private key
    * Apply the workaround mentioned in the "Supplementary Information" section

### 5. Creating Sheets in the Google Spreadsheet

Create the sheets specified in main.js:

* `TARGET_STARGAZERS.sheetName`
* `TARGET_VIEWS.sheetName`
* `TARGET_CLONES.sheetName`
* `TARGET_REFERRERS.sheetName`

### 6. Verifying Functionality

Run the `main` function and confirm that the metrics are written to the respective sheets.

### 7. Setting Up Triggers

In the GAS side menu, click "Triggers" and set up periodic execution of the main function.

## Deployment

To verify:

```console
make status
```

To deploy:

```console
make deploy
```

## Supplementary Information: Workaround for `GITHUB_APP_PRIVATE_KEY` Script Property

### Workaround 1

When setting the private key downloaded from GitHub via the GAS project UI and executing GAS, the error `Exception: Invalid argument: key` may occur.

This happens because the private key from GitHub is in `PKCS#1` format, whereas GAS requires `PKCS#8` format.

Convert the private key using the following command:

```console
openssl pkcs8 -topk8 -inform PEM -outform PEM -in GITHUB.PRIVATE-KEY.pem -out GAS.PRIVATE-KEY.pem -nocrypt
```

### Workaround 2

Even after converting the key using Workaround 1, the `Exception: Invalid argument: key` error may persist.

This is due to an issue in GAS with handling properties containing line breaks.

To resolve this, temporarily paste the following code into the GAS project and execute the setKey function to properly configure the `GITHUB_APP_PRIVATE_KEY` script property:

```js
const TMP_PRIVATE_KEY = `
Paste the contents of GAS.PRIVATE-KEY.pem here
`;

const setKey = () => {
  PropertiesService.getScriptProperties().setProperty('GITHUB_APP_PRIVATE_KEY', TMP_PRIVATE_KEY);
};
```

If any other script properties are modified, the above reconfiguration may be necessary again.

### References

* [GitHub Apps の Access Token を取得するGoogle Apps Script 用ライブラリーを作った](https://zenn.dev/hankei6km/articles/fetch-github-apps-token-by-google-apps-script) (In Japanese)
* [Exception: Invalid argument: key · Issue \#122 · googleworkspace/apps\-script\-oauth2](https://github.com/googleworkspace/apps-script-oauth2/issues/122)

## Contributing

Refer to our [contribution guidelines](./CONTRIBUTING.md) and [Code of Conduct for contributors](./CODE_OF_CONDUCT.md).

## References

Currently, we use this to collect metrics for the following repositories:

* https://github.com/giselles-ai/giselle
* https://github.com/liam-hq/liam
