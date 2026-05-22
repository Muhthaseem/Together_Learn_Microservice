#!/bin/bash
set -e

# Wait for database to be ready
DB_HOST=${DB_URL#*//}
DB_HOST=${DB_HOST%%:*}
DB_PORT=${DB_URL#*:}
DB_PORT=${DB_PORT%%/*}

echo "Waiting for database at $DB_HOST:$DB_PORT..."
for i in {1..30}; do
  if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "Database is ready!"
    break
  fi
  echo "Attempt $i/30: waiting for database..."
  sleep 2
done

exec "$@"
