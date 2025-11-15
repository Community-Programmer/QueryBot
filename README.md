# QueryBot

> An intelligent SQL query assistant with natural language processing and data visualization capabilities

## 🌟 Overview

QueryBot is a sophisticated AI-powered platform that transforms natural language questions into SQL queries, executes them on your databases, and provides intelligent insights with automated chart generation. Built with a modern microservices architecture, it combines the power of LangGraph agents, Flask APIs, React frontend, and Node.js database services to deliver seamless database interaction experiences.

**Perfect for:** Data analysts, business users, developers, and anyone who needs to extract insights from databases without writing SQL.

## ✨ Key Features

-  **Natural Language to SQL**: Transform plain English questions into optimized SQL queries
-  **Automated Visualization**: Generate contextual charts and graphs based on query results
-  **Secure Authentication**: JWT-based user authentication with cookie management
-  **Multi-format Support**: Upload SQLite databases or CSV files (auto-converted to SQLite)
-  **Real-time Streaming**: Live query execution updates via Server-Sent Events (SSE)
-  **Intelligent Insights**: AI-generated data narratives and recommendations
-  **Responsive UI**: Modern React interface with Tailwind CSS styling
-  **Workflow Management**: LangGraph-powered agent orchestration with conditional routing
-  **Docker Ready**: Containerized deployment for all services

## 🏗️ Architecture Overview

<img width="2882" height="1498" alt="diagram-export-11-14-2025-11_51_10-PM" src="https://github.com/user-attachments/assets/c2bbb7a4-5f14-406e-b905-637d247575c4" />

### Component Breakdown

| Component | Technology | Purpose | Port |
|-----------|------------|---------|------|
| **Frontend** | React + TypeScript + Vite | User interface and interaction | 5173 |
| **Auth Server** | Flask + SQLAlchemy + JWT | User authentication and LangGraph proxy | 5000 |
| **SQLite Server** | Node.js + Express + better-sqlite3 | Database file management and query execution | 3001 |
| **LangGraph Agent** | Python + LangGraph + OpenAI | Natural language processing and workflow orchestration | 8000 |

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-593D88?style=for-the-badge&logo=redux&logoColor=white)

### Backend
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

### Database & Storage
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

### AI & ML
![LangChain](https://img.shields.io/badge/LangChain-121212?style=for-the-badge&logo=chainlink&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)

> **⚠️ Need help?** Check the [SETUP.md](./SETUP.md) for detailed installation guide, troubleshooting, and configuration options.

