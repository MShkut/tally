#!/bin/sh
set -e

# Check if the API server is responding
# Using wget instead of curl (alpine has wget by default)
if wget -q -O /dev/null http://localhost:8080/api/health 2>/dev/null; then
  echo '{"status": "healthy"}'
  exit 0
else
  echo '{"status": "unhealthy"}'
  exit 1
fi
