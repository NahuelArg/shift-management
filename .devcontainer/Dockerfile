FROM mcr.microsoft.com/devcontainers/javascript-node:0-20

# Instalar herramientas adicionales
RUN apt-get update && apt-get install -y \
    mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Instalar Prisma CLI globalmente
RUN npm install -g prisma

# Configurar el directorio de trabajo
WORKDIR /workspaces/shift-management
