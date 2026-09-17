# Architecture — Shortly

## High-level architecture

```text
React + Coss UI
      |
      | HTTPS / REST + credentials
      v
Node.js + Express
      |
      +-- Auth middleware / validation / rate limiting
      |
      +-- Link controllers
      |
      +-- Bio controllers
      |
      +-- Analytics aggregation
      |
      v
MongoDB Atlas M0 Free (512 MB)
      |
      +-- users
      +-- refreshtokens
      +-- links
      +-- clickevents
      +-- bioprofiles
```

## Why MongoDB Atlas M0

The assessment allows MongoDB as the MERN database. MongoDB Atlas M0 is used so the application has a cloud-hosted MongoDB database without requiring a local MongoDB server or Docker. The schema is document-oriented and fits user profiles, links, social-link arrays and click-event documents naturally.

## Request flows

### Login

```text
React
  -> POST /api/auth/login
  -> Express validation
  -> bcrypt password comparison
  -> create refresh-token record with hashed token
  -> set httpOnly refresh cookie
  -> return 15-minute access token
```

### Refresh

```text
React
  -> POST /api/auth/refresh
  -> read httpOnly refresh cookie
  -> verify JWT + database token hash/jti
  -> revoke old refresh token
  -> issue new refresh token
  -> set replacement cookie
  -> return new access token
```

### Short-link redirect

```text
Browser
  -> GET /r/:shortCode
  -> rate limiter
  -> indexed Link lookup
  -> schedule ClickEvent write
  -> HTTP 302 destination
```

Telemetry contains timestamp, referrer, device type and an SHA-256 IP hash. Raw IP addresses are not persisted.

## Collections

### users

Stores identity and authentication-related user state. Passwords are stored as bcrypt hashes.

### refreshtokens

Stores only a hash of the refresh token plus its JWT `jti`, owner and expiry/revocation state. This supports rotation and server-side revocation.

### links

Stores destination URL, six-character/custom short code and owner. `shortCode` has a unique index because redirects depend on fast alias lookup.

### clickevents

Stores one compact telemetry document per click. The `linkId + timestamp` index supports analytics queries.

### bioprofiles

Stores public profile configuration including avatar, display name, bio, theme and social links.

## Rate limiting

Creation and redirect routes use `express-rate-limit` to reduce abuse. Authentication endpoints also use a stricter limiter.

## Atlas M0 considerations

The 512 MB free tier is appropriate for assessment/demo data. To avoid wasting storage:

- Click-event documents contain only the required telemetry fields.
- No raw IP addresses or unnecessary request payloads are stored.
- MongoDB indexes are limited to query-critical fields.
- Production-scale click ingestion should use a queue and an analytics-oriented datastore.
