#!/bin/zsh
# お題一括投入スクリプト
# 使い方: zsh scripts/bulk-import-questions.sh

TABLE_NAME="dev-q-questions"
INPUT_FILE="docs/初期お題.txt"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# お題を読み込み（空行を除く）
QUESTIONS=()
while IFS= read -r line; do
  line=$(echo "$line" | xargs)
  if [ -n "$line" ]; then
    QUESTIONS+=("$line")
  fi
done < "$INPUT_FILE"

TOTAL=${#QUESTIONS[@]}
echo "${TOTAL} 件のお題を読み込みました"

if [ "$TOTAL" -eq 0 ]; then
  echo "お題が見つかりません。${INPUT_FILE} を確認してください。"
  exit 1
fi

IMPORTED=0

# 25件ずつバッチ処理
for ((i=1; i<=TOTAL; i+=25)); do
  ITEMS=""
  END=$((i + 24))
  if [ "$END" -gt "$TOTAL" ]; then
    END=$TOTAL
  fi

  for ((j=i; j<=END; j++)); do
    UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    TEXT="${QUESTIONS[$j]}"
    # JSON内の特殊文字をエスケープ
    TEXT=$(echo "$TEXT" | sed 's/\\/\\\\/g; s/"/\\"/g')

    ITEM="{\"PutRequest\":{\"Item\":{\"questionId\":{\"S\":\"${UUID}\"},\"text\":{\"S\":\"${TEXT}\"},\"type\":{\"S\":\"admin\"},\"status\":{\"S\":\"approved\"},\"isFlagged\":{\"BOOL\":false},\"createdAt\":{\"S\":\"${TIMESTAMP}\"},\"updatedAt\":{\"S\":\"${TIMESTAMP}\"}}}}"

    if [ -n "$ITEMS" ]; then
      ITEMS="${ITEMS},${ITEM}"
    else
      ITEMS="${ITEM}"
    fi
  done

  # batch-write-item 実行
  aws dynamodb batch-write-item \
    --request-items "{\"${TABLE_NAME}\":[${ITEMS}]}" \
    --output text > /dev/null 2>&1

  if [ $? -ne 0 ]; then
    echo "エラー: バッチ $(( (i-1)/25 + 1 )) の投入に失敗しました"
    # エラー詳細を表示
    aws dynamodb batch-write-item \
      --request-items "{\"${TABLE_NAME}\":[${ITEMS}]}" 2>&1
    exit 1
  fi

  IMPORTED=$((END))
  echo "  ${IMPORTED} / ${TOTAL} 件完了"
done

echo ""
echo "全 ${IMPORTED} 件のお題を ${TABLE_NAME} に投入しました！"
