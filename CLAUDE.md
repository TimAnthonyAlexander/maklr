# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

---

## Project Overview

**Maklr** is an open-source real estate CRM. It uses a PHP 8.4 BaseAPI backend with a React 19 frontend. The full feature spec lives in `docs/MVP.md`.

**Current state:** Models and auth boilerplate are in place. Domain controllers, routes, services, and all frontend app screens still need to be built.

---

## Common Commands

### Backend (PHP/BaseAPI)

```bash
# Start development server
./mason serve             # foreground
./mason serve --screen    # in screen session

# Database migrations (auto-generated from model changes)
./mason migrate:generate && ./mason migrate:apply -y

# Run tests
composer phpunit

# Static analysis
composer phpstan
composer phpstan-baseline  # Update baseline

# Code quality
composer rector            # Dry run
composer rector:fix        # Apply changes
```

### Frontend (React/Bun)

```bash
cd web

# Development server
bun run dev

# Build for production
bun run build

# Linting and formatting
bun run lint
bun run lint:fix
bun run format
bun run fix  # Both lint and format
```

---

## Architecture

### Backend: BaseAPI Framework

BaseAPI is a custom PHP 8.4 framework with Active Record ORM and automatic migrations. See the detailed patterns below.

**Directory Structure:**
- `app/Controllers/` — HTTP controllers (one per endpoint/resource)
- `app/Models/` — Active Record models (properties = database columns)
- `app/Services/` — Business logic layer
- `app/Middleware/` — Auth, rate limiting, etc.
- `app/Providers/` — DI container service registration
- `app/Auth/` — User provider implementation
- `routes/api.php` — All route definitions
- `config/app.php` — Application configuration
- `storage/` — Logs, cache, migrations state
- `translations/` — i18n JSON files

### Frontend: React + TypeScript

**Directory Structure:**
- `web/src/pages/` — Page components
- `web/src/components/` — Reusable UI components
- `web/src/api/` — API client layer (types, hooks, HTTP client)
- `web/src/contexts/` — React contexts (auth, etc.)
- `web/src/theme.ts` — MUI theme (design tokens)
- `web/src/App.tsx` — Router
- `web/src/main.tsx` — Entry point

**Tech Stack:**
- React 19 + TypeScript
- MUI v7 with `sx` prop styling
- Vite 7 build tool
- React Router 7 — import from `react-router` (not `react-router-dom`)
- Bun package manager

### Frontend API Layer

The files in `web/src/api/` were initially scaffolded by `./mason types:generate` but are now **manually maintained**. They are safe to edit directly.

- `web/src/api/types.ts` — TypeScript interfaces for API requests/responses
- `web/src/api/client.ts` — API client functions (one per endpoint)
- `web/src/api/hooks.ts` — React hooks wrapping the client functions
- `web/src/api/http.ts` — Low-level fetch wrapper with error handling

**Important conventions:**
- `http` returns the raw JSON body — no unwrapping or transformation
- Since `wrap_data=false`, response types must match the raw API shape (no `{ data: ... }` wrapper)
- `Envelope<T>` is defined as `type Envelope<T> = T` (passthrough) — do not change this
- For paginated list responses, use `items` as the array key (not `data`)
- Hooks follow the pattern: `useGet*` for queries (auto-fetch), `usePost*/usePatch*/useDelete*` for mutations (manual trigger via `.mutate()`)

---

## BaseAPI Patterns

### Models

Models extend `BaseModel`. **Public typed properties automatically become database columns.** Three columns are inherited: `id`, `created_at`, `updated_at`.

```php
class Estate extends BaseModel
{
    public string $title = '';           // VARCHAR, NOT NULL, default ''
    public ?string $description = null;  // VARCHAR, nullable
    public float $price = 0.0;           // FLOAT/DOUBLE
    public bool $furnished = false;      // TINYINT(1)
    public int $rooms = 0;              // INT
    public ?string $office_id = null;    // FK — nullable string for UUID
}
```

**Critical rule:** Never add a public property unless it should be a database column. Relationships, computed values, and transient data must be methods, not properties.

### Custom Column Definitions

Override default type inference with `$columns`:

```php
public static array $columns = [
    'description' => ['type' => 'TEXT', 'nullable' => true],
    'status' => ['type' => 'VARCHAR(20)'],
    'virtual_tour_url' => ['type' => 'VARCHAR(2048)', 'nullable' => true],
];
```

### Indexes

```php
public static array $indexes = [
    'email' => 'unique',                         // Single unique
    'status' => 'index',                          // Single index
    ['property_type', 'marketing_type', 'status'], // Composite index
    ['from', 'to', 'type' => 'unique'],           // Composite unique
];
```

### Relationships

Defined as **methods** (never properties). Foreign key columns are regular string properties:

```php
// Foreign key property (this IS a column)
public ?string $owner_contact_id = null;

// Relationship method (this is NOT a column)
public function ownerContact(): BelongsTo
{
    return $this->belongsTo(Contact::class, 'owner_contact_id');
}

public function images(): HasMany
{
    return $this->hasMany(EstateImage::class);
}
```

**Usage:**
```php
$lessons = $course->lessons()->get();        // Get all related
$owner = $estate->ownerContact()->first();   // Get single related
$model->toArray()                            // Shallow — own columns only
$model->toArray(true)                        // Deep — includes loaded relations
```

### Query API

```php
Model::find($id)                                    // By primary key → ?Model
Model::firstWhere('email', '=', $email)              // First match → ?Model
Model::where('status', '=', 'active')->get()         // Collection
Model::where('status', '=', 'active')->count()       // Count
Model::where('email', '=', $email)->exists()         // Boolean
Model::where('type', '=', 'sale')
    ->where('price', '<=', 500000)
    ->orderBy('created_at', 'DESC')
    ->get()                                          // Chained query
Model::with(['office', 'assignedUser'])->get()       // Eager load
Model::cached(300)->where(...)->get()                 // Cached query (300s TTL)

// Pagination for list endpoints
$result = Model::apiQuery($this->request, 50);       // Auto-paginate, max 50
return JsonResponse::paginated($result);

// Raw QueryBuilder (returns arrays, not model objects!)
Model::query()->qb()
    ->select(['estate.id', 'estate.title'])
    ->join('office', 'estate.office_id', '=', 'office.id')
    ->where('office.active', '=', true)
    ->get();
```

### JSON Fields Pattern

For storing arrays/objects as JSON strings:

```php
public array $custom_fields = [];   // Stored as JSON in DB

// For nullable JSON, use string + getter/setter:
public ?string $metadata = null;

public function getMetadata(): array
{
    if ($this->metadata === null || $this->metadata === '') {
        return [];
    }
    return json_decode($this->metadata, true) ?: [];
}

public function setMetadata(array $meta): void
{
    $this->metadata = json_encode($meta) ?: null;
}
```

### Foreign Key Configuration

```php
// Default: ON DELETE CASCADE, ON UPDATE CASCADE
// Override per FK:
public static array $foreignKeys = [
    'user_id' => ['on_delete' => 'SET NULL', 'on_update' => 'CASCADE'],
];
```

### Model Methods

Business logic belongs in models:

```php
public function checkPassword(string $password): bool
{
    return password_verify($password, $this->password);
}

public function isPremium(): bool
{
    return $this->role === 'admin' || (strtotime($this->premium_until ?? '') > time());
}
```

---

### Controllers

Controllers extend `BaseApi\Controllers\Controller`. Method names match HTTP verbs: `get()`, `post()`, `put()`, `patch()`, `delete()`.

**Public properties are auto-bound** from the request body, query string, and route parameters.

```php
#[Tag('Estates')]
class EstateController extends Controller
{
    // Auto-bound from route parameter {id}
    public string $id = '';

    // Auto-bound from POST body
    public string $title = '';
    public string $property_type = 'apartment';

    public function get(): JsonResponse
    {
        $estate = Estate::find($this->id);
        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }
        return JsonResponse::ok($estate->toArray(true));
    }

    public function post(): JsonResponse
    {
        $this->validate([
            'title' => 'required|string|max:255',
            'property_type' => 'required|string|in:apartment,house,commercial,land,garage',
        ]);

        $estate = new Estate();
        $estate->title = $this->title;
        $estate->property_type = $this->property_type;
        $estate->save();

        return JsonResponse::created($estate->toArray());
    }
}
```

### Validation Rules

```php
$this->validate([
    'email'    => 'required|string|email',
    'password' => 'required|string|min:8',
    'type'     => 'required|string|in:buyer,seller,tenant,landlord',
    'name'     => 'string|max:255',              // optional
    'active'   => 'boolean',
]);
// Fails automatically with 422 + field errors if invalid
```

### Accessing the Authenticated User

After `CombinedAuthMiddleware` runs, user data is on the request:

```php
$userData = $this->request->user ?? null;
if (!$userData || empty($userData['id'])) {
    return JsonResponse::error('Unauthorized', 401);
}

// Hydrate model when you need model methods:
$user = User::find($userData['id']);
if (!$user instanceof User) {
    return JsonResponse::notFound('User not found');
}
```

### Constructor Dependency Injection

```php
final class EstateController extends Controller
{
    public function __construct(
        private readonly EstateService $estateService,
    ) {}
}
```

### JsonResponse Helpers

```php
JsonResponse::ok($data)                            // 200
JsonResponse::created($data)                       // 201
JsonResponse::noContent()                          // 204
JsonResponse::badRequest('Message', ['extra'])      // 400
JsonResponse::error('Unauthorized', 401)            // 401
JsonResponse::forbidden('Insufficient permissions') // 403
JsonResponse::notFound('Not found')                 // 404
JsonResponse::validationError($errors)              // 422
JsonResponse::error('Server error', 500)            // 500
JsonResponse::paginated($result)                    // 200 with pagination meta
```

### Guard Patterns

Always use `instanceof` checks after `find()`:

```php
$estate = Estate::find($this->id);
if (!$estate instanceof Estate) {
    return JsonResponse::notFound('Estate not found');
}

// Role check
if (!in_array($user->role, ['admin', 'manager'])) {
    return JsonResponse::forbidden('Insufficient permissions');
}
```

---

### Middleware

Implements `BaseApi\Http\Middleware` with `handle(Request $request, callable $next): Response`.

**Available middleware:**
- `CombinedAuthMiddleware` — Tries Bearer token, falls back to session. Sets `$request->user`
- `ApiTokenAuthMiddleware` — Bearer token only
- `RateLimitMiddleware` — Rate limiting with format `'60/1m'`, `'10/1h'`
- `SessionStartMiddleware` — Required for login/signup (session-modifying endpoints)
- `PermissionsMiddleware` — RBAC permission check with node string
- `AdminMiddleware` — Check `role === 'admin'` (create this when needed)

**Middleware execution order matters** — list in array order:

```php
$router->post('/estates', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],   // 1. Rate limit
    CombinedAuthMiddleware::class,                         // 2. Auth
    EstateController::class,                               // 3. Controller
]);
```

---

### Routes

All routes defined in `routes/api.php` using `$router = App::router()`:

```php
// Simple public route
$router->get('/health', [HealthController::class]);

// With rate limit
$router->get('/estates', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    EstateController::class,
]);

// Route parameters
$router->get('/estates/{id}', [
    CombinedAuthMiddleware::class,
    EstateController::class,
]);

// Session-modifying (login/signup)
$router->post('/auth/login', [
    SessionStartMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    LoginController::class,
]);

// Permission-protected
$router->delete('/files', [
    CombinedAuthMiddleware::class,
    PermissionsMiddleware::class => ['node' => 'files.delete'],
    FileUploadController::class,
]);
```

---

### Services

Services contain business logic. Registered in `AppServiceProvider`:

```php
// app/Providers/AppServiceProvider.php
public function register(ContainerInterface $container): void
{
    $container->singleton(UserProvider::class, SimpleUserProvider::class);
    $container->singleton(EmailService::class);

    // Factory for complex init:
    $container->singleton(SomeService::class, function () {
        return new SomeService($_ENV['API_KEY'] ?? '');
    });
}
```

**Inject in controllers via constructor:**

```php
public function __construct(private readonly EmailService $emailService) {}
```

---

### Migrations

Automatic diff-based migrations from model changes:

```bash
# 1. Change a model property
# 2. Generate migration SQL
./mason migrate:generate

# 3. Apply
./mason migrate:apply -y
```

State files:
- `storage/migrations.json` — Generated migrations (git-tracked)
- `storage/executed-migrations.json` — Applied status (not git-tracked)

---

## Authentication

**Dual auth system:**
- **Session-based** (cookies) for web frontend
- **API tokens** (Bearer) for external consumers

Both handled transparently by `CombinedAuthMiddleware`.

**Token flow:**
1. Login/signup → generate token → store SHA256 hash in DB → return plain token
2. Client sends `Authorization: Bearer <token>`
3. Middleware hashes token, looks up in `api_token` table

---

## Response Format

**This project uses `wrap_data=false`** (configured in `config/app.php` and `.env`). API responses return data at the root level — there is **no** `{ "data": ... }` envelope.

**Success (single resource):**
```json
{ "title": "My Estate", "status": "active", ... }
```

**Success (paginated list):**
```json
{ "items": [...], "pagination": { "page": 1, "per_page": 20, "total": 100, "remaining": 0 }, "meta": { ... } }
```

**Error:**
```json
{ "error": "Message", "errors": { "field": ["..."] } }
```

**Key points:**
- `JsonResponse::ok($data)` returns `$data` directly at the root level
- `JsonResponse::created($data)` returns `$data` directly at the root level
- `JsonResponse::paginated($result)` uses `"items"` as the array key (not `"data"`)
- The `Envelope<T>` type in `web/src/api/types.ts` is defined as `type Envelope<T> = T` (identity/passthrough) to reflect this

---

## Frontend Conventions

### Design Philosophy

Clean, confident minimalism. Flat design, no shadows or gradients.

- **Primary:** #1A1A1A (near-black)
- **Background:** #FAFAFA
- **Font:** DM Sans
- **Border radius:** 12px (containers), 8px (buttons)
- **Elevation:** Always 0 (flat)
- **Buttons:** No text transform, fontWeight 500

### Styling

Use MUI `sx` prop. No separate CSS files:

```tsx
<Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
```

### Query Hook Loading Semantics

- `loading` means "we have no data yet" (initial load), not "a request is in flight"
- Refetches happen silently — existing data stays visible while the background request completes
- After a mutation (PATCH/POST), use the response data directly via `setData()` instead of calling `refetch()` on the same resource
- Only call parent callbacks (e.g. `onTaskUpdated`) for list-level refresh; never call local `refetch()` after a patch

### Detail Page Empty Fields

- Always show all fields on detail pages, even when empty — never hide them with conditional rendering
- Empty fields display a dash (`\u2014`) in `text.disabled` color
- This gives the page consistent structure and makes it obvious which data is missing

---

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```
APP_ENV=local|staging|production
APP_DEBUG=true|false
DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD
```

---

## MVP Scope

The MVP includes: Estates, Contacts + matching, Activity Log, Calendar, Tasks, Email (IMAP/SMTP), Documents + PDF brochure, Users & Auth (RBAC, audit log), and React frontend for all of the above. See `docs/MVP.md` for full spec.

**Explicitly not in MVP:** Portal syndication, workflow automation, invoicing, dashboards, mobile app, CTI, public API, i18n.

---

## Testing

```bash
composer phpunit              # All tests
composer phpunit -- tests/Unit   # Unit only
composer phpunit -- tests/Feature # Feature only
```

- `tests/Unit/` — Isolated unit tests
- `tests/Feature/` — Integration/API tests
- SQLite in-memory for test isolation (see `phpunit.xml`)

---

## Important Architectural Rules

1. **Properties = columns.** Never add a public property to a model unless it should be a DB column.
2. **Relationships are methods**, not properties. Use `belongsTo()`, `hasMany()`.
3. **Services for business logic.** Controllers handle HTTP concerns only.
4. **Always `instanceof` check** after `Model::find()` before using the result.
5. **Validate in controllers** with `$this->validate([...])` before processing.
6. **Return `JsonResponse`** from every controller method — never throw for HTTP errors.
7. **Non-critical operations** (emails, notifications) should be wrapped in try-catch.
8. **Middleware order matters** — list rate limit first, then auth, then controller.
9. **Office scoping is mandatory.** Every query for tenant-owned data (estates, contacts, tasks, etc.) MUST be scoped to the authenticated user's `office_id`. Never use `Model::find($id)` alone for tenant data — always add `->where('office_id', '=', $officeId)`. On create, always set `office_id` from `$this->request->user['office_id']` — never accept it from user input. On update, never allow patching `office_id`.

### Office Scoping Pattern

```php
// Get the user's office_id from the auth middleware
$officeId = $this->request->user['office_id'] ?? null;

// READ: Always scope queries
$estate = Estate::where('id', '=', $this->id)
    ->where('office_id', '=', $officeId)
    ->first();

// LIST: Always scope the base query
$query = Estate::query()->where('office_id', '=', $officeId);

// CREATE: Always assign from auth, never from input
$estate->office_id = $this->request->user['office_id'] ?? null;

// UPDATE: Never allow office_id in patchable fields
```
