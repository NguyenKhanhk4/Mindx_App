# Stage 1: Build (Sử dụng Node.js để biên dịch TypeScript)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime (Chỉ giữ lại những gì cần thiết để chạy)
FROM node:22-alpine
WORKDIR /app
# Chỉ copy file đã build và dependencies cần thiết
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["npm", "start"]