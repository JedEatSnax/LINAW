FROM node:18-alpine AS deps
WORKDIR /backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --only=production --silent


FROM node:18-alpine AS builder
WORKDIR /backend
COPY --from=deps /backend/node_modules ./node_modules
COPY backend/ ./
RUN if [ -f package.json ] && grep -q "\"build\"" package.json; then npm run build; fi


FROM cgr.dev/chainguard/node:latest AS runner
WORKDIR /backend
COPY --from=builder /backend ./
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]