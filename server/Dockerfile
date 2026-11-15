# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma necesita OpenSSL en Alpine para elegir el engine correcto
RUN apk add --no-cache openssl

# Copiar primero solo los manifiestos aprovecha la caché de capas de Docker:
# si no cambian las dependencias, `npm ci` no se vuelve a ejecutar
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# ---------- Production stage ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Solo dependencias de producción (incluye el CLI de prisma para las migraciones)
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

# Aplica las migraciones pendientes antes de arrancar.
# Si una migración falla, el contenedor no arranca y Render mantiene la versión anterior
# (evita servir código nuevo contra un schema viejo).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
