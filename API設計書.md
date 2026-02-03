# API設計書 — Q.（仮）

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
  "success": true,
  "data": { ... }
}
```

**エラー時:**
```json
{
  "success": false,
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
  "success": true,
  "data": {
    "items": [ ... ],
    "nextCursor": "xxx" // 次ページがある場合
  }
}
```

---

## 3. エンドポイント一覧

### 認証系（Auth）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| POST | /auth/signup | ユーザー登録 | 不要 |
| POST | /auth/confirm | メール確認（コード検証） | 不要 |
| POST | /auth/resend-code | 確認コード再送信 | 不要 |
| POST | /auth/login | ログイン | 不要 |
| POST | /auth/logout | ログアウト | 必要 |
| POST | /auth/refresh | トークンリフレッシュ | 不要 |
| POST | /auth/forgot-password | パスワードリセット開始 | 不要 |
| POST | /auth/reset-password | パスワードリセット実行 | 不要 |
| POST | /auth/change-email | メールアドレス変更 | 必要 |
| POST | /auth/confirm-email-change | メール変更確認 | 必要 |

### ユーザー系（Users）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| GET | /users/me | 自分のプロフィール取得 | 必要 |
| PATCH | /users/me | プロフィール更新 | 必要 |
| POST | /users/me/app-id | アプリ内ID設定（初回のみ） | 必要 |
| GET | /users/me/check-app-id | アプリ内ID重複チェック | 必要 |
| POST | /users/me/profile-image | プロフィール画像アップロード | 必要 |
| DELETE | /users/me/profile-image | プロフィール画像削除 | 必要 |
| DELETE | /users/me | アカウント削除（退会） | 必要 |
| GET | /users/:appId | 他ユーザーのプロフィール取得 | 必要 |
| GET | /users/search | ユーザー検索（ID完全一致） | 必要 |

### フォロー系（Follows）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| POST | /users/:userId/follow | フォローする | 必要 |
| DELETE | /users/:userId/follow | フォロー解除 | 必要 |
| GET | /users/me/following | フォロー一覧 | 必要 |
| GET | /users/me/followers | フォロワー一覧 | 必要 |
| GET | /users/:userId/follow-status | フォロー状態確認 | 必要 |

### お題・回答系（Questions / Answers）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| GET | /questions/today | 今日の質問を取得 | 必要 |
| POST | /answers | 回答を投稿 | 必要 |
| DELETE | /answers/:date | 回答を削除 | 必要 |
| POST | /answers/:date/restore | 削除した回答を復活 | 必要 |
| GET | /answers/timeline | タイムライン取得 | 必要 |
| GET | /answers/me | 自分の過去回答一覧 | 必要 |

### リアクション系（Reactions）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| PUT | /answers/:answerId/reactions | リアクション付与/変更 | 必要 |
| DELETE | /answers/:answerId/reactions | リアクション解除 | 必要 |
| GET | /answers/:answerId/reactions | リアクション一覧取得 | 必要 |

### ブロック系（Blocks）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| POST | /users/:userId/block | ブロックする | 必要 |
| DELETE | /users/:userId/block | ブロック解除 | 必要 |
| GET | /users/me/blocks | ブロック一覧 | 必要 |

### 通報系（Reports）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| POST | /reports | 通報を送信 | 必要 |

### ユーザーお題系（Question Submissions）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| POST | /questions/submit | お題を提出 | 必要 |

### 設定系（Settings）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| PATCH | /settings/visibility | 閲覧範囲設定 | 必要 |
| POST | /settings/push-token | プッシュ通知トークン登録 | 必要 |
| DELETE | /settings/push-token | プッシュ通知トークン削除 | 必要 |

### アプリ系（App）
| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| GET | /app/version | アプリバージョンチェック | 不要 |

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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "displayName": "山田太郎（更新）"
}
```

**バリデーション:**
- displayName: 1〜20文字、絵文字不可、許可文字のみ

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid-xxx",
    "displayName": "山田太郎（更新）",
    "updatedAt": "2026-02-04T12:00:00Z"
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
  "success": true,
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
  "success": true,
  "data": {
    "appId": "yamada_taro",
    "available": true
  }
}
```

---

#### POST /users/me/profile-image
プロフィール画像をアップロード

**リクエスト:** `multipart/form-data`
- image: 画像ファイル（JPEG, PNG, HEIC）

**バリデーション:**
- 最大5MB
- JPEG, PNG, HEIC形式

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "profileImageUrl": "https://s3.../xxx.jpg"
  }
}
```

---

#### DELETE /users/me/profile-image
プロフィール画像を削除（デフォルトに戻す）

**レスポンス:**
```json
{
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "date": "2026-02-04",
    "questionId": "uuid-qqq",
    "questionText": "最近ハマっていることは？",
    "publishedAt": "2026-02-04T14:30:00Z",
    "hasAnswered": false,
    "myAnswer": null
  }
}
```

**回答済みの場合:**
```json
{
  "success": true,
  "data": {
    "date": "2026-02-04",
    "questionId": "uuid-qqq",
    "questionText": "最近ハマっていることは？",
    "publishedAt": "2026-02-04T14:30:00Z",
    "hasAnswered": true,
    "myAnswer": {
      "text": "読書にハマってます！",
      "isOnTime": true,
      "lateMinutes": 0,
      "isDeleted": false,
      "createdAt": "2026-02-04T14:45:00Z"
    }
  }
}
```

**備考:**
- 公開時刻前は `questionText: null`、`isPublished: false`

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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
  "data": {
    "items": [
      {
        "date": "2026-02-04",
        "questionText": "最近ハマっていることは？",
        "text": "読書にハマってます！",
        "isOnTime": true,
        "lateMinutes": 0,
        "isDeleted": false,
        "createdAt": "2026-02-04T14:45:00Z"
      },
      {
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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
  "success": true,
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

管理画面用のAPIは別途 `/admin/v1` プレフィックスで提供。
認証は IAM + Cognito Identity を使用。

### エンドポイント一覧

| メソッド | エンドポイント | 説明 |
|---|---|---|
| GET | /admin/v1/questions | お題一覧 |
| POST | /admin/v1/questions | 運営お題追加 |
| PATCH | /admin/v1/questions/:id | お題編集/承認/却下 |
| GET | /admin/v1/reports | 通報一覧 |
| PATCH | /admin/v1/reports/:id | 通報ステータス更新 |
| GET | /admin/v1/users | ユーザー一覧/検索 |
| GET | /admin/v1/users/:id | ユーザー詳細 |
| POST | /admin/v1/users/:id/ban | ユーザーBAN |
| DELETE | /admin/v1/users/:id/ban | BAN解除 |
| GET | /admin/v1/ng-words | NGワード一覧 |
| POST | /admin/v1/ng-words | NGワード追加 |
| DELETE | /admin/v1/ng-words/:word | NGワード削除 |
| GET | /admin/v1/flagged-answers | flagged投稿一覧 |

※ 詳細は管理画面開発時に別途設計

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
