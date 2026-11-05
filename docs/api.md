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
| `bio` | string | Required when creating. 1–500 characters. |
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

The signed-in user's own profile: the same shape as the `POST` response, plus `rating_avg` and `review_count` (see [Ratings](#ratings)).

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
  "created_at": "2026-11-05T18:20:00.000Z",
  "rating_avg": 4.3,
  "review_count": 3
}
```

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
  "rating_avg": 4.3,
  "review_count": 3,
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

Query parameters: `limit` (1–50, default 20) and `offset` (default 0). For page 2 of 20, use `?limit=20&offset=20`.

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
      "created_at": "2026-11-05T18:20:00.000Z",
      "rating_avg": null,
      "review_count": 0
    }
  ],
  "limit": 20,
  "offset": 0
}
```

Errors: `400` invalid `limit` or `offset`.

### Ratings

`GET /api/providers`, `GET /api/providers/:id` and `GET /api/providers/me` include:

| Field | Meaning |
|---|---|
| `rating_avg` | Average of the provider's review ratings, rounded to 1 decimal (e.g. `4.3`). `null` when they have no reviews yet. Show "No reviews yet" rather than 0 stars. |
| `review_count` | Number of reviews. `0` when none. |

They're computed from `reviews` every time they're read (nothing is stored), in the same query as the provider data.

---

## Services

A service is something a provider offers, like "Gel manicure". Endpoints marked **provider only** also use `requireProvider`. If the signed-in user has no provider profile, they get `403` `{ "error": "You need a provider profile to do this. Become a provider first." }`.

**Fields a provider can set** (any other field, including `id` and `provider_id`, is rejected with `400`):

| Field | Type | Rules |
|---|---|---|
| `category` | string | Required when creating. One of: `braids`, `makeup`, `nails`, `lashes`, `haircut`, `skincare`, `hair`, `locs`, `other`. |
| `title` | string | Required when creating. 1�80 characters. |
| `description` | string or null | Optional. Up to 1000 characters. `""` or `null` clears it. |
| `price` | number | Required when creating. More than 0, up to 1000, at most 2 decimal places (e.g. `25` or `19.99`). |
| `duration_min` | integer | Required when creating. Whole minutes, 5�480. |
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
| `limit` | 1�50, default 20. |
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

---

## Availability and slots

**Time zone:** CampusGlam runs on New York time (`America/New_York`).
- **Weekly hours** like `"10:00"` are New York wall-clock times.
- **Dates** like `2026-11-20` are New York calendar days.
- **Timestamps** in responses carry their offset: `-05:00` in winter (EST), `-04:00` in summer (EDT).

The server never uses its own time zone for this math.

`day_of_week`: `0` = Sunday, `1` = Monday, � `6` = Saturday.

### PUT /api/availability/mine (provider only)

Replaces the caller's **whole** weekly schedule with the list sent. The old blocks are deleted and the new ones saved in one transaction. Send `{ "blocks": [] }` for "no availability".

Rules for each block:
- `start_time` is `"HH:MM"` on the hour or half hour, 24-hour clock.
- `end_time` follows the same format, or `"24:00"` for midnight.
- Start must be before end.

Blocks on the same day may touch (`10:00�12:00` and `12:00�14:00`) but not overlap. At most 10 blocks per day and 70 in total.

Request:

```json
{
  "blocks": [
    { "day_of_week": 1, "start_time": "10:00", "end_time": "12:00" },
    { "day_of_week": 1, "start_time": "12:00", "end_time": "14:00" },
    { "day_of_week": 4, "start_time": "17:00", "end_time": "21:00" }
  ]
}
```

Response `200` (the saved schedule, sorted by day, then start time):

```json
{
  "time_zone": "America/New_York",
  "blocks": [
    { "id": 11, "day_of_week": 1, "start_time": "10:00", "end_time": "12:00" },
    { "id": 12, "day_of_week": 1, "start_time": "12:00", "end_time": "14:00" },
    { "id": 13, "day_of_week": 4, "start_time": "17:00", "end_time": "21:00" }
  ]
}
```

Errors: `400` invalid body. Problems inside a block appear under `fields.blocks`, e.g. `"Overlaps 10:00-12:00 on the same day"`.

### GET /api/availability/mine (provider only)

The caller's weekly schedule, in the same shape as the `PUT` response.

### GET /api/providers/:id/availability

A provider's weekly schedule, in the same shape as above. Same visibility as `GET /api/providers/:id`: rejected providers return `404`.

Errors: `400` invalid id, `404` `{ "error": "Provider not found." }`.

### GET /api/providers/:id/slots?service_id=&date=YYYY-MM-DD

Bookable start times for one service on one New York date.

- **The service:** `service_id` must be an active service belonging to this provider.
- **The date:** `date` must be from today to 60 days ahead (New York time).
- **How slots are built:**
  - Slots start every 30 minutes from the beginning of the day's hours. Touching blocks count as one continuous block.
  - The whole service (`duration_min`) must fit before the block ends.
- **What's removed:**
  - Slots that overlap a `requested` or `confirmed` appointment.
  - Slots starting less than 2 hours from now.
- **Daylight saving days:**
  - On the spring-forward day, the missing 2:00�2:59 AM times are skipped.
  - On the fall-back day, 1:00�1:59 AM is offered once, as the first (EDT) occurrence.

Example: `GET /api/providers/7/slots?service_id=3&date=2026-11-16`

Response `200`:

```json
{
  "date": "2026-11-16",
  "time_zone": "America/New_York",
  "service_id": 3,
  "duration_min": 60,
  "slots": [
    {
      "start_time": "10:00",
      "label": "10:00 AM",
      "start_at": "2026-11-16T10:00:00-05:00",
      "end_at": "2026-11-16T11:00:00-05:00"
    },
    {
      "start_time": "10:30",
      "label": "10:30 AM",
      "start_at": "2026-11-16T10:30:00-05:00",
      "end_at": "2026-11-16T11:30:00-05:00"
    }
  ]
}
```

Show `label` to users. Send `start_at` back to the server when booking.

`slots` is `[]` when the provider has no hours that day or everything is taken.

Errors:
- `400`: invalid id, `service_id` or `date`, or a date outside today to 60 days ahead.
- `404`: `{ "error": "Provider not found." }`, or `{ "error": "Service not found for this provider." }` when the service is inactive or belongs to someone else.
- `409`: `{ "error": "This provider isn't accepting bookings right now." }`

---

## Appointments (booking requests)

### Status rules

```
                 accept (provider, before start)              complete (provider, after end)
   requested ───────────────────────────────────▶ confirmed ─────────────────────────────▶ completed
      │  │                                            │
      │  └── decline (provider, any time) ──▶ declined │
      │                                               │
      └──────── cancel (client or provider, before start) ───────▶ cancelled
```

| Action | From | To | Who | When |
|---|---|---|---|---|
| accept | `requested` | `confirmed` | provider | before `start_at` |
| decline | `requested` | `declined` | provider | any time |
| cancel | `requested` or `confirmed` | `cancelled` | client or provider | before `start_at` |
| complete | `confirmed` | `completed` | provider | after `end_at` |

- Any other change returns `409` with a message naming the current status, e.g. `"Only requested appointments can be accepted (this one is confirmed)."`
- `no_show` exists in the schema but no endpoint sets it yet.
- `requested` and `confirmed` appointments hold their time slot; the other statuses free it.

Status-change endpoints return `404` `{ "error": "Appointment not found." }` when the appointment isn't yours. That's the same answer as for an appointment that doesn't exist.

### POST /api/appointments

A client requests a booking.
- **The server sets:** `client_id` (you), `provider_id`, `end_at` (start + the service's duration), `price` (copied from the service now, so later price changes don't affect this booking), and `status` (`requested`). Sending any of these is a `400`.
- **`start_at`** must be exactly one of the times `GET /api/providers/:id/slots` currently offers for that service. Use a slot's `start_at` value.

Request:

```json
{
  "service_id": 3,
  "start_at": "2026-11-16T10:00:00-05:00",
  "location_type": "campus_spot",
  "location_details": "Capen Hall, 2nd floor lounge",
  "client_notes": "I have long hair."
}
```

| Field | Rules |
|---|---|
| `service_id` | Required. A whole number. |
| `start_at` | Required. ISO timestamp with offset or `Z`. |
| `location_type` | Required. `provider_place`, `client_place` or `campus_spot`. |
| `location_details` | Optional. Up to 200 characters. |
| `client_notes` | Optional. Up to 500 characters. |

Response `201`:

```json
{
  "id": 21,
  "client_id": 12,
  "provider_id": 7,
  "service_id": 3,
  "start_at": "2026-11-16T10:00:00-05:00",
  "end_at": "2026-11-16T11:00:00-05:00",
  "status": "requested",
  "price": "25.00",
  "location_type": "campus_spot",
  "location_details": "Capen Hall, 2nd floor lounge",
  "client_notes": "I have long hair.",
  "is_paid": false,
  "created_at": "2026-11-05T20:00:00.000Z"
}
```

In every appointment response, `start_at` and `end_at` are New York time with the offset, in the same format as the slots endpoint: `-05:00` in winter (EST), `-04:00` in summer (EDT). `created_at` stays in UTC (`Z`).

Errors:
- `400` invalid body
- `400` `{ "error": "You can't book your own service." }`
- `400` `{ "error": "That time isn't available." }` when it isn't an open slot: wrong time, outside hours, already taken, under 2 hours away, or more than 60 days ahead
- `404` `{ "error": "Service not found." }` (inactive, or the provider is rejected)
- `409` `{ "error": "This provider isn't accepting bookings right now." }`
- `409` `{ "error": "That time was just taken. Please pick another slot." }` when someone booked an overlapping time a moment earlier
- `409` `{ "error": "You already have a booking that overlaps this time." }`

### GET /api/appointments/mine

Your bookings as a client.

Query parameters (all optional):

| Parameter | Rules |
|---|---|
| `status` | One status value, e.g. `confirmed`. |
| `when` | `upcoming` (starts now or later, soonest first) or `past` (already started, most recent first). Without it: all, newest start first. |
| `limit`, `offset` | Same as other lists (1–50, default 20). |

Example: `GET /api/appointments/mine?when=upcoming`

Response `200`:

```json
{
  "appointments": [
    {
      "id": 21,
      "status": "requested",
      "start_at": "2026-11-16T10:00:00-05:00",
      "end_at": "2026-11-16T11:00:00-05:00",
      "price": "25.00",
      "location_type": "campus_spot",
      "location_details": "Capen Hall, 2nd floor lounge",
      "client_notes": "I have long hair.",
      "created_at": "2026-11-05T20:00:00.000Z",
      "service": { "id": 3, "title": "Gel manicure", "category": "nails" },
      "provider": { "id": 7, "full_name": "Jasmine Lee", "business_name": "Nails by Jasmine" }
    }
  ],
  "limit": 20,
  "offset": 0
}
```

Errors: `400` invalid filters.

### GET /api/appointments/incoming (provider only)

The caller's appointments as a provider. It takes the same filters and returns the same shape as `/mine`, but with `client` instead of `provider`. Only the client's name is included, never their email.

```json
{
  "appointments": [
    {
      "id": 21,
      "status": "requested",
      "start_at": "2026-11-16T10:00:00-05:00",
      "end_at": "2026-11-16T11:00:00-05:00",
      "price": "25.00",
      "location_type": "campus_spot",
      "location_details": "Capen Hall, 2nd floor lounge",
      "client_notes": "I have long hair.",
      "created_at": "2026-11-05T20:00:00.000Z",
      "service": { "id": 3, "title": "Gel manicure", "category": "nails" },
      "client": { "full_name": "Sam Rivera" }
    }
  ],
  "limit": 20,
  "offset": 0
}
```

### POST /api/appointments/:id/accept (provider only)

### POST /api/appointments/:id/decline (provider only)

### POST /api/appointments/:id/complete (provider only)

### POST /api/appointments/:id/cancel (client or provider)

No request body. Each changes the status according to the table above.

Response `200`: the full updated appointment (same shape as the `POST /api/appointments` response), e.g. with `"status": "confirmed"`.

Errors: `400` invalid id, `404` not your appointment, `409` the change isn't allowed:

```json
{ "error": "This appointment has already started, so it can't be cancelled." }
```

---

## Reviews

A client can review an appointment once, after it's `completed`. A review's client and provider come from its appointment.

### POST /api/reviews

Request:

```json
{ "appointment_id": 21, "rating": 5, "comment": "Super neat and on time." }
```

| Field | Rules |
|---|---|
| `appointment_id` | Required. One of your appointments as the client. |
| `rating` | Required. A whole number from 1 to 5. |
| `comment` | Optional. Up to 1000 characters. `""` or `null` means no comment. |

Any other field (e.g. `client_id`) is a `400`.

Response `201`:

```json
{
  "id": 4,
  "appointment_id": 21,
  "rating": 5,
  "comment": "Super neat and on time.",
  "created_at": "2026-11-20T18:00:00.000Z"
}
```

Errors:
- `400` invalid body.
- `404` `{ "error": "Appointment not found." }` when it doesn't exist or you weren't its client.
- `409` `{ "error": "You can only review completed appointments (this one is confirmed)." }`
- `409` `{ "error": "You already reviewed this appointment." }`

### GET /api/providers/:id/reviews

A provider's reviews, newest first, with their rating summary. Same visibility as `GET /api/providers/:id`: rejected providers return `404`. Reviewers are shown as first name + last initial, never with ids or emails.

Query parameters: `limit` (1�50, default 20) and `offset` (default 0).

Response `200`:

```json
{
  "rating_avg": 4.3,
  "review_count": 3,
  "reviews": [
    {
      "id": 4,
      "rating": 5,
      "comment": "Super neat and on time.",
      "created_at": "2026-11-20T18:00:00.000Z",
      "reviewer_name": "Maya J."
    }
  ],
  "limit": 20,
  "offset": 0
}
```

A provider with no reviews returns `"rating_avg": null, "review_count": 0, "reviews": []`.

Errors: `400` invalid id, `limit` or `offset`; `404` `{ "error": "Provider not found." }`.

### GET /api/reviews/mine

Reviews you've written, newest first. Compare `appointment_id` with your `completed` appointments from `GET /api/appointments/mine?status=completed` to see which still need a review.

Query parameters: `limit` and `offset`, as above.

Response `200`:

```json
{
  "reviews": [
    {
      "id": 4,
      "appointment_id": 21,
      "rating": 5,
      "comment": "Super neat and on time.",
      "created_at": "2026-11-20T18:00:00.000Z",
      "service": { "id": 3, "title": "Gel manicure" },
      "provider": { "id": 7, "full_name": "Jasmine Lee", "business_name": "Nails by Jasmine" }
    }
  ],
  "limit": 20,
  "offset": 0
}
```
