#!/bin/bash
set -e

BACKUP_DIR=/mnt/backup
DATA_DIR=/data

# Restore budget data
cp -r "$BACKUP_DIR/data/"* "$DATA_DIR/"
