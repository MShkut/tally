#!/bin/sh

# Start the API server in the background
echo "Starting Tally API server..."
cd /app/api
node server.js &
API_PID=$!

# Wait a moment for the API to start
sleep 2

# Start nginx in the foreground
echo "Starting nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down..."
    kill $API_PID 2>/dev/null
    kill $NGINX_PID 2>/dev/null
    wait $API_PID 2>/dev/null
    wait $NGINX_PID 2>/dev/null
    exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

# Wait for either process to exit
wait $API_PID $NGINX_PID

# If we get here, one of the processes died
echo "A process died, shutting down..."
shutdown