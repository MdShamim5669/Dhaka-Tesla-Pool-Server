1. Project Overview

Product name: Dhaka Tesla Pool Tagline: Share a seat. Split the fare. Survive Dhaka traffic.

Problem: In Dhaka, passengers with overlapping routes (e.g. Banani → Mohakhali and Banani → Gulshan 1) each hire a separate vehicle. This wastes money, seats and road space.

Solution: A ride-pooling MVP where passengers request rides, drivers accept them, and compatible requests share one Tesla (e.g. Jashim's "Bullet", 3 seats). Each passenger gets an individual fare and sees only their own status.

Actors
Actor	Example	Goal
Passenger	Nusrat, Rafiq, Shirin	Get to the destination at a fair price
Driver	Jashim (owns Bullet, 3 seats)	Fill seats, run trips, know who is riding
System (Pool/Ride)	n/a	Match, enforce capacity, calculate fares, keep history
Goals
Working end-to-end flow: request → match → trip → complete
Seat capacity can never be exceeded, even under concurrent requests
Fare calculation that can be verified by hand
Full traceability (status history, audit)
Runs with docker compose up
Non-goals (MVP)
Real routing or maps, real payment gateway, microservices, Kafka, Redis, Kubernetes
Driver ratings, surge pricing, real-time GPS tracking
Seed cast (used in seed data, tests, README, demo)

Jashim (driver, Bullet, capacity 3), Nusrat, Rafiq, Shirin (passengers)

2. JWT Authentication Flow

Design: Short-lived access token plus rotating refresh token.

Item	Value
Access token	JWT, 15 min, payload: sub (user id), role, iat, exp
Refresh token	Random opaque string, 7 days, stored hashed in DB, rotated on every use
Password hashing	argon2 or bcrypt (cost ≥ 10)
Transport	Access token in Authorization: Bearer <token>. Refresh token in an httpOnly, Secure, SameSite cookie
Roles	PASSENGER, DRIVER

Flow
1. POST /auth/register  → validate → hash password → create user → return tokens
2. POST /auth/login     → verify password → issue access + refresh token
3. Client calls API with  Authorization: Bearer <access>
4. Middleware: verify signature + expiry → load req.user {id, role}
5. Role guard: route requires PASSENGER or DRIVER → else 403
6. Access token expired → POST /auth/refresh
      → validate refresh token (hash match, not revoked, not expired)
      → revoke old, issue new pair (rotation)
7. POST /auth/logout → revoke refresh token
Security notes
Reuse of a revoked refresh token revokes all of that user's tokens (theft detection).
Rate-limit login and register.
Generic error on login failure ("Invalid credentials"), never reveal which field was wrong.
Ownership checks live in the service layer, not only in route guards. A passenger can only touch their own ride requests.

3. Business Logic Flow
3.1 Passenger flow
Sign in → choose pickup zone, destination zone, seats (1–3)
→ see estimated fare (solo price + "if pooled" price)
→ confirm request (status REQUESTED)
→ driver accepts (MATCHED) → driver arrives (DRIVER_ARRIVED)
→ trip starts (STARTED) → trip ends (COMPLETED) → pay (Cash / TeslaPay)
→ view history
(Cancel allowed before STARTED)
3.2 Driver flow
Sign in → go online → see compatible REQUESTED rides
→ accept a request (creates a pool) or accept another request into the existing open pool
→ mark ARRIVED → START trip → COMPLETE trip
→ view passengers/seats and history → go offline
3.3 Matching and pooling flow
Passenger submits request (REQUESTED)
        │
Driver (online) sees request list, filtered by:
        - driver has no pool in STARTED state (not mid-trip)
        - request seats ≤ remaining seats (if joining an existing pool)
        - request is compatible with the pool (matching rule 7.2)
        │
Driver accepts
        ├─ No open pool for this Tesla → create pool (ACCEPTED), add member
        └─ Open pool exists (ACCEPTED) and compatible → add member
                (inside a DB transaction, capacity checked atomically)
        │
Request → MATCHED
3.4 Fare flow
Request time:   estimate = solo fare, plus "if pooled" fare (informational)
Pool joined:    members and seats are tracked
Trip STARTED:   fares are LOCKED (pool size is final; nobody joins after start)
                member_count ≥ 2 → pool discount applied to every member
Trip COMPLETED: payment recorded (Cash = mark paid, TeslaPay = debit wallet)
3.5 Concurrency flow (Nusrat vs Shirin, 1 seat left)
Both read "1 seat available"
Both call accept/join at the same instant
   → Transaction A: atomic UPDATE seats_occupied = seats_occupied + 1
                    WHERE seats_occupied + 1 <= capacity   → 1 row updated ✔
   → Transaction B: same statement, condition now false    → 0 rows updated ✘
   → B receives 409 SEAT_UNAVAILABLE, request stays REQUESTED


4. Core Functionality
4.1 Passenger
Sign up and sign in
Request ride (pickup zone, destination zone, seats)
See estimated fare before confirming
Track status: REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED / CANCELLED
See only their own fare and status
View ride history
Cancel a ride while the cancellation rule allows
Choose payment method (Cash or TeslaPay wallet)
4.2 Driver / Tesla
Sign in, go online/offline
Own exactly one Tesla with fixed capacity (Jashim → Bullet → 3 seats)
View relevant open requests
Accept a request or join a compatible open pool
Mark arrival, start trip, complete trip
See passengers, seats and per-ride status
View ride history
4.3 Pool / Ride
Multiple requests can share one Tesla
Occupied seats never exceed capacity
Each passenger gets an individual fare
Clear lifecycle and visible pool membership
Full status history (who changed what, when)

5. Product Data Model

All money is stored as integer paisa (৳1 = 100 paisa). IDs are UUIDs. Timestamps are timestamptz.

users
Column	Type	Notes
id	uuid PK	
name	text NOT NULL	
email	citext UNIQUE NOT NULL	
phone	text UNIQUE	
password_hash	text NOT NULL	
role	enum(PASSENGER, DRIVER)	
created_at	timestamptz	
drivers
Column	Type	Notes
user_id	uuid PK, FK → users	
is_online	boolean DEFAULT false	
updated_at	timestamptz	
teslas
Column	Type	Notes
id	uuid PK	
driver_id	uuid UNIQUE FK → drivers	one Tesla per driver (MVP)
name	text	"Bullet"
plate_no	text UNIQUE	
capacity	smallint CHECK (capacity BETWEEN 1 AND 6)	
zones
Column	Type	Notes
id	smallint PK	
name	text UNIQUE	Banani, Gulshan 1, Mohakhali, …
lat, lng	numeric	plain points
corridor	text	used by the matching rule
zone_distances
Column	Type	Notes
from_zone_id	FK → zones	
to_zone_id	FK → zones	
distance_m	integer CHECK (> 0)	
PK	(from_zone_id, to_zone_id)	
ride_requests (one per passenger request)
Column	Type	Notes
id	uuid PK	
passenger_id	uuid FK → users, indexed	
pickup_zone_id, dest_zone_id	FK → zones	CHECK (pickup ≠ dest)
seats	smallint CHECK (seats BETWEEN 1 AND 6)	
status	enum	REQUESTED, MATCHED, DRIVER_ARRIVED, STARTED, COMPLETED, CANCELLED
distance_m	integer	snapshot at request time
estimated_fare_paisa	integer	solo estimate
final_fare_paisa	integer NULL	set when locked
fare_breakdown	jsonb NULL	base, distance charge, discount
payment_method	enum(CASH, TESLAPAY)	
idempotency_key	text NULL	UNIQUE per passenger
cancelled_by, cancel_reason	nullable	
created_at, updated_at	timestamptz	
pools (one trip of one Tesla)
Column	Type	Notes
id	uuid PK	
tesla_id	FK → teslas, indexed	
status	enum	ACCEPTED, DRIVER_ARRIVED, STARTED, COMPLETED, CANCELLED
pickup_zone_id	FK → zones	pool anchor
corridor	text	pool anchor
seats_occupied	smallint DEFAULT 0	CHECK (seats_occupied >= 0)
capacity	smallint	copied from tesla for the CHECK
started_at, completed_at	timestamptz NULL	
created_at	timestamptz	

Constraints on pools:

CHECK (seats_occupied <= capacity)
Partial UNIQUE index, one active pool per Tesla: (tesla_id) WHERE status IN ('ACCEPTED','DRIVER_ARRIVED','STARTED')
pool_members
Column	Type	Notes
id	uuid PK	
pool_id	FK → pools, indexed	
ride_request_id	uuid UNIQUE FK → ride_requests	a request is in at most one pool
seats	smallint	snapshot
joined_at	timestamptz	
left_at	timestamptz NULL	set on cancellation
ride_status_history (audit trail)
Column	Type	Notes
id	bigserial PK	
ride_request_id	FK, indexed	
pool_id	FK NULL	
from_status, to_status	enum	
actor_user_id	FK → users	
reason	text NULL	
created_at	timestamptz	
wallets and payments (simulated TeslaPay)
Table	Columns
wallets	user_id PK/FK, balance_paisa integer CHECK (balance_paisa >= 0)
payments	id, ride_request_id UNIQUE FK, method, amount_paisa, status (PENDING, PAID, FAILED), created_at
refresh_tokens
Column	Type	Notes
id	uuid PK	
user_id	FK → users	
token_hash	text UNIQUE	
expires_at, revoked_at, created_at	timestamptz	

Why integer paisa: floats cannot represent decimal money exactly (0.1 + 0.2 ≠ 0.3). Integers make fare math exact and testable by hand. Discounts use integer arithmetic (basis points, floor).

Indexes
ride_requests(passenger_id, created_at DESC)
ride_requests(status, pickup_zone_id) for the driver feed
pool_members(pool_id)
pools(tesla_id, status)
ride_status_history(ride_request_id, created_at)

6. Relationship Summary
users 1 ──── 0..1 drivers 1 ──── 1 teslas
users 1 ──── * ride_requests
users 1 ──── 1 wallets
zones 1 ──── * ride_requests (as pickup)  /  * ride_requests (as destination)
zones * ──── * zones            (via zone_distances)
teslas 1 ──── * pools
pools 1 ──── * pool_members
ride_requests 1 ──── 0..1 pool_members      (a request joins at most one pool)
ride_requests 1 ──── * ride_status_history
ride_requests 1 ──── 0..1 payments
users 1 ──── * refresh_tokens







7. Business Rules
7.1 Lifecycle and transitions

Ride request status

From	Allowed to
REQUESTED	MATCHED, CANCELLED
MATCHED	DRIVER_ARRIVED, CANCELLED
DRIVER_ARRIVED	STARTED, CANCELLED
STARTED	COMPLETED
COMPLETED / CANCELLED	none (terminal)

Any other transition is rejected with 409 INVALID_STATE_TRANSITION.

Pool status moves ACCEPTED → DRIVER_ARRIVED → STARTED → COMPLETED, or to CANCELLED. Pool transitions cascade to the members' ride requests (driver marks arrived, so all members become DRIVER_ARRIVED).

Improvement on the suggested lifecycle: status lives on both the pool (the driver acts on the whole trip) and the ride request (each passenger sees their own state). This avoids driver actions touching passengers one by one.

7.2 Matching rule (documented assumption)

Two requests are pool-compatible if:

They have the same pickup zone, and
Their destination zones belong to the same corridor, and
Total seats ≤ Tesla capacity.

Example corridor table:

North-East: Banani, Mohakhali, Gulshan 1, Gulshan 2, Baridhara
North: Uttara, Airport
West: Mirpur, Farmgate, Dhanmondi
East: Bashundhara

→ Nusrat (Banani → Mohakhali) and Rafiq (Banani → Gulshan 1) are compatible: same pickup, same corridor.

7.3 Capacity rules
sum(seats of active members) ≤ tesla.capacity, always.
A request with seats > capacity is rejected up front.
Joining is only allowed while the pool is ACCEPTED (before the driver arrives).
7.4 Fare model
distanceCharge = distance_km × perKmRate
subtotal       = baseFare + distanceCharge
poolDiscount   = floor(subtotal × discountBps / 10000)   (only if pool has ≥ 2 members)
passengerFare  = (subtotal − poolDiscount) × seats        (seats multiplier)

Config (paisa): baseFare = 5000 (৳50), perKmRate = 1800 (৳18/km), discountBps = 2000 (20%).

Hand-calculation (Nusrat and Rafiq, 1 seat each)

	Distance	Subtotal	Discount (20%)	Final fare
Nusrat (Banani → Mohakhali)	3 km	5000 + 3×1800 = 10,400	2,080	8,320 paisa = ৳83.20
Rafiq (Banani → Gulshan 1)	4 km	5000 + 4×1800 = 12,200	2,440	9,760 paisa = ৳97.60

Travelling alone they would pay ৳104.00 and ৳122.00. (Distances come from the zone_distances seed table; the numbers above are examples to document.)

7.5 Cancellation rules
A passenger can cancel their own request in REQUESTED, MATCHED or DRIVER_ARRIVED. Not after STARTED.
On cancellation of a matched request: the member's seats are released (left_at set, seats_occupied decremented atomically), and fares of remaining members are recalculated only at the START lock.
A driver can cancel a pool before STARTED. All member requests return to REQUESTED (re-matchable), and the history records the reason.
MVP has no cancellation fee (documented limitation).
7.6 Visibility and authorization
Passenger sees only their own requests, fare and status. Pool responses to passengers show co-passenger count only (no names/fares).
Driver sees only pools of their own Tesla, with passenger names and seats.
Updating or cancelling someone else's ride → 403 FORBIDDEN (or 404 to avoid leaking existence).
7.7 Payments
Cash: marked PAID by the driver at completion.
TeslaPay (simulated): wallet debit in one transaction at completion, balance_paisa ≥ 0 enforced by CHECK. Insufficient balance → 402 INSUFFICIENT_FUNDS and the passenger can switch to Cash.
8. API Endpoints

Base path: /api/v1. Auth required unless noted.

Auth
Method	Path	Description
POST	/auth/register	Sign up (public)
POST	/auth/login	Sign in (public)
POST	/auth/refresh	Rotate tokens
POST	/auth/logout	Revoke refresh token
GET	/auth/me	Current user
Zones and fare (public/auth)
Method	Path	Description
GET	/zones	List areas
POST	/fares/estimate	Estimate fare (pickup, dest, seats)
Passenger
Method	Path	Description
POST	/rides	Request ride (supports Idempotency-Key header)
GET	/rides	My ride history (paginated, filter by status)
GET	/rides/:id	My ride detail: status, fare, driver/Tesla info
POST	/rides/:id/cancel	Cancel my ride
GET	/wallet	My TeslaPay balance
Driver
Method	Path	Description
PATCH	/drivers/me/availability	Go online/offline
GET	/drivers/me/tesla	My Tesla and capacity
GET	/driver/requests	Compatible REQUESTED rides
POST	/driver/requests/:rideId/accept	Accept into new/existing pool
GET	/driver/pools/current	Current pool, passengers, seats
POST	/driver/pools/:id/arrive	Mark arrival
POST	/driver/pools/:id/start	Start trip (locks fares)
POST	/driver/pools/:id/complete	Complete trip and settle payments
POST	/driver/pools/:id/cancel	Cancel pool
GET	/driver/pools	Pool/ride history
System
Method	Path	Description
GET	/health	Liveness + DB check (public)
Error codes

VALIDATION_ERROR (400), UNAUTHENTICATED (401), FORBIDDEN (403), NOT_FOUND (404), INVALID_STATE_TRANSITION (409), SEAT_UNAVAILABLE (409), NOT_COMPATIBLE (409), INSUFFICIENT_FUNDS (402), RATE_LIMITED (429).

API style: REST. The resources and state transitions map cleanly to HTTP verbs, it is simple to test and document, and no GraphQL flexibility is needed for a few fixed screens.

9. Project Structure
dhaka-tesla-pool/
├── apps/
│   ├── api/                      # Node.js + Express + TypeScript
│   │   ├── src/
│   │   │   ├── config/           # env validation, constants (fare config)
│   │   │   ├── modules/
│   │   │   │   ├── auth/         # routes, controller, service, schema (zod)
│   │   │   │   ├── rides/
│   │   │   │   ├── drivers/
│   │   │   │   ├── pools/        # matching, capacity, state machine
│   │   │   │   ├── fares/        # pure fare calculation functions
│   │   │   │   ├── wallet/
│   │   │   │   └── zones/
│   │   │   ├── middleware/       # auth, role guard, validate, error handler, rate limit
│   │   │   ├── db/               # client, migrations, seed (Jashim, Nusrat, Rafiq, Shirin)
│   │   │   ├── utils/            # logger (pino), errors, response helpers
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/                # unit + integration (capacity, transitions, fare, concurrency)
│   │   └── Dockerfile
│   └── web/                      # Next.js (App Router) + TypeScript
│       ├── app/
│       │   ├── (auth)/login, register
│       │   ├── passenger/        # request, active ride, history
│       │   └── driver/           # dashboard, requests, current pool, history
│       ├── components/
│       ├── lib/                  # api client, auth helpers
│       └── Dockerfile
├── docs/
│   ├── architecture.md           # Mermaid architecture diagram
│   ├── erd.md                    # ERD
│   ├── scaling.md                # "If Oi Tesla goes viral" bonus
│   └── api.md
├── docker-compose.yml
├── .env.example
├── README.md
└── .github/workflows/ci.yml      # optional: lint + tests

Layering in the API: route → controller → service → repository/DB. Business rules (state machine, capacity, fare) live in services and pure functions, not in controllers, so they are unit-testable.

10. Technical Specifications
Layer	Choice	Why (ride-pooling MVP)	Alternatives / switch when
Frontend	Next.js (App Router) + TypeScript, Tailwind	Routing, easy deployment, fast to build clean UI	Plain React + Vite if SSR isn't needed
Backend	Node.js + Express + TypeScript	Minimal, well known, easy to explain	NestJS for larger teams and DI/structure, Fastify for performance
Database	PostgreSQL	Transactions, row locks, CHECK/partial unique constraints, enums, jsonb. These are what seat capacity needs	MySQL is fine too. Move to geospatial (PostGIS) when real location matching is needed
ORM / query	Prisma (or Drizzle/Knex)	Typed migrations, seed support. Use raw SQL for the atomic seat update	Drizzle/Knex if you want closer-to-SQL control
Validation	Zod	One schema for runtime validation and types	Joi, class-validator
Auth	JWT access + refresh, argon2/bcrypt	Stateless API, simple for MVP	Sessions or an auth provider at scale
Logging	pino (JSON logs, request id)	Structured, cheap	Add OpenTelemetry at scale
Security	helmet, CORS allow-list, rate limiting, input validation, parameterized queries	Basic hardening	WAF, secrets manager later
Testing	Vitest/Jest + Supertest, real Postgres in tests (docker)	Concurrency tests need a real DB	Testcontainers for CI
Containers	Docker Compose: web, api, db (+ migrate/seed step), health checks	Mandatory	n/a
Hosting	Free tiers only (e.g. Vercel for web, a free Node host, a free Postgres tier). Verify current limits before choosing	No cost allowed	If no free backend hosting is available, document it and ship a reproducible Docker deployment
Architecture diagram
REST + JWT
Browser
Next.js Frontend
Node.js / Express API
Services: auth, rides, pools,fares
PostgreSQL
Concurrency design (now)

The single source of truth is PostgreSQL. Seat claiming uses one atomic statement inside a transaction, backed by CHECK constraints so even buggy code cannot overbook:

sql
UPDATE pools
SET seats_occupied = seats_occupied + $seats
WHERE id = $poolId
  AND status = 'ACCEPTED'
  AND seats_occupied + $seats <= capacity
RETURNING id;
-- 0 rows → throw 409 SEAT_UNAVAILABLE

Alternative: SELECT ... FOR UPDATE on the pool row, then check and insert. Both serialize contenders on that row.

At larger scale

Shard by city/zone, shorten lock time, use a matching service with a per-vehicle queue or single-writer per Tesla, add idempotency keys, and consider optimistic versioning plus retries.

11. Business Logic Rules (Enforcement Level)
Transactions: accept, join, cancel, start and complete each run in a single DB transaction (status change + member update + seat counter + history row).
State machine: one central canTransition(from, to) map. Every status change goes through it, and each change writes a ride_status_history row.
Capacity: enforced twice, in the atomic UPDATE and in the DB CHECK constraint. Cancelling decrements with the same atomic pattern (seats_occupied - n, never below 0).
One active pool per Tesla: partial unique index.
One pool per request: UNIQUE on pool_members.ride_request_id.
Idempotency: Idempotency-Key on POST /rides prevents duplicate requests from retries/double-clicks. UNIQUE (passenger_id, idempotency_key).
Fare calculation: pure functions (input: distance, seats, member count; output: paisa integers). No floats. Rounding is floor on the discount. Fares are locked at START and never recalculated afterwards.
Ownership checks: every ride query includes passenger_id = req.user.id (or the driver's Tesla for pool queries).
Driver gating: only online drivers with a Tesla can see or accept requests. A driver with a STARTED pool cannot accept new ones.
Wallet: debit in the same transaction as marking payment PAID. CHECK balance_paisa >= 0.
Audit: history rows are append-only (no updates or deletes).
12. Response Format
Success
json
{
  "success": true,
  "data": {
    "id": "b7f0…",
    "status": "MATCHED",
    "seats": 1,
    "fare": { "currency": "BDT", "amountPaisa": 8320, "display": "৳83.20" }
  },
  "meta": { "requestId": "c1a9…" }
}
List with pagination
json
{
  "success": true,
  "data": [ { "id": "…", "status": "COMPLETED" } ],
  "meta": { "page": 1, "limit": 20, "total": 42, "requestId": "…" }
}
Error
json
{
  "success": false,
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "Bullet has no free seats for this request.",
    "details": null
  },
  "meta": { "requestId": "…" }
}
Conventions
Money is always integer paisa (plus an optional display string).
Timestamps are ISO-8601 UTC.
HTTP status codes are meaningful (200, 201, 400, 401, 403, 404, 409, 429, 500).
Validation errors list fields in details.
Stack traces are never returned.
13. Deployment Checklist
Repository and process
 Branches: master, pre-release, release/v1.0.0, plus feature/* (e.g. feature/passenger-auth, feature/tesla-pooling, feature/driver-flow)
 Incremental commits using type(scope): description, no giant initial commit
 Features merged into master, then cut pre-release (fixes, docs, deploy checks), then release/v1.0.0
 No secrets committed; .env in .gitignore
Docker and environment
 docker compose up starts web, api and db
 DB health check; API waits for the DB
 .env.example with: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TTL, REFRESH_TTL, CORS_ORIGIN, NEXT_PUBLIC_API_URL, fare config values
 Migrations run automatically (or via a documented command)
 Seed data: Jashim + Bullet (3 seats), Nusrat, Rafiq, Shirin, zones, zone distances, wallets
Quality
 Tests passing: capacity never exceeded, invalid transitions rejected, Nusrat/Rafiq pooled fare (8,320 / 9,760), cannot modify another user's ride, cancellation rules, concurrent claims on the last seat
 Lint and type-check clean
 /health endpoint works
Deployment
 Free-tier hosting only; if not possible, document the constraint and provide the reproducible Docker deployment
 Production env vars set on the host, CORS configured, HTTPS on
 Smoke test: register → request → accept → arrive → start → complete
Documentation and submission
 README: summary, problem, features, screenshots/GIFs, architecture diagram, ERD, stack and justification, structure, env vars, setup (local + Docker), migrations/seed, run tests, demo credentials, deployment URL, API overview, trade-offs, limitations, next improvements
 AI Usage section (tools used, one accepted suggestion, one rejected/changed suggestion with the reason)
 Concurrency explanation (now vs. at scale)
 Bonus scaling doc (optional)
 6-minute video linked prominently in the README (0:00–1:00 problem, 1:00–3:00 engineering, 3:00–6:00 product tour)
14. Future Considerations
Product
Real maps and routing (OSRM/Mapbox), live GPS tracking, ETA
Smarter matching: detour tolerance, time windows, scheduled rides
Ratings and reviews, driver payouts, cancellation fees
Real payment gateways (bKash, Nagad, cards)
Multiple Teslas per driver, vehicle types, surge/traffic/weather pricing
Push/SMS notifications, admin dashboard, safety features (SOS, trip sharing)
Scaling to 1M passengers and 100k drivers ("If Oi Tesla goes viral")
Stateless API behind a load balancer, horizontally scaled
DB: indexes tuned, read replicas for history and reads, partition ride_status_history by time, a connection pooler (PgBouncer)
Geospatial matching: PostGIS or a geo index (geohash/H3) instead of zone tables
Caching: Redis for driver availability and zone data, added only when measured necessary
Queues/events: async notifications, matching jobs, payment settlement (outbox pattern)
Real-time: WebSockets or SSE for status and driver location
Contention: single-writer per vehicle or pool, short transactions, optimistic versioning with retries, idempotency keys everywhere
Resilience: rate limiting, retries with backoff, circuit breakers, graceful degradation
Observability: metrics, tracing, alerting (e.g. match latency, seat-conflict rate)
Security: WAF, token revocation lists, secrets manager, audit logging
Deployment: containers on an orchestrator, blue/green or canary releases, regional sharding by city
Engineering
CI pipeline (lint, tests, build), e2e tests with Playwright
OpenAPI/Swagger docs, feature flags, structured error tracking