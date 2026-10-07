FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29.8-alpine
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build --chown=nginx:nginx /app/dist/ /usr/share/nginx/html/
EXPOSE 8080
