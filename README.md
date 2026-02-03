# Slack Tools

Slackユーティリティツールのコレクション。各ツールは独立したSlack Appとして実装されています。

## ツール一覧

| ツール | 説明 |
|--------|------|
| [download-saved-items](./download-saved-items/) | Slack「Later」（保存済みアイテム）をCSVにエクスポート |
| [history-export](./history-export/) | チャンネル履歴をYAML/Markdown/CSVにエクスポート |

## 設計方針

- **独立したSlack App** - 各ツールは必要最小限のスコープを持つ別々のSlack App
- **User Token中心** - 個人データアクセスにはUser OAuth Token (xoxp-) を使用
- **独立した動作** - 各サブプロジェクトは独立して開発・テスト・デプロイ可能

## クイックスタート

### 1. サブプロジェクトに移動

```bash
cd download-saved-items  # または history-export
```

### 2. 環境設定

```bash
cp .env.example .env
# .envにSlackトークンを設定
```

### 3. 依存関係インストール

```bash
npm install
```

### 4. 実行

```bash
npm run dev
```

各ツールの詳細な使い方は、それぞれのディレクトリ内のREADMEを参照してください。

## Slack Appの設定

### User Tokenの取得

1. [api.slack.com/apps](https://api.slack.com/apps) でSlack Appを作成
2. **OAuth & Permissions** でUser Token Scopesを追加
3. ワークスペースにインストール
4. **User OAuth Token** (xoxp-...) を取得

### 必要なスコープ

| ツール | 必要なスコープ |
|--------|---------------|
| download-saved-items | `stars:read`, `channels:read`, `groups:read`, `im:read`, `mpim:read`, `channels:history`, `groups:history`, `im:history`, `mpim:history`, `users:read` |
| history-export | `channels:history`, `channels:read`, `groups:history`, `groups:read`, `users:read` |

## セキュリティ

- `.env`ファイルはコミット禁止（gitignore対象）
- エクスポートファイルには機密データが含まれる可能性があります

## ライセンス

MIT
