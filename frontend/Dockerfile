# ref: https://qiita.com/Nozomuts/items/b3a4fd57d0413d5d3437
FROM node:18 AS builder

WORKDIR /app

COPY ./frontend/zenn-app-router/package.json ./
COPY ./frontend/zenn-app-router/package-lock.json ./
RUN npm ci
COPY ./frontend/zenn-app-router ./
RUN npm run build:standalone

# baseステージをもとにrunnerステージを開始
FROM node:18-slim AS runner

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.7.1 /lambda-adapter /opt/extensions/lambda-adapter
# この値はDockerなら必須のためここで固定
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# public と .next/static は nextjs の standalone を使う場合に含まれないため、コピーする必要がある
# https://nextjs.org/docs/advanced-features/output-file-tracing#automatically-copying-traced-files
# builderから必要なファイルだけコピーする
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# `next start` の代わりに `node server.js` を使用
# https://nextjs.org/docs/advanced-features/output-file-tracing#automatically-copying-traced-files
CMD ["node", "server.js"]
