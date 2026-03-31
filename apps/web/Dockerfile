FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG API_INTERNAL_URL=http://api:3001
ENV API_INTERNAL_URL=$API_INTERNAL_URL
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY next.config.ts ./
EXPOSE 3000
CMD ["npm", "run", "start"]
