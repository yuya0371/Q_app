# Q.

毎日1つ届く「今日の質問」に短文で答えることで、フォローしている人の回答が見れる"日課SNS"アプリ。

## 概要

- **ターゲット**: 学生（中高生〜大学生）
- **コンセプト**: 普通のSNS化（拡散/おすすめ/ランキング）を避けた、シンプルな日課型SNS

## 主な機能

- 毎日10:00〜21:00の間にランダムで届く「今日の質問」
- 80文字以内の短文回答
- 回答するとフォロー中の人の回答が閲覧可能に
- リアクション機能（5種類）
- ユーザーからのお題提案（運営承認制）

## 技術スタック

### モバイルアプリ
- React Native + Expo (Managed workflow)
- TypeScript

### バックエンド
- AWS Lambda (Node.js / TypeScript)
- Amazon API Gateway (REST API)
- Amazon DynamoDB
- Amazon Cognito
- Amazon S3
- AWS Step Functions
- Amazon EventBridge

### 管理画面
- React
- TypeScript

### インフラ
- AWS CDK (TypeScript)
- GitHub Actions (CI/CD)

## プロジェクト構成

```
Q/
├── docs/                    # ドキュメント
│   ├── 要件定義書.md
│   ├── DB設計書.md
│   ├── API設計書.md
│   ├── 画面設計書.md
│   ├── システム構成図.md
│   └── タスク管理表.md
├── apps/
│   ├── mobile/             # モバイルアプリ (Expo)
│   └── admin/              # 管理画面 (React)
├── packages/
│   ├── api/                # Lambda関数
│   └── shared/             # 共有型定義
├── infra/                  # AWS CDK
└── mock/                   # HTMLモック
```

## 開発環境セットアップ

```bash
# 依存関係のインストール
npm install

# モバイルアプリの起動
cd apps/mobile
npm start

# 管理画面の起動
cd apps/admin
npm run dev

# CDKデプロイ（開発環境）
cd infra
npm run deploy:dev
```

## ドキュメント

| ドキュメント | 説明 |
|---|---|
| [要件定義書](./要件定義書.md) | 機能・仕様の定義 |
| [DB設計書](./DB設計書.md) | DynamoDBテーブル設計 |
| [API設計書](./API設計書.md) | REST APIエンドポイント定義 |
| [画面設計書](./画面設計書.md) | 画面構成・ワイヤーフレーム |
| [システム構成図](./システム構成図.md) | AWS構成・データフロー |
| [タスク管理表](./タスク管理表.md) | 開発タスク・進捗管理 |

## ライセンス

Private
