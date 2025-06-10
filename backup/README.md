# MongoDB Backup Manager

A comprehensive tool for backing up, restoring, and managing MongoDB database backups in the Hell-App project.

## Features

- Create full MongoDB database backups
- Manage existing backups through an interactive interface
- Restore databases from backups
- Compressed backup archives for easy sharing

## Requirements

- Docker and Docker Compose
- MongoDB container running in your environment

## Installation

The backup script is already included in your Docker Compose setup. No additional installation is needed.

## Usage

### Interactive Mode

Run the backup script without parameters to access the interactive user interface:

```bash
docker compose exec backup /backup/backup.sh
```

This will display the main menu with options to:
1. Create a new backup
2. View/Manage existing backups
3. Exit

### Direct Commands

You can also run specific backup operations directly using command-line parameters:

#### Create a new backup
```bash
docker compose exec backup /backup/backup.sh backup
```

#### List existing backups
```bash
docker compose exec backup /backup/backup.sh list
```

#### Restore from a backup
```bash
docker compose exec backup /backup/backup.sh restore <filename.tar.gz>
```

## Backup Location

All backups are stored in the `/backup` directory inside the container, which is mounted to the `./backup` directory in your project folder. The backup files use the naming convention:

```
mongodb_backup_YYYYMMDD_HHMMSS.tar.gz
```

## Sharing Backups

Backup files are standard `.tar.gz` archives that can be easily shared with team members. To import a backup received from someone else:

1. Place the `.tar.gz` file in your `./backup` directory
2. Use the interactive restore function or the restore command to apply the backup

## Troubleshooting

- If the script exits unexpectedly, verify that your MongoDB container is running
- Check permissions on the backup directory if you encounter write errors
- Ensure your environment variables for MongoDB authentication are correctly set

## Credits

Created by Shevchenko Denys @ LilConsul
