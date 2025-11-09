# Dockerfile для Next.js приложения

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Отключаем telemetry Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Копируем зависимости из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Устанавливаем переменные окружения для сборки
ENV NODE_ENV=production
# NEXT_PUBLIC_API_URL будет установлен во время сборки или runtime
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000}

# Собираем приложение
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы из standalone сборки
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Копируем standalone сборку (Next.js создает её в .next/standalone)
# Проверяем наличие standalone директории
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

