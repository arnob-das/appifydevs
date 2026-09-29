# EchoGPT Backend REST API

> **Production-Ready Backend REST API for EchoGPT Multi-AI Chrome Extension**  
> Built with **NestJS**, **PostgreSQL**, **Prisma ORM**, and **Swagger OpenAPI**.

[![NestJS](https://img.shields.io/badge/NestJS-v12.0-E0234E?logo=nestjs)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-4169E1?logo=postgresql)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-v6.19-2D3748?logo=prisma)](https://www.prisma.io)
[![Swagger](https://img.shields.io/badge/OpenAPI-v3.0-85EA2D?logo=swagger)](http://localhost:3000/api/docs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Design Principles](#architecture--design-principles)
3. [Technology Stack](#technology-stack)
4. [Normalized PostgreSQL Database Schema](#normalized-postgresql-database-schema)
5. [Feature Highlights](#feature-highlights)
   - [1. Authentication & Security](#1-authentication--security)
   - [2. User Management](#2-user-management)
   - [3. Subscription Management & Daily Usage Limits](#3-subscription-management--daily-usage-limits)
   - [4. AI Provider Management (OpenAI, Claude, Gemini)](#4-ai-provider-management)
   - [5. Chat API & Server-Sent Events (SSE) Streaming](#5-chat-api--streaming)
   - [6. AI-Assisted Web Search & Result Caching](#6-web-search-api--result-caching)
   - [7. Admin Panel & Observability](#7-admin-panel-apis)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Installation & Local Setup](#installation--local-setup)
8. [Docker Compose Deployment](#docker-compose-deployment)
9. [Running Tests](#running-tests)
10. [Chrome Extension Integration Guide](#chrome-extension-integration-guide)
11. [Postman Collection](#postman-collection)
12. [License](#license)

---

## Project Overview

EchoGPT is a Multi-AI Chat Sidebar extension for Google Chrome that enables users to effortlessly switch between top-tier AI models (OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, Google Gemini 1.5 Pro), perform AI-assisted web searches, and maintain organized conversation threads.

This repository contains the production-ready REST API backend powering EchoGPT, implementing clean architecture, secure session handling, plan-based rate/usage limiting, multi-model AI adapters, and comprehensive Swagger documentation.

---

## Architecture & Design Principles

The backend is built following **Clean Architecture** and NestJS modular design:

```
src/
├── common/                     (Cross-cutting concerns & shared infrastructure)
│   ├── constants/              (Roles, Plan tiers, Provider types, Daily quotas)
│   ├── decorators/             (@CurrentUser, @Roles, @Public)
│   ├── dto/                    (Standardized Pagination and API response envelopes)
│   ├── filters/                (AllExceptionsFilter centralized error handling)
│   ├── guards/                 (JwtAuthGuard, RolesGuard, UsageLimitGuard)
│   ├── interceptors/           (LoggingInterceptor, TransformInterceptor)
│   └── utils/                  (crypto.util AES-256-GCM, hash.util Bcrypt)
├── config/                     (Type-safe configuration & Swagger OpenAPI setup)
├── prisma/                     (Prisma Client lifecycle management)
└── modules/
    ├── auth/                   (Registration, Login, Token Refresh Rotation, Email Verification)
    ├── users/                  (Profile, Password Changes, Account deletion)
    ├── subscriptions/          (Tier upgrades/downgrades, daily limit tracking, quota reset)
    ├── ai-providers/           (Provider CRUD, multi-model adapter factory, health ping)
    ├── chat/                   (Multi-turn prompt execution, SSE streaming, thread management)
    ├── web-search/             (Query execution, SearchCache TTL acceleration, suggestions)
    └── admin/                  (Dashboard statistics, user/sub administration, audit logs)
```

### Core Architecture Pillars:
- **Separation of Concerns**: Controllers exclusively handle HTTP routing and Swagger metadata; Services encapsulate pure business domain logic; Prisma models enforce schema invariants.
- **Factory & Adapter Pattern**: AI providers are decoupled behind an `IAiAdapter` contract, permitting seamless addition of new LLM providers without touching chat logic.
- **Defence-in-Depth Security**: Argon2/Bcrypt password hashing, AES-256-GCM encryption for stored API keys, JWT token rotation, Helmet HTTP headers, Throttler rate limiting, and Role-Based Access Control (RBAC).

---

## Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Framework** | NestJS 12 | Enterprise-grade TypeScript framework |
| **Database** | PostgreSQL 16 | ACID-compliant relational persistence |
| **ORM** | Prisma 6.19 | Type-safe query engine and schema migration manager |
| **API Specs** | Swagger / OpenAPI 3.0 | Interactive API testing documentation at `/api/docs` |
| **Auth** | Passport & JWT | Stateless Bearer access token + refresh token rotation |
| **Password Hashing** | Bcrypt (10 rounds) | Salted one-way hash algorithm |
| **Key Encryption** | AES-256-GCM | Authenticated cipher for AI provider keys at rest |
| **Streaming** | Server-Sent Events (SSE) | Push-based real-time token streaming over HTTP |
| **Testing** | Vitest | High-speed unit and integration test runner |
| **Containerization**| Docker & Docker Compose | Multi-stage production container build |

---

## Normalized PostgreSQL Database Schema

```mermaid
erDiagram
    User ||--o{ Session : "has many"
    User ||--o| Subscription : "has one"
    User ||--o{ Conversation : "owns"
    User ||--o{ WebSearch : "performs"
    User ||--o{ ApiUsageLog : "generates"
    AiProvider ||--o{ Conversation : "serves"
    Conversation ||--o{ ChatMessage : "contains"

    User {
        uuid id PK
        string email UK
        string passwordHash
        string name
        enum role "USER | ADMIN"
        boolean isEmailVerified
        datetime createdAt
    }

    Session {
        uuid id PK
        uuid userId FK
        string refreshTokenHash
        boolean isRevoked
        datetime expiresAt
    }

    Subscription {
        uuid id PK
        uuid userId FK, UK
        enum planTier "FREE | PREMIUM | ENTERPRISE"
        enum status "ACTIVE | CANCELLED | EXPIRED"
        int requestsUsedToday
        int requestsLimitDaily
        int tokensUsedCurrentMonth
        datetime currentPeriodEnd
    }

    AiProvider {
        uuid id PK
        string name UK
        enum providerType "OPENAI | CLAUDE | GEMINI | CUSTOM"
        string encryptedApiKey "AES-256-GCM"
        string defaultModel
        boolean isEnabled
        boolean isDefault
    }

    Conversation {
        uuid id PK
        uuid userId FK
        uuid providerId FK
        string title
        string model
    }

    ChatMessage {
        uuid id PK
        uuid conversationId FK
        enum role "USER | ASSISTANT | SYSTEM"
        text content
        int tokensUsed
    }

    WebSearch {
        uuid id PK
        uuid userId FK
        string query
        json results
        text summary
    }

    SearchCache {
        uuid id PK
        string queryHash UK
        string query
        json results
        datetime expiresAt
    }

    ApiUsageLog {
        uuid id PK
        uuid userId FK
        string endpoint
        string method
        int statusCode
        int responseTimeMs
    }
```

---

## Feature Highlights

### 1. Authentication & Security
- **Registration & Login**: Issues short-lived Access Tokens (15m) and long-lived Refresh Tokens (7d).
- **Refresh Token Rotation**: Each refresh request revokes the prior session hash and issues a fresh token pair to prevent token hijacking.
- **Secure Logout**: Revokes the specific user session or all sessions in the database.
- **Email Verification (Bonus)**: Issues secure 32-byte hex verification tokens with 24-hour expiration.

### 2. User Management
- View and update profile (`GET/PATCH /users/me`).
- Secure password change endpoint (`POST /users/change-password`) with automatic invalidation of existing active sessions.
- Full account deletion (`DELETE /users/me`) with cascade deletion of data.

### 3. Subscription Management & Daily Usage Limits
EchoGPT features a tier system enforcing daily request quotas:
- **Free**: 20 requests/day, 100k tokens/month.
- **Premium**: 500 requests/day, 2M tokens/month, all models, priority response ($19.99/mo).
- **Enterprise**: 5000 requests/day, 20M tokens/month ($99.99/mo).
- **`UsageLimitGuard`**: Intercepts requests before AI generation or Web Search, returns `429 Too Many Requests` with upgrade hints if daily quota is reached, and automatically resets at midnight UTC.

### 4. AI Provider Management
- **Multi-Model Provider Engine**: Built-in support for OpenAI, Anthropic Claude, and Google Gemini.
- **AES-256-GCM Encryption**: Plaintext API keys are never stored in the database.
- **Public & Admin Endpoints**: Users retrieve enabled providers and model options with masked keys (`sk-p...1234`), while Admins can add, edit, toggle, or set default providers.
- **Health Checks**: `/ai-providers/health` tests network response latency against provider endpoints.

### 5. Chat API & Streaming
- **Standard Prompt**: `POST /chat/send` saves user message, invokes AI adapter with context history (last 10 messages), saves assistant response, and increments usage.
- **SSE Streaming (Bonus)**: `GET /chat/stream?prompt=...` utilizes Server-Sent Events to push incremental token chunks in real-time (`text/event-stream`), completing with token consumption metadata and database record synchronization.

### 6. Web Search API & Result Caching
- **Cached Search**: `POST /search` computes a SHA-256 hash of the query and checks `SearchCache` table. If found within TTL (2 hours), returns instantly with `cached: true` (Cache Hit).
- **AI Synthesis Summary**: Summarizes web findings across top domain sources.
- **History & Autocomplete Suggestions**: Tracks user search history and suggests matching keywords based on user and platform search queries.

### 7. Admin Panel APIs
- **Dashboard Stats**: Real-time aggregation of users, active subscriptions, total conversations, tokens consumed, and API latency.
- **User & Subscription Admin**: Role updates (`USER` <-> `ADMIN`), plan overrides, user deletion.
- **Audit Logs & System Health**: Process uptime, heap and RSS memory stats, and live database latency check.

---

## API Endpoints Reference

All endpoints (except `@Public()` routes) require the Bearer header: `Authorization: Bearer <accessToken>`.

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Public? |
|---|---|---|:---:|
| `POST` | `/auth/register` | Register new account & start free plan | Yes |
| `POST` | `/auth/login` | Authenticate credentials & issue tokens | Yes |
| `POST` | `/auth/refresh` | Rotate session & refresh tokens | Yes |
| `POST` | `/auth/logout` | Revoke current/all user sessions | No |
| `POST` | `/auth/verify-email` | Verify email address via token | Yes |
| `POST` | `/auth/resend-verification` | Resend verification token | Yes |

### User Management (`/api/v1/users`)
| Method | Endpoint | Description | Public? |
|---|---|---|:---:|
| `GET` | `/users/me` | Get current user profile & subscription summary | No |
| `PATCH` | `/users/me` | Update name and avatar URL | No |
| `POST` | `/users/change-password` | Change password and revoke sessions | No |
| `DELETE`| `/users/me` | Delete user account and cascade data | No |

### Subscriptions (`/api/v1/subscriptions`)
| Method | Endpoint | Description | Public? |
|---|---|---|:---:|
| `GET` | `/subscriptions/plans` | List available tiers, limits, and pricing | Yes |
| `GET` | `/subscriptions/status` | Current subscription tier and usage status | No |
| `GET` | `/subscriptions/remaining-requests`| Quick remaining quota for Chrome extension | No |
| `POST` | `/subscriptions/upgrade` | Upgrade subscription tier | No |
| `POST` | `/subscriptions/downgrade` | Downgrade subscription tier | No |
| `POST` | `/subscriptions/cancel` | Cancel subscription auto-renewal | No |

### AI Providers (`/api/v1/ai-providers`)
| Method | Endpoint | Description | Role |
|---|---|---|:---:|
| `GET` | `/ai-providers` | List active providers and model options | Public |
| `GET` | `/ai-providers/health` | Check connectivity of all active providers | Public |
| `GET` | `/ai-providers/:id` | Provider details (masked key) | Public |
| `GET` | `/ai-providers/:id/health` | Specific provider latency ping | Public |
| `POST` | `/ai-providers` | Add new AI provider (AES-256 encrypted) | Admin |
| `PATCH`| `/ai-providers/:id` | Update provider configuration | Admin |
| `PATCH`| `/ai-providers/:id/toggle` | Toggle provider active status | Admin |
| `PATCH`| `/ai-providers/:id/set-default`| Set provider as system default | Admin |
| `DELETE`| `/ai-providers/:id` | Remove AI provider | Admin |

### Chat API (`/api/v1/chat`)
| Method | Endpoint | Description | Guard |
|---|---|---|:---:|
| `POST` | `/chat/send` | Send prompt and receive AI response | UsageLimitGuard |
| `GET` | `/chat/stream` | Server-Sent Events (SSE) real-time streaming | UsageLimitGuard |
| `POST` | `/chat/conversations` | Create a new conversation thread | JwtAuthGuard |
| `GET` | `/chat/conversations` | List user conversation threads (paginated) | JwtAuthGuard |
| `GET` | `/chat/conversations/:id` | Get full message history of a thread | JwtAuthGuard |
| `PATCH`| `/chat/conversations/:id` | Rename conversation thread | JwtAuthGuard |
| `DELETE`| `/chat/conversations/:id` | Delete conversation thread | JwtAuthGuard |
| `DELETE`| `/chat/conversations/:id/messages`| Clear messages in thread | JwtAuthGuard |

### Web Search (`/api/v1/search`)
| Method | Endpoint | Description | Guard |
|---|---|---|:---:|
| `POST` | `/search` | Perform AI web search (cached) | UsageLimitGuard |
| `GET` | `/search` | GET search convenience endpoint | UsageLimitGuard |
| `GET` | `/search/history` | Paginated search history | JwtAuthGuard |
| `GET` | `/search/recent` | Recent distinct queries array | JwtAuthGuard |
| `GET` | `/search/suggestions` | Autocomplete prefix suggestions | Public |
| `DELETE`| `/search/history` | Clear search history | JwtAuthGuard |

### Admin Panel (`/api/v1/admin`)
| Method | Endpoint | Description | Role |
|---|---|---|:---:|
| `GET` | `/admin/dashboard/stats` | Aggregated user, chat, search, and traffic metrics | Admin |
| `GET` | `/admin/users` | Paginated users list with search & role filter | Admin |
| `GET` | `/admin/users/:id` | Comprehensive user details with activity counts | Admin |
| `PATCH`| `/admin/users/:id/role` | Update user role (`USER` / `ADMIN`) | Admin |
| `DELETE`| `/admin/users/:id` | Admin delete user account | Admin |
| `GET` | `/admin/subscriptions` | Paginated subscriptions across all users | Admin |
| `PATCH`| `/admin/subscriptions/:id` | Update user subscription plan or daily quota | Admin |
| `GET` | `/admin/analytics/usage` | Endpoint traffic breakdown and latency stats | Admin |
| `GET` | `/admin/logs` | Paginated `ApiUsageLog` audit logs | Admin |
| `GET` | `/admin/health` | Uptime, memory usage, and PostgreSQL ping | Admin |

---

## Installation & Local Setup

### Prerequisites
- Node.js 20+ or 22+
- PostgreSQL 14+ (or Docker)
- npm or pnpm

### 1. Clone & Install Dependencies
```bash
git clone <repository_url> echogpt-backend
cd echogpt-backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your PostgreSQL database URL is set in `.env`:
```env
DATABASE_URL="postgresql://echogpt_user:echogpt_password@localhost:5432/echogpt_db?schema=public"
```

### 3. Run Database Migrations & Seed Data
```bash
npm run db:migrate

npm run seed
```

Default seeded credentials:
- **Admin**: `admin@echogpt.dev` / `Admin@123456`
- **User**: `user@echogpt.dev` / `User@123456`

### 4. Start the Application
```bash
npm run start:dev

npm run build
npm run start:prod
```

### 5. Access Interactive Swagger Docs
Open your browser and navigate to:
```
http://localhost:3000/api/docs
```

---

## Docker Compose Deployment

To run the complete production stack (PostgreSQL + NestJS API + pgAdmin GUI) in one command:

```bash
docker compose up -d --build
```

Services will be accessible at:
- **EchoGPT Backend API**: `http://localhost:3000/api/v1`
- **Swagger Documentation**: `http://localhost:3000/api/docs`
- **PostgreSQL**: `localhost:5432`
- **pgAdmin**: `http://localhost:5050` (Email: `admin@echogpt.dev` / Password: `Admin@123456`)

To tear down:
```bash
docker compose down -v
```

---

## Running Tests

The test suite covers crypto encryption, password hashing, multi-model adapters, subscriptions limits, and web search caching:

```bash
npm test

npm run test:cov

npm run test:watch
```

---

## Chrome Extension Integration Guide

### 1. Connecting from Extension Background Service Worker
In the Chrome Extension's background script or sidebar iframe:

```typescript
const BACKEND_URL = 'http://localhost:3000/api/v1';
let accessToken = localStorage.getItem('echogpt_access_token');

async function checkRemainingQuota() {
  const res = await fetch(`${BACKEND_URL}/subscriptions/remaining-requests`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  console.log(`Remaining requests today: ${data.data.remainingRequests}`);
}

function streamPrompt(prompt, model = 'gpt-4o') {
  const eventSource = new EventSource(
    `${BACKEND_URL}/chat/stream?prompt=${encodeURIComponent(prompt)}&model=${model}`
  );

  eventSource.onmessage = (event) => {
    const chunk = JSON.parse(event.data);
    if (chunk.done) {
      eventSource.close();
      console.log('Stream finished!');
    } else {
      document.getElementById('sidebar-chat').innerHTML += chunk.chunk;
    }
  };
}
```

---

## Postman Collection

A complete Postman collection is included at `postman_collection.json`.

To test the API using Postman:
1. Import `postman_collection.json` into Postman.
2. The collection includes preconfigured environment variables:
   - `baseUrl`: `http://localhost:3000/api/v1`
   - `accessToken`: Automatically populated when executing `Authentication -> Login User`
   - `adminAccessToken`: Automatically populated when executing `Authentication -> Login Admin`
3. All endpoints across Authentication, User Profile, Subscriptions, AI Providers, Chat (including SSE streaming), Web Search, and Admin analytics are pre-configured with headers and request bodies.

---

## License
This project is open-source and licensed under the MIT License.
