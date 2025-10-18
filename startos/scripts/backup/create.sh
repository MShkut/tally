#!/bin/bash
set -e

DATA_DIR=/data
BACKUP_DIR=/mnt/backup

# Create backup of budget data
cp -r "$DATA_DIR" "$BACKUP_DIR/"
