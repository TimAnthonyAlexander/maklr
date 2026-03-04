# BaseAPI

BaseAPI is a PHP 8.4+ framework that combines an Active Record ORM, automatic diff-based migrations, and a controller layer with method-based routing plus JsonResponse helpers.

---

## Models and ORM

BaseAPI uses an Active Record pattern:
- Each model class represents a database table.
- Each instance represents one row.
- Models handle persistence, relationships, validation via typed properties, and provide a fluent query API.
- `toArray()` produces clean JSON output (no ORM internals) and includes foreign key fields.
- `toArray(true)` can include loaded relations for deeper output.

### Basic model definition

Models extend `BaseModel` and define schema via public typed properties.

```php
<?php

namespace App\Models;

use BaseApi\Models\BaseModel;

class User extends BaseModel
{
    public string $name = '';
    public string $email = '';
    public string $password = '';
    public bool $active = true;
    public ?string $avatar_url = null;

    // Inherited columns: $id, $created_at, $updated_at

    public static array $indexes = [
        'email' => 'unique',
        'active' => 'index',
        ['workspace_id', 'email', 'type' => 'unique'],
    ];

    public function checkPassword(string $password): bool
    {
        return password_verify($password, $this->password);
    }
}
```

All BaseModel entities have a save() method to just save it (override or create if new BaseModel()).

### Relationships

Relationships are defined via foreign key properties (usually `*_id`) plus `belongsTo()` and `hasMany()` methods.

**IMPORTANT RULE**: Properties will always become database columns. Only define properties that should be actual columns in the table.

```php
<?php

use BaseApi\Models\BaseModel;
use BaseApi\Models\Relations\BelongsTo;
use BaseApi\Models\Relations\HasMany;

class Room extends BaseModel
{
    public string $title = '';
    public string $type = '';
    public int $capacity = 1;

    // Foreign key property - becomes a column in the database
    public string $hotel_id = '';

    // NO property like: public $hotel; or public array $offers = [];
    // These would try to create columns, which is wrong!
    // Relationships are accessed via methods only.

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }
}

class Offer extends BaseModel
{
    public string $name = '';
    public float $price = 0.0;

    // Foreign key property - becomes a column in the database
    public string $room_id = '';

    // NO property like: public $room;
    // Would create an unwanted column!

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
```

Usage:

```php
<?php

$room = Room::find($id);

$hotel = $room->hotel()->get();
$offers = $room->offers()->get();

$json = $room->toArray();
$jsonWithRelations = $room->toArray(true);
```

### Eager loading

Use `with()` to avoid N+1 queries.

```php
<?php

$rooms = Room::with(['hotel'])->get();
$hotels = Hotel::with(['rooms'])->get();
$offers = Offer::with(['room'])->get();

foreach ($hotels as $hotel) {
    foreach ($hotel->rooms as $room) {
        // Already loaded
    }
}
```

### API queries and pagination

`apiQuery()` provides automatic pagination, sorting, filtering, and eager loading for API endpoints.

```php
<?php

use BaseApi\Http\JsonResponse;

public function get(): JsonResponse
{
    // Handles: ?page=1&perPage=20&sort=name&with=hotel
    $result = Room::apiQuery($this->request, 50);

    return JsonResponse::paginated($result);
}

$result = Room::where('capacity', '>=', 2)
    ->with(['hotel'])
    ->paginate($page, $perPage, $maxPerPage, true);

return JsonResponse::paginated($result);
```

### ModelQuery vs. QueryBuilder

When querying models, you are typically working with a `ModelQuery` object. `ModelQuery` handles the transition between database rows and model instances (hydration).

- **`ModelQuery`**: Returned by methods like `User::where()`, `User::with()`, etc. Methods like `get()`, `first()`, and `paginate()` on a `ModelQuery` return **model objects**.
- **`QueryBuilder`**: Accessible via `User::qb()`. This is the raw database query layer. Methods like `get()`, `first()`, and `paginate()` on a `QueryBuilder` return **raw associative arrays**.

**IMPORTANT**: Avoid calling `->qb()` unless you specifically need to bypass model hydration or use advanced SQL features not covered by `ModelQuery`. Calling `->qb()` in the middle of a query chain will cause subsequent execution methods to return arrays instead of objects.
  
### Query caching

Cache expensive queries with `cached($seconds)`. Cache invalidation happens automatically when related models are saved or deleted.

```php
<?php

$hotels = Hotel::cached(300)
    ->where('rating', '>=', 4.0)
    ->with(['rooms'])
    ->get();

$hotel = new Hotel();
$hotel->title = 'New Hotel';
$hotel->save();
```

### Models best practices

- **Properties become columns**: Only define properties that should be actual database columns. Never add properties for computed values or relationships.
- Prefer typed properties for validation and clean JSON.
- Use string foreign key properties (example: `public string $user_id = '';`) - these ARE columns.
- Define relationships via methods only (e.g., `user(): BelongsTo`), never as properties.
- Add indexes for real query patterns.
- Use eager loading for relation-heavy list endpoints.
- Use `apiQuery()` for standard list endpoints.
- Keep business logic in models, HTTP logic in controllers.
- Use `toArray()` for shallow JSON, `toArray(true)` when you want loaded relations included.
- **Never use `->qb()` unnecessarily**: Using `qb()` returns raw arrays instead of model objects, which can break transformers or logic that expects model instances.

---

## Migrations

BaseAPI generates migrations automatically from model definitions.
- Diff-based: it introspects the current database schema and compares it to your models.
- Generates only necessary SQL statements.
- Each migration has a deterministic content-based ID and tracks whether it has been applied.

### Commands

```bash
./mason migrate:generate
```

```bash
./mason migrate:apply
```

Migrations are stored in:
- `storage/migrations.json`
- `storage/executed-migrations.json` (execution state, typically not git-tracked)

### Model to database mapping

All models extend `BaseModel` and automatically include:
- `id`
- `created_at`
- `updated_at`

### Foreign keys and relationships

Foreign keys are created when BaseAPI detects string properties ending with `_id` and a matching model exists.

```php
<?php

use BaseApi\Models\BaseModel;
use BaseApi\Models\Relations\BelongsTo;

class Order extends BaseModel
{
    public string $user_id = '';
    public string $product_id = '';
    public int $quantity = 1;
    public float $total = 0.0;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public static array $indexes = [
        'user_id' => 'index',
        'product_id' => 'index',
    ];
}
```

### Cascade configuration

Default behavior:
- `ON DELETE CASCADE`
- `ON UPDATE CASCADE`

You can customize per foreign key using `public static array $foreignKeys`.

```php
<?php

use BaseApi\Models\BaseModel;

class Comment extends BaseModel
{
    public ?string $user_id = null;
    public string $post_id = '';
    public string $content = '';
    public ?\DateTime $created_at = null;

    public static array $foreignKeys = [
        'user_id' => [
            'on_delete' => 'SET NULL',
            'on_update' => 'CASCADE',
        ],
        'post_id' => [
            'on_delete' => 'CASCADE',
            'on_update' => 'CASCADE',
        ],
    ];
}
```

Supported options:
- `CASCADE` (default)
- `RESTRICT`
- `SET NULL` (column must be nullable)
- `NO ACTION`

### Migration state format

Example `storage/migrations.json`:

```json
{
  "version": "1.0",
  "migrations": [
    {
      "id": "mig_a684b3eb7c1c",
      "sql": "CREATE TABLE \"users\" (\n  \"id\" TEXT PRIMARY KEY NOT NULL,\n  \"name\" TEXT NOT NULL,\n  \"email\" TEXT NOT NULL\n)",
      "destructive": false,
      "generated_at": "2024-12-01T12:00:00+00:00",
      "table": "users",
      "operation": "create_table",
      "warning": null
    }
  ]
}
```

Example `storage/executed-migrations.json`:

```json
{
  "version": "1.0",
  "executed": [
    {
      "id": "mig_a684b3eb7c1c",
      "executed_at": "2024-12-01T12:01:00+00:00"
    }
  ]
}
```

### Custom column definitions

Use `public static array $columns` when you need explicit SQL types or nullability rules beyond defaults.

```php
<?php

use BaseApi\Models\BaseModel;

class User extends BaseModel
{
    public string $name = '';
    public string $email = '';
    public ?string $bio = null;

    public static array $columns = [
        'name' => ['type' => 'VARCHAR(120)', 'null' => false],
        'email' => ['type' => 'VARCHAR(255)', 'null' => false],
        'bio' => ['type' => 'TEXT', 'null' => true],
    ];

    public static array $indexes = [
        'email' => 'unique',
        'name' => 'index',
    ];
}
```

### Composite indexes

Use array syntax for multi-column indexes. Add `'type' => 'unique'` for unique constraints.

```php
<?php

use BaseApi\Models\BaseModel;

class Task extends BaseModel
{
    public string $project_id = '';
    public string $status = 'backlog';
    public string $priority = 'medium';
    public ?string $assignee_user_id = null;
    public ?string $rank = null;

    public static array $indexes = [
        'project_id' => 'index',
        'status' => 'index',

        ['project_id', 'status'],
        ['project_id', 'status', 'rank'],
        ['assignee_user_id', 'status'],

        ['project_id', 'external_id', 'type' => 'unique'],
    ];
}
```

Notes:
- Column order matters. Put columns used in WHERE before those used only in ORDER BY.
- Indexes speed up reads but add write and storage overhead. Create indexes for real query patterns.

### Driver type mapping overview

Mappings vary by driver. Example overview:

```php
// MySQL
// string -> VARCHAR(255) or VARCHAR(36) for *_id
// int    -> INT
// float  -> DOUBLE
// bool   -> TINYINT(1)
// array  -> JSON
// object -> JSON

// SQLite
// string -> TEXT
// int    -> INTEGER
// float  -> REAL
// bool   -> INTEGER (0/1)
// array  -> TEXT (JSON)
// object -> TEXT (JSON)

// PostgreSQL
// string -> VARCHAR(255) or UUID for *_id
// int    -> INTEGER
// float  -> REAL
// double -> DOUBLE PRECISION
// bool   -> BOOLEAN
// array  -> JSONB
// object -> JSONB
```

### Safe migration practices

- Destructive operations are detected (dropping tables or columns, shrinking types).
- Use safe mode in production first.

```bash
./mason migrate:apply --safe
```

---

## Routing

Routes are defined in `routes/api.php` using the router instance:

```php
<?php

use BaseApi\App;
use App\Controllers\ProjectController;
use BaseApi\Http\Middleware\RateLimitMiddleware;
use App\Middleware\CombinedAuthMiddleware;

$router = App::router();

// Simple route
$router->get('/health', [HealthController::class]);

// Route with middleware
$router->get('/me', [
    CombinedAuthMiddleware::class,
    MeController::class,
]);

// Route with middleware configuration
$router->post('/auth/login', [
    SessionStartMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    LoginController::class,
]);

// Route with parameters
$router->get('/projects/{id}', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    ProjectController::class,
]);

// DELETE with parameters
$router->delete('/api-tokens/{id}', [
    CombinedAuthMiddleware::class,
    ApiTokenController::class,
]);
```

### Route parameter binding

Route parameters (e.g., `{id}`, `{userId}`) are automatically bound to controller properties:

```php
<?php

// Route: /projects/{id}
class ProjectController extends Controller
{
    public string $id = ''; // Auto-bound from route parameter

    public function get(): JsonResponse
    {
        if (!empty($this->id)) {
            // Handle single resource
            $project = Project::find($this->id);
            // ...
        } else {
            // Handle list
            // ...
        }
    }
}
```

### Request data binding

POST/PATCH/PUT body fields and query parameters are also auto-bound:

```php
<?php

class LoginController extends Controller
{
    // Auto-bound from POST body
    public string $email = '';
    public string $password = '';

    public function post(): JsonResponse
    {
        // $this->email and $this->password are already populated
        $this->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);
        // ...
    }
}
```

---

## Controllers

Controllers handle HTTP requests and return responses.
- Method-based routing: `get()`, `post()`, `put()`, `patch()`, `delete()`, `head()` map to HTTP verbs.
- Route parameters and form fields are bound to controller properties.
- Validation and consistent JSON responses are built-in.

### Basic controller structure

```php
<?php

namespace App\Controllers;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use App\Models\User;

class UserController extends Controller
{
    public string $id = '';

    public string $name = '';
    public string $email = '';
    public string $password = '';

    public function get(): JsonResponse
    {
        if (empty($this->id)) {
            $result = User::apiQuery($this->request, 50);
            return JsonResponse::paginated($result);
        }

        $user = User::find($this->id);
        if (!$user) {
            return JsonResponse::notFound('User not found');
        }

        return JsonResponse::ok($user->jsonSerialize());
    }

    public function post(): JsonResponse
    {
        $this->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email',
            'password' => 'required|string|min:8',
        ]);

        $existingUser = User::firstWhere('email', '=', $this->email);
        if ($existingUser) {
            return JsonResponse::error('User with this email already exists', 409);
        }

        $user = new User();
        $user->name = $this->name;
        $user->email = $this->email;
        $user->password = password_hash($this->password, PASSWORD_DEFAULT);
        $user->save();

        return JsonResponse::created($user->jsonSerialize());
    }
}
```

### JsonResponse helpers

```php
// Success
JsonResponse::ok($data)
JsonResponse::created($data)
JsonResponse::success($data)
JsonResponse::accepted($data)
JsonResponse::paginated($result)

// Errors
JsonResponse::badRequest($message, $errors)
JsonResponse::unauthorized($message)
JsonResponse::forbidden($message)
JsonResponse::notFound($message)
JsonResponse::error($message, $status)
JsonResponse::validationError($errors)
JsonResponse::unprocessable($message, $details)

// Other
JsonResponse::noContent()
```

### Authentication in controllers

Controllers can access authenticated user information via the request object after authentication middleware runs:

```php
<?php

namespace App\Controllers;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class MeController extends Controller
{
    public function get(): JsonResponse
    {
        // User is set by authentication middleware (e.g., CombinedAuthMiddleware)
        $user = $this->request->user;

        if (!$user) {
            return JsonResponse::unauthorized();
        }

        return JsonResponse::ok(['user' => $user]);
    }
}
```

For routes that support both session and API token authentication, use `CombinedAuthMiddleware`. The authenticated user will be available in `$this->request->user`.

For session-only access (e.g., in routes without auth middleware):

```php
<?php

// Access session data directly
$userId = $this->request->session['user_id'] ?? null;
```

### Validation and error handling

Always validate input before processing, and handle null/missing results appropriately:

```php
<?php

namespace App\Controllers;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use App\Models\User;

class LoginController extends Controller
{
    public string $email = '';
    public string $password = '';

    public function post(): JsonResponse
    {
        $this->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::firstWhere('email', '=', $this->email);

        // IMPORTANT: Always check if the model was found before using it
        if (!$user instanceof User) {
            return JsonResponse::error('Invalid credentials', 401);
        }

        if (!$user->checkPassword($this->password)) {
            return JsonResponse::error('Invalid credentials', 401);
        }

        // ... proceed with login
        return JsonResponse::ok($user->jsonSerialize());
    }
}
```

**Common mistake**: Calling methods on a potentially null result from `firstWhere()`, `find()`, or similar query methods. Always validate the result is an instance of the expected model before using it.

### Route parameter binding and conditional logic

Controllers can handle multiple scenarios based on auto-bound route parameters:

```php
<?php

namespace App\Controllers;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use App\Models\Project;

class ProjectController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        // If ID is provided, get single resource; otherwise list all
        if (!empty($this->id)) {
            return $this->getProject();
        }

        return $this->listProjects();
    }

    private function getProject(): JsonResponse
    {
        $project = Project::find($this->id);

        if (!$project) {
            return JsonResponse::notFound('Project not found');
        }

        return JsonResponse::ok($project->toArray(true));
    }

    private function listProjects(): JsonResponse
    {
        $result = Project::where('active', '=', true)
            ->with(['user'])
            ->paginate(
                $this->request->query['page'] ?? 1,
                $this->request->query['perPage'] ?? 20,
                50, // max per page
                true // count total
            );

        return JsonResponse::paginated($result);
    }
}
```

### Middleware patterns

#### Session-based authentication

For routes that modify session state (login, signup), use `SessionStartMiddleware`:

```php
<?php

// In routes/api.php
use BaseApi\Http\SessionStartMiddleware;

$router->post('/auth/signup', [
    SessionStartMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '5/1m'],
    AuthController::class,
]);

$router->post('/auth/login', [
    SessionStartMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    LoginController::class,
]);
```

#### Combined authentication (session + API tokens)

For routes that should work with both session and API token authentication, use `CombinedAuthMiddleware`:

```php
<?php

// In routes/api.php
use App\Middleware\CombinedAuthMiddleware;

$router->get('/me', [
    CombinedAuthMiddleware::class,
    MeController::class,
]);

$router->get('/projects/{id}', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    ProjectController::class,
]);
```

In controllers, check authentication from either source:

```php
<?php

// For routes with CombinedAuthMiddleware - user is always set
$user = $this->request->user;

// For routes without auth middleware - check both sources
$userId = $this->request->user['id'] ?? $this->request->session['user_id'] ?? null;
```

### Dependency injection

Controllers support constructor dependency injection for services:

```php
<?php

namespace App\Controllers;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use App\Services\EmailService;
use App\Models\User;

class SignupController extends Controller
{
    public string $name = '';
    public string $email = '';
    public string $password = '';

    public function __construct(
        private readonly EmailService $emailService,
    ) {}

    public function post(): JsonResponse
    {
        $this->validate([
            'name' => 'required|string',
            'email' => 'required|string|email',
            'password' => 'required|string|min:8',
        ]);

        // Check if user already exists
        $existingUser = User::firstWhere('email', '=', $this->email);
        if ($existingUser instanceof User) {
            return JsonResponse::error('User with this email already exists', 409);
        }

        // Create new user
        $user = new User();
        $user->name = $this->name;
        $user->email = $this->email;
        $user->password = password_hash($this->password, PASSWORD_DEFAULT);
        $user->save();

        // Use injected service
        $this->emailService->sendWelcome($user->email, $user->name);

        return JsonResponse::created($user->jsonSerialize());
    }
}
```

### Controllers best practices

- Keep controllers focused on HTTP concerns.
- **Always validate query results**: Check if models are found before using them (use `instanceof` checks).
- Validate all incoming input with `$this->validate()`.
- Use appropriate HTTP status codes via JsonResponse helpers.
- Use `apiQuery()` for list endpoints with standard pagination and filtering.
- Prefer dependency injection for service classes when business logic grows.
- Access authenticated users via `$this->request->user` (set by auth middleware).
- Use consistent error messages for security-sensitive operations (e.g., "Invalid credentials" for both missing user and wrong password).
- For routes supporting multiple auth methods, check `$this->request->user` first, then fall back to session if needed.

---

## Common Pitfalls and Solutions

### X Defining properties that shouldn't be columns

**CORE RULE**: Properties will always become database columns. Only define properties that should be actual columns in your table.

```php
<?php

// BAD - Will cause database errors (array to string conversion, JSON errors)
class User extends BaseModel
{
    public string $name = '';
    public string $email = '';
    
    // WRONG - This creates a "projects" column in the database!
    // Relationships are methods, not properties.
    public array $projects = [];
    
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }
}
```

```php
<?php

// GOOD - Only define properties for actual table columns
class User extends BaseModel
{
    // These ARE columns - correct!
    public string $name = '';
    public string $email = '';
    
    // No $projects property - relationships are methods only!
    
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }
}

class Project extends BaseModel
{
    // These ARE columns - correct!
    public string $title = '';
    public string $user_id = ''; // Foreign key IS a column
    
    // No $user property - that would create a "user" column!
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

// Usage:
$user = User::find($id);
$projects = $user->projects()->get(); // Access via method
```

### X Calling methods on potentially null model results

```php
<?php

// BAD - This will fatal error if user not found
$user = User::firstWhere('email', '=', $email);
if (!$user->checkPassword($password)) {
    // ...
}
```

```php
<?php

// GOOD - Always check instanceof first
$user = User::firstWhere('email', '=', $email);

if (!$user instanceof User) {
    return JsonResponse::error('Invalid credentials', 401);
}

if (!$user->checkPassword($password)) {
    return JsonResponse::error('Invalid credentials', 401);
}
```

### X Directly accessing session instead of using middleware-set user

```php
<?php

// BAD - Doesn't support API token auth
class MeController extends Controller
{
    public function get(): JsonResponse
    {
        $userId = $_SESSION['user_id'] ?? null;
        $user = App::userProvider()->byId($userId);
        // ...
    }
}
```

```php
<?php

// GOOD - Uses middleware-set user (supports both session and API token)
class MeController extends Controller
{
    public function get(): JsonResponse
    {
        $user = $this->request->user;
        
        if (!$user) {
            return JsonResponse::unauthorized();
        }
        
        return JsonResponse::ok(['user' => $user]);
    }
}
```

### X Forgetting to use SessionStartMiddleware for session-modifying routes

```php
<?php

// BAD - Session won't be available
$router->post('/auth/login', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    LoginController::class,
]);
```

```php
<?php

// GOOD - SessionStartMiddleware enables session access
$router->post('/auth/login', [
    SessionStartMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    LoginController::class,
]);
```

### X Not handling both auth methods in visibility checks

```php
<?php

// BAD - Only checks session, won't work with API tokens
if ($project->visibility === 'private') {
    $userId = $this->request->session['user_id'] ?? null;
    if (!$userId || $project->user_id !== $userId) {
        return JsonResponse::forbidden('This project is private');
    }
}
```

```php
<?php

// GOOD - Checks both request->user (API token) and session
if ($project->visibility === 'private') {
    $userId = $this->request->user['id'] ?? $this->request->session['user_id'] ?? null;
    if (!$userId || $project->user_id !== $userId) {
        return JsonResponse::forbidden('This project is private');
    }
}
```

### X Using custom method names instead of HTTP verbs

```php
<?php

// BAD - BaseAPI won't route to these methods
class ProjectController extends Controller
{
    public function listProjects(): JsonResponse { /* ... */ }
    public function createProject(): JsonResponse { /* ... */ }
}
```

```php
<?php

// GOOD - Use standard HTTP verb methods
class ProjectController extends Controller
{
    public function get(): JsonResponse
    {
        // Handle both list and single resource
        if (!empty($this->id)) {
            return $this->getProject();
        }
        return $this->listProjects();
    }

    public function post(): JsonResponse
    {
        // Create new resource
        // ...
    }
    
    // Private helper methods are fine
    private function listProjects(): JsonResponse { /* ... */ }
    private function getProject(): JsonResponse { /* ... */ }
}
```

### X Not validating input before processing

```php
<?php

// BAD - No validation, could fail with type errors
public function post(): JsonResponse
{
    $user = new User();
    $user->name = $this->name;
    $user->email = $this->email;
    $user->save();
    // ...
}
```

```php
<?php

// GOOD - Validate first, then process
public function post(): JsonResponse
{
    $this->validate([
        'name' => 'required|string|max:100',
        'email' => 'required|email',
        'password' => 'required|string|min:8',
    ]);

    $user = new User();
    $user->name = $this->name;
    $user->email = $this->email;
    $user->password = password_hash($this->password, PASSWORD_DEFAULT);
    $user->save();
    // ...
}
```

### ✅ Security best practices

1. **Always hash passwords**: Use `password_hash()` for storage, `password_verify()` for checking
2. **Regenerate session IDs after login**: Prevents session fixation attacks
3. **Use consistent error messages**: Don't reveal if email exists ("Invalid credentials" for both missing user and wrong password)
4. **Rate limit sensitive endpoints**: Authentication, signup, password reset
5. **Validate all input**: Never trust client data
6. **Check authorization**: Verify user owns resource before allowing modifications

```php
<?php

// Example: Secure login implementation
class LoginController extends Controller
{
    public string $email = '';
    public string $password = '';

    public function post(): JsonResponse
    {
        $this->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::firstWhere('email', '=', $this->email);

        if (!$user instanceof User) {
            return JsonResponse::error('Invalid credentials', 401);
        }

        if (!$user->checkPassword($this->password)) {
            return JsonResponse::error('Invalid credentials', 401);
        }

        $this->request->session['user_id'] = $user->id;
        
        // Regenerate session ID for security
        session_regenerate_id(true);

        return JsonResponse::ok($user->jsonSerialize());
    }
}
```
