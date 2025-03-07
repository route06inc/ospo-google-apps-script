# OSPO Google Apps Script by ROUTE06, Inc.

## 概要

GitHub リポジトリの各種メトリクスを Google スプレッドシートに蓄積する Google Apps Script (GAS)。

| Metrics name | GitHub API |
|---|---|
| Stargazers | [List stargazers](https://docs.github.com/rest/activity/starring?apiVersion=2022-11-28#list-stargazers) |
| Traffic views | [Get traffic views](https://docs.github.com/rest/metrics/traffic?apiVersion=2022-11-28#get-page-views) |
| Traffic clones | [Get traffic clones](https://docs.github.com/rest/metrics/traffic?apiVersion=2022-11-28#get-repository-clones) |
| Traffic referrers | [Get top referral sources](https://docs.github.com/rest/metrics/traffic?apiVersion=2022-11-28#get-top-referral-sources) |

例として、架空の下記リポジトリのメトリクスを収集する。

* https://github.com/org1/repo1
* https://github.com/org2/repo2

それぞれ、下記ディレクトリに対応する。

* [repo1/](./repo1)
* [repo2/](./repo2)

## 最初のセットアップ

### 1. GitHub App の作成

1. [Registering a GitHub App](https://docs.github.com/apps/creating-github-apps/registering-a-github-app/registering-a-github-app) を参考にして、GitHub App を作成する
    * `WebHook`:
        * Active のチェックを外す
    * `Permissions`:
        * Administration Read-only
        * Metadata Read-only
1. App ID を書き留めておく
1. General の "Private keys" で Private key を作成し、ローカル環境にダウンロードする

### 2. clasp のセットアップ

[@google/clasp](https://www.npmjs.com/package/@google/clasp) で GAS のコードを管理する。

1. https://script.google.com/home/usersettings で Google Apps Script API を有効にする。
1. clasp をインストールする

    ```consle
    npm i
    ```

1. clasp で script.google.com にログインする

    ```consle
    npx clasp login
    ```

### 3. Google スプレッドシートと GAS の作成

1. 作業ディレクトリに移動する

    ```console
    cd repo1
    ```

1. org1/repo1 に対応する Google スプレッドシートと、それに紐づく GAS プロジェクトを作成する

    ```console
    npx clasp create --type sheets --title "Repo1 repo metrics"
    ```

1. これから GAS プロジェクトに push するファイルを確認する

    ```console
    npx clasp status
    ```

1. ローカルファイルを GAS プロジェクトに push する

    ```console
    npx clasp push
    ```

1. GAS サイドメニューの「プロジェクトの設定」をクリックし、タイムゾーンを合わせる
1. appsscript.json に反映する

    ```console
    npx clasp pull
    ```

> [!TIP]
> チームで開発する場合は `.clasp.json` の `rootDir` フィールドを削除してください。デフォルト値はカレントディレクトリです。

> [!TIP]
> `.clasp.json` と `appsscript.json` には秘匿情報が含まれないため、git commit 可能です。

### 4. GAS スクリプトプロパティの設定

GAS サイドメニューの「プロジェクトの設定」をクリックし、以下のスクリプトプロパティを作成する。

* `GITHUB_APP_ID`:
    * 前述の App ID
* `GITHUB_APP_PRIVATE_KEY`:
    * 前述の Private key
    * 後述する「補足」のワークアラウンドを適用すること

### 5. Google スプレッドシートにシートを作成する

main.js で設定したシートを作成する。

* `TARGET_STARGAZERS.sheetName`
* `TARGET_VIEWS.sheetName`
* `TARGET_CLONES.sheetName`
* `TARGET_REFERRERS.sheetName`

### 6. 動作確認

`main` 関数を実行し、各シートにメトリクスが書き込まれることを確認する。

### 7. トリガーの設定

GAS サイドメニューの「トリガー」をクリックし、`main` 関数の定期実行を設定する。

## デプロイ方法

確認:

```console
make status
```

デプロイ:

```console
make deploy
```

## 補足: スクリプトプロパティ `GITHUB_APP_PRIVATE_KEY` へのワークアラウンド

### ワークアラウンド1

GitHub からダウンロードした private key を GAS プロジェクトの UI 上から設定し、GAS を実行すると `Exception: Invalid argument: key` エラーが発生する。

GitHub からダウンロードした private key は `PKCS#1` 形式だが、GAS が要求する形式は `PKCS#8` であるためのようだ。

以下のように変換した private key を使用する。

```console
openssl pkcs8 -topk8 -inform PEM -outform PEM -in GITHUB.PRIVATE-KEY.pem -out GAS.PRIVATE-KEY.pem -nocrypt
```

### ワークアラウンド2

ワークアラウンド1で変換した `GAS.PRIVATE-KEY.pem` を使用しても、まだ `Exception: Invalid argument: key` エラーが発生する。

GAS 側で、改行を含むプロパティの取り扱いに問題があるためのようだ。

同 GAS プロジェクトで一時的に以下のコードを貼り付け、setKey 関数を実行することで、スクリプトプロパティ `GITHUB_APP_PRIVATE_KEY` を正常に設定できる。

```js
const TMP_PRIVATE_KEY = `
GAS.PRIVATE-KEY.pem の中身を貼り付ける
`;

const setKey = () => {
  PropertiesService.getScriptProperties().setProperty('GITHUB_APP_PRIVATE_KEY', TMP_PRIVATE_KEY);
};
```

他のスクリプトプロパティを変更した場合でも、上記再設定が必要のようだ。

### 参考

* [GitHub Apps の Access Token を取得するGoogle Apps Script 用ライブラリーを作った](https://zenn.dev/hankei6km/articles/fetch-github-apps-token-by-google-apps-script)
* [Exception: Invalid argument: key · Issue \#122 · googleworkspace/apps\-script\-oauth2](https://github.com/googleworkspace/apps-script-oauth2/issues/122)
