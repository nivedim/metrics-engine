# Unified Revenue Metrics Engine

A production-grade, fault-tolerant, zero-drift financial ledger processing pipeline built with **Node.js**, **TypeScript**, and **PostgreSQL (via Supabase)**.

This system ingests asynchronous transactional payloads from disparate third-party webhooks (**Stripe**, **PayPal**, **Plaid**), normalizes conflicting data footprints, and serves immutable aggregate calculations immune to timezone or calculation-induced drift.

---

# 🏗️ Core Architectural Pillars & Design Decisions

## 1. Zero-Drift Financial Calculations (Structural Design)

### The Problem

Standard architectures often use independent, disparate queries for calculating overall revenue summaries versus day-by-day breakdowns. This introduces high susceptibility to chronological race conditions, boundary discrepancies, or double-entry variance.

### The Senior Solution

This engine implements a strict top-down chain of custody for data.

The summary endpoint:

```http
GET /api/revenue/summary
```

is mathematically incapable of drifting from the breakdown endpoint:

```http
GET /api/revenue/breakdown
```

because it calculates its total by directly aggregating the computed data keys from the underlying breakdown service layer.

---

## 2. Timezone-Drift Immunity

### The Problem

Financial metrics frequently drift when server infrastructure scales across cloud regions (e.g., AWS `us-east-1` vs. `eu-west-1`), converting ISO strings into localized machine dates.

### The Senior Solution

#### Storage Layer

All timestamps are captured via indexed `TIMESTAMPTZ` columns in PostgreSQL, converting absolute points in time uniformly to UTC.

#### Application Layer

The metrics parsing matrix processes strings using strict UTC accessors:

```ts
.toISOString().split("T")[0]
```

This decouples runtime date boundaries completely from server runtime environments.

---

## 3. Defensive Ingestion via Strict Allow-Listing

### The Problem

Third-party financial platforms frequently iterate on their payload schemas. If a platform introduces a new transaction status (e.g., Stripe adding `partially_captured`), an exclusion-based blocklist (such as ignoring `failed`) will blindly accept the unknown status, leading to catastrophic revenue inflation.

### The Senior Solution

The ingestion system utilizes a non-exclusionary Allow-List Matrix.

Any transactional status that is not explicitly registered for a specific provider automatically defaults to a canonical status of:

```text
PENDING
```

This shields internal revenue ledgers from upstream vendor variance.

---

## 4. Idempotency & Data De-duplication

### The Problem

Webhook deliveries from payment networks guarantee **at-least-once delivery**, not **exactly-once**. Duplicate payloads will artificially distort financial metrics.

### The Senior Solution

The engine enforces database-level constraints using a unique transaction ID as a primary key, utilizing an upsert operation with an explicit conflict target:

```ts
.upsert(data, {
  onConflict: "id"
});
```

This guarantees absolute idempotency at the ingestion layer.

---

## 5. Automated Architectural Safety Guards (Static Lint Constraints)

### The Problem

As a codebase grows, future developers might accidentally bypass the domain service layer and query the `transactions` database table directly elsewhere, fragmenting the single source of truth.

### The Senior Solution

An automated structural unit test:

```text
src/__tests__/architecture.test.ts
```

parses abstract string patterns throughout the codebase.

It uses static analysis to guarantee that only the approved metrics service is capable of calling the transactions table, failing the CI/CD pipeline immediately if a boundary violation is discovered.

---

# 🛠️ Tech Stack & Database Security

| Component              | Technology                        |
| ---------------------- | --------------------------------- |
| Runtime Engine         | Node.js (v18+)                    |
| Language               | TypeScript                        |
| API Framework          | Express.js (CommonJS Compilation) |
| Database               | PostgreSQL via Supabase           |
| Testing Infrastructure | Jest + ts-jest                    |

---

# 🚀 Getting Started & Execution Flow

## 1. Environment Configuration

Create a `.env` file in the root of the project:

```env
PORT=3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-high-privilege-backend-jwt-key
```

---

## 2. Dependency Installation

```bash
npm install
```

---

## 3. Execute Architectural Safety Guard (Test Suite)

Validate codebase boundaries and structural integrity rules:

```bash
npm run test
```

---

## 4. Populate Local Production Fixtures

Simulate processing realistic, structurally varied, and messy JSON snapshots exported from real Stripe and Plaid developer environments:

```bash
npm run seed:fixtures
```

---

## 5. Launch the Server

```bash
npm start
```

---

# 📊 API Specification

## 1. Revenue Summary

### Endpoint

```http
GET /api/revenue/summary
```

### Response Prototype

```json
{
  "success": true,
  "meta": {
    "startDate": "2026-05-20T12:40:49.161Z",
    "endDate": "2026-06-19T12:40:49.162Z",
    "unit": "cents"
  },
  "data": {
    "total": 50050
  }
}
```

---

## 2. Daily Breakdown

### Endpoint

```http
GET /api/revenue/breakdown
```

### Response Prototype

```json
{
  "success": true,
  "meta": {
    "startDate": "2026-05-20T12:40:56.440Z",
    "endDate": "2026-06-19T12:40:56.440Z",
    "unit": "cents"
  },
  "data": {
    "2026-06-18": 30050,
    "2026-06-19": 20000
  }
}
```


# Gemini chat link
https://gemini.google.com/share/e5132aaf3727