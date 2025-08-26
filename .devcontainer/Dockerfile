# Utiliza una imagen base de Node.js
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Instalar herramientas adicionales
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm globalmente (opcional, si lo prefieres sobre npm)
RUN npm install -g pnpm

# Instalar las dependencias globales que necesitas
RUN npm install -g @nestjs/cli typescript ts-node

# Configurar el workspace
WORKDIR /workspace

# El resto de la configuración (como la instalación de dependencias y la construcción)
# se manejará a través del devcontainer.json y los scripts post-create