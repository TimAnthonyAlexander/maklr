# Translation Context Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add i18n support with a React LanguageContext that fetches translations from the existing TranslationService backend and caches them in localStorage.

**Architecture:** Backend serves all translations as a flat dict via `GET /translations?lang=X`. Frontend `LanguageProvider` wraps the app, provides `t()` function and language state. User language preference persisted to DB via `POST /me/language` and synced on login via `LanguageSync` component.

**Tech Stack:** PHP 8.4 BaseAPI, React 19, TypeScript, MUI v7

---

### Task 1: Add `language` property to User model

**Files:**
- Modify: `app/Models/User.php:9-26`

**Step 1: Add the property**

Add `public string $language = 'en';` after the `avatar_url` property (line 25):

```php
public ?string $avatar_url = null;

public string $language = 'en';
```

**Step 2: Generate and apply migration**

Run: `./mason migrate:generate && ./mason migrate:apply -y`
Expected: Migration adds `language VARCHAR(255) NOT NULL DEFAULT 'en'` column to `user` table.

**Step 3: Verify with tests**

Run: `composer phpunit`
Expected: All existing tests still pass.

**Step 4: Commit**

```bash
git add app/Models/User.php storage/migrations.json
git commit -m "feat: add language property to User model"
```

---

### Task 2: Create TranslationController

**Files:**
- Create: `app/Controllers/TranslationController.php`
- Test: `tests/Feature/TranslationControllerTest.php`

**Step 1: Write the failing test**

Create `tests/Feature/TranslationControllerTest.php`:

```php
<?php

namespace Tests\Feature;

use Tests\FeatureTestCase;

class TranslationControllerTest extends FeatureTestCase
{
    public function test_get_translations_returns_english_by_default(): void
    {
        $response = $this->get('/translations');

        $this->assertSame(200, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('data', $body);
        $this->assertArrayHasKey('translations', $body['data']);
        $this->assertIsArray($body['data']['translations']);
    }

    public function test_get_translations_with_lang_parameter(): void
    {
        $response = $this->get('/translations?lang=en');

        $this->assertSame(200, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('common.welcome', $body['data']['translations']);
    }

    public function test_get_translations_falls_back_to_english_for_unsupported_lang(): void
    {
        $response = $this->get('/translations?lang=xx');

        $this->assertSame(200, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        // Should fall back to English translations
        $this->assertArrayHasKey('common.welcome', $body['data']['translations']);
    }
}
```

**Step 2: Run test to verify it fails**

Run: `composer phpunit -- tests/Feature/TranslationControllerTest.php`
Expected: FAIL — route `/translations` not defined.

**Step 3: Create the controller**

Create `app/Controllers/TranslationController.php`:

```php
<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\TranslationService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Http\Attributes\ResponseType;
use BaseApi\Http\Attributes\Tag;

#[Tag('i18n')]
final class TranslationController extends Controller
{
    public string $lang = '';

    public function __construct(
        private readonly TranslationService $translationService
    ) {}

    #[ResponseType(['translations' => 'array'])]
    public function get(): Response
    {
        $language = $this->lang === '' ? 'en' : $this->lang;

        if (!$this->translationService->isSupported($language)) {
            $language = 'en';
        }

        $user = $this->request->user ?? null;
        $includeAdmin = $user !== null && isset($user['role']) && $user['role'] === 'admin';

        $translations = $this->translationService->getAll($language, $includeAdmin);

        return JsonResponse::ok([
            'translations' => $translations,
        ]);
    }
}
```

**Step 4: Register the route**

Add to `routes/api.php` after the health check block (around line 43), inside the "Public Endpoints" section:

```php
use App\Controllers\TranslationController;
```

(Add to imports at top of file)

```php
// Translations (public, optional auth for admin namespace)
$router->get('/translations', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    TranslationController::class,
]);
```

**Step 5: Run test to verify it passes**

Run: `composer phpunit -- tests/Feature/TranslationControllerTest.php`
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add app/Controllers/TranslationController.php tests/Feature/TranslationControllerTest.php routes/api.php
git commit -m "feat: add TranslationController with GET /translations endpoint"
```

---

### Task 3: Create UpdateLanguageController

**Files:**
- Create: `app/Controllers/UpdateLanguageController.php`
- Test: `tests/Feature/UpdateLanguageControllerTest.php`

**Step 1: Write the failing test**

Create `tests/Feature/UpdateLanguageControllerTest.php`:

```php
<?php

namespace Tests\Feature;

use Tests\FeatureTestCase;
use App\Models\User;

class UpdateLanguageControllerTest extends FeatureTestCase
{
    public function test_update_language_requires_auth(): void
    {
        $response = $this->post('/me/language', ['language' => 'de']);

        $this->assertSame(401, $response->getStatusCode());
    }

    public function test_update_language_validates_input(): void
    {
        $this->actingAs($this->createTestUser());

        $response = $this->post('/me/language', []);

        $this->assertSame(422, $response->getStatusCode());
    }

    public function test_update_language_saves_preference(): void
    {
        $user = $this->createTestUser();
        $this->actingAs($user);

        $response = $this->post('/me/language', ['language' => 'de']);

        $this->assertSame(200, $response->getStatusCode());

        $updated = User::find($user->id);
        $this->assertSame('de', $updated->language);
    }
}
```

**Step 2: Run test to verify it fails**

Run: `composer phpunit -- tests/Feature/UpdateLanguageControllerTest.php`
Expected: FAIL — route `/me/language` not defined.

**Step 3: Create the controller**

Create `app/Controllers/UpdateLanguageController.php`:

```php
<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Attributes\ResponseType;
use BaseApi\Http\Attributes\Tag;

#[Tag('User')]
final class UpdateLanguageController extends Controller
{
    public string $language = '';

    #[ResponseType(['success' => 'bool'])]
    public function post(): JsonResponse
    {
        $this->validate([
            'language' => 'required|string|min:2|max:5',
        ]);

        $userData = $this->request->user ?? null;
        if (!$userData || empty($userData['id'])) {
            return JsonResponse::error('Unauthorized', 401);
        }

        $user = User::find($userData['id']);
        if (!$user instanceof User) {
            return JsonResponse::notFound('User not found');
        }

        $user->language = $this->language;
        $user->save();

        return JsonResponse::ok(['success' => true]);
    }
}
```

**Step 4: Register the route**

Add to `routes/api.php` imports:

```php
use App\Controllers\UpdateLanguageController;
```

Add after the `GET /me` route (around line 78):

```php
// Update user language preference
$router->post('/me/language', [
    CombinedAuthMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    UpdateLanguageController::class,
]);
```

**Step 5: Run test to verify it passes**

Run: `composer phpunit -- tests/Feature/UpdateLanguageControllerTest.php`
Expected: PASS (3 tests)

**Step 6: Run all tests**

Run: `composer phpunit`
Expected: All tests pass.

**Step 7: Commit**

```bash
git add app/Controllers/UpdateLanguageController.php tests/Feature/UpdateLanguageControllerTest.php routes/api.php
git commit -m "feat: add UpdateLanguageController with POST /me/language endpoint"
```

---

### Task 4: Create LanguageContext

**Files:**
- Create: `web/src/contexts/LanguageContext.tsx`

**Step 1: Create the context file**

Create `web/src/contexts/LanguageContext.tsx`:

```tsx
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'

import { http } from '../api/http'

interface LanguageContextType {
    language: string
    translations: Record<string, string>
    isLoading: boolean
    setLanguage: (lang: string, skipSync?: boolean) => void
    t: (key: string, params?: Record<string, string>) => string
    refetchTranslations: () => Promise<void>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_KEY = 'maklr_language'
const TRANSLATIONS_CACHE_KEY = 'maklr_translations_cache'
const DEFAULT_LANGUAGE = 'en'

function getStoredLanguage(): string {
    return localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE
}

function getCachedTranslations(lang: string): Record<string, string> {
    const cachedData = localStorage.getItem(TRANSLATIONS_CACHE_KEY)
    if (!cachedData) return {}
    try {
        const parsed = JSON.parse(cachedData)
        return parsed[lang] || {}
    } catch {
        return {}
    }
}

function setCachedTranslations(lang: string, translations: Record<string, string>): void {
    const cachedData = localStorage.getItem(TRANSLATIONS_CACHE_KEY)
    let cache: Record<string, Record<string, string>> = {}
    if (cachedData) {
        try {
            cache = JSON.parse(cachedData)
        } catch {
            cache = {}
        }
    }
    cache[lang] = translations
    localStorage.setItem(TRANSLATIONS_CACHE_KEY, JSON.stringify(cache))
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<string>(getStoredLanguage)
    const [translations, setTranslations] = useState<Record<string, string>>(() =>
        getCachedTranslations(getStoredLanguage())
    )
    const [isLoading, setIsLoading] = useState(false)

    const fetchTranslations = useCallback(async (lang: string) => {
        try {
            const response = await http.get<{ data: { translations: Record<string, string> } }>(
                `/translations?lang=${lang}`
            )
            const fresh = response.data.translations || {}
            setTranslations(fresh)
            setCachedTranslations(lang, fresh)
        } catch (error) {
            console.error('Failed to fetch translations:', error)
        }
    }, [])

    const refetchTranslations = useCallback(async () => {
        setIsLoading(true)
        await fetchTranslations(language)
        setIsLoading(false)
    }, [language, fetchTranslations])

    useEffect(() => {
        const initFetch = async () => {
            if (Object.keys(translations).length === 0) {
                setIsLoading(true)
            }
            await fetchTranslations(language)
            setIsLoading(false)
        }
        initFetch()
    }, [language, fetchTranslations])

    const setLanguage = useCallback((lang: string, skipSync = false) => {
        // Load cached translations immediately for instant switch
        const cached = getCachedTranslations(lang)
        if (Object.keys(cached).length > 0) {
            setTranslations(cached)
        }

        setLanguageState(lang)
        localStorage.setItem(LANGUAGE_KEY, lang)

        if (!skipSync) {
            http.post('/me/language', { language: lang }).catch((error: unknown) => {
                console.error('Failed to update language preference:', error)
            })
        }
    }, [])

    const t = useCallback((key: string, params?: Record<string, string>): string => {
        let text = translations[key] || key

        if (params) {
            for (const [paramKey, value] of Object.entries(params)) {
                text = text.replaceAll(`{${paramKey}}`, value)
                text = text.replaceAll(`:${paramKey}`, value)
            }
        }

        return text
    }, [translations])

    const value: LanguageContextType = {
        language,
        translations,
        isLoading,
        setLanguage,
        t,
        refetchTranslations,
    }

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation(): LanguageContextType {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider')
    }
    return context
}
```

**Step 2: Verify lint passes**

Run: `cd web && bun run lint`
Expected: No errors.

**Step 3: Commit**

```bash
git add web/src/contexts/LanguageContext.tsx
git commit -m "feat: add LanguageContext with useTranslation hook"
```

---

### Task 5: Create LanguageSync component

**Files:**
- Create: `web/src/components/LanguageSync.tsx`

**Step 1: Create the component**

Create `web/src/components/LanguageSync.tsx`:

```tsx
import { useEffect, useRef } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/LanguageContext'

export default function LanguageSync() {
    const { user } = useAuth()
    const { setLanguage } = useTranslation()
    const syncedUserIdRef = useRef<string | null>(null)

    useEffect(() => {
        if (user && user.id) {
            if (syncedUserIdRef.current !== user.id) {
                syncedUserIdRef.current = user.id
                const userLang = (user as unknown as { language?: string }).language
                if (userLang) {
                    setLanguage(userLang, true)
                }
            }
        } else {
            syncedUserIdRef.current = null
        }
    }, [user, setLanguage])

    return null
}
```

**Step 2: Add `language` to AuthUser interface**

Modify `web/src/contexts/AuthContext.tsx:5-13` — add `language` to the `AuthUser` interface:

```typescript
export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  language: string
  office_id: string | null
  phone: string | null
  avatar_url: string | null
}
```

With `language` on `AuthUser`, simplify `LanguageSync.tsx` to use `user.language` directly instead of the cast:

```tsx
import { useEffect, useRef } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/LanguageContext'

export default function LanguageSync() {
    const { user } = useAuth()
    const { setLanguage } = useTranslation()
    const syncedUserIdRef = useRef<string | null>(null)

    useEffect(() => {
        if (user && user.id) {
            if (syncedUserIdRef.current !== user.id) {
                syncedUserIdRef.current = user.id
                if (user.language) {
                    setLanguage(user.language, true)
                }
            }
        } else {
            syncedUserIdRef.current = null
        }
    }, [user, setLanguage])

    return null
}
```

**Step 3: Verify lint passes**

Run: `cd web && bun run lint`
Expected: No errors.

**Step 4: Commit**

```bash
git add web/src/components/LanguageSync.tsx web/src/contexts/AuthContext.tsx
git commit -m "feat: add LanguageSync component and language field to AuthUser"
```

---

### Task 6: Wire up providers in main.tsx

**Files:**
- Modify: `web/src/main.tsx`

**Step 1: Update main.tsx**

Replace the contents of `web/src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import LanguageSync from './components/LanguageSync'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <LanguageProvider>
            <LanguageSync />
            <App />
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 2: Verify build passes**

Run: `cd web && bun run build`
Expected: Build succeeds with no errors.

**Step 3: Verify lint passes**

Run: `cd web && bun run lint`
Expected: No errors.

**Step 4: Commit**

```bash
git add web/src/main.tsx
git commit -m "feat: wire LanguageProvider and LanguageSync into app root"
```

---

### Task 7: Manual smoke test

**Step 1: Start backend**

Run: `./mason serve`

**Step 2: Start frontend**

Run: `cd web && bun run dev`

**Step 3: Verify translation endpoint**

Run: `curl -s http://127.0.0.1:7273/translations?lang=en | jq .`
Expected: `{"data": {"translations": {"common.welcome": "Welcome to our application!"}}}`

**Step 4: Verify frontend loads without errors**

Open `http://localhost:5173` in browser. Check browser console — no errors related to translations.

**Step 5: Run all tests**

Run: `composer phpunit`
Expected: All tests pass.

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete translation context implementation"
```
