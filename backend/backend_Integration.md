# Backend Integration Guide (Frontend → Backend)

This document explains how to call the backend API from the frontend: base URL, authentication, request/response shapes, and examples for every endpoint currently exposed by the backend.

## Quick facts

- **API base path**: `/api`
- **Default dev server port**: `3000` (or `process.env.PORT`)
- **Dev CORS allowlist**: `http://localhost:5173` (Vite)
- **Auth (required for every endpoint)**: Firebase **ID Token** in `Authorization: Bearer <token>`
- **If missing/invalid**: request is denied with `401 Unauthorized`

Example base URL in dev:

- `http://localhost:3000/api`

## Running the backend locally (for frontend devs)

1. From the backend folder:
   - `npm install`
2. Start Postgres (from the backend folder):
   - `docker compose up -d`
3. Run DB migrations:
   - `npm run migrate`
4. Start the API server:
   - `npm run dev` (or `npm start`)

If you hit DB connection issues, confirm your `.env` values used by `backend/docker-compose.yml` (Postgres container) match what the app expects.

## Authentication (required on ALL endpoints)

Every route in this backend requires a Firebase **ID token**.

### Header

Send this header with every request:

- `Authorization: Bearer <FIREBASE_ID_TOKEN>`

### Getting the Firebase ID token (frontend)

Using Firebase Web SDK (typical pattern):

```ts
import { getAuth } from "firebase/auth";

async function getBearerToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const idToken = await user.getIdToken(/* forceRefresh */ false);
  return idToken;
}
```

Then attach it:

```ts
const token = await getBearerToken();
await fetch(`${API_BASE_URL}/assets`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Common auth failures

- Missing/invalid token → `401` with message like `UNAUTHORIZED: No valid Bearer token` or an error payload.
- Too many requests (rate limit) → `429` with `{ "message": "Too many API requests, slow down." }` (or similar).

## Response & error formats

Not all failures return the exact same shape, but most errors flowing through the centralized error handler look like:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": ["\"email\" is required"]
  }
}
```

Common HTTP status codes:

- `200` OK
- `201` Created
- `400` Validation/request error
- `401` Unauthorized (missing/invalid token)
- `403` Forbidden
- `409` Conflict (email already exists)
- `429` Too many requests (rate limited)
- `500` Internal server error

## Recommended frontend API wrapper

Use a single helper that:

- Adds `Authorization` automatically
- Sets `Content-Type: application/json`
- Parses JSON
- Throws a useful error

### `fetch`-based helper (TypeScript)

```ts
type ApiError = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token: string; baseUrl: string }
): Promise<T> {
  const { token, baseUrl, headers, ...rest } = options;

  const res = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const err = data as ApiError;
    const message = err?.error?.message || err?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
```

## Endpoints

All endpoints below are mounted under `/api`.

### Auth / Users

#### `POST /signup`

Creates a user record in Postgres.

- **Auth**: required (Bearer token)
- **Rate limit**: strict (5 requests / 15 min)
- **Request body** (intended by DB/DAO):

```json
{
  "email": "alice@example.com",
  "firebase_uid": "firebase-uid-from-client"
}
```

- **Success**: `201`

```json
{
  "email": "alice@example.com",
  "message": "Signup successful"
}
```

Notes:

- The `users.firebase_uid` column is `NOT NULL` in the DB migration, so you should send `firebase_uid`.
- The backend currently verifies the Firebase ID token, so you’ll typically have access to the Firebase UID on the server side as well.

#### `POST /login`

Looks up an existing user record.

- **Auth**: required (Bearer token)
- **Rate limit**: strict (5 requests / 15 min)
- **Request body**:

```json
{
  "email": "alice@example.com",
  "firebase_uid": "firebase-uid-from-client"
}
```

- **Success**: `200`

```json
{
  "email": "alice@example.com",
  "message": "Login Successful"
}
```

### Blockchain / Fabric

All Fabric routes have these defaults:

- **Auth**: required (Bearer token)
- **Rate limit**: API (30 requests / minute)

#### `POST /networks`

Creates a network.

- **Auth**: required (Bearer token)

- **Request body**:

```json
{
  "name": "net1",
  "description": "optional description",
  "orgs": [
    { "name": "Org1", "msp_ID": "Org1MSP" }
  ]
}
```

- **Success**: `201` (response shape depends on service implementation)

#### `POST /networks/:id/channels`

Creates a channel under a network.

- **Auth**: required (Bearer token)

- **Path params**:
  - `id`: network id
- **Request body**:

```json
{
  "name": "mychannel",
  "memberOrgs": ["Org1MSP", "Org2MSP"]
}
```

- **Success**: `201`

#### `POST /channel/:channel_id/contracts`

Creates / deploys a smart contract.

- **Auth**: required (Bearer token)

- **Path params**:
  - `channel_id`: channel id
- **Request body**:

```json
{
  "contractType": "assetRegistry",
  "contractName": "optional",
  "version": "optional"
}
```

- **Success**: `201`

#### `GET /channel/:channel_id/contracts`

Reads all contracts for a channel.

- **Auth**: required (Bearer token)

- **Path params**:
  - `channel_id`: channel id
- **Success**: `200`

#### `POST /assets`

Creates an asset on the ledger.

- **Auth**: required (Bearer token)

- **Request body**:

```json
{
  "id": "asset1",
  "color": "blue",
  "size": 10,
  "owner": "Alice",
  "appraisedValue": 100
}
```

- **Success**: `201`

Typical response:

```json
{
  "message": "Asset Created Succesfully",
  "requested_by": "<firebase-uid>",
  "data": { }
}
```

#### `POST /assets/:id/transfer`

Transfers an asset to a new owner.

- **Auth**: required (Bearer token)

- **Path params**:
  - `id`: asset id
- **Request body**:

```json
{ "owner": "Bob" }
```

- **Success**: `200`

#### `PUT /assets/:id`

Updates an existing asset.

- **Auth**: required (Bearer token)

- **Path params**:
  - `id`: asset id
- **Request body**:

```json
{
  "color": "red",
  "size": 11,
  "owner": "Alice",
  "appraisedValue": 200
}
```

- **Success**: `200`

#### `DELETE /assets/:id`

Deletes an asset.

- **Auth**: required (Bearer token)

- **Path params**:
  - `id`: asset id
- **Success**: `200`

#### `GET /assets/:id`

Reads a single asset.

- **Auth**: required (Bearer token)

- **Path params**:
  - `id`: asset id
- **Success**: `200`

#### `GET /assets`

Reads all assets.

- **Auth**: required (Bearer token)

- **Success**: `200`

## Copy-paste examples

Assume:

- `API_BASE_URL = "http://localhost:3000/api"`
- `token = await getBearerToken()`

### Signup

```ts
await apiRequest("/signup", {
  baseUrl: API_BASE_URL,
  token,
  method: "POST",
  body: JSON.stringify({
    email: "alice@example.com",
    firebase_uid: "<firebase uid>",
  }),
});
```

### Create asset

```ts
await apiRequest("/assets", {
  baseUrl: API_BASE_URL,
  token,
  method: "POST",
  body: JSON.stringify({
    id: "asset1",
    color: "blue",
    size: 10,
    owner: "Alice",
    appraisedValue: 100,
  }),
});
```

### Read all assets

```ts
const res = await apiRequest<{ message: string; requested_by: string; data: unknown }>(
  "/assets",
  {
    baseUrl: API_BASE_URL,
    token,
    method: "GET",
  }
);
```

## Troubleshooting

- **CORS error in browser**: backend only allows `http://localhost:5173` by default. If your frontend runs on a different origin, update CORS options in the backend.
- **401 Unauthorized**: confirm you’re sending `Authorization: Bearer ...` and that the token is a Firebase **ID token** (not an access token from elsewhere).
- **429 Too many requests**: auth endpoints are heavily rate-limited; avoid retry loops and debounce UI actions.
- **Fabric endpoints returning 500**: these require a working Hyperledger Fabric gateway configuration (env vars + crypto material paths) and a running Fabric network.
