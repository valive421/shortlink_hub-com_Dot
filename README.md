# Shortly — Branded Short-Link & Bio-Link Hub

<p align="center">
  <strong>A modern Bitly + Linktree-style platform for branded short links, link analytics, and customizable bio pages.</strong>
</p>

<p align="center">
  <a href="http://80.225.223.253">Live Application</a> ·
  <a href="https://github.com/valive421/shortlink_hub-com_Dot">GitHub Repository</a>
</p>

---

## ✨ Overview

**Shortly** is a full-stack MERN application developed for **Project 04 of the technical assessment**.

It combines two common creator/marketing workflows in one application:

- **Branded URL shortener** — create short links with generated codes or custom vanity slugs.
- **Link-in-bio hub** — create a public profile containing a bio, avatar, social links, and shareable links.
- **Analytics dashboard** — understand link performance through click trends, referrers, and device distribution.

The implementation focuses on the assessment's core requirements while keeping the architecture simple enough to run on low-cost/free infrastructure.

> **Assessment basis:** The provided assessment allows either MERN or Python and evaluates requirement understanding, functionality, code quality, architecture, database design, API implementation, UI/UX, technical decisions, and documentation. 
---

## 🚀 Live Demo

### Frontend

**http://80.225.223.253**

The React/Vite production build is served by **Nginx** on an Oracle Cloud Ubuntu VM.

### API

**http://80.225.223.253/api**

The API is reverse-proxied by Nginx to the Node.js/Express process running on the same VM.

### Public routes

```text
http://80.225.223.253/
http://80.225.223.253/r/<shortCode>
http://80.225.223.253/bio/<username>
```

> The deployment currently uses HTTP because it is running directly on the assessment VM. For a production deployment, HTTPS should be enabled and secure cookies should be used.

---

# 🎯 Key Features

## 🔐 Authentication

- Signup and simulated email verification
- Login with JWT authentication
- Short-lived **15-minute access token**
- **7-day refresh token**
- Refresh token stored in an `httpOnly` cookie
- Refresh-token rotation
- Logout/revocation
- Forgot-password flow
- Reset-password flow
- Password hashing with bcrypt

## 🔗 Branded Short Links

- Automatically generated unique **6-character** short codes
- Custom vanity slugs
- Collision detection
- Destination URL validation
- Link library
- Search
- Pagination
- Copy short URL
- QR-code generation
- Link deletion

## 📊 Analytics

Each successful redirect can generate a lightweight click event containing:

- Timestamp
- HTTP referrer
- Device type
  - Mobile
  - Desktop
  - Tablet
- Salted SHA-256 IP hash

The dashboard aggregates this data for:

- Total clicks
- Clicks over time
- Top referrers
- Device distribution

## 👤 Bio-Link Hub

Users can customize:

- Avatar
- Display name
- Bio
- Social links
- Public username

Available themes:

- Minimal Light
- Dark Slate
- Gradient

The public profile is responsive and available at:

```text
/bio/:username
```

## 🛡️ Security & Validation

- bcrypt password hashing
- JWT expiration
- Rotating refresh tokens
- `httpOnly` refresh cookies
- Helmet security headers
- CORS configuration
- API input validation with Zod
- Rate limiting on link creation and redirect routes
- Hashed IP telemetry instead of storing raw IP addresses
- Unique MongoDB indexes for aliases/usernames

---

# 🏗️ Architecture

Shortly follows a conventional three-layer web architecture:

```mermaid
flowchart LR
    U[User / Browser]

    N[Nginx<br/>Reverse Proxy + Static Server]

    F[React + Vite<br/>Tailwind + Coss UI]

    A[Node.js + Express API]

    M[(MongoDB Atlas)]

    U -->|HTTP| N
    N -->|Static assets / SPA| F
    N -->|/api/*| A
    N -->|/r/* redirects| A
    N -->|/bio/* public pages| A
    A -->|Mongoose| M
```

### Request flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Nginx
    participant API as Express API
    participant DB as MongoDB Atlas

    B->>N: HTTP request
    alt React application
        N-->>B: Vite production assets
    else API request
        N->>API: /api/*
        API->>DB: Query / mutation
        DB-->>API: Result
        API-->>N: JSON response
        N-->>B: JSON response
    else Short-link redirect
        N->>API: GET /r/:shortCode
        API->>DB: Find indexed link
        DB-->>API: Destination
        API-->>B: HTTP 302 redirect
        API-->>DB: Async click telemetry
    else Public bio
        N->>API: GET /bio/:username
        API->>DB: Find indexed profile
        DB-->>API: Profile
        API-->>N: Response
        N-->>B: Public page
    end
```

---

# ☁️ Deployment Infrastructure

The current deployment is intentionally lightweight and uses a single Oracle Cloud VM plus MongoDB Atlas.

```mermaid
flowchart TB
    INTERNET[Internet]

    subgraph ORACLE[Oracle Cloud Infrastructure]
        VM[Ubuntu 24.04 VM]

        NG[Nginx :80]
        PM2[PM2 Process Manager]
        NODE[Node.js + Express :5000]
        REACT[React Production Build<br/>client/dist]

        NG -->|Static files| REACT
        NG -->|Reverse proxy /api| NODE
        NG -->|Reverse proxy /r| NODE
        NG -->|Reverse proxy /bio| NODE
        PM2 --> NODE
    end

    ATLAS[(MongoDB Atlas<br/>M0 Free Tier)]

    INTERNET -->|HTTP :80| NG
    NODE -->|Mongoose / MongoDB URI| ATLAS
```

### Infrastructure components

| Component | Purpose |
|---|---|
| **Oracle Cloud VM** | Hosts the application |
| **Ubuntu 24.04** | Server operating system |
| **Nginx** | Static frontend hosting and reverse proxy |
| **Node.js 22** | Backend runtime |
| **Express.js** | REST API and redirect engine |
| **PM2** | Keeps the backend process running and restarts it after failures/reboots |
| **MongoDB Atlas M0** | Managed database |
| **GitHub** | Source-code hosting |

### Deployment flow

```mermaid
flowchart LR
    DEV[Developer]
    GH[GitHub]
    VM[Oracle Cloud VM]
    BUILD[npm run build]
    NG[Nginx]
    PM2[PM2]
    DB[(MongoDB Atlas)]

    DEV -->|git push| GH
    GH -->|git clone / pull| VM
    VM --> BUILD
    BUILD --> NG
    VM --> PM2
    PM2 -->|Node API| DB
```

### Why this deployment architecture?

The assessment primarily requires a working, reviewable application and public repository rather than a particular cloud architecture. fileciteturn13file1L59-L69

A single VM was chosen for the assessment deployment because it:

1. Keeps the architecture easy to understand.
2. Avoids unnecessary cloud-service complexity.
3. Allows frontend and backend to share one public origin.
4. Lets Nginx terminate public HTTP traffic and reverse-proxy API requests.
5. Keeps MongoDB managed externally through Atlas.
6. Is inexpensive and suitable for assessment/demo traffic.

For production, the application could be split into independently scalable frontend/API services with HTTPS, a CDN, centralized logging, a queue, and a production-grade database tier.

---

# 🗄️ Database Design

Shortly uses MongoDB with Mongoose.

### Collections

```text
users
refreshtokens
links
clickevents
bioprofiles
```

### Entity relationship overview

MongoDB is document-oriented, but the logical relationships can be represented as:

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : owns
    USERS ||--o{ LINKS : creates
    USERS ||--|| BIO_PROFILES : has
    LINKS ||--o{ CLICK_EVENTS : receives

    USERS {
        ObjectId _id PK
        string email UK
        string passwordHash
        string username UK
        boolean emailVerified
    }

    REFRESH_TOKENS {
        ObjectId _id PK
        ObjectId userId FK
        string tokenHash
        date expiresAt
        boolean revoked
    }

    LINKS {
        ObjectId _id PK
        ObjectId userId FK
        string shortCode UK
        string destinationUrl
        string title
        date createdAt
    }

    CLICK_EVENTS {
        ObjectId _id PK
        ObjectId linkId FK
        date timestamp
        string referrer
        string deviceType
        string ipHash
    }

    BIO_PROFILES {
        ObjectId _id PK
        ObjectId userId FK
        string username UK
        string avatar
        string displayName
        string bio
        string theme
        array socialLinks
    }
```

> The diagram represents the application's documented logical data model. MongoDB stores these as separate collections rather than relational tables.

### Indexing strategy

Indexes are important because short-link redirects are lookup-heavy operations.

```mermaid
flowchart LR
    REQUEST[GET /r/:shortCode]
    INDEX[Indexed shortCode lookup]
    LINK[(links)]
    EVENT[Create ClickEvent]

    REQUEST --> INDEX
    INDEX --> LINK
    LINK --> EVENT
```

Important indexes include:

- Unique index on `links.shortCode`
- Unique index on `bioprofiles.username`
- User-oriented indexes for link retrieval
- Link/time indexes for click-event analytics

This allows the redirect path to locate a short link without scanning the entire collection.

---

# 🔄 Short-Link Request Flow

```mermaid
sequenceDiagram
    participant User
    participant API as Express
    participant DB as MongoDB
    participant Target as Destination

    User->>API: GET /r/abc123
    API->>DB: Find shortCode = abc123
    DB-->>API: Link document
    API-->>User: 302 Location: destination URL
    API-)DB: Insert ClickEvent asynchronously
    User->>Target: Follow redirect
```

The redirect remains a `302` response while telemetry is written asynchronously so analytics work does not unnecessarily block the redirect path.

---

# 🔑 Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as Express
    participant DB as MongoDB

    B->>API: POST /api/auth/login
    API->>DB: Verify user + password
    DB-->>API: User
    API-->>B: Access JWT + httpOnly refresh cookie

    B->>API: Authenticated API request
    API->>API: Validate access token
    API-->>B: Protected resource

    B->>API: POST /api/auth/refresh
    API->>DB: Validate refresh-token hash
    API->>DB: Revoke old token
    API->>DB: Store new token hash
    API-->>B: New access token + rotated refresh cookie
```

The access token is intentionally short-lived. Refresh tokens are stored hashed and rotated, reducing the impact of token reuse.

---

# 📡 API Overview

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/verify-email` | Simulated email verification |
| `POST` | `/api/auth/login` | Authenticate user |
| `POST` | `/api/auth/refresh` | Rotate refresh token |
| `POST` | `/api/auth/logout` | Revoke session |
| `POST` | `/api/auth/forgot-password` | Start password-reset simulation |
| `POST` | `/api/auth/reset-password` | Reset password |

## Links

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/links` | List/search/paginate links |
| `POST` | `/api/links` | Create short link |
| `GET` | `/api/links/:id` | Get link |
| `GET` | `/api/links/:id/analytics` | Get link analytics |
| `DELETE` | `/api/links/:id` | Delete link |
| `GET` | `/r/:shortCode` | Redirect to destination |

## Bio

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/bio/me` | Get current user's bio |
| `PUT` | `/api/bio/me` | Update bio |
| `GET` | `/api/bio/:username` | Get public bio |

The assessment specifically expects appropriate API implementation, validation, error handling, and API documentation where applicable. fileciteturn13file1L59-L69 fileciteturn13file1L95-L117

---

# 🧰 Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Coss UI / shadcn-compatible primitives
- React Router
- Axios
- Recharts
- qrcode.react
- Lucide React

### Backend

- Node.js
- Express 5
- Mongoose
- JSON Web Tokens
- bcryptjs
- Zod
- Helmet
- CORS
- express-rate-limit
- cookie-parser
- nanoid

### Infrastructure

- Oracle Cloud Infrastructure
- Ubuntu 24.04
- Nginx
- PM2
- MongoDB Atlas
- GitHub

---

# 📁 Project Structure

```text
shortlink_hub-com_Dot/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── API.md
├── architecture.md
├── README.md
├── package.json
└── setup.sh
```

---

# ⚙️ Local Development

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB Atlas account

The assessment permits additional libraries/frameworks and expects the repository to include setup instructions and environment requirements. fileciteturn13file1L93-L117

## 1. Clone

```bash
git clone https://github.com/valive421/shortlink_hub-com_Dot.git
cd shortlink_hub-com_Dot
```

## 2. Install dependencies

```bash
npm install
```

Then install the frontend and backend dependencies if required by the root setup:

```bash
cd server
npm install

cd ../client
npm install

cd ..
```

## 3. Configure backend

Create:

```text
server/.env
```

Example:

```env
PORT=5000

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/branded_shortlink?retryWrites=true&w=majority

CLIENT_URL=http://localhost:5173

JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret

ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
```

## 4. Configure frontend

Create:

```text
client/.env
```

For local development:

```env
VITE_API_URL=http://localhost:5000/api
VITE_PUBLIC_BASE_URL=http://localhost:5000
```

## 5. Start backend

```bash
cd server
npm run dev
```

## 6. Start frontend

In another terminal:

```bash
cd client
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🌐 Production Deployment

The current VM deployment uses:

```text
Browser
   │
   ▼
Oracle Cloud :80
   │
   ▼
Nginx
   ├── /       → client/dist
   ├── /api/*  → Node/Express :5000
   ├── /r/*    → Node/Express :5000
   └── /bio/*  → Node/Express :5000
```

### Frontend build

```bash
cd ~/shortlink_hub-com_Dot/client
npm install
npm run build
```

The generated files are placed in:

```text
client/dist/
```

Nginx serves this directory as the production frontend.

### Backend process

```bash
cd ~/shortlink_hub-com_Dot/server
npm install
pm2 start src/server.js --name shortly-api
pm2 save
```

PM2 is configured to restore the application after server restarts.

### Nginx

Nginx handles:

- Public port 80
- Static React files
- SPA fallback to `index.html`
- `/api/*` reverse proxy
- `/r/*` reverse proxy
- `/bio/*` reverse proxy

This creates a **single public origin** for the frontend and backend:

```text
http://80.225.223.253
```

That avoids the browser mixed-content problem that occurs when an HTTPS frontend calls an HTTP API.

---

# 🔒 Environment & Secrets

Never commit:

```text
server/.env
client/.env
```

Do not commit:

- MongoDB passwords
- JWT secrets
- API keys
- Access tokens
- Refresh tokens
- Other credentials

The assessment explicitly prohibits committing passwords, API keys, access tokens, database credentials, or other secrets. 
Use `.env.example` for safe placeholders.

---

# 🧪 Validation & Error Handling

The backend validates incoming API payloads with **Zod**.

Examples of validation areas include:

- URL format
- Required fields
- Authentication inputs
- Link creation payloads
- Bio/profile data

MongoDB unique indexes additionally protect against duplicate:

- Short codes
- Vanity slugs
- Usernames

---

# 📈 Analytics Design

The telemetry pipeline intentionally keeps the stored event compact:

```text
Redirect
   │
   ├── timestamp
   ├── referrer
   ├── deviceType
   └── salted IP hash
          │
          ▼
     ClickEvent
          │
          ▼
   Aggregation queries
          │
          ├── Total clicks
          ├── Clicks over time
          ├── Top referrers
          └── Device distribution
```

Raw IP addresses are not persisted.

For high-volume production traffic, this synchronous database architecture could be replaced by a queue/streaming pipeline and dedicated analytics storage.

---

# 🎨 Frontend UX

The application provides a dashboard-oriented experience with:

- Responsive layouts
- Reusable UI primitives
- Theme-aware components
- Link management
- Analytics visualizations
- QR generation
- Copy-to-clipboard actions
- Public bio pages optimized for mobile

The assessment explicitly evaluates frontend usability, responsiveness, and implementation quality. fileciteturn13file1L201-L214

---

# 🧠 Technical Decisions

### Why MongoDB?

The application's entities are naturally document-oriented and MongoDB works well for:

- User profiles
- Links
- Flexible social-link data
- Click-event documents
- Rapid assessment development

MongoDB Atlas also provides a managed free-tier database suitable for demonstration workloads.

### Why Nginx?

Nginx provides a simple production boundary between the public internet and the application:

- Serves static React assets efficiently
- Reverse-proxies API requests
- Provides one public origin
- Makes SPA routing work correctly
- Leaves Node.js focused on application logic

### Why PM2?

PM2 provides process supervision without introducing a larger container/orchestration stack for a single assessment VM.

### Why asynchronous click logging?

A short-link redirect should be fast. The application therefore returns the `302` redirect while scheduling telemetry persistence without making the redirect depend on the analytics write completing first.

---

# ⚠️ Limitations & Production Improvements

This is an assessment/demo deployment, not a hardened production SaaS environment.

### Current limitations

- Email verification is simulated.
- Password-reset email delivery is simulated.
- Deployment currently uses HTTP.
- MongoDB Atlas M0 is intended for small workloads.
- Click telemetry is stored directly in MongoDB.
- The public IP is used instead of a dedicated domain.

### Production roadmap

A production version could add:

- HTTPS with a real domain
- `COOKIE_SECURE=true`
- HSTS and stricter security headers
- Managed secrets
- Transactional email provider
- Redis-backed rate limiting
- Queue-based telemetry using BullMQ
- Dedicated analytics storage
- Centralized logging and monitoring
- CDN for static assets
- Automated CI/CD
- Horizontal API scaling
- Automated database backups

The assessment also asks candidates to honestly document incomplete areas and explain how they would improve them with additional time. 
---

# 📋 Assessment Requirement Mapping

| Requirement | Implementation |
|---|---|
| MERN stack | React + Node + Express + MongoDB |
| Authentication | JWT access/refresh token pair |
| Access token | 15 minutes |
| Refresh token | 7 days + rotation |
| Secure refresh storage | httpOnly cookie |
| Email verification | Simulated flow |
| Password reset | Simulated flow |
| Short code | Unique 6-character code |
| Vanity URL | Custom slug + collision detection |
| Redirect | `302 /r/:shortCode` |
| Telemetry | Timestamp, referrer, device, hashed IP |
| Analytics | Clicks, referrers, devices, trends |
| Link library | Search, pagination, copy, QR, delete |
| Bio profile | Avatar, name, bio, social links |
| Themes | Light, Dark Slate, Gradient |
| Public bio | `/bio/:username` |
| Rate limiting | Link creation + redirects |
| Database indexes | Short-code + username lookup indexes |
| Deployment | Oracle Cloud + Nginx + PM2 |
| Database hosting | MongoDB Atlas |

The assessment requires the major requirements of the selected project to be implemented, along with a functional frontend/backend, appropriate data storage, APIs/business logic, validation/error handling, and clean project structure. 

# 📚 Documentation

- **API Documentation:** [`API.md`](./API.md)
- **Architecture Notes:** [`architecture.md`](./architecture.md)
- **Repository:** https://github.com/valive421/shortlink_hub-com_Dot
- **Live Application:** http://80.225.223.253



## 👨‍💻 Project

**Shortly — Branded Short-Link & Bio-Link Hub**

Built as a full-stack MERN technical assessment project.

**Live:** http://80.225.223.253  
**Source:** https://github.com/valive421/shortlink_hub-com_Dot
