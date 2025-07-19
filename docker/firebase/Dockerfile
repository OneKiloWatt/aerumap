FROM node:18-alpine

# Javaとfirebase-toolsをインストール
RUN apk add --no-cache openjdk17 && \
    npm install -g firebase-tools typescript

# 作業ディレクトリ
WORKDIR /app

# volumesでマウントされるので、COPYは不要だが
# 起動時に依存関係をインストールしてからビルド・起動する

# 起動時に依存関係をインストール→ビルド→エミュレーター起動
CMD ["sh", "-c", "cd functions && npm install && npm run build && cd .. && firebase emulators:start --project demo-project --only functions,firestore,auth"]
