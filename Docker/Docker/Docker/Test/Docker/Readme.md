# 🚀 Todo Backend API

A complete and professional API for managing tasks (Todo) with JWT authentication

## ✨ Features

- 🔐 Full authentication with JWT and Refresh Token
- 📝 Full CRUD operations for managing tasks
- 🗃️ PostgreSQL database with Sequelize ORM
- 🐳 Docker and Docker Compose for easy implementation
- 📊 Database management panel (pgAdmin)
- 📚 API documentation with Swagger
- ✅ Full testing with Jest
- 🔒 Security with Helmet, CORS, Rate Limiting
- 📝 Advanced logging with Winston
- 🎯 Validation with Joi
- 📱 Support for Pagination, Filtering, Sorting

## 🚀 Quick setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (if not using Docker)

### Installation with Docker (recommended)

```bash
# Clone  Repository
git clone https://github.com/yourusername/todo-backend.git
cd todo-backend
# Copy the env file
cp .env.example .env
# Setup with Docker Compose
docker-compose up -d
