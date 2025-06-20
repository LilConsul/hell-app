# 🎓 Student Examination Application

<div align="center">

<!-- Project Status -->
<div>
  <a href="https://github.com/LilConsul/hell-app"><img src="https://img.shields.io/badge/Skill-Issue-red?style=for-the-badge&labelColor=black" alt="Skill:Issue" /></a>
  <a href="https://github.com/LilConsul/hell-app"><img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge&labelColor=black" alt="Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge&labelColor=black" alt="License" /></a>
  <a href="https://deepwiki.com/LilConsul/hell-app"><img src="https://img.shields.io/badge/DeepWiki-Ask-purple?style=for-the-badge&labelColor=black&logo=bookstack&logoColor=white" alt="DeepWiki" /></a>
</div>

<br/>

<!-- Technologies -->
<div>
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&labelColor=black&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&labelColor=black&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&labelColor=black&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-7.4-DC382D?style=for-the-badge&labelColor=black&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-Latest-2496ED?style=for-the-badge&labelColor=black&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Nginx-1.27-009639?style=for-the-badge&labelColor=black&logo=nginx&logoColor=white" alt="Nginx" />
</div>

</div>

<br/>

<p align="center">
  <img src="/src/frontend/public/hell-app.svg" alt="Hell App Logo" width="200" height="auto" />
</p>

## 📑 Table of Contents

- [📚 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🚀 Getting Started](#-getting-started)
- [🛠️ Tech Stack](#-tech-stack)
- [📊 Project Structure](#-project-structure)
- [🔧 Backend Architecture](#-backend-architecture)
- [🔒 Environment Configuration](#-environment-configuration)
- [🧪 Testing](#-testing)
- [📝 API Documentation](#-api-documentation)
- [👥 Contributors](#-contributors)
- [📄 License](#-license)

## 📚 Overview

The Student Examination Application is a cutting-edge educational platform designed to revolutionize the way academic institutions handle examinations. Built with modern technologies and a microservices architecture, it offers:

### 🎯 Purpose
- **Streamlined Exam Management**: End-to-end solution from exam creation to result analysis
- **Paperless Environment**: Reduce administrative overhead and environmental impact
- **Enhanced Security**: Advanced measures to prevent cheating and ensure exam integrity

### 💡 Core Benefits
- **For Students**: Easy access to exams, instant results, and progress tracking
- **For Teachers**: Simplified exam creation, automated grading, and detailed analytics
- **For Administrators**: Comprehensive oversight, detailed reporting, and efficient management

### 🌟 Why Choose This Solution?
- **Modern Architecture**: Built with React 19 and FastAPI for optimal performance
- **Scalable Design**: Microservices approach allows easy scaling and maintenance
- **Real-time Updates**: Instant result processing and notification system
- **Cross-platform**: Works seamlessly across desktop and mobile devices

<img src="/img/main_page.png" alt="Main Page Screenshot" width="100%" height="auto">

## ✨ Key Features

| Feature                      | Description                                                    |
|------------------------------|----------------------------------------------------------------|
| **🔐 Secure Authentication** | Complete user management with JWT HTTP-Only cookies            |
| **👩‍🏫 Role-Based Access**  | Separate interfaces for students, teachers, and administrators |
| **📝 Exam Management**       | Create, assign, take, and grade exams                          |
| **🤖 Automatic Evaluation**  | AI-powered automatic grading of exams                          |
| **🌓 Dark/Light Mode**       | Customizable UI theme for better user experience               |
| **⏱️ Time Zone Handling**    | Accurate scheduling across different regions                   |
| **📱 Responsive Design**     | Works on desktop and mobile devices                            |
| **📧 Email Notifications**   | Automated alerts for exam schedules and results                |

## 🚀 Getting Started

### Prerequisites

- [Docker and Docker Compose](https://docs.docker.com/get-docker/)

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

> [!IMPORTANT]
> The application runs on self-signed certificates, so you may need to accept the security warning in your browser.

| Service           | URL                           |
|-------------------|-------------------------------|
| Frontend          | https://localhost             |
| API Documentation | https://localhost/api/docs    |
| Email Testing UI  | https://localhost/dev/mailhog |
| Celery Monitoring | https://localhost/dev/flower  |

### 🗃️ Testing Database

The project includes a test database backup located in the `backup` directory. To import this database:

```bash
docker compose exec backup /backup/backup.sh
```

> [!NOTE]
> Alternatively, you can use the cli to import the backup, but it is recommended to use the script for convenience.

1. **List available backups:**
   ```bash
   docker compose exec backup /backup/backup.sh list
   ```

2. **Restore a specific backup:**
   ```bash
   docker compose exec backup /backup/backup.sh restore <backup_name>
   ```

## 🛠️ Tech Stack

<div align="center">

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

## 📊 Project Structure

### Main Application Code Structure (`./src`)

```
src/
├── backend/             # FastAPI application
│   ├── app/
│   │   ├── admin/       # Admin panel functionality
│   │   ├── auth/        # Authentication and authorization
│   │   ├── celery/      # Background task processing
│   │   ├── core/        # Core utilities and base classes
│   │   ├── database/    # Database connections and utilities
│   │   ├── exam/        # Exam management
│   │   ├── middleware/  # Custom middleware components
│   │   └── users/       # User management
│   └── tests/           # Backend tests
├── frontend/            # React application
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── contexts/    # React contexts
│       ├── hooks/       # Custom React hooks
│       ├── lib/         # Utility functions
│       └── pages/       # Page components
├── backup/              # Database backup utilities
└── nginx/              # Nginx configuration and SSL
```

## 🔧 Backend Architecture

The backend is built with a clean, maintainable three-layer architecture:

### Three-Layer Architecture

| Layer                       | Description                                                                                                                                                  |
|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **🔵 Presentation Layer**   | FastAPI routers and endpoints that handle HTTP requests and responses. This layer validates input data, manages authentication, and serializes responses.    |
| **🟢 Business Logic Layer** | Service components that implement core application logic, business rules, and orchestrate workflows between different parts of the system.                   |
| **🟡 Data Access Layer**    | Repository pattern implementations that abstract database operations, providing a clean interface for data manipulation without exposing database specifics. |

### Additional Design Patterns

- **Dependency Injection**: Leveraging FastAPI's dependency system for loose coupling and easier testing
- **Repository Pattern**: Abstracting database operations behind interfaces for flexibility in data sources
- **Middleware Components**: Custom middleware for cross-cutting concerns like language localization and timezone
  handling
- **Asynchronous Processing**: Using Celery for handling background tasks and scheduled jobs
- **JWT Authentication**: Secure authentication using HTTP-only cookies with JWT tokens

The modular design enables independent scaling of components and facilitates continuous development without disrupting
existing functionality.

## 🔒 Environment Configuration

The application uses environment variables for configuration through a `.env` file. Most variables are self-explanatory,
but here are some key ones:

<details> 
<summary> Key Environment Variables </summary>

#### Application Settings

| Variable        | Description                     | Example Value   |
|-----------------|---------------------------------|-----------------|
| `PROJECT_NAME`  | Name of the application         | `Hell App`      |
| `DOMAIN`        | Domain name for the application | `localhost`     |
| `BACKEND_DEBUG` | Enable debug mode for backend   | `true`, `false` |

#### Security Settings

| Variable                      | Description               | Example Value       |
|-------------------------------|---------------------------|---------------------|
| `SECRET_KEY`                  | Secret key for encryption | `InsanelySecretKey` |
| `ALGORITHM`                   | Algorithm used for JWT    | `HS256`             |
| `ACCESS_TOKEN_EXPIRE_SECONDS` | JWT token expiration time | `36000`             |

#### Admin Configuration

| Variable         | Description         | Example Value        |
|------------------|---------------------|----------------------|
| `ADMIN_EMAIL`    | Admin user email    | `admin@hell-app.com` |
| `ADMIN_PASSWORD` | Admin user password | `AdminSecret11`      |

#### Testing Users

> These users are used for testing purposes only and should not be used in production. Just leave empty fields if you
> don't need them.

| Variable           | Description           | Example Value             |
|--------------------|-----------------------|---------------------------|
| `STUDENT_EMAIL`    | Test student email    | `Student123@hell-app.com` |
| `STUDENT_PASSWORD` | Test student password | `StudentSecret11`         |
| `TEACHER_EMAIL`    | Test teacher email    | `Teacher123@hell-app.com` |
| `TEACHER_PASSWORD` | Test teacher password | `TeacherSecret11`         |

#### Database Configuration (MongoDB)

| Variable                     | Description           | Example Value |
|------------------------------|-----------------------|---------------|
| `MONGO_INITDB_ROOT_USERNAME` | MongoDB root username | `admin`       |
| `MONGO_INITDB_ROOT_PASSWORD` | MongoDB root password | `admin`       |
| `MONGO_INITDB_DATABASE`      | MongoDB database name | `app`         |

</details> 

## 🧪 Testing

This project includes comprehensive test coverage for backend functionality.

### Running Tests

```bash
# Run all tests (command should be executed in the backend container)
uv sync --extra "test" # Install test dependencies
uv run pytest
```

```bash
docker exec hell-app-backend-1 uv sync --extra "test" # Install test, run only once
docker exec hell-app-backend-1 uv run pytest
```

### Test Structure

- Unit tests verify individual components in isolation
- Integration tests ensure different modules work together correctly
- End-to-end tests validate complete user flows

## 📝 API Documentation

The API documentation is auto-generated using FastAPI's built-in Swagger UI and ReDoc integration.

| Documentation | URL                         |
|---------------|-----------------------------|
| Swagger UI    | https://localhost/api/docs  |
| ReDoc         | https://localhost/api/redoc |

### API Endpoints Overview

- **/api/auth** - Authentication and user management
- **/api/exams** - Exam creation and management
- **/api/students** - Student-specific endpoints
- **/api/teachers** - Teacher-specific endpoints

## 👥 Contributors

| Contributor                                                                                                                                                     |                                          Role                                          |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|:--------------------------------------------------------------------------------------:|
| <div align="center"><img src="https://github.com/LilConsul.png" width="60" height="60"><br/>[**Shevchenko Denys**](https://github.com/LilConsul)</div>          | <div align="center">Project Maintainer<br/>DevOps Engineer<br/>Backend Developer</div> |
| <div align="center"><img src="https://github.com/yehorkarabanov.png" width="60" height="60"><br/>[**Yehor Karabanov**](https://github.com/yehorkarabanov)</div> |                    <div align="center">Lead Backend Developer</div>                    |
| <div align="center"><img src="https://github.com/valmtv.png" width="60" height="60"><br/>[**Valerii Matviiv**](https://github.com/valmtv)</div>                 |             <div align="center">Frontend Lead<br/>Frontend Developer</div>             |
| <div align="center"><img src="https://github.com/aleexmaaa.png" width="60" height="60"><br/>[**Marcu Andrei-Alexandru**](https://github.com/aleexmaaa)</div>    |                  <div align="center">Intern Frontend Developer</div>                   |
| <div align="center"><img src="https://github.com/ianaaians.png" width="60" height="60"><br/>[**Iana-Iuliana Nastasiu**](https://github.com/ianaaians)</div>     |                  <div align="center">Intern Frontend Developer</div>                   |

## 📄 License

[MIT License](LICENSE)
