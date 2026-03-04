# Translation Context Design

## Overview

Add i18n support to the React frontend by creating a `LanguageContext` that fetches translations from the existing `TranslationService` backend and caches them in localStorage. Mirrors the proven pattern from the lairner project.

## Backend

### TranslationController (`GET /translations?lang=en`)
- Injects `TranslationService`, calls `getAll($lang, $includeAdmin)`
- Falls back to `'en'` if language is unsupported
- Checks `$request->user['role']` for admin namespace inclusion
- Public endpoint with rate limiting, optional auth via `CombinedAuthMiddleware`

### UpdateLanguageController (`POST /me/language`)
- Validates `language` field (required, string, min:2, max:5)
- Finds authenticated user, saves `language` preference
- Auth-protected

### User Model Change
- Add `public string $language = 'en';` property (new DB column)
- Requires migration

### Routes (`routes/api.php`)
- `GET /translations` — rate limited `60/1m`, optional CombinedAuth
- `POST /me/language` — CombinedAuth required, rate limited `10/1m`

## Frontend

### LanguageContext (`web/src/contexts/LanguageContext.tsx`)
- `LanguageProvider` component wrapping the app
- `useTranslation()` hook exposing: `t`, `language`, `setLanguage`, `isLoading`, `refetchTranslations`
- `t(key, params?)` with `{param}` and `:param` replacement
- localStorage cache per language for instant switching
- Fetches `/translations?lang=X` on mount and language change
- `setLanguage()` updates localStorage, swaps cached translations, fires async `POST /me/language`

### LanguageSync (`web/src/components/LanguageSync.tsx`)
- Reads `user.language` from AuthContext after login
- Calls `setLanguage(lang, skipSync=true)` to avoid circular API call
- Pure side-effect component, renders nothing

### main.tsx Changes
- Wrap app with `LanguageProvider` inside `AuthProvider`
- Add `<LanguageSync />` inside both providers

## Data Flow

```
User selects language -> setLanguage() -> localStorage + state update -> POST /me/language (async)
App loads -> read localStorage -> show cached translations -> GET /translations?lang=X -> update cache
User logs in -> LanguageSync reads user.language -> setLanguage(lang, skipSync=true)
Component renders -> t('common.welcome', {name: 'Tim'}) -> "Welcome, Tim!"
```

## Reference

Based on lairner's `LanguageContext.tsx`, `LanguageSync.tsx`, and `TranslationController.php`.
