# Google Apps Script for OSPO

## 概要

GitHub リポジトリの各種メトリクスを Google スプレッドシートに蓄積する Google Apps Script (GAS)。

対象リポジトリと Google スプレッドシートは下記参照。

* [giselle/](./giselle)
* [liam/](./liam)

毎日 AM9:00 - AM10:00 と PM9:00 - PM10:00 の間に GAS がトリガーされる。

* GAS のサイドメニュー「トリガー」参照。コード管理は出来ない
* エラー発生時には @masutaka にメール通知される

## セットアップ

```consle
make setup
```

https://script.google.com/home/usersettings で Google Apps Script API を有効にしてください。

## デプロイ

確認:

```console
make status
```

デプロイ:

```console
make deploy
```

## 補足1: GitHub API を使うための Access Token の取得方法

同 GAS で、GitHub App [Get repo metrics for ROUTE06](https://github.com/apps/get-repo-metrics-for-route06) の Access Token を作成し、API 呼び出しに使用している。

この GitHub App には必要最小限な権限が付与されており、対象リポジトリのみにインストールされている。

* https://github.com/giselles-ai/giselle/settings/installations
* https://github.com/liam-hq/liam/settings/installations

同 GAS プロジェクトには以下のスクリプトプロパティが設定されており、いずれも GAS から参照されている。

* GITHUB_APP_ID
    * [App settings > General](https://github.com/organizations/route06inc/settings/apps/get-repo-metrics-for-route06) から確認できる
* GITHUB_APP_PRIVATE_KEY（後述）
    * [App settings > General > Private keys](https://github.com/organizations/route06inc/settings/apps/get-repo-metrics-for-route06#private-key) から作成したもの

## 補足2: スクリプトプロパティ `GITHUB_APP_PRIVATE_KEY` へのワークアラウンド

### ワークアラウンド1

GitHub からダウンロードした private key を GAS プロジェクトの UI 上から設定し、GAS を実行すると `Exception: Invalid argument: key` エラーが発生する。

GitHub からダウンロードした private key は `PKCS#1` 形式だが、GAS が要求する形式は `PKCS#8` であるためのようだ。

以下のように変換した private key を使用する。

```
$ openssl pkcs8 -topk8 -inform PEM -outform PEM -in GITHUB.PRIVATE-KEY.pem -out GAS.PRIVATE-KEY.pem -nocrypt
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
