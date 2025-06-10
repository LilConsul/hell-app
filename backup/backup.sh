#!/bin/bash

# MongoDB Backup and Restore Interactive Console
# Enhanced UI/UX for database management

# Don't use set -e as it causes the script to exit on any command error
# We'll handle errors explicitly where needed

# Colors for better UI
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Constants
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backup"
ARCHIVE_NAME="mongodb_backup_$TIMESTAMP"

# Clear screen function
clear_screen() {
    clear
}

# Print header
print_header() {
    echo -e "${BOLD}${BLUE}┌─────────────────────────────────────────────┐${NC}"
    echo -e "${BOLD}${BLUE}│           Hell-App Backup Manager           │${NC}"
    echo -e "${BOLD}${BOLD}│   Created by Shevchenko Denys @ LilConsul   │${NC}"
    echo -e "${BOLD}${BLUE}└─────────────────────────────────────────────┘${NC}"
    echo
}

# Display a menu and get user selection
show_menu() {
    local title="$1"
    shift
    local options=("$@")
    local selection

    echo -e "${YELLOW}${title}${NC}\n"

    # Display numbered menu options
    for i in "${!options[@]}"; do
        echo -e "  ${BOLD}$((i+1)).${NC} ${options[$i]}"
    done
    echo

    while true; do
        read -p "Select an option [1-${#options[@]}]: " selection

        # Check if input is a number and in range
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "${#options[@]}" ]; then
            return $((selection-1))
        else
            echo -e "${RED}Please enter a valid number between 1 and ${#options[@]}${NC}"
        fi
    done
}

# Display progress
show_spinner() {
    local message=$1
    local pid=$2
    local spin='-\|/'
    local i=0

    echo -ne "${message} "
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) % 4 ))
        echo -ne "\r${message} ${spin:$i:1}"
        sleep .1
    done
    echo -e "\r${message} ${GREEN}✓${NC}"
}

# Backup function
backup_mongodb() {
    clear_screen
    print_header

    echo -e "${YELLOW}Creating a new MongoDB backup...${NC}\n"

    # Run mongodump in the background
    (mongodump --host=mongodb --port=27017 \
        -u "$MONGO_INITDB_ROOT_USERNAME" \
        -p "$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase=admin \
        --out="${BACKUP_DIR:?}/${ARCHIVE_NAME:?}" > /dev/null 2>&1) &

    # Show progress spinner
    show_spinner "Creating backup with mongodump" $!

    # Compress the backup
    cd ${BACKUP_DIR:?}

    (tar -czf "${ARCHIVE_NAME:?}.tar.gz" "${ARCHIVE_NAME:?}" > /dev/null 2>&1) &
    show_spinner "Compressing backup files" $!

    # Cleanup
    (rm -rf "${BACKUP_DIR:?}/${ARCHIVE_NAME:?}" > /dev/null 2>&1) &
    show_spinner "Cleaning up temporary files" $!

    echo
    echo -e "${GREEN}Backup completed successfully!${NC}"
    echo -e "${BOLD}Location:${NC} ${BACKUP_DIR}/${ARCHIVE_NAME}.tar.gz"
    echo -e "${BOLD}Size:${NC} $(du -h ${ARCHIVE_NAME}.tar.gz | cut -f1)"
    echo
    echo -e "This backup file can be shared with others."
    echo
    read -p "Press Enter to continue..."
    main_menu
}

# List backups function
list_backups() {
    clear_screen
    print_header

    echo -e "${YELLOW}Available Backups:${NC}\n"

    # Safely check if backups exist without triggering script exit
    if find ${BACKUP_DIR} -name "*.tar.gz" -type f 2>/dev/null | grep -q .; then
        echo -e "${BOLD}ID  | Date Created       | Size     | Filename${NC}"
        echo -e "----------------------------------------------------"

        # Initialize counter and associative array for backup files
        counter=1
        declare -A BACKUPS

        # Process each backup file
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                size=$(du -h "$file" 2>/dev/null | cut -f1)

                # Extract date from filename
                date_part=$(echo "$filename" | sed -n 's/mongodb_backup_\([0-9]\{8\}_[0-9]\{6\}\).*/\1/p')
                if [[ ! -z "$date_part" ]]; then
                    formatted_date=$(echo "$date_part" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
                else
                    formatted_date="Unknown date"
                fi

                printf "%-4s| %-18s| %-9s| %s\n" "$counter" "$formatted_date" "$size" "$filename"
                BACKUPS[$counter]="$filename"
                ((counter++))
            fi
        done < <(find ${BACKUP_DIR} -name "*.tar.gz" -type f -print 2>/dev/null | sort -r)

        echo
        echo -e "Total backups: $((counter-1))"
        echo

        # Add menu options for actions
        echo -e "Options:"
        echo -e "  ${BOLD}Enter a backup ID${NC} - View backup details"
        echo -e "  ${BOLD}r${NC} - Return to main menu"
        echo

        while true; do
            read -p "Enter your choice: " choice

            if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -lt "$counter" ]; then
                backup_details "${BACKUPS[$choice]}"
                break
            elif [[ "$choice" == "r" || "$choice" == "R" ]]; then
                main_menu
                break
            else
                echo -e "${RED}Invalid option. Please enter a valid backup ID or 'r' to return.${NC}"
            fi
        done
    else
        echo -e "${RED}No backups found.${NC}"
        echo
        read -p "Press Enter to return to main menu..."
        main_menu
    fi
}

# Show backup details
backup_details() {
    local filename="$1"
    clear_screen
    print_header

    echo -e "${YELLOW}Backup Details:${NC}\n"
    echo -e "${BOLD}Filename:${NC} $filename"

    # Extract date from filename
    date_part=$(echo "$filename" | sed -n 's/mongodb_backup_\([0-9]\{8\}_[0-9]\{6\}\).*/\1/p')
    if [[ ! -z "$date_part" ]]; then
        formatted_date=$(echo "$date_part" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
        echo -e "${BOLD}Created:${NC} $formatted_date"
    fi

    echo -e "${BOLD}Size:${NC} $(du -h ${BACKUP_DIR}/${filename} | cut -f1)"
    echo

    # Options for this backup
    local options=(
        "Restore this backup"
        "Delete this backup"
        "Back to backup list"
    )

    show_menu "Select an action:" "${options[@]}"
    local choice=$?

    case "$choice" in
        0)
            confirm_restore "$filename"
            ;;
        1)
            confirm_delete "$filename"
            ;;
        2)
            list_backups
            ;;
    esac
}

# Confirm restore
confirm_restore() {
    local filename="$1"
    clear_screen
    print_header

    echo -e "${RED}${BOLD}WARNING: Database Restore${NC}"
    echo -e "${RED}This will REPLACE all current data with backup data!${NC}"
    echo -e "You are about to restore: ${BOLD}$filename${NC}"
    echo

    # Yes/No options
    local options=(
        "Yes, restore this backup"
        "No, cancel operation"
    )

    show_menu "Are you sure you want to proceed?" "${options[@]}"
    local choice=$?

    if [ $choice -eq 0 ]; then
        restore_mongodb "$filename"
    else
        list_backups
    fi
}

# Confirm delete
confirm_delete() {
    local filename="$1"
    clear_screen
    print_header

    echo -e "${RED}${BOLD}WARNING: Delete Backup${NC}"
    echo -e "You are about to delete: ${BOLD}$filename${NC}"
    echo

    # Yes/No options
    local options=(
        "Yes, delete this backup"
        "No, cancel operation"
    )

    show_menu "Are you sure you want to delete this backup?" "${options[@]}"
    local choice=$?

    if [ $choice -eq 0 ]; then
        rm "${BACKUP_DIR:?}/${filename:?}"
        echo -e "${GREEN}Backup deleted successfully!${NC}"
        sleep 2
        list_backups
    else
        list_backups
    fi
}

# Restore function
restore_mongodb() {
    local RESTORE_FILE="$1"
    clear_screen
    print_header

    echo -e "${YELLOW}Restoring database from backup...${NC}\n"

    # Handle absolute path if provided
    if [[ "$RESTORE_FILE" == "/backup/"* ]]; then
        RESTORE_FILE="${RESTORE_FILE#/backup/}"
    fi

    RESTORE_DIR="${RESTORE_FILE%.tar.gz}"

    if [ ! -f "$BACKUP_DIR/$RESTORE_FILE" ]; then
        echo -e "${RED}Error: Backup file $BACKUP_DIR/$RESTORE_FILE not found${NC}"
        sleep 3
        main_menu
        exit 1
    fi

    cd $BACKUP_DIR

    (tar -xzf "$RESTORE_FILE" > /dev/null 2>&1) &
    show_spinner "Extracting backup archive" $!

    # Restore the database
    (mongorestore --host=mongodb --port=27017 \
        -u "$MONGO_INITDB_ROOT_USERNAME" \
        -p "$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase=admin \
        --drop \
        "$BACKUP_DIR/$RESTORE_DIR" > /dev/null 2>&1) &
    show_spinner "Restoring database" $!

    # Cleanup
    (rm -rf "${BACKUP_DIR:?}/${RESTORE_DIR:?}" > /dev/null 2>&1) &
    show_spinner "Cleaning up temporary files" $!

    echo
    echo -e "${GREEN}Database restored successfully!${NC}"
    echo
    read -p "Press Enter to continue..."
    main_menu
}

# Main menu
main_menu() {
    clear_screen
    print_header

    local options=(
        "Create a new backup"
        "View/Manage existing backups"
        "Exit"
    )

    show_menu "Main Menu" "${options[@]}"
    local choice=$?

    case "$choice" in
        0)
            backup_mongodb
            ;;
        1)
            list_backups
            ;;
        2)
            clear_screen
            echo -e "${BLUE}Thank you for using MongoDB Backup Manager!${NC}"
            exit 0
            ;;
    esac
}

# If arguments are provided, use classic CLI mode for backward compatibility
if [[ $# -gt 0 ]]; then
    case "$1" in
        backup)
            backup_mongodb
            ;;
        restore)
            if [ -z "$2" ]; then
                echo -e "${RED}Error: Please provide a backup file to restore${NC}"
                echo "Usage: $0 restore [backup_file.tar.gz]"
                exit 1
            fi
            restore_mongodb "$2"
            ;;
        list)
            declare -A BACKUPS
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
else
    # No arguments, start interactive menu
    declare -A BACKUPS
    main_menu
fi

exit 0
