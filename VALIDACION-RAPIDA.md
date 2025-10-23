# Guía de Validación Rápida - Shift Management

Esta guía contiene comandos esenciales para validar rápidamente el estado del proyecto.

## 🚀 Setup Inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/NahuelArg/shift-management.git
cd shift-management

# 2. Instalar dependencias del servidor
cd server
npm install

# 3. Instalar dependencias del cliente
cd ../client
npm install

# 4. Configurar variables de entorno
cd ../server
cp .env.example .env
# Editar .env con tus credenciales

cd ../client
cp .env.example .env
# Editar .env con la URL del API
```

## 🔍 Validaciones Esenciales (5 minutos)

```bash
# Desde la raíz del proyecto

# 1. Verificar linting del servidor
cd server && npm run lint && cd ..

# 2. Verificar linting del cliente
cd client && npm run lint && cd ..

# 3. Verificar schema de Prisma
cd server && npx prisma validate && cd ..

# 4. Verificar vulnerabilidades
cd server && npm audit && cd ..
cd client && npm audit && cd ..

# 5. Verificar build del servidor
cd server && npm run build && cd ..

# 6. Verificar build del cliente
cd client && npm run build && cd ..
```

## ⚡ Inicio Rápido en Desarrollo

```bash
# Terminal 1 - Backend
cd server
npm run start:dev
# Espera a ver: "Application is running on: http://localhost:3000"

# Terminal 2 - Frontend
cd client
npm run dev
# Abre: http://localhost:5173

# Terminal 3 - Prisma Studio (opcional)
cd server
npx prisma studio
# Abre: http://localhost:5555
```

## 🧪 Tests

```bash
# Tests del servidor (si funcionan)
cd server
npm run test

# Tests con coverage
npm run test:cov

# Tests E2E
npm run test:e2e
```

## 🔒 Validaciones de Seguridad

```bash
# 1. Buscar secretos expuestos
grep -r "API_KEY\|SECRET\|PASSWORD" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .

# 2. Verificar .gitignore
cat .gitignore | grep -E "\.env|node_modules"

# 3. Verificar que .env no esté commiteado
git ls-files | grep "\.env$"
# Si retorna algo, ¡hay un problema!

# 4. Audit de npm
cd server && npm audit
cd ../client && npm audit
```

## 📊 Checks de Base de Datos

```bash
cd server

# Ver estado de migraciones
npx prisma migrate status

# Generar cliente de Prisma
npx prisma generate

# Abrir Prisma Studio (GUI)
npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name descripcion_cambio

# Formatear schema
npx prisma format
```

## 🐳 Docker

```bash
# Build de imagen del servidor
cd server
docker build -t shift-management-server .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env shift-management-server

# Ver tamaño de imagen
docker images | grep shift-management
```

## 🌐 Validación de APIs

```bash
# Healthcheck del backend
curl http://localhost:3000/

# Verificar Swagger
curl http://localhost:3000/api
# O abre en navegador: http://localhost:3000/api

# Test de login (requiere servidor corriendo)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Test de registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"nuevo@test.com",
    "password":"test123",
    "name":"Usuario Nuevo",
    "role":"CLIENT"
  }'
```

## 📈 Análisis de Código

```bash
# Buscar TODOs
grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" server/src client/src

# Detectar importaciones circulares
cd server
npx madge --circular --extensions ts src/

# Contar líneas de código
cloc server/src client/src

# Analizar bundle size (después de build)
cd client
npm run build
ls -lh dist/
```

## 🔧 Troubleshooting

### Problema: "jest: not found"
```bash
cd server
rm -rf node_modules package-lock.json
npm install
npm run test
```

### Problema: "Prisma Client is not generated"
```bash
cd server
npx prisma generate
```

### Problema: "DATABASE_URL not found"
```bash
cd server
cp .env.example .env
# Edita .env con tu conexión a MySQL
```

### Problema: Puerto 3000 ya en uso
```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O cambiar puerto en .env
echo "PORT=3001" >> server/.env
```

### Problema: CORS en producción
```bash
# Verificar configuración actual
cd server
grep "enableCors" src/main.ts

# Debe usar variable de entorno
# En .env:
ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
```

## ✅ Checklist Pre-Deployment

```bash
# Ejecutar TODOS estos comandos antes de deployment

cd server

# 1. Linting limpio
npm run lint

# 2. Tests pasan
npm run test

# 3. Build exitoso
npm run build

# 4. Sin vulnerabilidades críticas
npm audit --audit-level=high

# 5. Prisma schema válido
npx prisma validate

# 6. Variables de entorno configuradas
cat .env | grep -E "DATABASE_URL|JWT_SECRET|PORT"

cd ../client

# 7. Linting limpio del cliente
npm run lint

# 8. Build del cliente exitoso
npm run build

# 9. Sin vulnerabilidades críticas
npm audit --audit-level=high

# 10. .env configurado
cat .env | grep VITE_API_URL
```

## 📱 Comandos One-Liner Útiles

```bash
# Reiniciar todo desde cero
cd shift-management && rm -rf server/node_modules client/node_modules && cd server && npm install && cd ../client && npm install

# Actualizar todas las dependencias (cuidado!)
cd server && npx npm-check-updates -u && npm install
cd ../client && npx npm-check-updates -u && npm install

# Ver puertos en uso
netstat -tuln | grep -E '3000|5173|5555'

# Limpiar builds
rm -rf server/dist client/dist

# Ver logs del servidor en desarrollo
cd server && npm run start:dev 2>&1 | tee server.log

# Backup de base de datos (MySQL)
mysqldump -u root -p shift_management > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u root -p shift_management < backup_20250123.sql
```

## 🎯 Flujo de Trabajo Recomendado

### Para Desarrollo Diario
```bash
# 1. Actualizar código
git pull origin main

# 2. Instalar dependencias (si package.json cambió)
cd server && npm install && cd ../client && npm install && cd ..

# 3. Generar Prisma Client (si schema cambió)
cd server && npx prisma generate && cd ..

# 4. Levantar servicios
# Terminal 1
cd server && npm run start:dev

# Terminal 2
cd client && npm run dev

# 5. Hacer cambios...

# 6. Antes de commit
cd server && npm run lint && npm run test
cd client && npm run lint
```

### Para Nueva Feature
```bash
# 1. Crear branch
git checkout -b feature/nombre-feature

# 2. Desarrollo...

# 3. Tests
cd server && npm run test

# 4. Lint
cd server && npm run lint
cd client && npm run lint

# 5. Build
cd server && npm run build
cd client && npm run build

# 6. Commit
git add .
git commit -m "feat: descripción de la feature"
git push origin feature/nombre-feature
```

## 🆘 Recursos Adicionales

- **Documentación completa**: Ver `ANALISIS-ARQUITECTURA.md`
- **API Docs**: http://localhost:3000/api (cuando servidor esté corriendo)
- **Prisma Docs**: https://www.prisma.io/docs
- **NestJS Docs**: https://docs.nestjs.com
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev

## 📞 Soporte

Si encuentras problemas:
1. Revisa `ANALISIS-ARQUITECTURA.md` sección "Problemas Prioritarios"
2. Busca en Issues de GitHub
3. Contacta al equipo de desarrollo

---

**Última actualización**: Enero 2025  
**Mantenido por**: Equipo de Desarrollo
