# 🎓 Student Examination Application

<div style="text-align: center;">

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/LilConsul/hell-app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/LilConsul/hell-app/releases)
[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)](https://github.com/LilConsul/hell-app)

</div>

<p style="text-align: center;">
  <img src="frontend/public/hell-app.svg" alt="Hell App Logo" width="200" height="auto" />
</p>

## 📚 Overview

A modern, comprehensive platform for managing student examinations with a robust microservices architecture. This application enables seamless exam creation, administration, and result management for educational institutions.

## ✨ Key Features

| Feature                      | Description                                                    |
|------------------------------|----------------------------------------------------------------|
| **🔐 Secure Authentication** | Complete user management with JWT HTTP-Only cookies            |
| **👩‍🏫 Role-Based Access**  | Separate interfaces for students, teachers, and administrators |
| **📝 Exam Management**       | Create, assign, take, and grade exams                          |
| **⏱️ Time Zone Handling**    | Accurate scheduling across different regions                   |
| **📱 Responsive Design**     | Works on desktop and mobile devices                            |
| **📧 Email Notifications**   | Automated alerts for exam schedules and results                |

## 🛠️ Tech Stack

<div style="text-align: center;">

### Frontend
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)

### Backend
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryproject.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)](https://pydantic-docs.helpmanual.io/)

### Infrastructure
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)

</div>

## 🔧 Backend Architecture

The backend is built with a clean, maintainable three-layer architecture:

### Three-Layer Architecture

| Layer | Description |
|-------|-------------|
| **🔵 Presentation Layer** | FastAPI routers and endpoints that handle HTTP requests and responses. This layer validates input data, manages authentication, and serializes responses. |
| **🟢 Business Logic Layer** | Service components that implement core application logic, business rules, and orchestrate workflows between different parts of the system. |
| **🟡 Data Access Layer** | Repository pattern implementations that abstract database operations, providing a clean interface for data manipulation without exposing database specifics. |

### Additional Design Patterns

- **Dependency Injection**: Leveraging FastAPI's dependency system for loose coupling and easier testing
- **Repository Pattern**: Abstracting database operations behind interfaces for flexibility in data sources
- **Middleware Components**: Custom middleware for cross-cutting concerns like language localization and timezone handling
- **Asynchronous Processing**: Using Celery for handling background tasks and scheduled jobs
- **OAuth Integration**: Secure authentication with support for multiple identity providers

The modular design enables independent scaling of components and facilitates continuous development without disrupting existing functionality.

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/LilConsul/hell-app.git
   cd hell-app
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**

   | Service           | URL                          |
   |-------------------|------------------------------|
   | Frontend          | http://localhost             |
   | API Documentation | http://localhost/api/docs    |
   | Email Testing UI  | http://localhost/dev/mailhog |
   | Celery Monitoring | http://localhost/dev/flower  |

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

| Profile                                                                                                                     | Role                                                   |
|-----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| [![Shevchenko Denys](https://github.com/LilConsul.png) <br> **Shevchenko Denys**](https://github.com/LilConsul)             | Project Maintainer, DevOps Engineer, Backend Developer |
| [![Yehor Karabanov](https://github.com/yehorkarabanov.png) <br> **Yehor Karabanov**](https://github.com/yehorkarabanov)     | Backend Developer                                      |
| [![Valerii Matviiv](https://github.com/valmtv.png) <br> **Valerii Matviiv**](https://github.com/valmtv)                     | Frontend Developer                                     |
| [![Marcu Andrei-Alexandru](https://github.com/aleexmaaa.png) <br> **Marcu Andrei-Alexandru**](https://github.com/aleexmaaa) | Intern Frontend Developer                              |
| [![Iana-Iuliana Nastasiu](https://github.com/ianaaians.png) <br> **Iana-Iuliana Nastasiu**](https://github.com/ianaaians)   | Intern Frontend Developer                              |
