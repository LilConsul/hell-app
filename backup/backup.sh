#!/bin/bash

# MongoDB Backup and Restore Script
# Usage:
#   ./backup.sh backup - Create a backup
#   ./backup.sh restore [filename] - Restore from a backup

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backup"
ARCHIVE_NAME="mongodb_backup_$TIMESTAMP"

backup_mongodb() {
    echo "Creating MongoDB backup..."

    mongodump --host=mongodb --port=27017 \
        -u "$MONGO_INITDB_ROOT_USERNAME" \
        -p "$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase=admin \
        --out="${BACKUP_DIR:?}/${ARCHIVE_NAME:?}"

    echo "Compressing backup..."
    cd ${BACKUP_DIR:?}
    tar -czf "${ARCHIVE_NAME:?}.tar.gz" "${ARCHIVE_NAME:?}"

    echo "Cleaning up..."
    rm -rf "${BACKUP_DIR:?}/${ARCHIVE_NAME:?}"

    echo "Backup completed: ${BACKUP_DIR:?}/${ARCHIVE_NAME:?}.tar.gz"
    echo "You can share this file with others."
}

restore_mongodb() {
    if [ -z "$1" ]; then
        echo "Error: Please provide a backup file to restore"
        echo "Usage: ./backup.sh restore [backup_file.tar.gz]"
        exit 1
    fi

    RESTORE_FILE="$1"

    if [[ "$RESTORE_FILE" == "/backup/"* ]]; then
        RESTORE_FILE="${RESTORE_FILE#/backup/}"
    fi

    RESTORE_DIR="${RESTORE_FILE%.tar.gz}"

    if [ ! -f "$BACKUP_DIR/$RESTORE_FILE" ]; then
        echo "Error: Backup file $BACKUP_DIR/$RESTORE_FILE not found"
        exit 1
    fi

    echo "Extracting backup archive..."
    cd $BACKUP_DIR
    tar -xzf "$RESTORE_FILE"

    echo "Restoring MongoDB backup from $RESTORE_DIR..."
    mongorestore --host=mongodb --port=27017 \
        -u "$MONGO_INITDB_ROOT_USERNAME" \
        -p "$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase=admin \
        --drop \
        "$BACKUP_DIR/$RESTORE_DIR"

    echo "Restore completed successfully!"
}

list_backups() {
    echo "Available backups:"
    ls -la $BACKUP_DIR/*.tar.gz 2>/dev/null || echo "No backups found"
}

case "$1" in
    backup)
        backup_mongodb
        ;;
    restore)
        restore_mongodb "$2"
        ;;
    list)
        list_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore|list}"
        echo "  backup - Create a new backup"
        echo "  restore [filename] - Restore from a backup file"
        echo "  list - Show available backup files"
        exit 1
        ;;
esac

exit 0
