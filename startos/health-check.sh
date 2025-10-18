#!/bin/bash
set -e

# Check if nginx is responding
curl -f -s http://localhost:8080/api/health > /dev/null

if [ $? -eq 0 ]; then
  echo '{"status": "healthy"}'
  exit 0
else
  echo '{"status": "unhealthy"}'
  exit 1
fi
