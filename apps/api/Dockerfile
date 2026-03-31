FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY prisma ./prisma
COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
RUN mkdir -p /data/pdfs
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
