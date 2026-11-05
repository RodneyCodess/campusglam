# CampusGlam API

All endpoints live on the server (`http://localhost:4000` in development) and return JSON.

**Auth:** every endpoint below uses `requireUser`. Send the Clerk session token as `Authorization: Bearer <token>` (the client's `useApi()` does this for you).

| Status | Meaning |
|---|---|
| `401` | Not signed in. |
| `403` | Signed in, but the account hasn't been synced yet (`POST /api/users/sync`). On provider-only endpoints (marked **provider only**), also: no provider profile. |
| `400` | The request was invalid. See the error format below. |

**Validation errors (400)** list problems by field. `other` holds problems not tied to a single field, such as unknown fields:

```json
{
  "error": "Invalid request",
  "fields": { "bio": ["Bio is required"] },
  "other": ["Unrecognized key: \"user_id\""]
}
```

Other errors look like `{ "error": "Provider not found." }`.

---

## Provider profiles

A provider profile is what makes a user a provider ("Become a provider"). Each user can have at most one.

**Fields a provider can set** (any other field, including `id`, `user_id` and `verification_status`, is rejected with `400`):

| Field | Type | Rules |
|---|---|---|
| `bio` | string | Required when creating. 1â€“500 characters. |
| `business_name` | string or null | Optional. Up to 80 characters. `""` or `null` clears it. |
| `instagram_handle` | string or null | Optional. Letters, numbers, `.` and `_`, up to 30. A leading `@` is removed. |
| `photo_url` | string or null | Optional. Must be an `https://` link. |
| `is_accepting_bookings` | boolean | Optional. Defaults to `true`. |

`verification_status` starts as `pending` and is only changed by the team. Public endpoints show `pending` and `verified` providers and hide `rejected` ones.

### POST /api/providers

Creates a provider profile for the signed-in user and sets their `users.is_provider` to `true` in the same database transaction.

Request:

```json
{
  "bio": "Gel and acrylic nails in Ellicott.",
  "business_name": "Nails by Jasmine",
  "instagram_handle": "@nailsbyjas"
}
```

Response `201`:

```json
{
  "id": 7,
  "user_id": 12,
  "business_name": "Nails by Jasmine",
  "bio": "Gel and acrylic nails in Ellicott.",
  "photo_url": null,
  "instagram_handle": "nailsbyjas",
  "verification_status": "pending",
  "is_accepting_bookings": true,
  "created_at": "2026-11-05T18:20:00.000Z"
}
```

Errors: `400` invalid body, `409` `{ "error": "You already have a provider profile." }`.

### GET /api/providers/me

The signed-in user's own profile (same shape as the `POST` response).

Errors: `404` `{ "error": "You don't have a provider profile yet." }`.

### PATCH /api/providers/me

Updates the signed-in user's own profile. Send only the fields to change (at least one).

Request:

```json
{ "is_accepting_bookings": false, "business_name": null }
```

Response `200`: the full updated profile (same shape as the `POST` response).

Errors: `400` invalid body or no fields, `404` no profile.

### GET /api/providers/:id

One provider's public profile, with their active services (`[]` if none). `:id` is the provider profile's `id`, not the user's. Never includes email, `user_id` or `clerk_user_id`.

Response `200`:

```json
{
  "id": 7,
  "full_name": "Jasmine Lee",
  "business_name": "Nails by Jasmine",
  "bio": "Gel and acrylic nails in Ellicott.",
  "photo_url": null,
  "instagram_handle": "nailsbyjas",
  "verification_status": "pending",
  "is_accepting_bookings": true,
  "created_at": "2026-11-05T18:20:00.000Z",
  "services": [
    {
      "id": 3,
      "category": "nails",
      "title": "Gel manicure",
      "description": null,
      "price": "25.00",
      "duration_min": 60
    }
  ]
}
```

`price` is a string (e.g. `"25.00"`) because Postgres sends decimals as text to avoid rounding errors. Use `Number(price)` to do math with it.

Errors: `400` `:id` isn't a positive whole number, `404` `{ "error": "Provider not found." }` (also for rejected providers).

### GET /api/providers

Providers for the browse page, newest first. Same public fields as above, without `services`.

Query parameters: `limit` (1â€“50, default 20) and `offset` (default 0). For page 2 of 20, use `?limit=20&offset=20`.

Response `200`:

```json
{
  "providers": [
    {
      "id": 7,
      "full_name": "Jasmine Lee",
      "business_name": "Nails by Jasmine",
      "bio": "Gel and acrylic nails in Ellicott.",
      "photo_url": null,
      "instagram_handle": "nailsbyjas",
      "verification_status": "pending",
      "is_accepting_bookings": true,
      "created_at": "2026-11-05T18:20:00.000Z"
    }
  ],
  "limit": 20,
  "offset": 0
}
```

Errors: `400` invalid `limit` or `offset`.

---

## Services

A service is something a provider offers, like "Gel manicure". Endpoints marked **provider only** also use `requireProvider`. If the signed-in user has no provider profile, they get `403` `{ "error": "You need a provider profile to do this. Become a provider first." }`.

**Fields a provider can set** (any other field, including `id` and `provider_id`, is rejected with `400`):

| Field | Type | Rules |
|---|---|---|
| `category` | string | Required when creating. One of: `braids`, `makeup`, `nails`, `lashes`, `haircut`, `skincare`, `hair`, `locs`, `other`. |
| `title` | string | Required when creating. 1–80 characters. |
| `description` | string or null | Optional. Up to 1000 characters. `""` or `null` clears it. |
| `price` | number | Required when creating. More than 0, up to 1000, at most 2 decimal places (e.g. `25` or `19.99`). |
| `duration_min` | integer | Required when creating. Whole minutes, 5–480. |
| `is_active` | boolean | `PATCH` only. `false` hides the service; `true` brings it back. |

`price` is sent as a number but returned as a string like `"19.99"`, which is how Postgres returns decimals.

### POST /api/services (provider only)

Creates a service for the signed-in provider. The service always belongs to the caller's own provider profile.

Request:

```json
{
  "category": "nails",
  "title": "Gel manicure",
  "description": "Includes shaping and cuticle care.",
  "price": 25,
  "duration_min": 60
}
```

Response `201`:

```json
{
  "id": 3,
  "provider_id": 7,
  "category": "nails",
  "title": "Gel manicure",
  "description": "Includes shaping and cuticle care.",
  "price": "25.00",
  "duration_min": 60,
  "is_active": true,
  "created_at": "2026-11-05T19:00:00.000Z"
}
```

Errors: `400` invalid body.

### GET /api/services/mine (provider only)

All of the caller's services, including inactive (deleted) ones, newest first.

Response `200`: an array of services (same shape as the `POST` response).

```json
[
  {
    "id": 3,
    "provider_id": 7,
    "category": "nails",
    "title": "Gel manicure",
    "description": "Includes shaping and cuticle care.",
    "price": "25.00",
    "duration_min": 60,
    "is_active": false,
    "created_at": "2026-11-05T19:00:00.000Z"
  }
]
```

### PATCH /api/services/:id (provider only)

Updates one of the caller's own services. Send only the fields to change (at least one). Send `{ "is_active": true }` to reactivate a deleted service.

Request:

```json
{ "price": 30, "duration_min": 75 }
```

Response `200`: the full updated service (same shape as the `POST` response).

Errors: `400` invalid id or body, `404` `{ "error": "Service not found." }`. The `404` is returned both when the service doesn't exist and when it belongs to another provider, so nobody can tell which ids exist.

### DELETE /api/services/:id (provider only)

Soft-deletes one of the caller's own services: it sets `is_active` to `false` instead of removing the row, so past appointments that point at it stay intact. Deleting an already-inactive service still succeeds.

Response `200`: the service, now with `"is_active": false`.

Errors: `400` invalid id, `404` `{ "error": "Service not found." }` (same rule as `PATCH`).

### GET /api/services

Services for the browse page, newest first. Only active services, from providers who aren't rejected and are accepting bookings. Never includes emails, `user_id` or `clerk_user_id`.

Query parameters (all optional):

| Parameter | Rules |
|---|---|
| `category` | One of the categories above. |
| `max_price` | Number more than 0. Returns services priced at or below it. |
| `limit` | 1–50, default 20. |
| `offset` | Default 0. |

Example: `GET /api/services?category=nails&max_price=40&limit=20`

Response `200`:

```json
{
  "services": [
    {
      "id": 3,
      "category": "nails",
      "title": "Gel manicure",
      "description": "Includes shaping and cuticle care.",
      "price": "25.00",
      "duration_min": 60,
      "created_at": "2026-11-05T19:00:00.000Z",
      "provider": {
        "id": 7,
        "full_name": "Jasmine Lee",
        "business_name": "Nails by Jasmine"
      }
    }
  ],
  "limit": 20,
  "offset": 0
}
```

`provider.id` is the provider profile id, so it can be used with `GET /api/providers/:id`.

Errors: `400` invalid `category`, `max_price`, `limit` or `offset`.
