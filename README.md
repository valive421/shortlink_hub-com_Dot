# Shortly — Branded Short-Link & Bio-Link Hub

A MERN implementation of Project 04 from the technical assessment: a Bitly + Linktree hybrid with custom short links, click telemetry, analytics, and a public link-in-bio page.

## Assessment alignment

This implementation covers the Project 04 core requirements:

- Pair-token JWT authentication: 15-minute access token + 7-day refresh token in an httpOnly cookie
- Signup with simulated email verification
- Login with refresh-token rotation
- Forgot/reset password simulation
- Auto-generated unique 6-character short codes
- Custom vanity slugs with collision detection and URL validation
- `GET /r/:shortCode` 302 redirects with asynchronous click telemetry
- Timestamp, referrer, device type and hashed IP telemetry
- Analytics aggregation for clicks over time, top referrers and devices
- Link library with search, pagination, copy, QR and delete
- Bio profile editor with avatar, display name, bio and social links
- Minimal Light, Dark Slate and Gradient themes
- Public responsive `/bio/:username` page
- Rate limiting on link creation and redirects
- MongoDB indexes for short-code and username lookups

The technical assessment evaluates requirement understanding, functionality, code quality, architecture, database design, APIs, frontend usability, technical decisions and documentation.

## Stack

- **Frontend:** React + Vite + Tailwind CSS + Coss UI primitives
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas M0 Free Tier (512 MB) + Mongoose
- **Auth:** 15-minute JWT access token + 7-day rotating refresh token in an httpOnly cookie
- **Charts:** Recharts
- **QR:** qrcode.react
- **Security:** Helmet, CORS, express-rate-limit, bcrypt, IP hashing, Zod validation

Coss UI is installed through the shadcn registry workflow. See the official Coss UI documentation for the current installation flow.

## Requirements

- Node.js 20+
- npm 10+
- A MongoDB Atlas account with an **M0 Free cluster (512 MB)**

No local MongoDB installation and no Docker installation are required.

## 1. MongoDB Atlas setup

Create an Atlas M0 Free cluster and then:

1. Create a database user.
2. Add your development IP under **Network Access**.
3. Open **Connect → Drivers**.
4. Select Node.js.
5. Copy the `mongodb+srv://...` connection string.
6. Replace the username/password/cluster placeholders.

The application will create its collections automatically through Mongoose when the API starts.

### Atlas connection string

Your server environment should contain:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/branded_shortlink?retryWrites=true&w=majority
```

If your password contains characters such as `@`, `:`, `/`, `?`, `#` or `%`, URL-encode the password before putting it into the connection string.

## 2. Install the repository

```bash
git clone <YOUR_PUBLIC_REPO_URL>
cd branded-shortlink-hub
npm install
npm run install:all
```

Or use the included setup script on macOS/Linux:

```bash
chmod +x setup.sh
./setup.sh
```

## 3. Configure environment

Create the backend environment file:

```bash
cp .env.example server/.env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example server/.env
```

Then edit `server/.env` and set:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/branded_shortlink?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your-long-random-access-secret
JWT_REFRESH_SECRET=your-long-random-refresh-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_PUBLIC_BASE_URL=http://localhost:5000
```

**Never commit `server/.env` or `client/.env`.** The assessment requires that passwords, API keys, tokens and database credentials are excluded from the repository.

## 4. Install Coss UI components

Run from `client/`:

```bash
cd client
npx shadcn@latest init @coss/style
npx shadcn@latest add @coss/ui
cd ..
```

The CLI generates the local Coss/shadcn-compatible UI primitives under `client/src/components/ui/`.

## 5. Run the application

From the project root:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

API:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

## Core routes

### Frontend

- `/login`
- `/signup`
- `/dashboard`
- `/links`
- `/analytics`
- `/bio`
- `/bio/:username`

### Backend

- `POST /api/auth/signup`
- `POST /api/auth/verify-email`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/links`
- `POST /api/links`
- `GET /api/links/:id`
- `GET /api/links/:id/analytics`
- `DELETE /api/links/:id`
- `GET /r/:shortCode`
- `GET /api/bio/me`
- `PUT /api/bio/me`
- `GET /api/bio/:username`

## Authentication design

The browser receives a short-lived access token and keeps it in application memory. The long-lived refresh token is stored as an `httpOnly` cookie scoped to `/api/auth`. Refresh tokens are stored hashed in MongoDB and rotated on every refresh; the previous token is revoked.

## Email verification and password reset

The assessment asks for simulation rather than a required external mail provider. In development, the signup and forgot-password endpoints return one-time simulation tokens so the flows can be demonstrated without committing an email-service credential.

## Click telemetry

For every successful redirect the server schedules a non-blocking `ClickEvent` insert containing:

- timestamp
- HTTP referrer
- Mobile/Desktop/Tablet device type
- salted SHA-256 IP hash

The redirect itself remains a `302` response.

## Database design

MongoDB Atlas collections:

- `users`
- `refreshtokens`
- `links`
- `clickevents`
- `bioprofiles`

Important indexes include unique short codes and usernames, plus link/time indexes for telemetry queries.

The free M0 tier is sufficient for assessment/demo usage. Click events are intentionally kept lean; for production-scale traffic, telemetry should move to a queue/streaming pipeline and a dedicated analytics store.

## Security notes

- Passwords are bcrypt-hashed.
- Access tokens expire after 15 minutes.
- Refresh tokens expire after 7 days and rotate.
- Refresh tokens are `httpOnly` cookies.
- Raw IP addresses are never persisted.
- Link creation and redirect endpoints are rate limited.
- Helmet is enabled.
- CORS is restricted to the configured frontend origin.
- Zod validates API inputs.
- Unique MongoDB indexes protect aliases and usernames.

## Atlas troubleshooting

### `bad auth`

Check the Atlas database username/password. Make sure you are using the **database user's** credentials, not your Atlas account login.

### `IP not in access list`

In Atlas, open **Network Access** and add the public IP from which you are running the application.

For a temporary development setup, Atlas also supports allowing access from anywhere, but a restricted IP allowlist is preferable.

### Connection string contains special characters

URL-encode special characters in the database password.

### Application starts but database connection fails

Check `server/.env`, restart the backend and verify the Atlas cluster is running.

## Limitations / production improvements

- Email verification and password reset are simulations; production would use a transactional email provider.
- The click event write is intentionally asynchronous; a queue such as BullMQ would be preferable at larger scale.
- A production deployment should use HTTPS, `COOKIE_SECURE=true`, a managed MongoDB deployment, centralized logs and monitoring.
- The public short-link base URL should be a dedicated production domain.
- The Atlas M0 tier is intended for development/assessment scale, not high-volume production analytics.

## Assessment deliverables

Before submission:

1. Push the complete source to one public Git repository.
2. Verify `.env` and secrets are excluded from Git.
3. Verify the public repository can be cloned and started using the README.
4. Record the explanation video covering architecture, database, APIs, frontend, security, decisions, challenges and limitations.
5. Submit the public repository and public video links in the assessment form.
