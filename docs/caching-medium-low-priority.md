# CacheHelper Integration — Medium & Low Priority

This document describes where `App\Services\CacheHelper` should be integrated beyond the high-priority targets (DashboardStats, OpenApi, EmailList accessible accounts) which are already implemented.

## Prerequisites

- Read `app/Services/CacheHelper.php` to understand the API: `key()`, `remember()`, `forget()`, `ttlWithJitter()`, `getMany()`, `putMany()`
- Read `CLAUDE.md` for BaseAPI patterns, controller conventions, and office scoping rules

---

## Medium Priority

### 1. TranslationController — Cache translations per locale

**File:** `app/Controllers/TranslationController.php`
**Service:** `app/Services/TranslationService.php`

**Problem:** Every request creates a new `TranslationService` and reads JSON files from disk. The in-memory cache is request-scoped and discarded after each response.

**Solution:** Cache the final translations array (after `__meta` filtering) per locale using `CacheHelper::remember()`. Translations only change on deployment.

```php
// In TranslationController::get()
$lang = /* however the locale is resolved */;
return JsonResponse::ok(
    CacheHelper::remember('translations', $lang, 86400, function () use ($translationService, $lang) {
        $all = $translationService->getAll($lang);
        // filter out __meta keys
        return array_filter($all, fn($k) => $k !== '__meta', ARRAY_FILTER_USE_KEY);
    }, useJitter: false)
);
```

**TTL:** 86400s (24h). Jitter off — translations are global, not per-tenant.
**Invalidation:** None needed at runtime. Cache expires naturally. If hot-reloading translations during development, either lower the TTL or skip caching when `APP_ENV=local`.

---

### 2. TaskShowController — Cache task detail with relations

**File:** `app/Controllers/Task/TaskShowController.php`

**Problem:** 5 queries per request (task + taskUsers + comments + estate + contact). The heaviest show endpoint.

**Solution:** Cache the full `toArray(true)` result keyed by task ID + office ID.

```php
// In TaskShowController::get()
$data = CacheHelper::remember('task', $this->id, 300, function () use ($officeId) {
    $task = Task::with(['taskUsers', 'comments', 'estate', 'contact'])
        ->where('id', '=', $this->id)
        ->where('office_id', '=', $officeId)
        ->first();

    if (!$task instanceof Task) {
        return null;
    }

    return $task->toArray(true);
});

if ($data === null) {
    return JsonResponse::notFound('Task not found');
}

return JsonResponse::ok($data);
```

**TTL:** 300s (5 min) with jitter (default).
**Invalidation:** Add `CacheHelper::forget('task', $taskId)` in:
- `TaskUpdateController::patch()`
- `TaskDeleteController::delete()`
- `TaskAssigneeController::post()` and `delete()` (assignee changes)
- `TaskCommentController::post()` (new comment)
- `TaskCommentDeleteController::delete()`

---

### 3. AppointmentShowController — Cache appointment detail

**File:** `app/Controllers/Appointment/AppointmentShowController.php`

**Problem:** 4 queries per request (appointment + appointmentUsers + appointmentContacts + estate).

**Solution:** Same pattern as TaskShowController.

```php
CacheHelper::remember('appointment', $this->id, 300, function () use ($officeId) {
    // ... fetch with eager loading, return toArray(true) or null
});
```

**TTL:** 300s with jitter.
**Invalidation:** Add `CacheHelper::forget('appointment', $appointmentId)` in:
- `AppointmentUpdateController::patch()`
- `AppointmentDeleteController::delete()`

---

### 4. DocumentShowController — Cache document detail

**File:** `app/Controllers/Document/DocumentShowController.php`

**Problem:** 4 queries per request (document + uploadedByUser + estate + contact).

**Solution:** Same pattern.

```php
CacheHelper::remember('document', $this->id, 300, function () use ($officeId) {
    // ... fetch with eager loading, return toArray(true) or null
});
```

**TTL:** 300s with jitter.
**Invalidation:** Add `CacheHelper::forget('document', $documentId)` in:
- `DocumentUpdateController::patch()`
- `DocumentDeleteController::delete()`

---

### 5. ContactShowController — Cache contact detail

**File:** `app/Controllers/Contact/ContactShowController.php`

**Problem:** 3 queries per request (contact + relationships + activities). Activities relation can return many rows on active contacts.

**Solution:** Same pattern, but be aware that activities are append-only and change frequently. Use a shorter TTL.

```php
CacheHelper::remember('contact', $this->id, 120, function () use ($officeId) {
    // ... fetch with eager loading, return toArray(true) or null
});
```

**TTL:** 120s (2 min) with jitter — shorter because activities change often.
**Invalidation:** Add `CacheHelper::forget('contact', $contactId)` in:
- `ContactUpdateController::patch()`
- `ContactDeleteController::delete()`
- `ActivityCreateController::post()` — when `entity_type === 'contact'`, forget that contact's cache

---

## Low Priority — Skip or Defer

### Simple list endpoints (EstateList, ContactList, TaskList, AppointmentList)

**Why skip:** Paginated endpoints with many filter combinations produce a combinatorial explosion of cache keys. The cache hit rate would be low and invalidation complex. Better to optimize queries directly (indexes, full-text search) if performance becomes an issue.

### MeController, HealthController

**Why skip:** Zero or near-zero DB cost. Caching adds complexity with no measurable benefit.

### DocumentDownloadController

**Why skip:** Streams raw file bytes. The bottleneck is file I/O / storage, not DB queries. HTTP-level caching (ETag, Cache-Control headers) is more appropriate than application-level caching.

### EstateShowController

**Why skip for now:** Only 2 queries (estate + images). Light enough that caching overhead isn't justified unless profiling shows otherwise.

---

## Implementation Checklist

For each medium-priority target:
- [ ] Add `use App\Services\CacheHelper;` to the show controller
- [ ] Wrap the query + toArray in `CacheHelper::remember()`
- [ ] Handle the `null` return (not found) case outside the callback
- [ ] Add `CacheHelper::forget()` calls in all related mutation controllers
- [ ] Verify office scoping is still enforced (the cache key does NOT replace the office_id WHERE clause — the callback must still scope queries)
- [ ] Test that updates/deletes properly invalidate the cache

## Important Notes

- **Office scoping inside callbacks is mandatory.** The cache key uses the resource ID, but the callback must still filter by `office_id` to prevent cross-tenant data leakage on cache miss.
- **Never cache the `null` not-found case.** Return `null` from the callback and check outside, otherwise a deleted resource stays "not found" in cache.
- **Jitter is on by default.** This is intentional — it prevents thundering herd when many resources expire together. Only disable for global (non-tenant) data like translations.
