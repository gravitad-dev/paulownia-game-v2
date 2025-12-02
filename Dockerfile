# Etapa 1: Build
FROM node:20-alpine AS builder

# Establece directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json (si existe)
COPY package.json ./
COPY package-lock.json ./

# Instala dependencias solo de producción y desarrollo necesarias para el build
RUN npm install

# Copia el resto del código fuente
COPY . .

# Ejecuta el build de Next.js
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine AS runner

# Establece directorio de trabajo
WORKDIR /app

COPY . .

#COPY next.config.js .
# Copia solo lo necesario desde el builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./

# Variable de entorno para producción
ENV NODE_ENV=production

# Puerto por defecto que expone Next.js
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "start"]
