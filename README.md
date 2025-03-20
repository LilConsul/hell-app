# React FastAPI PostgreSQL Template

This is a template for building a full-stack application using React, FastAPI, PostgreSQL, and Nginx. It includes pre-configured self-signed SSL certificates for Nginx and has Tailwind CSS preinstalled for styling. The project is set up to run easily with Docker and Docker Compose.

## Features

- **Frontend**: React and TailwindCSS v4 .
- **Backend**: Python 3.13 / FastAPI with a PostgreSQL database.
- **API Docs**: Swagger API docs available at `/api/docs`.
- **Nginx**: Serves the React frontend and proxies API requests to FastAPI, with self-signed SSL certificates for HTTPS support.
- **Docker**: The project runs with a simple command `docker-compose up`.

## Nginx & Self-Signed Certificates

This project uses Nginx to serve the frontend and backend with HTTPS. Self-signed SSL certificates are included for local development. You can replace these with valid certificates for production.

### Self-Signed Certificates

Self-signed certificates are located in the `nginx/certs/` directory. These certificates are for local development and testing purposes. For production, you should replace them with certificates from a trusted certificate authority (CA).

## Getting Started

Follow the steps below to get this project running on your local machine.

### 1. Clone the repository

```bash
git clone https://github.com/LilConsul/fastapi-react-template.git 
cd fastapi-react-template
```

### 2. Start the application
Launch docker on your local machine and run the following command.

```bash
docker-compose up
```

### 3. Access the frontend
After the Docker containers are up and running, you can access the frontend at the following URL in your browser:

- [https://localhost](https://localhost)

This will display the React app, which has Tailwind CSS preinstalled for styling.

### 4. Access the backend API docs

FastAPI automatically generates API documentation using Swagger UI. You can view the API docs at:

- [https://localhost/api/docs](https://localhost/api/docs)

Here, you can test all the available API endpoints and interact with the backend directly.

### 5. Stopping the application

To stop the Docker containers, run the following command:

```bash
docker-compose down
```