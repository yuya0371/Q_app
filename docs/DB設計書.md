# DB設計書 — Q.（仮）

## 1. 概要

- **データベース**: Amazon DynamoDB
- **リージョン**: ap-northeast-1（東京）
- **テーブル数**: 10テーブル
- **設計方針**: アクセスパターンに最適化したテーブル分割設計

---

## 2. アクセスパターン一覧

| # | アクセスパターン | 対応テーブル |
|---|---|---|
| 1 | ユーザーIDでユーザー情報取得 | Users |
| 2 | アプリ内IDでユーザー検索 | Users (GSI1) |
| 3 | 今日の質問を取得 | DailyQuestions |
| 4 | 回答を投稿 | Answers |
| 5 | 自分の過去回答一覧を取得 | Answers (GSI1) |
| 6 | フォロー中の人の今日の回答一覧（タイムライン） | Follows + Answers |
| 7 | フォロー一覧を取得 | Follows |
| 8 | フォロワー一覧を取得 | Follows (GSI1) |
| 9 | 相互フォロー判定 | Follows |
| 10 | フォロー数/フォロワー数を取得 | Users (カウンター) |
| 11 | 投稿にリアクション付与 | Reactions |
| 12 | 投稿についたリアクション一覧取得 | Reactions |
| 13 | 自分がリアクションしたか確認 | Reactions |
| 14 | ブロック一覧取得 | Blocks |
| 15 | 特定ユーザーをブロックしているか確認 | Blocks |
| 16 | 通報送信 | Reports |
| 17 | ユーザーお題を提出 | Questions + UserQuestionSubmissions |
| 18 | 承認待ちお題一覧（管理画面） | Questions (GSI1) |
| 19 | 承認済みお題からランダム取得 | Questions (GSI2) |

---

## 3. テーブル定義

### 3.1 Users（ユーザー）

ユーザーの基本情報を管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **userId** | String | ユーザーID（UUID） | PK |
| appId | String | アプリ内ID（3〜15文字、英小文字+数字+_） | ○ |
| displayName | String | 表示名（1〜20文字）、未設定時はnull | - |
| email | String | メールアドレス（小文字正規化済み） | ○ |
| birthDate | String | 生年月日（YYYY-MM-DD） | ○ |
| profileImageUrl | String | プロフィール画像のS3 URL | - |
| visibilityType | String | 閲覧範囲（`mutual` / `followers`） | ○ |
| followingCount | Number | フォロー数 | ○ |
| followerCount | Number | フォロワー数 | ○ |
| isBanned | Boolean | BANされているか | ○ |
| createdAt | String | 作成日時（ISO 8601） | ○ |
| updatedAt | String | 更新日時（ISO 8601） | ○ |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | userId |

**GSI:**
| GSI名 | PK | SK | 用途 |
|---|---|---|---|
| GSI1_AppId | appId | - | アプリ内IDでユーザー検索 |

**備考:**
- `visibilityType`: `mutual`=相互フォローのみ、`followers`=フォロワーまで
- デフォルト: `visibilityType = mutual`
- `followingCount`/`followerCount` はフォロー時にアトミックカウンターで更新

---

### 3.2 DailyQuestions（日別お題）

日ごとの公開質問を管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **date** | String | 日付（YYYY-MM-DD、JST） | PK |
| questionId | String | お題ID | ○ |
| questionText | String | お題本文 | ○ |
| scheduledPublishTime | String | 公開予定時刻（HH:mm） | ○ |
| publishedAt | String | 実際の公開日時（ISO 8601） | - |
| isFallback | Boolean | フォールバックお題かどうか | ○ |
| createdAt | String | レコード作成日時 | ○ |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | date |

**備考:**
- 毎日0:00に翌日分のレコードを作成
- `publishedAt` は実際に公開処理が走った時刻
- `isFallback` は予備お題が発動した場合にtrue

---

### 3.3 Questions（お題マスタ）

運営お題・ユーザー投稿お題を管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **questionId** | String | お題ID（UUID） | PK |
| text | String | お題本文（最大80文字） | ○ |
| type | String | 種別（`admin` / `user`） | ○ |
| submittedBy | String | 投稿者userId（userの場合） | - |
| status | String | ステータス（下記参照） | ○ |
| isFlagged | Boolean | NGワード検知されたか | ○ |
| lastUsedAt | String | 最後に使用された日時 | - |
| createdAt | String | 作成日時 | ○ |
| updatedAt | String | 更新日時 | ○ |

**ステータス:**
| status | 説明 |
|---|---|
| `pending` | 審査待ち（ユーザー投稿） |
| `approved` | 承認済み（採用可能） |
| `rejected` | 却下 |
| `used` | 使用済み（直近30日以内に出題） |
| `archived` | アーカイブ（運営お題の無効化等） |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | questionId |

**GSI:**
| GSI名 | PK | SK | 用途 |
|---|---|---|---|
| GSI1_Status | status | createdAt | ステータス別一覧（承認待ち等） |
| GSI2_Approved | status | lastUsedAt | 承認済み＆未使用のお題取得 |

**備考:**
- 採用時に `lastUsedAt` を更新
- 30日経過後に `used` → `approved` に戻すバッチ処理が必要

---

### 3.4 Answers（回答）

ユーザーの回答を管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **date** | String | 回答対象の日付（YYYY-MM-DD） | PK |
| **userId** | String | 回答者のユーザーID | SK |
| questionId | String | 質問ID | ○ |
| text | String | 回答本文（最大80文字） | ○ |
| isOnTime | Boolean | オンタイム（30分以内）か | ○ |
| lateMinutes | Number | 遅れた分数（On-timeなら0） | ○ |
| isFlagged | Boolean | NGワード検知されたか | ○ |
| isDeleted | Boolean | 削除済みか | ○ |
| createdAt | String | 投稿日時 | ○ |
| deletedAt | String | 削除日時 | - |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | date |
| Sort Key (SK) | userId |

**GSI:**
| GSI名 | PK | SK | 用途 |
|---|---|---|---|
| GSI1_UserHistory | userId | date | ユーザーの過去回答一覧 |

**備考:**
- タイムライン取得時は、フォロー一覧を取得後、今日の `date` でクエリ
- 削除後の復活は `isDeleted = false` に更新
- 削除後の再投稿は不可（同じPK+SKのレコードが存在するため弾く）

---

### 3.5 Follows（フォロー関係）

フォロー関係を管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **followerId** | String | フォローする側のユーザーID | PK |
| **followeeId** | String | フォローされる側のユーザーID | SK |
| createdAt | String | フォロー日時 | ○ |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | followerId |
| Sort Key (SK) | followeeId |

**GSI:**
| GSI名 | PK | SK | 用途 |
|---|---|---|---|
| GSI1_Followers | followeeId | followerId | フォロワー一覧取得 |

**備考:**
- フォロー/解除時に Users テーブルのカウンターも更新（トランザクション）
- 相互フォロー判定: 両方のレコードが存在するか確認

---

### 3.6 Blocks（ブロック関係）

ブロック関係を管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **blockerId** | String | ブロックする側のユーザーID | PK |
| **blockedId** | String | ブロックされる側のユーザーID | SK |
| createdAt | String | ブロック日時 | ○ |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | blockerId |
| Sort Key (SK) | blockedId |

**GSI:**
| GSI名 | PK | SK | 用途 |
|---|---|---|---|
| GSI1_BlockedBy | blockedId | blockerId | 自分をブロックしている人の確認 |

**備考:**
- ブロック時に双方のフォロー関係を削除（トランザクション）
- タイムライン表示時にブロック関係をフィルタ

---

### 3.7 Reactions（リアクション）

投稿へのリアクションを管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **answerId** | String | 回答ID（`{date}#{userId}` 形式） | PK |
| **reactorId** | String | リアクションしたユーザーID | SK |
| reactionType | String | リアクション種別（❤️/🔥/😂/🤔/👀） | ○ |
| createdAt | String | リアクション日時 | ○ |
| updatedAt | String | 更新日時（変更時） | ○ |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | answerId |
| Sort Key (SK) | reactorId |

**備考:**
- `answerId` は `{date}#{userId}` の複合キー形式
- 1人1投稿につき1リアクションのみ（上書き更新）
- リアクション解除は項目削除

---

### 3.8 Reports（通報）

通報を管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **reportId** | String | 通報ID（UUID） | PK |
| reporterId | String | 通報者のユーザーID | ○ |
| targetType | String | 対象種別（`user` / `answer`） | ○ |
| targetId | String | 対象ID（userId または answerId） | ○ |
| category | String | 通報カテゴリ | ○ |
| description | String | 自由記述 | - |
| status | String | ステータス（`pending`/`resolved`/`dismissed`） | ○ |
| createdAt | String | 通報日時 | ○ |
| resolvedAt | String | 対応完了日時 | - |
| resolvedBy | String | 対応した管理者ID | - |

**カテゴリ:**
- `spam`: スパム
- `harassment`: 嫌がらせ・いじめ
- `inappropriate`: 不適切なコンテンツ
- `impersonation`: なりすまし
- `privacy`: 個人情報の公開
- `other`: その他

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | reportId |

**GSI:**
| GSI名 | PK | SK | 用途 |
|---|---|---|---|
| GSI1_Status | status | createdAt | ステータス別一覧（未対応等） |

---

### 3.9 UserQuestionSubmissions（ユーザーお題提出履歴）

ユーザーが1日1件のお題提出制限を管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **date** | String | 提出日（YYYY-MM-DD） | PK |
| **userId** | String | 提出者のユーザーID | SK |
| questionId | String | 提出したお題のID | ○ |
| createdAt | String | 提出日時 | ○ |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | date |
| Sort Key (SK) | userId |

**備考:**
- お題提出前にこのテーブルを確認して1日1件制限をチェック
- 実際のお題内容は Questions テーブルに保存

---

### 3.10 NGWords（NGワード）

NGワードを管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **word** | String | NGワード（小文字正規化） | PK |
| createdAt | String | 登録日時 | ○ |
| createdBy | String | 登録した管理者ID | ○ |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | word |

**備考:**
- 投稿時にこのテーブルをスキャンしてマッチングチェック
- パフォーマンス向上のためキャッシュ（Lambda環境変数 or ElastiCache）を検討

---

### 3.11 PushTokens（プッシュ通知トークン）

Expo Push Notification用のトークンを管理するテーブル。

| 属性名 | 型 | 説明 | 必須 |
|---|---|---|---|
| **userId** | String | ユーザーID | PK |
| **token** | String | Expo Push Token | SK |
| deviceType | String | デバイス種別（`ios` / `android`） | ○ |
| createdAt | String | 登録日時 | ○ |
| updatedAt | String | 更新日時 | ○ |

**キー設計:**
| キー | 属性 |
|---|---|
| Partition Key (PK) | userId |
| Sort Key (SK) | token |

**備考:**
- 1ユーザーが複数デバイスを持つ可能性があるため、複数トークン対応
- 通知送信時は userId で全トークンを取得して送信

---

## 4. テーブル一覧サマリー

| # | テーブル名 | PK | SK | GSI数 | 用途 |
|---|---|---|---|---|---|
| 1 | Users | userId | - | 1 | ユーザー情報 |
| 2 | DailyQuestions | date | - | 0 | 日別お題 |
| 3 | Questions | questionId | - | 2 | お題マスタ |
| 4 | Answers | date | userId | 1 | 回答 |
| 5 | Follows | followerId | followeeId | 1 | フォロー関係 |
| 6 | Blocks | blockerId | blockedId | 1 | ブロック関係 |
| 7 | Reactions | answerId | reactorId | 0 | リアクション |
| 8 | Reports | reportId | - | 1 | 通報 |
| 9 | UserQuestionSubmissions | date | userId | 0 | お題提出履歴 |
| 10 | NGWords | word | - | 0 | NGワード |
| 11 | PushTokens | userId | token | 0 | プッシュトークン |

**合計: 11テーブル、7 GSI**

---

## 5. タイムライン取得ロジック

タイムライン（フォロー中の人の今日の回答一覧）の取得は以下の手順で行う：

```
1. Follows テーブルから自分がフォローしている人一覧を取得
   - Query: PK = {myUserId}

2. 各フォロー先の閲覧可否を判定
   - 相手の visibilityType を確認
   - mutual の場合: 相手も自分をフォローしているか確認
   - followers の場合: 閲覧可

3. Blocks テーブルで相互ブロックチェック
   - ブロック関係がある場合は除外

4. Answers テーブルから今日の回答を取得
   - Query: PK = {today}, Filter: userId IN (閲覧可能なuserIdリスト)

5. 並び替え
   - On-time優先 → 投稿が早い順
```

**注意:**
- フォロー数が多い場合はパフォーマンスに注意
- 将来的にはキャッシュやファンアウト方式への変更を検討

---

## 6. データ整合性

### 6.1 トランザクションが必要な処理

| 処理 | 更新対象テーブル |
|---|---|
| フォロー | Follows, Users（カウンター×2） |
| フォロー解除 | Follows, Users（カウンター×2） |
| ブロック | Blocks, Follows（削除）, Users（カウンター×2〜4） |
| 退会 | 全テーブル（Step Functionsで段階削除） |

### 6.2 整合性の担保

- DynamoDB TransactWriteItems を使用（最大100項目）
- 大量削除が必要な退会処理は Step Functions で段階的に実行

---

## 7. バックアップ・リカバリ

- **PITR（Point-in-Time Recovery）**: 全テーブルで有効化
- **オンデマンドバックアップ**: リリース前、大規模変更前に取得
- **リージョン**: ap-northeast-1（東京）単一リージョン（MVP）

---

## 8. キャパシティ設計

### MVP段階

| テーブル | モード | 備考 |
|---|---|---|
| 全テーブル | オンデマンド | トラフィック予測が難しいため |

### スケール後（検討）

- トラフィックパターンが安定したらプロビジョンドに切り替え検討
- Auto Scaling 設定

---

## 9. 命名規則

- **テーブル名**: `{環境}-{アプリ名}-{テーブル名}`
  - 例: `dev-q-Users`, `prod-q-Answers`
- **GSI名**: `GSI{番号}_{用途}`
  - 例: `GSI1_AppId`, `GSI1_Followers`
