#!/bin/bash

# Función para verificar si un puerto está en uso
check_port() {
    lsof -i:$1 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "Puerto $1 está en uso. Matando el proceso..."
        lsof -ti:$1 | xargs kill -9
    fi
}

# Matar procesos existentes si es necesario
check_port 3000
check_port 5173

# Iniciar el servidor
echo "Iniciando el servidor..."
cd server
npm run start:dev &
SERVER_PID=$!

# Esperar a que el servidor esté listo
sleep 5

# Iniciar el cliente
echo "Iniciando el cliente..."
cd ../client
npm run dev &
CLIENT_PID=$!

# Función para manejar la señal de interrupción (Ctrl+C)
cleanup() {
    echo "Deteniendo los procesos..."
    kill $SERVER_PID $CLIENT_PID
    exit 0
}

trap cleanup SIGINT

# Mantener el script corriendo
wait
