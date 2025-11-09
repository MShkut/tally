#!/bin/sh

# Ensure /data directory exists
mkdir -p /data

# Set database path environment variable
export DB_PATH=/data/tally.db

# Start the API server in the background
echo "Starting Tally API server..."
cd /app/api
node server.js &
API_PID=$!

# Wait for API server to be ready by checking if process is running and port is listening
echo "Waiting for API server to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    # Check if process is still running
    if ! kill -0 $API_PID 2>/dev/null; then
        echo "ERROR: API server process died"
        exit 1
    fi
    # Check if port 3001 is listening
    if netstat -tuln 2>/dev/null | grep -q ":3001 "; then
        echo "API server is ready!"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo "ERROR: API server failed to start after 30 seconds"
        exit 1
    fi
    echo "Waiting for API server... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    sleep 1
done

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