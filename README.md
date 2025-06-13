# 🎓 Student Examination Application

<div align="center">

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/LilConsul/hell-app)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Status](https://img.shields.io/badge/status-active-brightgreen.svg)

</div>

<p align="center">
  <img src="frontend/public/hell-app.svg" alt="Hell App Logo" width="200" height="auto" />
</p>

## 📚 Overview

A modern, comprehensive platform for managing student examinations with a robust microservices architecture. This application enables seamless exam creation, administration, and result management for educational institutions.

## ✨ Key Features

<table>
  <tr>
    <td><b>🔐 Secure Authentication</b></td>
    <td>Complete user management with OAuth integration</td>
  </tr>
  <tr>
    <td><b>👩‍🏫 Role-Based Access</b></td>
    <td>Separate interfaces for students, teachers, and administrators</td>
  </tr>
  <tr>
    <td><b>📝 Exam Management</b></td>
    <td>Create, assign, take, and grade exams</td>
  </tr>
  <tr>
    <td><b>🌐 Internationalization</b></td>
    <td>Multi-language interface for global access</td>
  </tr>
  <tr>
    <td><b>⏱️ Time Zone Handling</b></td>
    <td>Accurate scheduling across different regions</td>
  </tr>
  <tr>
    <td><b>📱 Responsive Design</b></td>
    <td>Works on desktop and mobile devices</td>
  </tr>
  <tr>
    <td><b>📧 Email Notifications</b></td>
    <td>Automated alerts for exam schedules and results</td>
  </tr>
</table>

## 🛠️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)

### Infrastructure
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

</div>

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hell-app
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**

   | Service | URL |
   |---------|-----|
   | Frontend | http://localhost |
   | API Documentation | http://localhost/api/docs |
   | Email Testing UI | http://localhost/dev/mailhog |
   | Celery Monitoring | http://localhost/dev/flower |

## 📊 Project Structure

```
hell-app/
├── backend/             # FastAPI application
│   ├── app/
│   │   ├── admin/       # Admin panel functionality
│   │   ├── auth/        # Authentication and authorization
│   │   ├── celery/      # Background task processing
│   │   ├── exam/        # Exam management
│   │   ├── i18n/        # Internationalization
│   │   └── users/       # User management
│   └── tests/           # Backend tests
├── frontend/            # React application
│   ├── public/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── lib/
│       └── pages/
├── backup/              # Database backup utilities
└── nginx/               # Nginx configuration
```

## 🔒 Environment Configuration

The application uses environment variables for configuration. 

Key environment variables:

- `FRONTEND_PORT_INTERNAL`: Port for the React frontend
- `BACKEND_PORT_INTERNAL`: Port for FastAPI backend
- `MONGO_*`: MongoDB connection settings
- `REDIS_*`: Redis settings
- `SMTP_*`: Email configuration

## 📄 License

[MIT License](LICENSE)

## 👥 Contributors

<table>
  <tr>
    <td align="center"><a href="https://github.com/LilConsul"><img src="https://github.com/LilConsul.png" width="100px;" alt=""/><br /><sub><b>Shevchenko Denys</b></sub></a><br />Project Maintainer, DevOps Engineer, Backend Developer</td>
    <td align="center"><a href="https://github.com/yehorkarabanov"><img src="https://github.com/yehorkarabanov.png" width="100px;" alt=""/><br /><sub><b>Yehor Karabanov</b></sub></a><br />Backend Developer</td>
    <td align="center"><a href="https://github.com/valmtv"><img src="https://github.com/valmtv.png" width="100px;" alt=""/><br /><sub><b>Valerii Matviiv</b></sub></a><br />Frontend Developer</td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/aleexmaaa"><img src="https://github.com/aleexmaaa.png" width="100px;" alt=""/><br /><sub><b>Marcu Andrei-Alexandru</b></sub></a><br />Intern Frontend Developer</td>
    <td align="center"><a href="https://github.com/ianaaians"><img src="https://github.com/ianaaians.png" width="100px;" alt=""/><br /><sub><b>Iana-Iuliana Nastasiu</b></sub></a><br />Intern Frontend Developer</td>
    <td></td>
  </tr>
</table>
