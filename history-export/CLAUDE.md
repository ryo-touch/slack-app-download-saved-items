# CLAUDE.md - History Export Tool

Slackチャンネル履歴エクスポートツールの技術コンテキスト。

## プロジェクト概要

- **種別:** Slackチャンネル履歴エクスポートツール
- **言語:** TypeScript
- **ランタイム:** Node.js
- **APIクライアント:** @slack/web-api

## 機能

- チャンネル履歴をYAML、Markdown、CSV形式でエクスポート
- スレッド展開（返信をインライン表示）
- 日付範囲フィルタリング
- ユーザー名解決
- チャンネル名解決
- チャンネル/ユーザーキャッシュによるrate limit回避

## ディレクトリ構造

```
history-export/
├── src/
│   ├── index.ts          # CLIエントリポイント
│   └── exporter.ts       # HistoryExporterクラス
├── exports/              # 出力先（gitignore対象）
├── .cache/               # キャッシュ（gitignore対象）
│   ├── channels.json     # チャンネル名→ID
│   └── users.json        # ユーザーID→表示名
├── dist/                 # コンパイル済みJavaScript
├── package.json
├── tsconfig.json
├── .env.example
└── CLAUDE.md
```

## コアコンポーネント

### HistoryExporterクラス (src/exporter.ts)

**コンストラクタ:** `new HistoryExporter(token: string, cacheDir?: string)`

**メインメソッド:** `export(options: ExportOptions): Promise<ExportResult>`

**ExportOptions:**
```typescript
interface ExportOptions {
  channelId: string;      // チャンネルIDまたは名前
  startDate?: Date;       // 開始日（任意）
  endDate?: Date;         // 終了日（任意）
  format: 'csv' | 'markdown' | 'yaml';
  outputDir: string;
}
```

**主要メソッド:**
- `listChannels()` - チャンネル一覧取得（ファイルキャッシュ対応）
- `prefetchUsersToCache()` - ユーザー一覧を事前取得（ファイルキャッシュ対応）
- `fetchHistory()` - ページネーションでチャンネルメッセージ取得
- `fetchThreadReplies()` - スレッド返信を展開
- `resolveChannelId()` - チャンネル名をIDに変換（キャッシュ対応）
- `getUserName()` - ユーザーIDを表示名に解決（キャッシュ付き）
- `getChannelName()` - チャンネルIDを名前に解決（キャッシュ付き）
- `formatAsMarkdown()` - Markdown出力生成
- `formatAsCsv()` - CSV出力生成
- `formatAsYaml()` - YAML出力生成

### CLIエントリポイント (src/index.ts)

**引数:**
- `--channel <name|id>` - エクスポート対象チャンネル（**ID推奨**、rate limit回避）
- `--from <YYYY-MM-DD>` - 開始日（任意）
- `--to <YYYY-MM-DD>` - 終了日（任意）
- `--format <yaml|csv|md>` - 出力形式（デフォルト: yaml）
- `--output <dir>` - 出力先ディレクトリ（デフォルト: exports/）
- `--list-channels` - チャンネル一覧を表示してキャッシュに保存
- `--prefetch-users` - ユーザー一覧を事前取得してキャッシュに保存
- `--refresh-cache` - キャッシュを強制更新

## 必要なSlackスコープ (User Token)

| スコープ | 用途 |
|---------|------|
| `channels:history` | パブリックチャンネルのメッセージ読み取り |
| `channels:read` | パブリックチャンネル情報取得 |
| `groups:history` | プライベートチャンネルのメッセージ読み取り |
| `groups:read` | プライベートチャンネル情報取得 |
| `users:read` | ユーザーIDを名前に解決 |

## 出力形式・使用例

README.mdを参照。

## Rate Limit回避のベストプラクティス

1. **初回セットアップ** - `--list-channels`と`--prefetch-users`を事前実行
2. **チャンネルIDを直接指定** - `--channel C01234567`形式を使用
3. **キャッシュファイル** - `.cache/`に保存される
   - `channels.json` - チャンネル名→ID（conversations.list回避）
   - `users.json` - ユーザーID→表示名（users.list回避）

### Slack API Rate Limit Tier

| Tier | 制限 | 主なAPI |
|------|------|---------|
| Tier 2 | 20+/分 | `conversations.list`, `users.list` |
| Tier 3 | 50+/分 | `conversations.history`, `conversations.replies` |
| Tier 4 | 100+/分 | `users.info` |

チャンネル名で指定すると`conversations.list`（Tier 2）が呼び出され、rate limitに達する可能性がある。
ユーザー数が多い場合、`users.list`（Tier 2）もrate limitに達する可能性がある。
キャッシュを事前作成することで、2回目以降はTier 2 APIの呼び出しを完全に回避可能。

## 開発

```bash
# 依存関係インストール
npm install

# 開発モード
npm run dev -- --channel <channel>

# プロダクションビルド
npm run build

# プロダクション実行
npm start -- --channel <channel>
```

## APIパターン

### タイムスタンプ変換
Slackは文字列タイムスタンプを使用（例: "1234567890.123456"）。Dateへの変換:
```typescript
const date = new Date(parseFloat(ts) * 1000);
```

### 日付範囲フィルタリング
`oldest`と`latest`パラメータを使用（Unixタイムスタンプの文字列）:
```typescript
const oldest = (startDate.getTime() / 1000).toString();
const latest = (endDate.getTime() / 1000).toString();
```

### スレッド返信
親メッセージの`ts`で`conversations.replies`を使用:
```typescript
const replies = await client.conversations.replies({
  channel: channelId,
  ts: threadTs,
});
```

## エラーハンドリング

- トークン未設定: 明確なエラーメッセージで終了
- 無効なチャンネル: 利用可能なチャンネルを表示
- APIエラー: ログ出力して可能な限り継続
- レート制限: @slack/web-apiが自動処理

## セキュリティ

- トークンは`.env`に格納（gitignore対象）
- エクスポートファイルには機密メッセージが含まれる可能性あり
- User Tokenが必要（Bot Tokenではない）
