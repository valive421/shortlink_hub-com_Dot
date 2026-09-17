# API Documentation

Base URL: `http://localhost:5000`

## Auth

### POST `/api/auth/signup`

```json
{"email":"demo@example.com","password":"Password123!","username":"demo","displayName":"Demo User"}
```

### POST `/api/auth/login`

```json
{"email":"demo@example.com","password":"Password123!"}
```

Returns a short-lived `accessToken` and sets the refresh cookie.

### POST `/api/auth/refresh`

Uses the httpOnly refresh cookie. Rotates it and returns a new access token.

### POST `/api/auth/logout`

Revokes the current refresh token.

### POST `/api/auth/verify-email`

```json
{"token":"SIMULATION_TOKEN"}
```

### POST `/api/auth/forgot-password`

```json
{"email":"demo@example.com"}
```

### POST `/api/auth/reset-password`

```json
{"token":"SIMULATION_TOKEN","password":"NewPassword123!"}
```

## Links

All link management endpoints require:

```text
Authorization: Bearer <accessToken>
```

### POST `/api/links`

```json
{"destinationUrl":"https://example.com","shortCode":"summer-sale"}
```

`shortCode` is optional. If omitted, the server generates a unique six-character code.

### GET `/api/links?page=1&limit=8&search=github`

Returns paginated links.

### GET `/api/links/:id`

Returns one owned link.

### DELETE `/api/links/:id`

Deletes an owned link and its click events.

### GET `/api/links/:id/analytics`

Returns total clicks, daily clicks, top referrers and device distribution.

### GET `/r/:shortCode`

Public redirect. Returns HTTP `302` and asynchronously records click telemetry.

## Bio

### GET `/api/bio/me`

Returns the authenticated user's profile or defaults.

### PUT `/api/bio/me`

```json
{
  "username":"demo",
  "displayName":"Demo User",
  "bio":"Building software.",
  "avatar":"https://example.com/avatar.png",
  "theme":"gradient",
  "socialLinks":[{"label":"GitHub","url":"https://github.com/example","platform":"github","position":0}]
}
```

### GET `/api/bio/:username`

Public profile endpoint.
