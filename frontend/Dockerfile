FROM node:lts-alpine AS build
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./

# Variaveis VITE_* sao lidas em build time pelo Vite, nao em runtime — precisam
# chegar como build arg (Railway injeta as variaveis do servico automaticamente
# como build args em builds via Dockerfile).
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM caddy
WORKDIR /app
COPY Caddyfile ./
RUN caddy fmt Caddyfile --overwrite
COPY --from=build /app/dist ./dist
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]
