#!/bin/bash
  set -e

  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  mkdir -p ~/backups/wakeup/

  cp ~/wakeup/data.json ~/backups/wakeup/wakeup_data_$TIMESTAMP.json
  cp ~/wakeup/.env ~/backups/wakeup/wakeup_env_$TIMESTAMP.bak 2>/dev/null || echo "No .env file found, skipping"

  # Keep only last 30 backups
  ls -t ~/backups/wakeup/wakeup_data_*.json | tail -n +31 | xargs rm -f 2>/dev/null || true
  ls -t ~/backups/wakeup/wakeup_env_*.bak | tail -n +31 | xargs rm -f 2>/dev/null || true

  echo "WakeUp Backup complete"