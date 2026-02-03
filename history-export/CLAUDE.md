# CLAUDE.md - History Export Tool

Slackチャンネル履歴エクスポートツールの技術コンテキスト。

## プロジェクト概要

- **種別:** Slackチャンネル履歴エクスポートツール
- **言語:** TypeScript
- **ランタイム:** Node.js
- **APIクライアント:** @slack/web-api

## 機能

- チャンネル履歴をMarkdownまたはCSV形式でエクスポート
- スレッド展開（返信をインライン表示）
- 日付範囲フィルタリング
- ユーザー名解決
- チャンネル名解決

## ディレクトリ構造

```
history-export/
├── src/
│   ├── index.ts          # CLIエントリポイント
│   └── exporter.ts       # HistoryExporterクラス
├── exports/              # 出力先（gitignore対象）
├── dist/                 # コンパイル済みJavaScript
├── package.json
├── tsconfig.json
├── .env.example
└── CLAUDE.md
```

## コアコンポーネント

### HistoryExporterクラス (src/exporter.ts)

**コンストラクタ:** `new HistoryExporter(token: string)`

**メインメソッド:** `export(options: ExportOptions): Promise<ExportResult>`

**ExportOptions:**
```typescript
interface ExportOptions {
  channelId: string;      // チャンネルIDまたは名前
  startDate?: Date;       // 開始日（任意）
  endDate?: Date;         // 終了日（任意）
  format: 'csv' | 'markdown';
  outputDir: string;
}
```

**主要メソッド:**
- `fetchHistory()` - ページネーションでチャンネルメッセージ取得
- `fetchThreadReplies()` - スレッド返信を展開
- `resolveChannelId()` - チャンネル名をIDに変換
- `getUserName()` - ユーザーIDを表示名に解決（キャッシュ付き）
- `getChannelName()` - チャンネルIDを名前に解決（キャッシュ付き）
- `formatAsMarkdown()` - Markdown出力生成
- `formatAsCsv()` - CSV出力生成

### CLIエントリポイント (src/index.ts)

**引数:**
- `--channel <name|id>` - エクスポート対象チャンネル（必須）
- `--from <YYYY-MM-DD>` - 開始日（任意）
- `--to <YYYY-MM-DD>` - 終了日（任意）
- `--format <csv|md>` - 出力形式（デフォルト: md）
- `--output <dir>` - 出力先ディレクトリ（デフォルト: exports/）

## 必要なSlackスコープ (User Token)

| スコープ | 用途 |
|---------|------|
| `channels:history` | パブリックチャンネルのメッセージ読み取り |
| `channels:read` | パブリックチャンネル情報取得 |
| `groups:history` | プライベートチャンネルのメッセージ読み取り |
| `groups:read` | プライベートチャンネル情報取得 |
| `users:read` | ユーザーIDを名前に解決 |

## 出力形式

### Markdown（デフォルト）
```markdown
# #general

## 2026-02-02

### 09:15 @username
メッセージテキスト

> **09:20 @replier**
> スレッド返信テキスト
```

### CSV
```csv
timestamp,channel,user,text,thread_ts,reply_count
2026-02-02T09:15:00.000Z,general,username,メッセージテキスト,,0
```

## 使用例

```bash
# 全履歴をMarkdownでエクスポート
npm run dev -- --channel general

# 日付範囲指定
npm run dev -- --channel general --from 2026-01-01 --to 2026-01-31

# CSVでエクスポート
npm run dev -- --channel general --format csv

# 出力先ディレクトリ指定
npm run dev -- --channel general --output ./my-exports
```

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
