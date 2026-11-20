FROM node:20-alpine AS base

WORKDIR /app

# Enable corepack for bun/pnpm or install bun
RUN npm install -g bun

COPY package.json bun.lock* ./
RUN bun install

COPY . .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "3000"]
