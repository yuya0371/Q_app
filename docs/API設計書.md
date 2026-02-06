# API設計書 — Q.（仮）

## 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-02-04 | 実装に合わせて更新: レスポンス形式からsuccessフィールドを削除、PATCH /users/meにusername/bio/isPrivateフィールド追加・displayName上限を50文字に変更、POST /users/me/profile-imageをpresigned URL方式に変更 |
| 2026-02-05 | 実装との整合性確認・更新: HTTPメソッド修正（PATCH→PUT）、パスパラメータ修正、フォロー/フォロワー一覧のパス変更、リアクションエンドポイント修正、未実装エンドポイントをTODOマーク |
| 2026-02-05 | GET /users/me/blocks を実装済みに更新 |
| 2026-02-05 | GET /app/version を実装済みに更新 |
| 2026-02-05 | 管理画面API（Phase 5）実装完了: 認証にisAdmin追加、全管理APIを /admin プレフィックスで実装、レスポンス形式を { items: [...] } に統一 |

---

## 1. 概要

- **形式**: REST API
- **ベースURL**: `https://api.{domain}/v1`
- **認証**: Amazon Cognito（JWT Bearer Token）
- **レスポンス形式**: JSON

---

## 2. 共通仕様

### 2.1 認証ヘッダー

認証が必要なエンドポイントには以下のヘッダーを含める：

```
Authorization: Bearer {access_token}
```

### 2.2 共通レスポンス形式

**成功時:**
```json
{
  "data": { ... }
}
```

**エラー時:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 2.3 共通エラーコード

| HTTPステータス | コード | 説明 |
|---|---|---|
| 400 | BAD_REQUEST | リクエスト形式が不正 |
| 400 | VALIDATION_ERROR | バリデーションエラー |
| 401 | UNAUTHORIZED | 認証が必要 |
| 403 | FORBIDDEN | アクセス権限がない |
| 403 | ACCOUNT_BANNED | アカウントがBANされている |
| 404 | NOT_FOUND | リソースが見つからない |
| 409 | CONFLICT | リソースが競合（重複など） |
| 429 | RATE_LIMIT_EXCEEDED | レート制限超過 |
| 500 | INTERNAL_ERROR | サーバー内部エラー |

### 2.4 ページネーション

一覧取得APIでは以下のクエリパラメータを使用：

| パラメータ | 型 | 説明 |
|---|---|---|
| limit | number | 取得件数（デフォルト: 20、最大: 100） |
| cursor | string | ページネーションカーソル（次ページ取得用） |

**レスポンス:**
```json
{
  "data": {
    "items": [ ... ],
    "nextCursor": "xxx" // 次ページがある場合
  }
}
```

---

## 3. エンドポイント一覧

### 認証系（Auth）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| POST | /auth/signup | ユーザー登録 | 不要 | ✅ |
| POST | /auth/confirm | メール確認（コード検証） | 不要 | ✅ |
| POST | /auth/resend-code | 確認コード再送信 | 不要 | ✅ |
| POST | /auth/login | ログイン | 不要 | ✅ |
| POST | /auth/logout | ログアウト | 必要 | ❌ TODO |
| POST | /auth/refresh | トークンリフレッシュ | 不要 | ✅ |
| POST | /auth/forgot-password | パスワードリセット開始 | 不要 | ✅ |
| POST | /auth/reset-password | パスワードリセット実行 | 不要 | ✅ |
| POST | /auth/change-email | メールアドレス変更 | 必要 | ❌ TODO |
| POST | /auth/confirm-email-change | メール変更確認 | 必要 | ❌ TODO |

### ユーザー系（Users）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| GET | /users/me | 自分のプロフィール取得 | 必要 | ✅ ※1 |
| PUT | /users/me | プロフィール更新 | 必要 | ✅ ※2 |
| PUT | /users/me/app-id | アプリ内ID設定（初回のみ） | 必要 | ✅ ※3 |
| GET | /users/me/check-app-id | アプリ内ID重複チェック | 必要 | ❌ TODO |
| POST | /users/me/profile-image | プロフィール画像アップロードURL取得 | 必要 | ✅ |
| DELETE | /users/me/profile-image | プロフィール画像削除 | 必要 | ✅ |
| DELETE | /users/me | アカウント削除（退会） | 必要 | ✅ |
| GET | /users/:appId | 他ユーザーのプロフィール取得 | 必要 | ✅ ※4 |
| GET | /users/search | ユーザー検索（ID完全一致） | 必要 | ✅ |

> **変更理由:**
> - ※1: 実装では `/users/{userId}` で `userId=me` の場合に自身のプロフィールを返す
> - ※2: PATCH → PUT に変更（API Gatewayの定義に合わせる）
> - ※3: POST → PUT に変更（リソースの更新操作のため）
> - ※4: パスパラメータは `{userId}` だが、実装内部でappIdとして検索する

### フォロー系（Follows）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| POST | /users/:userId/follow | フォローする | 必要 | ✅ |
| DELETE | /users/:userId/follow | フォロー解除 | 必要 | ✅ |
| GET | /users/:userId/following | フォロー一覧 | 必要 | ✅ ※5 |
| GET | /users/:userId/followers | フォロワー一覧 | 必要 | ✅ ※5 |
| GET | /users/:userId/follow-status | フォロー状態確認 | 必要 | ❌ TODO |

> **変更理由:**
> - ※5: `/users/me/following` → `/users/{userId}/following` に変更（自分以外のユーザーのフォロー一覧も取得可能にするため）。`userId=me` で自身の一覧を取得

### お題・回答系（Questions / Answers）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| GET | /questions/today | 今日の質問を取得 | 必要 | ✅ |
| GET | /questions/past | 過去の質問一覧を取得 | 必要 | ✅ ※6 |
| POST | /answers | 回答を投稿 | 必要 | ✅ |
| DELETE | /answers/:answerId | 回答を削除 | 必要 | ✅ ※7 |
| POST | /answers/:answerId/restore | 削除した回答を復活 | 必要 | ❌ TODO |
| GET | /answers/timeline | タイムライン取得 | 必要 | ✅ |
| GET | /users/:userId/answers | ユーザーの過去回答一覧 | 必要 | ✅ ※8 |

> **変更理由:**
> - ※6: 新規追加（過去の質問一覧取得機能）
> - ※7: `/answers/:date` → `/answers/:answerId` に変更（回答IDで特定する方が一意性が保証される）
> - ※8: `/answers/me` → `/users/{userId}/answers` に変更（他ユーザーの回答履歴も取得可能にするため）

### リアクション系（Reactions）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| POST | /answers/:answerId/reaction | リアクション付与/変更 | 必要 | ✅ ※9 |
| DELETE | /answers/:answerId/reaction | リアクション解除 | 必要 | ✅ ※9 |
| GET | /answers/:answerId/reactions | リアクション一覧取得 | 必要 | ❌ TODO |

> **変更理由:**
> - ※9: PUT → POST に変更、パスを `reactions`（複数形）→ `reaction`（単数形）に変更（1ユーザー1回答に対して1リアクションのため単数形が適切）

### ブロック系（Blocks）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| POST | /users/:userId/block | ブロックする | 必要 | ✅ |
| DELETE | /users/:userId/block | ブロック解除 | 必要 | ✅ |
| GET | /users/me/blocks | ブロック一覧 | 必要 | ✅ |

### 通報系（Reports）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| POST | /reports | 通報を送信 | 必要 | ✅ |

### ユーザーお題系（Question Submissions）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| POST | /questions/submit | お題を提出 | 必要 | ✅ |

### 設定系（Settings）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| PATCH | /settings/visibility | 閲覧範囲設定 | 必要 | ❌ TODO |
| POST | /push-tokens | プッシュ通知トークン登録 | 必要 | ✅ ※10 |
| DELETE | /push-tokens | プッシュ通知トークン削除 | 必要 | ❌ TODO |

> **変更理由:**
> - ※10: `/settings/push-token` → `/push-tokens` に変更（独立したリソースとして扱う）

### アプリ系（App）
| メソッド | エンドポイント | 説明 | 認証 | 実装状況 |
|---|---|---|---|---|
| GET | /app/version | アプリバージョンチェック | 不要 | ✅ |

---

## 4. エンドポイント詳細

---

### 4.1 認証系（Auth）

#### POST /auth/signup
ユーザー登録（Cognito にユーザー作成）

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "birthDate": "2000-01-15"
}
```

**バリデーション:**
- email: 有効なメールアドレス形式、小文字に正規化
- password: 8〜64文字
- birthDate: YYYY-MM-DD形式、13歳以上

**レスポンス（成功）:**
```json
{
  "data": {
    "userId": "uuid-xxx",
    "email": "user@example.com",
    "requiresConfirmation": true
  }
}
```

**エラー:**
| コード | 説明 |
|---|---|
| EMAIL_ALREADY_EXISTS | メールアドレスが既に登録済み |
| UNDER_AGE | 13歳未満 |

---

#### POST /auth/confirm
メール確認コードを検証

**リクエスト:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**レスポンス（成功）:**
```json
{
  "data": {
    "confirmed": true
  }
}
```

**エラー:**
| コード | 説明 |
|---|---|
| INVALID_CODE | コードが無効または期限切れ |

---

#### POST /auth/resend-code
確認コードを再送信

**リクエスト:**
```json
{
  "email": "user@example.com"
}
```

**レスポンス（成功）:**
```json
{
  "data": {
    "sent": true
  }
}
```

---

#### POST /auth/login
ログイン

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス（成功）:**
```json
{
  "data": {
    "accessToken": "xxx",
    "refreshToken": "xxx",
    "expiresIn": 3600,
    "user": {
      "userId": "uuid-xxx",
      "email": "user@example.com",
      "appId": "yamada_taro",
      "displayName": "山田太郎",
      "profileImageUrl": "https://...",
      "hasCompletedOnboarding": true
    }
  }
}
```

**エラー:**
| コード | 説明 |
|---|---|
| INVALID_CREDENTIALS | メールアドレスまたはパスワードが間違い |
| EMAIL_NOT_CONFIRMED | メール未確認 |
| ACCOUNT_BANNED | アカウントがBAN |

---

#### POST /auth/logout
ログアウト（現在のセッションを無効化）

**リクエスト:** なし

**レスポンス（成功）:**
```json
{
  "data": {
    "loggedOut": true
  }
}
```

---

#### POST /auth/refresh
アクセストークンをリフレッシュ

**リクエスト:**
```json
{
  "refreshToken": "xxx"
}
```

**レスポンス（成功）:**
```json
{
  "data": {
    "accessToken": "xxx",
    "expiresIn": 3600
  }
}
```

---

#### POST /auth/forgot-password
パスワードリセットを開始（確認コードをメール送信）

**リクエスト:**
```json
{
  "email": "user@example.com"
}
```

**レスポンス（成功）:**
```json
{
  "data": {
    "sent": true
  }
}
```

---

#### POST /auth/reset-password
パスワードリセットを実行

**リクエスト:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

**レスポンス（成功）:**
```json
{
  "data": {
    "reset": true
  }
}
```

---

#### POST /auth/change-email
メールアドレス変更を開始

**リクエスト:**
```json
{
  "newEmail": "newemail@example.com"
}
```

**レスポンス（成功）:**
```json
{
  "data": {
    "sent": true
  }
}
```

---

#### POST /auth/confirm-email-change
メールアドレス変更を確認

**リクエスト:**
```json
{
  "code": "123456"
}
```

**レスポンス（成功）:**
```json
{
  "data": {
    "email": "newemail@example.com"
  }
}
```

---

### 4.2 ユーザー系（Users）

#### GET /users/me
自分のプロフィールを取得

**レスポンス:**
```json
{
  "data": {
    "userId": "uuid-xxx",
    "appId": "yamada_taro",
    "displayName": "山田太郎",
    "email": "user@example.com",
    "birthDate": "2000-01-15",
    "profileImageUrl": "https://...",
    "visibilityType": "mutual",
    "followingCount": 42,
    "followerCount": 38,
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

---

#### PATCH /users/me
プロフィールを更新

**リクエスト:**
```json
{
  "username": "yamada_taro",
  "displayName": "山田太郎（更新）",
  "bio": "よろしくお願いします",
  "isPrivate": false
}
```

**バリデーション:**
- username: 3〜20文字、英数字とアンダースコアのみ、重複不可
- displayName: 1〜50文字
- bio: 200文字以下
- isPrivate: boolean

**レスポンス:**
```json
{
  "data": {
    "message": "Profile updated successfully",
    "user": {
      "userId": "uuid-xxx",
      "username": "yamada_taro",
      "displayName": "山田太郎（更新）",
      "bio": "よろしくお願いします",
      "isPrivate": false,
      "profileImageUrl": "https://..."
    }
  }
}
```

---

#### POST /users/me/app-id
アプリ内IDを設定（初回のみ、変更不可）

**リクエスト:**
```json
{
  "appId": "yamada_taro"
}
```

**バリデーション:**
- 3〜15文字
- 英小文字(a-z) + 数字(0-9) + アンダースコア(_)
- 先頭は英字
- 予約語（admin, support）は不可
- 重複不可

**レスポンス:**
```json
{
  "data": {
    "appId": "yamada_taro"
  }
}
```

**エラー:**
| コード | 説明 |
|---|---|
| APP_ID_ALREADY_SET | 既にアプリ内IDを設定済み |
| APP_ID_TAKEN | このIDは既に使用されている |
| APP_ID_RESERVED | 予約語のため使用不可 |
| APP_ID_INVALID | 形式が不正 |

---

#### GET /users/me/check-app-id
アプリ内IDの重複チェック

**クエリパラメータ:**
- appId: チェックしたいID

**レスポンス:**
```json
{
  "data": {
    "appId": "yamada_taro",
    "available": true
  }
}
```

---

#### POST /users/me/profile-image
プロフィール画像アップロード用のpresigned URLを取得

**リクエスト:**
```json
{
  "contentType": "image/jpeg",
  "fileName": "profile.jpg"
}
```

**バリデーション:**
- contentType: `image/jpeg`, `image/png`, `image/webp` のいずれか
- fileName: 必須

**レスポンス:**
```json
{
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...(presigned URL)",
    "imageUrl": "https://bucket.s3.amazonaws.com/profiles/userId/timestamp.jpg",
    "expiresIn": 300
  }
}
```

**備考:**
- クライアントは `uploadUrl` に対してPUTリクエストで画像をアップロード
- アップロード完了後、`imageUrl` がプロフィール画像URLとして使用される
- presigned URLの有効期限は5分（300秒）
- DBのprofileImageUrlは自動的に更新される

---

#### DELETE /users/me/profile-image
プロフィール画像を削除（デフォルトに戻す）

**レスポンス:**
```json
{
  "data": {
    "deleted": true
  }
}
```

---

#### DELETE /users/me
アカウント削除（退会）

**リクエスト:**
```json
{
  "confirmation": "DELETE"
}
```

**レスポンス:**
```json
{
  "data": {
    "deletionStarted": true
  }
}
```

**備考:**
- Step Functionsで段階的に削除処理を実行
- 即座に全セッションを無効化

---

#### GET /users/:appId
他ユーザーのプロフィールを取得

**パスパラメータ:**
- appId: 対象ユーザーのアプリ内ID

**レスポンス:**
```json
{
  "data": {
    "userId": "uuid-yyy",
    "appId": "tanaka_hanako",
    "displayName": "田中花子",
    "profileImageUrl": "https://...",
    "followingCount": 100,
    "followerCount": 200,
    "isFollowing": true,
    "isFollowedBy": true,
    "isBlocked": false,
    "isBlockedBy": false
  }
}
```

**エラー:**
| コード | 説明 |
|---|---|
| USER_NOT_FOUND | ユーザーが見つからない |
| USER_BLOCKED | ブロック関係にある |

---

#### GET /users/search
ユーザーを検索（アプリ内ID完全一致）

**クエリパラメータ:**
- q: 検索クエリ（アプリ内ID）

**レスポンス:**
```json
{
  "data": {
    "user": {
      "userId": "uuid-yyy",
      "appId": "tanaka_hanako",
      "displayName": "田中花子",
      "profileImageUrl": "https://..."
    }
  }
}
```

**備考:**
- ブロック関係のユーザーは検索結果に出ない
- 見つからない場合は `user: null`

---

### 4.3 フォロー系（Follows）

#### POST /users/:userId/follow
ユーザーをフォロー

**パスパラメータ:**
- userId: フォロー対象のユーザーID

**レスポンス:**
```json
{
  "data": {
    "following": true
  }
}
```

**エラー:**
| コード | 説明 |
|---|---|
| CANNOT_FOLLOW_SELF | 自分自身はフォローできない |
| USER_BLOCKED | ブロック関係にある |
| ALREADY_FOLLOWING | 既にフォロー中 |

---

#### DELETE /users/:userId/follow
フォローを解除

**レスポンス:**
```json
{
  "data": {
    "following": false
  }
}
```

---

#### GET /users/me/following
フォロー一覧を取得

**クエリパラメータ:**
- limit: 取得件数（デフォルト: 20）
- cursor: ページネーションカーソル

**レスポンス:**
```json
{
  "data": {
    "items": [
      {
        "userId": "uuid-yyy",
        "appId": "tanaka_hanako",
        "displayName": "田中花子",
        "profileImageUrl": "https://...",
        "followedAt": "2026-01-20T10:00:00Z"
      }
    ],
    "nextCursor": "xxx"
  }
}
```

---

#### GET /users/me/followers
フォロワー一覧を取得

**レスポンス:** フォロー一覧と同じ形式

---

#### GET /users/:userId/follow-status
フォロー状態を確認

**レスポンス:**
```json
{
  "data": {
    "isFollowing": true,
    "isFollowedBy": true,
    "isMutual": true
  }
}
```

---

### 4.4 お題・回答系（Questions / Answers）

#### GET /questions/today
今日の質問を取得

**未公開時のレスポンス（公開時刻前）:**
```json
{
  "data": {
    "date": "2026-02-04",
    "isPublished": false,
    "question": null,
    "hasAnswered": false,
    "userAnswer": null
  }
}
```

**公開後のレスポンス（未回答）:**
```json
{
  "data": {
    "date": "2026-02-04",
    "isPublished": true,
    "publishedAt": "2026-02-04T05:30:00Z",
    "question": {
      "questionId": "uuid-qqq",
      "text": "最近ハマっていることは？",
      "category": null
    },
    "hasAnswered": false,
    "userAnswer": null
  }
}
```

**回答済みの場合:**
```json
{
  "data": {
    "date": "2026-02-04",
    "isPublished": true,
    "publishedAt": "2026-02-04T05:30:00Z",
    "question": {
      "questionId": "uuid-qqq",
      "text": "最近ハマっていることは？",
      "category": null
    },
    "hasAnswered": true,
    "userAnswer": {
      "text": "読書にハマってます！",
      "isOnTime": true,
      "lateMinutes": 0,
      "isDeleted": false,
      "createdAt": "2026-02-04T05:45:00Z"
    }
  }
}
```

**備考:**
- 毎日0:00 JSTに当日の公開時刻（10:00〜21:00 JSTのランダム）が決定される
- 公開時刻前は `isPublished: false`、`question: null`
- 公開予定時刻はユーザーには公開しない（サプライズ要素）

---

#### POST /answers
回答を投稿

**リクエスト:**
```json
{
  "text": "読書にハマってます！"
}
```

**バリデーション:**
- 最大80文字
- 改行OK
- URL禁止（http/https検出時エラー）

**レスポンス:**
```json
{
  "data": {
    "date": "2026-02-04",
    "text": "読書にハマってます！",
    "isOnTime": true,
    "lateMinutes": 0,
    "isFlagged": false,
    "createdAt": "2026-02-04T14:45:00Z"
  }
}
```

**エラー:**
| コード | 説明 |
|---|---|
| ALREADY_ANSWERED | 既に今日回答済み |
| ANSWER_DELETED | 削除済みで再投稿不可 |
| QUESTION_NOT_PUBLISHED | 質問がまだ公開されていない |
| URL_NOT_ALLOWED | URLが含まれている |

---

#### DELETE /answers/:date
回答を削除

**パスパラメータ:**
- date: 回答日（YYYY-MM-DD）

**レスポンス:**
```json
{
  "data": {
    "deleted": true
  }
}
```

---

#### POST /answers/:date/restore
削除した回答を復活

**パスパラメータ:**
- date: 回答日（YYYY-MM-DD）

**レスポンス:**
```json
{
  "data": {
    "restored": true,
    "answer": {
      "text": "読書にハマってます！",
      "isOnTime": true,
      "lateMinutes": 0,
      "createdAt": "2026-02-04T14:45:00Z"
    }
  }
}
```

**エラー:**
| コード | 説明 |
|---|---|
| ANSWER_NOT_DELETED | 削除されていない |
| ANSWER_NOT_FOUND | 回答が存在しない |

---

#### GET /answers/timeline
タイムライン（フォロー中の人の今日の回答）を取得

**クエリパラメータ:**
- date: 日付（省略時は今日、YYYY-MM-DD）

**レスポンス:**
```json
{
  "data": {
    "date": "2026-02-04",
    "questionText": "最近ハマっていることは？",
    "hasAnswered": true,
    "items": [
      {
        "answerId": "2026-02-04#uuid-yyy",
        "user": {
          "userId": "uuid-yyy",
          "appId": "tanaka_hanako",
          "displayName": "田中花子",
          "profileImageUrl": "https://..."
        },
        "text": "筋トレです💪",
        "displayText": "筋トレです💪",
        "isOnTime": true,
        "lateMinutes": 0,
        "createdAt": "2026-02-04T14:35:00Z",
        "myReaction": "🔥"
      }
    ]
  }
}
```

**備考:**
- `hasAnswered: false` の場合、`items` は空配列
- NGワードがある場合、`displayText` はマスクされた文字列
- 並び順: On-time優先 → 投稿が早い順

---

#### GET /answers/me
自分の過去回答一覧を取得

**クエリパラメータ:**
- limit: 取得件数
- cursor: ページネーションカーソル

**レスポンス:**
```json
{
  "data": {
    "items": [
      {
        "answerId": "answer-uuid-1",
        "date": "2026-02-04",
        "questionText": "最近ハマっていることは？",
        "text": "読書にハマってます！",
        "isOnTime": true,
        "lateMinutes": 0,
        "isDeleted": false,
        "createdAt": "2026-02-04T14:45:00Z"
      },
      {
        "answerId": "answer-uuid-2",
        "date": "2026-02-03",
        "questionText": "好きな季節は？",
        "text": "春が好きです",
        "isOnTime": false,
        "lateMinutes": 120,
        "isDeleted": true,
        "createdAt": "2026-02-03T18:00:00Z",
        "deletedAt": "2026-02-03T19:00:00Z"
      }
    ],
    "nextCursor": "xxx"
  }
}
```

---

### 4.5 リアクション系（Reactions）

#### PUT /answers/:answerId/reactions
リアクションを付与/変更

**パスパラメータ:**
- answerId: 回答ID（`{date}#{userId}` 形式）

**リクエスト:**
```json
{
  "reactionType": "🔥"
}
```

**バリデーション:**
- reactionType: ❤️, 🔥, 😂, 🤔, 👀 のいずれか

**レスポンス:**
```json
{
  "data": {
    "reactionType": "🔥"
  }
}
```

---

#### DELETE /answers/:answerId/reactions
リアクションを解除

**レスポンス:**
```json
{
  "data": {
    "removed": true
  }
}
```

---

#### GET /answers/:answerId/reactions
回答のリアクション一覧を取得

**レスポンス:**
```json
{
  "data": {
    "items": [
      {
        "user": {
          "userId": "uuid-zzz",
          "appId": "suzuki_ichiro",
          "displayName": "鈴木一郎",
          "profileImageUrl": "https://..."
        },
        "reactionType": "❤️",
        "createdAt": "2026-02-04T15:00:00Z"
      }
    ]
  }
}
```

---

### 4.6 ブロック系（Blocks）

#### POST /users/:userId/block
ユーザーをブロック

**レスポンス:**
```json
{
  "data": {
    "blocked": true
  }
}
```

**備考:**
- 双方のフォロー関係を自動解除

---

#### DELETE /users/:userId/block
ブロックを解除

**レスポンス:**
```json
{
  "data": {
    "blocked": false
  }
}
```

---

#### GET /users/me/blocks
ブロック一覧を取得

**レスポンス:**
```json
{
  "data": {
    "items": [
      {
        "userId": "uuid-xxx",
        "appId": "blocked_user",
        "displayName": "ブロックした人",
        "profileImageUrl": "https://...",
        "blockedAt": "2026-01-30T10:00:00Z"
      }
    ],
    "nextCursor": null
  }
}
```

---

### 4.7 通報系（Reports）

#### POST /reports
通報を送信

**リクエスト:**
```json
{
  "targetType": "user",
  "targetId": "uuid-xxx",
  "category": "harassment",
  "description": "不適切なメッセージを送ってきました"
}
```

**バリデーション:**
- targetType: `user` または `answer`
- category: `spam`, `harassment`, `inappropriate`, `impersonation`, `privacy`, `other`
- description: 任意、最大500文字

**レスポンス:**
```json
{
  "data": {
    "reportId": "uuid-rrr",
    "submitted": true
  }
}
```

---

### 4.8 ユーザーお題系（Question Submissions）

#### POST /questions/submit
お題を提出

**リクエスト:**
```json
{
  "text": "子供の頃の夢は何でしたか？"
}
```

**バリデーション:**
- 最大80文字
- 改行OK
- URL禁止
- 今日の回答を投稿済みであること
- 今日まだお題を提出していないこと

**レスポンス:**
```json
{
  "data": {
    "submitted": true
  }
}
```

**エラー:**
| コード | 説明 |
|---|---|
| NOT_ANSWERED_TODAY | 今日の回答をまだ投稿していない |
| ALREADY_SUBMITTED_TODAY | 今日は既にお題を提出済み |
| URL_NOT_ALLOWED | URLが含まれている |

---

### 4.9 設定系（Settings）

#### PATCH /settings/visibility
閲覧範囲を設定

**リクエスト:**
```json
{
  "visibilityType": "followers"
}
```

**バリデーション:**
- visibilityType: `mutual` または `followers`

**レスポンス:**
```json
{
  "data": {
    "visibilityType": "followers"
  }
}
```

---

#### POST /settings/push-token
プッシュ通知トークンを登録

**リクエスト:**
```json
{
  "token": "ExponentPushToken[xxxx]",
  "deviceType": "ios"
}
```

**レスポンス:**
```json
{
  "data": {
    "registered": true
  }
}
```

---

#### DELETE /settings/push-token
プッシュ通知トークンを削除

**リクエスト:**
```json
{
  "token": "ExponentPushToken[xxxx]"
}
```

**レスポンス:**
```json
{
  "data": {
    "deleted": true
  }
}
```

---

### 4.10 アプリ系（App）

#### GET /app/version
アプリバージョンチェック（強制アップデート判定）

**クエリパラメータ:**
- platform: `ios` または `android`
- version: 現在のアプリバージョン（例: `1.0.0`）

**レスポンス:**
```json
{
  "data": {
    "currentVersion": "1.0.0",
    "minimumVersion": "1.0.0",
    "latestVersion": "1.1.0",
    "updateRequired": false,
    "updateAvailable": true,
    "storeUrl": "https://apps.apple.com/..."
  }
}
```

---

## 5. 管理画面用API

管理画面用のAPIは `/admin` プレフィックスで提供（同一API Gateway内）。
認証は Cognito ID Token を使用（モバイルアプリと同じ）。管理者権限チェックはフロントエンドで `isAdmin` フラグを確認。

### エンドポイント一覧

| メソッド | エンドポイント | 説明 | 実装状況 |
|---|---|---|---|
| GET | /admin/ng-words | NGワード一覧 | ✅ |
| POST | /admin/ng-words | NGワード追加 | ✅ |
| DELETE | /admin/ng-words/{word} | NGワード削除 | ✅ ※11 |
| GET | /admin/questions | お題一覧 | ✅ |
| POST | /admin/questions | 運営お題追加 | ✅ |
| POST | /admin/daily-question | 今日のお題設定 | ✅ |
| GET | /admin/reports | 通報一覧 | ✅ |
| PUT | /admin/reports/{reportId} | 通報ステータス更新 | ✅ |
| GET | /admin/submissions | ユーザー提案お題一覧 | ✅ |
| PUT | /admin/submissions/{submissionId} | 提案お題の承認/却下 | ✅ |
| GET | /admin/users | ユーザー一覧/検索 | ✅ |
| POST | /admin/users/{userId}/ban | ユーザーBAN | ✅ |
| DELETE | /admin/users/{userId}/ban | BAN解除 | ✅ |
| GET | /admin/flagged-posts | フラグ付き投稿一覧 | ✅ |
| PUT | /admin/flagged-posts/{answerId} | フラグ付き投稿の対応 | ✅ |
| GET | /admin/logs | 監査ログ一覧 | ✅ |

> **変更理由:**
> - ※11: パスパラメータはURLエンコードされたNGワード文字列（日本語対応）。バックエンドでdecodeURIComponentして処理

### 共通レスポンス形式

すべての一覧APIは以下の形式で返却：
```json
{
  "data": {
    "items": [...],
    "nextCursor": "xxx" // ページネーション用（オプション）
  }
}
```

### ログインAPIのisAdmin追加

`POST /auth/login` のレスポンスに `isAdmin` フラグを追加：
```json
{
  "data": {
    "user": {
      "userId": "...",
      "email": "...",
      "isAdmin": true  // 管理者フラグ
    },
    "accessToken": "...",
    "idToken": "...",
    "refreshToken": "..."
  }
}
```

### 監査ログ（AdminLogs）

管理者操作は自動的に監査ログに記録される。記録されるアクション：
- `ADD_NG_WORD` / `DELETE_NG_WORD`
- `CREATE_QUESTION` / `SET_DAILY_QUESTION`
- `UPDATE_REPORT`
- `REVIEW_SUBMISSION`
- `BAN_USER` / `UNBAN_USER`
- `REVIEW_FLAGGED_POST`

---

## 6. レート制限

| エンドポイント | 制限 |
|---|---|
| POST /auth/login | 5回/分/IP |
| POST /auth/signup | 3回/分/IP |
| POST /auth/forgot-password | 3回/分/IP |
| POST /users/:userId/follow | 60回/分/ユーザー |
| POST /answers | 10回/分/ユーザー |
| POST /reports | 10回/分/ユーザー |
| その他 | 100回/分/ユーザー |

---

## 7. WebSocket（将来検討）

MVP後の機能追加として、リアルタイム通知用のWebSocket接続を検討。

- 新しい回答の通知
- リアクション通知
- フォロー通知

※ MVPではプッシュ通知のみで対応
