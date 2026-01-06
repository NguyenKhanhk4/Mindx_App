# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build-time environment variables (Week 2)
ARG VITE_API_URL
ARG VITE_GA_MEASUREMENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
# Remove default nginx static files
RUN rm -rf ./*
# Copy built static files from builder stage
COPY --from=builder /app/dist .
# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]