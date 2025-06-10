#!/bin/bash

# MongoDB Backup and Restore Interactive Console
# Enhanced UI/UX for database management


# Enhanced color palette for better UI
RED='\033[0;31m'          # Error messages
GREEN='\033[0;32m'        # Success messages
BLUE='\033[0;34m'         # Headers
YELLOW='\033[1;33m'       # Prompts & highlights
CYAN='\033[0;36m'         # Secondary information
MAGENTA='\033[0;35m'      # Special actions
GRAY='\033[0;90m'         # Subtle information
NC='\033[0m'              # No Color
BOLD='\033[1m'            # Bold text
UNDERLINE='\033[4m'       # Underlined text

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backup"
ARCHIVE_NAME="mongodb_backup_$TIMESTAMP"
VERSION="1.2.0"

clear_screen() {
    clear
}

divider() {
    echo -e "${GRAY}${BOLD}────────────────────────────────────────────────────────${NC}"
}

print_header() {
    clear_screen
    echo
    echo -e "${BLUE}${BOLD}┌─────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}${BOLD}│           Hell-App Backup Manager           │${NC}"
    echo -e "${BLUE}${BOLD}└─────────────────────────────────────────────┘${NC}"
    echo -e "        ${BOLD}Created by Shevchenko Denys @ LilConsul${NC}"
    echo -e "                  ${GRAY}Version ${VERSION}${NC}"
    echo
}

show_menu() {
    local title="$1"
    shift
    local options=("$@")
    local selection

    echo -e "${YELLOW}${BOLD}${title}${NC}\n"

    for i in "${!options[@]}"; do
        if [[ "${options[$i]}" == *"Create"* ]] || [[ "${options[$i]}" == *"backup"* ]]; then
            echo -e "  ${BOLD}$((i+1)).${NC} ${CYAN}${options[$i]}${NC}"
        elif [[ "${options[$i]}" == *"Delete"* ]] || [[ "${options[$i]}" == *"Exit"* ]]; then
            echo -e "  ${BOLD}$((i+1)).${NC} ${MAGENTA}${options[$i]}${NC}"
        elif [[ "${options[$i]}" == *"Yes"* ]]; then
            echo -e "  ${BOLD}$((i+1)).${NC} ${GREEN}${options[$i]}${NC}"
        elif [[ "${options[$i]}" == *"No"* ]]; then
            echo -e "  ${BOLD}$((i+1)).${NC} ${RED}${options[$i]}${NC}"
        else
            echo -e "  ${BOLD}$((i+1)).${NC} ${options[$i]}"
        fi
    done
    echo

    while true; do
        echo -ne "${YELLOW}Select an option [1-${#options[@]}]:${NC} "
        read selection

        # Check if input is a number and in range
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "${#options[@]}" ]; then
            return $((selection-1))
        else
            echo -e "${RED}Please enter a valid number between 1 and ${#options[@]}${NC}"
        fi
    done
}

show_spinner() {
    local message="$1"
    local pid=$2
    local spin='⣾⣽⣻⢿⡿⣟⣯⣷'
    local i=0
    local start_time=$(date +%s)

    echo -ne "${CYAN}${message}${NC} "
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) % 8 ))
        elapsed=$(($(date +%s) - start_time))
        echo -ne "\r${CYAN}${message}${NC} ${YELLOW}${spin:$i:1}${NC} ${GRAY}(${elapsed}s)${NC}"
        sleep .1
    done
    echo -e "\r${CYAN}${message}${NC} ${GREEN}✓${NC} ${GRAY}(${elapsed}s)${NC}"
}

show_status() {
    local type="$1"
    local message="$2"

    case "$type" in
        success)
            echo -e "\n${GREEN}✓ ${message}${NC}"
            ;;
        error)
            echo -e "\n${RED}✗ ${message}${NC}"
            ;;
        warning)
            echo -e "\n${YELLOW}⚠ ${message}${NC}"
            ;;
        info)
            echo -e "\n${CYAN}ℹ ${message}${NC}"
            ;;
    esac
}

backup_mongodb() {
    print_header

    echo -e "${YELLOW}${BOLD}Creating a new MongoDB backup${NC}\n"
    divider

    echo -e "${CYAN}Starting backup process...${NC}"
    (mongodump --host=mongodb --port=27017 \
        -u "$MONGO_INITDB_ROOT_USERNAME" \
        -p "$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase=admin \
        --out="${BACKUP_DIR:?}/${ARCHIVE_NAME:?}" > /dev/null 2>&1) &

    show_spinner "Creating backup with mongodump" $!

    cd ${BACKUP_DIR:?} || {
        show_status "error" "Failed to change directory to ${BACKUP_DIR:?}"
    }

    (tar -czf "${ARCHIVE_NAME:?}.tar.gz" "${ARCHIVE_NAME:?}" > /dev/null 2>&1) &
    show_spinner "Compressing backup files" $!

    (rm -rf "${BACKUP_DIR:?}/${ARCHIVE_NAME:?}" > /dev/null 2>&1) &
    show_spinner "Cleaning up temporary files" $!

    divider
    show_status "success" "Backup completed successfully!"
    echo -e "${BOLD}Location:${NC} ${UNDERLINE}${BACKUP_DIR}/${ARCHIVE_NAME}.tar.gz${NC}"
    echo -e "${BOLD}Size:${NC}     $(du -h ${ARCHIVE_NAME}.tar.gz | cut -f1)"
    echo -e "${BOLD}Date:${NC}     $(date '+%Y-%m-%d %H:%M:%S')"
    divider
    echo -e "\n${CYAN}This backup file can be shared with others.${NC}"
    echo
    read -p "Press Enter to continue..."
    main_menu
}

list_backups() {
    print_header

    echo -e "${YELLOW}${BOLD}Available Backups${NC}\n"
    divider

    if find ${BACKUP_DIR} -name "*.tar.gz" -type f 2>/dev/null | grep -q .; then
        echo -e "${BOLD}ID   | Date Created        | Size      | Filename${NC}"
        echo -e "${BOLD}${GRAY}─────┼─────────────────────┼───────────┼──────────────────${NC}"

        counter=1
        declare -A BACKUPS

        while IFS= read -r file; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                size=$(du -h "$file" 2>/dev/null | cut -f1)

                date_part=$(echo "$filename" | sed -n 's/mongodb_backup_\([0-9]\{8\}_[0-9]\{6\}\).*/\1/p')
                if [[ ! -z "$date_part" ]]; then
                    formatted_date=$(echo "$date_part" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
                else
                    formatted_date="Unknown date"
                fi

                if [ $((counter % 2)) -eq 0 ]; then
                    printf "%-4s | %-19s | %-9s | %s\n" "$counter" "$formatted_date" "$size" "$filename"
                else
                    # Odd rows
                    printf "%-4s | %-19s | %-9s | %s\n" "$counter" "$formatted_date" "$size" "$filename"
                fi

                BACKUPS[$counter]="$filename"
                ((counter++))
            fi
        done < <(find ${BACKUP_DIR} -name "*.tar.gz" -type f -print 2>/dev/null | sort -r)

        divider
        echo -e "\n${CYAN}Total backups: $((counter-1))${NC}\n"

        # Add menu options for actions
        echo -e "${BOLD}Options:${NC}"
        echo -e "  ${CYAN}Enter a backup ID${NC} - View backup details"
        echo -e "  ${MAGENTA}r${NC}              - Return to main menu"
        echo

        while true; do
            echo -ne "${YELLOW}Enter your choice:${NC} "
            read choice

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
        show_status "info" "No backups found."
        divider
        echo -e "\n${CYAN}Create a backup first to see it listed here.${NC}"
        echo
        read -p "Press Enter to return to main menu..."
        main_menu
    fi
}

backup_details() {
    local filename="$1"
    print_header

    echo -e "${YELLOW}${BOLD}Backup Details${NC}\n"
    divider

    echo -e "${BOLD}Filename: ${NC}${filename}"

    # Extract date from filename
    date_part=$(echo "$filename" | sed -n 's/mongodb_backup_\([0-9]\{8\}_[0-9]\{6\}\).*/\1/p')
    if [[ ! -z "$date_part" ]]; then
        formatted_date=$(echo "$date_part" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
        echo -e "${BOLD}Created:  ${NC}${formatted_date}"
    fi

    size=$(du -h ${BACKUP_DIR}/${filename} | cut -f1)
    echo -e "${BOLD}Size:     ${NC}${size}"

    file_info=$(file ${BACKUP_DIR}/${filename} 2>/dev/null || echo "Unknown file type")
    echo -e "${BOLD}Type:     ${NC}${file_info#*: }"

    divider

    local options=(
        "Restore this backup"
        "Delete this backup"
        "Back to backup list"
    )

    show_menu "Available Actions:" "${options[@]}"
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

confirm_restore() {
    local filename="$1"
    print_header

    echo -e "${RED}${BOLD} WARNING: Database Restore  ️${NC}\n"
    divider
    echo -e "${RED}${BOLD}This operation will REPLACE all current data with backup data!${NC}"
    echo -e "${RED}This action cannot be undone.${NC}\n"
    echo -e "You are about to restore: ${BOLD}$filename${NC}"
    divider

    # Yes/No options with clearer labeling
    local options=(
        "Yes, restore this backup (overwrites current data)"
        "No, cancel operation (return to backup details)"
    )

    show_menu "Please confirm:" "${options[@]}"
    local choice=$?

    if [ $choice -eq 0 ]; then
        restore_mongodb "$filename"
    else
        backup_details "$filename"
    fi
}

confirm_delete() {
    local filename="$1"
    print_header

    echo -e "${RED}${BOLD} WARNING: Delete Backup  ️${NC}\n"
    divider
    echo -e "${RED}${BOLD}This will permanently delete the backup file!${NC}"
    echo -e "${RED}This action cannot be undone.${NC}\n"
    echo -e "You are about to delete: ${BOLD}$filename${NC}"
    divider

    # Yes/No options with clearer labeling
    local options=(
        "Yes, delete this backup permanently"
        "No, cancel operation (return to backup details)"
    )

    show_menu "Please confirm:" "${options[@]}"
    local choice=$?

    if [ $choice -eq 0 ]; then
        rm "${BACKUP_DIR:?}/${filename:?}"
        show_status "success" "Backup deleted successfully!"
        sleep 1
        list_backups
    else
        backup_details "$filename"
    fi
}

# Restore function with improved progress feedback
restore_mongodb() {
    local RESTORE_FILE="$1"
    print_header

    echo -e "${YELLOW}${BOLD}Restoring Database from Backup${NC}\n"
    divider

    # Handle absolute path if provided
    if [[ "$RESTORE_FILE" == "/backup/"* ]]; then
        RESTORE_FILE="${RESTORE_FILE#/backup/}"
    fi

    RESTORE_DIR="${RESTORE_FILE%.tar.gz}"

    if [ ! -f "$BACKUP_DIR/$RESTORE_FILE" ]; then
        show_status "error" "Backup file $BACKUP_DIR/$RESTORE_FILE not found"
        echo -e "${RED}The requested backup file does not exist.${NC}"
        sleep 3
        main_menu
        exit 1
    fi

    cd $BACKUP_DIR || {
        show_status "error" "Failed to change directory to ${BACKUP_DIR:?}"
    }

    echo -e "${CYAN}Starting restore process...${NC}"
    (tar -xzf "$RESTORE_FILE" > /dev/null 2>&1) &
    show_spinner "Extracting backup archive" $!

    (mongorestore --host=mongodb --port=27017 \
        -u "$MONGO_INITDB_ROOT_USERNAME" \
        -p "$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase=admin \
        --drop \
        "$BACKUP_DIR/$RESTORE_DIR" > /dev/null 2>&1) &
    show_spinner "Restoring database from backup" $!

    (rm -rf "${BACKUP_DIR:?}/${RESTORE_DIR:?}" > /dev/null 2>&1) &
    show_spinner "Cleaning up temporary files" $!

    divider
    show_status "success" "Database restored successfully!"
    echo -e "${CYAN}All data has been restored from backup: ${BOLD}$RESTORE_FILE${NC}"
    echo
    read -p "Press Enter to continue..."
    main_menu
}

main_menu() {
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
            echo
            echo -e "${BLUE}┌─────────────────────────────────────────────┐${NC}"
            echo -e "${BLUE}│                                             │${NC}"
            echo -e "${BLUE}│       Thank you for using Hell-App          │${NC}"
            echo -e "${BLUE}│            MongoDB Backup Manager           │${NC}"
            echo -e "${BLUE}│                                             │${NC}"
            echo -e "${BLUE}└─────────────────────────────────────────────┘${NC}"
            echo
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
