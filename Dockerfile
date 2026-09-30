FROM nginxinc/nginx-unprivileged:1.29.8-alpine

COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx frontend/dist/ /usr/share/nginx/html/

EXPOSE 8080

