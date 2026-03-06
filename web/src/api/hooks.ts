// Generated React hooks for BaseApi
// Do not edit manually - regenerate with: ./mason types:generate

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type DependencyList,
} from "react";
import { type HttpOptions } from "./http";
import * as Api from "./client";
import * as Types from "./types";

export interface QueryOptions<T> extends HttpOptions {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setData: (data: T) => void;
}

/**
 * Shared query hook logic. `loading` only becomes true on initial load
 * (when no data exists yet). Refetches happen silently in the background.
 */
function useQueryHook<T>(
  fetchFn: () => Promise<T>,
  enabled: boolean,
  deps: DependencyList,
  options?: QueryOptions<T>,
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasDataRef = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  const optionsRef = useRef(options);

  fetchFnRef.current = fetchFn;
  optionsRef.current = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    if (!hasDataRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchFnRef.current();
      setData(result);
      hasDataRef.current = true;
      optionsRef.current?.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      optionsRef.current?.onError?.(error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}

export interface MutationResult<T, TVariables> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: (variables: TVariables) => Promise<T>;
  reset: () => void;
}

/**
 * React hook for GET /health
 * Auto-fetches on mount and when dependencies change
 */
export function useGetHealth(
  query?: Types.GetHealthQueryParams,
  options?: QueryOptions<Types.GetHealthResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetHealthResponse> {
  return useQueryHook(
    () => Api.getHealth(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /benchmark
 * Auto-fetches on mount and when dependencies change
 */
export function useGetBenchmark(
  options?: QueryOptions<Types.GetBenchmarkResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetBenchmarkResponse> {
  return useQueryHook(
    () => Api.getBenchmark(options),
    options?.enabled ?? true,
    [...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /auth/signup
 * Returns a mutate function that must be called manually
 */
export function usePostSignup(
  options?: QueryOptions<Types.PostSignupResponse>,
): MutationResult<
  Types.PostSignupResponse,
  { body: Types.PostSignupRequestBody }
> {
  const [data, setData] = useState<Types.PostSignupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostSignupRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postSignup(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for POST /auth/login
 * Returns a mutate function that must be called manually
 */
export function usePostLogin(
  options?: QueryOptions<Types.PostLoginResponse>,
): MutationResult<
  Types.PostLoginResponse,
  { body: Types.PostLoginRequestBody }
> {
  const [data, setData] = useState<Types.PostLoginResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostLoginRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postLogin(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for POST /auth/logout
 * Returns a mutate function that must be called manually
 */
export function usePostLogout(
  options?: QueryOptions<Types.PostLogoutResponse>,
): MutationResult<Types.PostLogoutResponse, {}> {
  const [data, setData] = useState<Types.PostLogoutResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (_variables: {}) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postLogout(options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /me
 * Auto-fetches on mount and when dependencies change
 */
export function useGetMe(
  options?: QueryOptions<Types.GetMeResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetMeResponse> {
  return useQueryHook(
    () => Api.getMe(options),
    options?.enabled ?? true,
    [...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /api-tokens
 * Auto-fetches on mount and when dependencies change
 */
export function useGetApiToken(
  query?: Types.GetApiTokenQueryParams,
  options?: QueryOptions<Types.GetApiTokenResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetApiTokenResponse> {
  return useQueryHook(
    () => Api.getApiToken(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /api-tokens
 * Returns a mutate function that must be called manually
 */
export function usePostApiToken(
  options?: QueryOptions<Types.PostApiTokenResponse>,
): MutationResult<
  Types.PostApiTokenResponse,
  { body: Types.PostApiTokenRequestBody }
> {
  const [data, setData] = useState<Types.PostApiTokenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostApiTokenRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postApiToken(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /api-tokens/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteApiTokenById(
  options?: QueryOptions<Types.DeleteApiTokenByIdResponse>,
): MutationResult<
  Types.DeleteApiTokenByIdResponse,
  {
    path: Types.DeleteApiTokenByIdPathParams;
    query?: Types.DeleteApiTokenByIdQueryParams;
  }
> {
  const [data, setData] = useState<Types.DeleteApiTokenByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.DeleteApiTokenByIdPathParams;
      query?: Types.DeleteApiTokenByIdQueryParams;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteApiTokenById(
          variables.path,
          variables.query,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for POST /files/upload
 * Returns a mutate function that must be called manually
 */
export function usePostFileUpload(
  options?: QueryOptions<Types.PostFileUploadResponse>,
): MutationResult<Types.PostFileUploadResponse, {}> {
  const [data, setData] = useState<Types.PostFileUploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (_variables: {}) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postFileUpload(options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /files/info
 * Auto-fetches on mount and when dependencies change
 */
export function useGetFileUpload(
  options?: QueryOptions<Types.GetFileUploadResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetFileUploadResponse> {
  return useQueryHook(
    () => Api.getFileUpload(options),
    options?.enabled ?? true,
    [...(deps || [])],
    options,
  );
}

/**
 * React hook for DELETE /files
 * Returns a mutate function that must be called manually
 */
export function useDeleteFileUpload(
  options?: QueryOptions<Types.DeleteFileUploadResponse>,
): MutationResult<Types.DeleteFileUploadResponse, {}> {
  const [data, setData] = useState<Types.DeleteFileUploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (_variables: {}) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteFileUpload(options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /offices
 * Auto-fetches on mount and when dependencies change
 */
export function useGetOfficeList(
  options?: QueryOptions<Types.GetOfficeListResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetOfficeListResponse> {
  return useQueryHook(
    () => Api.getOfficeList(options),
    options?.enabled ?? true,
    [...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /offices/{id}
 * Auto-fetches on mount and when dependencies change
 */
export function useGetOfficeShowById(
  path: Types.GetOfficeShowByIdPathParams,
  options?: QueryOptions<Types.GetOfficeShowByIdResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetOfficeShowByIdResponse> {
  return useQueryHook(
    () => Api.getOfficeShowById(path, options),
    options?.enabled ?? true,
    [JSON.stringify(path), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /offices
 * Returns a mutate function that must be called manually
 */
export function usePostOfficeCreate(
  options?: QueryOptions<Types.PostOfficeCreateResponse>,
): MutationResult<
  Types.PostOfficeCreateResponse,
  { body: Types.PostOfficeCreateRequestBody }
> {
  const [data, setData] = useState<Types.PostOfficeCreateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostOfficeCreateRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postOfficeCreate(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /offices/{id}
 * Returns a mutate function that must be called manually
 */
export function usePatchOfficeUpdateById(
  options?: QueryOptions<Types.PatchOfficeUpdateByIdResponse>,
): MutationResult<
  Types.PatchOfficeUpdateByIdResponse,
  {
    path: Types.PatchOfficeUpdateByIdPathParams;
    body: Types.PatchOfficeUpdateByIdRequestBody;
  }
> {
  const [data, setData] = useState<Types.PatchOfficeUpdateByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.PatchOfficeUpdateByIdPathParams;
      body: Types.PatchOfficeUpdateByIdRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchOfficeUpdateById(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /offices/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteOfficeDeleteById(
  options?: QueryOptions<Types.DeleteOfficeDeleteByIdResponse>,
): MutationResult<
  Types.DeleteOfficeDeleteByIdResponse,
  { path: Types.DeleteOfficeDeleteByIdPathParams }
> {
  const [data, setData] = useState<Types.DeleteOfficeDeleteByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.DeleteOfficeDeleteByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteOfficeDeleteById(
          variables.path,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /users
 * Auto-fetches on mount and when dependencies change
 */
export function useGetUserList(
  query?: Types.UserListQueryParams,
  options?: QueryOptions<Types.GetUserListResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetUserListResponse> {
  return useQueryHook(
    () => Api.getUserList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /users/{id}
 * Auto-fetches on mount and when dependencies change
 */
export function useGetUserShowById(
  path: Types.GetUserShowByIdPathParams,
  options?: QueryOptions<Types.GetUserShowByIdResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetUserShowByIdResponse> {
  return useQueryHook(
    () => Api.getUserShowById(path, options),
    options?.enabled ?? true,
    [JSON.stringify(path), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /users
 * Returns a mutate function that must be called manually
 */
export function usePostUserCreate(
  options?: QueryOptions<Types.PostUserCreateResponse>,
): MutationResult<
  Types.PostUserCreateResponse,
  { body: Types.PostUserCreateRequestBody }
> {
  const [data, setData] = useState<Types.PostUserCreateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostUserCreateRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postUserCreate(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /users/{id}
 * Returns a mutate function that must be called manually
 */
export function usePatchUserUpdateById(
  options?: QueryOptions<Types.PatchUserUpdateByIdResponse>,
): MutationResult<
  Types.PatchUserUpdateByIdResponse,
  {
    path: Types.PatchUserUpdateByIdPathParams;
    body: Types.PatchUserUpdateByIdRequestBody;
  }
> {
  const [data, setData] = useState<Types.PatchUserUpdateByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.PatchUserUpdateByIdPathParams;
      body: Types.PatchUserUpdateByIdRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchUserUpdateById(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /users/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteUserDeleteById(
  options?: QueryOptions<Types.DeleteUserDeleteByIdResponse>,
): MutationResult<
  Types.DeleteUserDeleteByIdResponse,
  { path: Types.DeleteUserDeleteByIdPathParams }
> {
  const [data, setData] = useState<Types.DeleteUserDeleteByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.DeleteUserDeleteByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteUserDeleteById(variables.path, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /openapi.json
 * Auto-fetches on mount and when dependencies change
 */
export function useGetOpenApi(
  options?: QueryOptions<Types.GetOpenApiResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetOpenApiResponse> {
  return useQueryHook(
    () => Api.getOpenApi(options),
    options?.enabled ?? true,
    [...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /stream
 * Auto-fetches on mount and when dependencies change
 */
export function useGetStream(
  query?: Types.GetStreamQueryParams,
  options?: QueryOptions<Types.GetStreamResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetStreamResponse> {
  return useQueryHook(
    () => Api.getStream(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /estates
 * Auto-fetches on mount and when dependencies change
 */
export function useGetEstateList(
  query?: Types.EstateListQueryParams,
  options?: QueryOptions<Types.EstateListResponse>,
  deps?: DependencyList,
): QueryResult<Types.EstateListResponse> {
  return useQueryHook(
    () => Api.getEstateList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /estates/{id}
 * Auto-fetches on mount and when dependencies change
 */
export function useGetEstateShowById(
  path: Types.GetEstateShowByIdPathParams,
  options?: QueryOptions<Types.GetEstateShowByIdResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetEstateShowByIdResponse> {
  return useQueryHook(
    () => Api.getEstateShowById(path, options),
    options?.enabled ?? true,
    [JSON.stringify(path), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /estates
 * Returns a mutate function that must be called manually
 */
export function usePostEstateCreate(
  options?: QueryOptions<Types.PostEstateCreateResponse>,
): MutationResult<
  Types.PostEstateCreateResponse,
  { body: Types.PostEstateCreateRequestBody }
> {
  const [data, setData] = useState<Types.PostEstateCreateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostEstateCreateRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postEstateCreate(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for POST /estates/bulk-action
 * Returns a mutate function that must be called manually
 */
export function usePostEstateBulkAction(
  options?: QueryOptions<Types.PostEstateBulkActionResponse>,
): MutationResult<
  Types.PostEstateBulkActionResponse,
  { body: Types.PostEstateBulkActionRequestBody }
> {
  const [data, setData] = useState<Types.PostEstateBulkActionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostEstateBulkActionRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postEstateBulkAction(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /estates/{id}
 * Returns a mutate function that must be called manually
 */
export function usePatchEstateUpdateById(
  options?: QueryOptions<Types.PatchEstateUpdateByIdResponse>,
): MutationResult<
  Types.PatchEstateUpdateByIdResponse,
  {
    path: Types.PatchEstateUpdateByIdPathParams;
    body: Types.PatchEstateUpdateByIdRequestBody;
  }
> {
  const [data, setData] = useState<Types.PatchEstateUpdateByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.PatchEstateUpdateByIdPathParams;
      body: Types.PatchEstateUpdateByIdRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchEstateUpdateById(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /documents
 * Auto-fetches on mount and when dependencies change
 */
export function useGetDocumentList(
  query?: Types.DocumentListQueryParams,
  options?: QueryOptions<Types.DocumentListResponse>,
  deps?: DependencyList,
): QueryResult<Types.DocumentListResponse> {
  return useQueryHook(
    () => Api.getDocumentList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /documents/{id}
 * Auto-fetches on mount and when dependencies change
 */
export function useGetDocumentShowById(
  path: Types.DocumentByIdPathParams,
  options?: QueryOptions<Types.GetDocumentShowByIdResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetDocumentShowByIdResponse> {
  return useQueryHook(
    () => Api.getDocumentShowById(path, options),
    options?.enabled ?? true,
    [path.id, ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /documents (file upload)
 */
export function usePostDocumentCreate(
  options?: QueryOptions<Types.Document>,
): MutationResult<Types.Document, { formData: FormData }> {
  const [data, setData] = useState<Types.Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(async (variables: { formData: FormData }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await Api.postDocumentCreate(
        variables.formData,
        optionsRef.current,
      );
      setData(result);
      optionsRef.current?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      optionsRef.current?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /documents/{id}
 */
export function usePatchDocumentUpdateById(
  options?: QueryOptions<Types.PatchDocumentUpdateByIdResponse>,
): MutationResult<
  Types.PatchDocumentUpdateByIdResponse,
  {
    path: Types.DocumentByIdPathParams;
    body: Types.PatchDocumentUpdateByIdRequestBody;
  }
> {
  const [data, setData] =
    useState<Types.PatchDocumentUpdateByIdResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: {
      path: Types.DocumentByIdPathParams;
      body: Types.PatchDocumentUpdateByIdRequestBody;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await Api.patchDocumentUpdateById(
          variables.path,
          variables.body,
          optionsRef.current,
        );
        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        optionsRef.current?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /documents/{id}
 */
export function useDeleteDocumentById(
  options?: QueryOptions<Types.DeleteDocumentByIdResponse>,
): MutationResult<
  Types.DeleteDocumentByIdResponse,
  { path: Types.DocumentByIdPathParams }
> {
  const [data, setData] = useState<Types.DeleteDocumentByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: { path: Types.DocumentByIdPathParams }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await Api.deleteDocumentById(
          variables.path,
          optionsRef.current,
        );
        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        optionsRef.current?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /activities
 * Auto-fetches on mount and when dependencies change
 */
export function useGetActivityList(
  query?: Types.ActivityListQueryParams,
  options?: QueryOptions<Types.ActivityListResponse>,
  deps?: DependencyList,
): QueryResult<Types.ActivityListResponse> {
  return useQueryHook(
    () => Api.getActivityList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /activities
 * Returns a mutate function that must be called manually
 */
export function usePostActivityCreate(
  options?: QueryOptions<Types.PostActivityCreateResponse>,
): MutationResult<
  Types.PostActivityCreateResponse,
  { body: Types.PostActivityCreateRequestBody }
> {
  const [data, setData] = useState<Types.PostActivityCreateResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostActivityCreateRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postActivityCreate(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /dashboard/stats
 * Auto-fetches on mount and when dependencies change
 */
export function useGetDashboardStats(
  options?: QueryOptions<Types.DashboardStatsResponse>,
  deps?: DependencyList,
): QueryResult<Types.DashboardStatsResponse> {
  return useQueryHook(
    () => Api.getDashboardStats(options),
    options?.enabled ?? true,
    [...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /tasks
 * Auto-fetches on mount and when dependencies change
 */
export function useGetTaskList(
  query?: Types.TaskListQueryParams,
  options?: QueryOptions<Types.TaskListResponse>,
  deps?: DependencyList,
): QueryResult<Types.TaskListResponse> {
  return useQueryHook(
    () => Api.getTaskList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /tasks/{id}
 * Auto-fetches on mount and when dependencies change
 */
export function useGetTaskShowById(
  path: Types.GetTaskShowByIdPathParams,
  options?: QueryOptions<Types.GetTaskShowByIdResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetTaskShowByIdResponse> {
  return useQueryHook(
    () => Api.getTaskShowById(path, options),
    options?.enabled ?? true,
    [JSON.stringify(path), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /tasks
 * Returns a mutate function that must be called manually
 */
export function usePostTaskCreate(
  options?: QueryOptions<Types.PostTaskCreateResponse>,
): MutationResult<
  Types.PostTaskCreateResponse,
  { body: Types.PostTaskCreateRequestBody }
> {
  const [data, setData] = useState<Types.PostTaskCreateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostTaskCreateRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postTaskCreate(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /tasks/{id}
 * Returns a mutate function that must be called manually
 */
export function usePatchTaskUpdateById(
  options?: QueryOptions<Types.PatchTaskUpdateByIdResponse>,
): MutationResult<
  Types.PatchTaskUpdateByIdResponse,
  {
    path: Types.PatchTaskUpdateByIdPathParams;
    body: Types.PatchTaskUpdateByIdRequestBody;
  }
> {
  const [data, setData] = useState<Types.PatchTaskUpdateByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.PatchTaskUpdateByIdPathParams;
      body: Types.PatchTaskUpdateByIdRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchTaskUpdateById(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /tasks/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteTaskById(
  options?: QueryOptions<Types.DeleteTaskByIdResponse>,
): MutationResult<
  Types.DeleteTaskByIdResponse,
  { path: Types.DeleteTaskByIdPathParams }
> {
  const [data, setData] = useState<Types.DeleteTaskByIdResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.DeleteTaskByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteTaskById(variables.path, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /contacts
 * Auto-fetches on mount and when dependencies change
 */
export function useGetContactList(
  query?: Types.ContactListQueryParams,
  options?: QueryOptions<Types.ContactListResponse>,
  deps?: DependencyList,
): QueryResult<Types.ContactListResponse> {
  return useQueryHook(
    () => Api.getContactList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /contacts/{id}
 * Auto-fetches on mount and when dependencies change
 */
export function useGetContactShowById(
  path: Types.GetContactShowByIdPathParams,
  options?: QueryOptions<Types.GetContactShowByIdResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetContactShowByIdResponse> {
  return useQueryHook(
    () => Api.getContactShowById(path, options),
    options?.enabled ?? true,
    [JSON.stringify(path), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /contacts
 * Returns a mutate function that must be called manually
 */
export function usePostContactCreate(
  options?: QueryOptions<Types.PostContactCreateResponse>,
): MutationResult<
  Types.PostContactCreateResponse,
  { body: Types.PostContactCreateRequestBody }
> {
  const [data, setData] = useState<Types.PostContactCreateResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostContactCreateRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postContactCreate(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /contacts/{id}
 * Returns a mutate function that must be called manually
 */
export function usePatchContactUpdateById(
  options?: QueryOptions<Types.PatchContactUpdateByIdResponse>,
): MutationResult<
  Types.PatchContactUpdateByIdResponse,
  {
    path: Types.PatchContactUpdateByIdPathParams;
    body: Types.PatchContactUpdateByIdRequestBody;
  }
> {
  const [data, setData] = useState<Types.PatchContactUpdateByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.PatchContactUpdateByIdPathParams;
      body: Types.PatchContactUpdateByIdRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchContactUpdateById(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /contacts/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteContactById(
  options?: QueryOptions<Types.DeleteContactByIdResponse>,
): MutationResult<
  Types.DeleteContactByIdResponse,
  { path: Types.DeleteContactByIdPathParams }
> {
  const [data, setData] = useState<Types.DeleteContactByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.DeleteContactByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteContactById(variables.path, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /appointments
 * Auto-fetches on mount and when dependencies change
 */
export function useGetAppointmentList(
  query?: Types.AppointmentListQueryParams,
  options?: QueryOptions<Types.AppointmentListResponse>,
  deps?: DependencyList,
): QueryResult<Types.AppointmentListResponse> {
  return useQueryHook(
    () => Api.getAppointmentList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /appointments/{id}
 * Auto-fetches on mount and when dependencies change
 */
export function useGetAppointmentShowById(
  path: Types.GetAppointmentShowByIdPathParams,
  options?: QueryOptions<Types.GetAppointmentShowByIdResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetAppointmentShowByIdResponse> {
  return useQueryHook(
    () => Api.getAppointmentShowById(path, options),
    options?.enabled ?? true,
    [JSON.stringify(path), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /appointments
 * Returns a mutate function that must be called manually
 */
export function usePostAppointmentCreate(
  options?: QueryOptions<Types.PostAppointmentCreateResponse>,
): MutationResult<
  Types.PostAppointmentCreateResponse,
  { body: Types.PostAppointmentCreateRequestBody }
> {
  const [data, setData] = useState<Types.PostAppointmentCreateResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostAppointmentCreateRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postAppointmentCreate(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /appointments/{id}
 * Returns a mutate function that must be called manually
 */
export function usePatchAppointmentUpdateById(
  options?: QueryOptions<Types.PatchAppointmentUpdateByIdResponse>,
): MutationResult<
  Types.PatchAppointmentUpdateByIdResponse,
  {
    path: Types.PatchAppointmentUpdateByIdPathParams;
    body: Types.PatchAppointmentUpdateByIdRequestBody;
  }
> {
  const [data, setData] =
    useState<Types.PatchAppointmentUpdateByIdResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.PatchAppointmentUpdateByIdPathParams;
      body: Types.PatchAppointmentUpdateByIdRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchAppointmentUpdateById(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /appointments/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteAppointmentById(
  options?: QueryOptions<Types.DeleteAppointmentByIdResponse>,
): MutationResult<
  Types.DeleteAppointmentByIdResponse,
  { path: Types.DeleteAppointmentByIdPathParams }
> {
  const [data, setData] = useState<Types.DeleteAppointmentByIdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.DeleteAppointmentByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteAppointmentById(variables.path, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /estates/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteEstateById(
  options?: QueryOptions<Types.DeleteEstateByIdResponse>,
): MutationResult<
  Types.DeleteEstateByIdResponse,
  { path: Types.DeleteEstateByIdPathParams }
> {
  const [data, setData] = useState<Types.DeleteEstateByIdResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.DeleteEstateByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteEstateById(variables.path, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /email-accounts
 * Auto-fetches on mount and when dependencies change
 */
export function useGetEmailAccountList(
  query?: Types.EmailAccountListQueryParams,
  options?: QueryOptions<Types.EmailAccountListResponse>,
  deps?: DependencyList,
): QueryResult<Types.EmailAccountListResponse> {
  return useQueryHook(
    () => Api.getEmailAccountList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /email-accounts
 * Returns a mutate function that must be called manually
 */
export function usePostEmailAccountCreate(
  options?: QueryOptions<Types.PostEmailAccountCreateResponse>,
): MutationResult<
  Types.PostEmailAccountCreateResponse,
  { body: Types.PostEmailAccountCreateRequestBody }
> {
  const [data, setData] = useState<Types.PostEmailAccountCreateResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostEmailAccountCreateRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postEmailAccountCreate(
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /email-accounts/{id}
 * Returns a mutate function that must be called manually
 */
export function usePatchEmailAccountUpdateById(
  options?: QueryOptions<Types.PatchEmailAccountUpdateResponse>,
): MutationResult<
  Types.PatchEmailAccountUpdateResponse,
  {
    path: Types.EmailAccountByIdPathParams;
    body: Types.PatchEmailAccountUpdateRequestBody;
  }
> {
  const [data, setData] =
    useState<Types.PatchEmailAccountUpdateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.EmailAccountByIdPathParams;
      body: Types.PatchEmailAccountUpdateRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchEmailAccountUpdateById(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /email-accounts/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteEmailAccountById(
  options?: QueryOptions<Types.DeleteEmailAccountResponse>,
): MutationResult<
  Types.DeleteEmailAccountResponse,
  { path: Types.EmailAccountByIdPathParams }
> {
  const [data, setData] = useState<Types.DeleteEmailAccountResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.EmailAccountByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteEmailAccountById(
          variables.path,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for POST /email-accounts/{id}/test
 * Returns a mutate function that must be called manually
 */
export function usePostEmailAccountTestById(
  options?: QueryOptions<Types.EmailAccountTestResponse>,
): MutationResult<
  Types.EmailAccountTestResponse,
  { path: Types.EmailAccountByIdPathParams }
> {
  const [data, setData] = useState<Types.EmailAccountTestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.EmailAccountByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postEmailAccountTestById(
          variables.path,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

// ================================
// Email Message Hooks
// ================================

/**
 * React hook for GET /emails
 * Auto-fetches on mount and when dependencies change
 */
export function useGetEmailList(
  query?: Types.EmailListQueryParams,
  options?: QueryOptions<Types.EmailListResponse>,
  deps?: DependencyList,
): QueryResult<Types.EmailListResponse> {
  return useQueryHook(
    () => Api.getEmailList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /emails/{id}
 * Auto-fetches on mount and when dependencies change
 */
export function useGetEmailShowById(
  path: Types.EmailByIdPathParams,
  options?: QueryOptions<Types.GetEmailShowByIdResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetEmailShowByIdResponse> {
  return useQueryHook(
    () => Api.getEmailShowById(path, options),
    options?.enabled ?? true,
    [JSON.stringify(path), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /emails (send)
 * Manual trigger via .mutate()
 */
export function usePostEmailSend(
  options?: QueryOptions<Types.PostEmailSendResponse>,
): MutationResult<
  Types.PostEmailSendResponse,
  { body: Types.PostEmailSendRequestBody }
> {
  const [data, setData] = useState<Types.PostEmailSendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { body: Types.PostEmailSendRequestBody }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postEmailSend(variables.body, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /emails/{id}
 * Manual trigger via .mutate()
 */
export function usePatchEmailUpdateById(
  options?: QueryOptions<Types.PatchEmailUpdateResponse>,
): MutationResult<
  Types.PatchEmailUpdateResponse,
  { path: Types.EmailByIdPathParams; body: Types.PatchEmailUpdateRequestBody }
> {
  const [data, setData] = useState<Types.PatchEmailUpdateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.EmailByIdPathParams;
      body: Types.PatchEmailUpdateRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchEmailUpdateById(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /emails/{id}
 * Manual trigger via .mutate()
 */
export function useDeleteEmailById(
  options?: QueryOptions<Types.DeleteEmailResponse>,
): MutationResult<
  Types.DeleteEmailResponse,
  { path: Types.EmailByIdPathParams }
> {
  const [data, setData] = useState<Types.DeleteEmailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.EmailByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteEmailById(variables.path, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for POST /email-accounts/{id}/sync
 * Manual trigger via .mutate()
 */
export function usePostEmailAccountSyncById(
  options?: QueryOptions<Types.EmailSyncResponse>,
): MutationResult<
  Types.EmailSyncResponse,
  { path: Types.EmailAccountByIdPathParams }
> {
  const [data, setData] = useState<Types.EmailSyncResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.EmailAccountByIdPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postEmailAccountSyncById(
          variables.path,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for POST /emails/{id}/create-task
 * Returns a mutate function that must be called manually
 */
export function usePostEmailCreateTask(
  options?: QueryOptions<Types.PostEmailCreateTaskResponse>,
): MutationResult<
  Types.PostEmailCreateTaskResponse,
  { path: Types.PostEmailCreateTaskPathParams }
> {
  const [data, setData] =
    useState<Types.PostEmailCreateTaskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.PostEmailCreateTaskPathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postEmailCreateTask(variables.path, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /contacts/{id}/matches
 * Auto-fetches on mount and when dependencies change
 */
export function useGetContactMatchesById(
  path: Types.ContactMatchByIdPathParams,
  options?: QueryOptions<Types.ContactMatchesResponse>,
  deps?: DependencyList,
): QueryResult<Types.ContactMatchesResponse> {
  return useQueryHook(
    () => Api.getContactMatchesById(path, options),
    options?.enabled ?? true,
    [path.id, ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /estates/{id}/matches
 * Auto-fetches on mount and when dependencies change
 */
export function useGetEstateMatchesById(
  path: Types.EstateMatchByIdPathParams,
  options?: QueryOptions<Types.EstateMatchesResponse>,
  deps?: DependencyList,
): QueryResult<Types.EstateMatchesResponse> {
  return useQueryHook(
    () => Api.getEstateMatchesById(path, options),
    options?.enabled ?? true,
    [path.id, ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /estates/{id}/contacts
 * Auto-fetches on mount and when dependencies change
 */
export function useGetEstateContactList(
  path: Types.EstateContactListPathParams,
  options?: QueryOptions<Types.EstateContactListResponse>,
  deps?: DependencyList,
): QueryResult<Types.EstateContactListResponse> {
  return useQueryHook(
    () => Api.getEstateContactList(path, options),
    options?.enabled ?? true,
    [path.id, ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /estates/{id}/contacts (link contact)
 * Returns a mutate function that must be called manually
 */
export function usePostEstateContactLink(
  options?: QueryOptions<Types.EstateContactItem>,
): MutationResult<
  Types.EstateContactItem,
  {
    path: Types.EstateContactListPathParams;
    body: Types.PostEstateContactLinkRequestBody;
  }
> {
  const [data, setData] = useState<Types.EstateContactItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.EstateContactListPathParams;
      body: Types.PostEstateContactLinkRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postEstateContactLink(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /estates/{id}/contacts (unlink contact)
 * Returns a mutate function that must be called manually
 */
export function useDeleteEstateContactUnlink(
  options?: QueryOptions<{ message: string }>,
): MutationResult<
  { message: string },
  {
    path: Types.EstateContactListPathParams;
    body: Types.DeleteEstateContactUnlinkRequestBody;
  }
> {
  const [data, setData] = useState<{ message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.EstateContactListPathParams;
      body: Types.DeleteEstateContactUnlinkRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteEstateContactUnlink(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React mutation hook for POST /estates/{id}/images
 * Upload an image to an estate
 */
export function usePostEstateImageUpload(
  options?: QueryOptions<Types.PostEstateImageUploadResponse>,
): MutationResult<
  Types.PostEstateImageUploadResponse,
  { estateId: string; formData: FormData }
> {
  const [data, setData] =
    useState<Types.PostEstateImageUploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { estateId: string; formData: FormData }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postEstateImageUpload(
          variables.estateId,
          variables.formData,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React mutation hook for PATCH /estates/{id}/images/{imageId}
 * Update an estate image's metadata
 */
export function usePatchEstateImageUpdate(
  options?: QueryOptions<Types.PatchEstateImageUpdateResponse>,
): MutationResult<
  Types.PatchEstateImageUpdateResponse,
  {
    path: Types.EstateImagePathParams;
    body: Types.PatchEstateImageUpdateRequestBody;
  }
> {
  const [data, setData] =
    useState<Types.PatchEstateImageUpdateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.EstateImagePathParams;
      body: Types.PatchEstateImageUpdateRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchEstateImageUpdate(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React mutation hook for DELETE /estates/{id}/images/{imageId}
 * Delete an estate image
 */
export function useDeleteEstateImage(
  options?: QueryOptions<Types.DeleteEstateImageResponse>,
): MutationResult<
  Types.DeleteEstateImageResponse,
  { path: Types.EstateImagePathParams }
> {
  const [data, setData] =
    useState<Types.DeleteEstateImageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: { path: Types.EstateImagePathParams }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteEstateImage(variables.path, options);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

// --- Email Templates ---

/**
 * React hook for GET /email-templates/placeholders
 * Auto-fetches on mount
 */
export function useGetEmailTemplatePlaceholders(
  options?: QueryOptions<Types.EmailTemplatePlaceholdersResponse>,
  deps?: DependencyList,
): QueryResult<Types.EmailTemplatePlaceholdersResponse> {
  return useQueryHook(
    () => Api.getEmailTemplatePlaceholders(options),
    options?.enabled ?? true,
    [...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /email-templates
 * Auto-fetches on mount and when dependencies change
 */
export function useGetEmailTemplateList(
  query?: Types.EmailTemplateListQueryParams,
  options?: QueryOptions<Types.EmailTemplateListResponse>,
  deps?: DependencyList,
): QueryResult<Types.EmailTemplateListResponse> {
  return useQueryHook(
    () => Api.getEmailTemplateList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for GET /email-templates/{id}
 * Auto-fetches on mount and when dependencies change
 */
export function useGetEmailTemplateShowById(
  path: Types.EmailTemplateByIdPathParams,
  options?: QueryOptions<Types.GetEmailTemplateShowByIdResponse>,
  deps?: DependencyList,
): QueryResult<Types.GetEmailTemplateShowByIdResponse> {
  return useQueryHook(
    () => Api.getEmailTemplateShowById(path, options),
    options?.enabled ?? true,
    [path.id, ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /email-templates
 */
export function usePostEmailTemplateCreate(
  options?: QueryOptions<Types.PostEmailTemplateCreateResponse>,
): MutationResult<
  Types.PostEmailTemplateCreateResponse,
  { body: Types.PostEmailTemplateCreateRequestBody }
> {
  const [data, setData] =
    useState<Types.PostEmailTemplateCreateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: { body: Types.PostEmailTemplateCreateRequestBody }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await Api.postEmailTemplateCreate(
          variables.body,
          optionsRef.current,
        );
        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        optionsRef.current?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for POST /email-templates/generate
 */
export function usePostEmailTemplateGenerate(
  options?: QueryOptions<Types.PostEmailTemplateGenerateResponse>,
): MutationResult<
  Types.PostEmailTemplateGenerateResponse,
  { body: Types.PostEmailTemplateGenerateRequestBody }
> {
  const [data, setData] =
    useState<Types.PostEmailTemplateGenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: {
      body: Types.PostEmailTemplateGenerateRequestBody;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await Api.postEmailTemplateGenerate(
          variables.body,
          optionsRef.current,
        );
        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        optionsRef.current?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /email-templates/{id}
 */
export function usePatchEmailTemplateUpdateById(
  options?: QueryOptions<Types.PatchEmailTemplateUpdateResponse>,
): MutationResult<
  Types.PatchEmailTemplateUpdateResponse,
  {
    path: Types.EmailTemplateByIdPathParams;
    body: Types.PatchEmailTemplateUpdateRequestBody;
  }
> {
  const [data, setData] =
    useState<Types.PatchEmailTemplateUpdateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: {
      path: Types.EmailTemplateByIdPathParams;
      body: Types.PatchEmailTemplateUpdateRequestBody;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await Api.patchEmailTemplateUpdateById(
          variables.path,
          variables.body,
          optionsRef.current,
        );
        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        optionsRef.current?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /email-templates/{id}
 */
export function useDeleteEmailTemplateById(
  options?: QueryOptions<Types.DeleteEmailTemplateResponse>,
): MutationResult<
  Types.DeleteEmailTemplateResponse,
  { path: Types.EmailTemplateByIdPathParams }
> {
  const [data, setData] =
    useState<Types.DeleteEmailTemplateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: { path: Types.EmailTemplateByIdPathParams }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await Api.deleteEmailTemplateById(
          variables.path,
          optionsRef.current,
        );
        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        optionsRef.current?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for POST /email-templates/{id}/preview
 */
export function usePostEmailTemplatePreviewById(
  options?: QueryOptions<Types.EmailTemplatePreviewResponse>,
): MutationResult<
  Types.EmailTemplatePreviewResponse,
  {
    path: Types.EmailTemplateByIdPathParams;
    body: Types.PostEmailTemplatePreviewRequestBody;
  }
> {
  const [data, setData] =
    useState<Types.EmailTemplatePreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: {
      path: Types.EmailTemplateByIdPathParams;
      body: Types.PostEmailTemplatePreviewRequestBody;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await Api.postEmailTemplatePreviewById(
          variables.path,
          variables.body,
          optionsRef.current,
        );
        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        optionsRef.current?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

// --- Custom Field Definition hooks ---

/**
 * React hook for GET /custom-fields
 * Auto-fetches on mount and when dependencies change
 */
export function useGetCustomFieldDefinitionList(
  query?: Types.CustomFieldDefinitionListQueryParams,
  options?: QueryOptions<Types.CustomFieldDefinitionListResponse>,
  deps?: DependencyList,
): QueryResult<Types.CustomFieldDefinitionListResponse> {
  return useQueryHook(
    () => Api.getCustomFieldDefinitionList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

/**
 * React hook for POST /custom-fields
 * Returns a mutate function that must be called manually
 */
export function usePostCustomFieldDefinitionCreate(
  options?: QueryOptions<Types.PostCustomFieldDefinitionCreateResponse>,
): MutationResult<
  Types.PostCustomFieldDefinitionCreateResponse,
  { body: Types.PostCustomFieldDefinitionCreateRequestBody }
> {
  const [data, setData] =
    useState<Types.PostCustomFieldDefinitionCreateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      body: Types.PostCustomFieldDefinitionCreateRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postCustomFieldDefinitionCreate(
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for PATCH /custom-fields/{id}
 * Returns a mutate function that must be called manually
 */
export function usePatchCustomFieldDefinitionUpdateById(
  options?: QueryOptions<Types.PatchCustomFieldDefinitionUpdateResponse>,
): MutationResult<
  Types.PatchCustomFieldDefinitionUpdateResponse,
  {
    path: Types.CustomFieldDefinitionByIdPathParams;
    body: Types.PatchCustomFieldDefinitionUpdateRequestBody;
  }
> {
  const [data, setData] =
    useState<Types.PatchCustomFieldDefinitionUpdateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.CustomFieldDefinitionByIdPathParams;
      body: Types.PatchCustomFieldDefinitionUpdateRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.patchCustomFieldDefinitionUpdateById(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /custom-fields/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteCustomFieldDefinitionById(
  options?: QueryOptions<Types.DeleteCustomFieldDefinitionResponse>,
): MutationResult<
  Types.DeleteCustomFieldDefinitionResponse,
  { path: Types.CustomFieldDefinitionByIdPathParams }
> {
  const [data, setData] =
    useState<Types.DeleteCustomFieldDefinitionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.CustomFieldDefinitionByIdPathParams;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteCustomFieldDefinitionById(
          variables.path,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for GET /audit-logs
 * Auto-fetches on mount and when dependencies change
 */
export function useGetAuditLogList(
  query?: Types.AuditLogListQueryParams,
  options?: QueryOptions<Types.AuditLogListResponse>,
  deps?: DependencyList,
): QueryResult<Types.AuditLogListResponse> {
  return useQueryHook(
    () => Api.getAuditLogList(query, options),
    options?.enabled ?? true,
    [JSON.stringify(query), ...(deps || [])],
    options,
  );
}

// --- Contact Relationships ---

/**
 * React hook for POST /contacts/{id}/relationships
 * Returns a mutate function that must be called manually
 */
export function usePostContactRelationship(
  options?: QueryOptions<Types.ContactRelationship>,
): MutationResult<
  Types.ContactRelationship,
  {
    path: Types.PostContactRelationshipPathParams;
    body: Types.PostContactRelationshipRequestBody;
  }
> {
  const [data, setData] = useState<Types.ContactRelationship | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.PostContactRelationshipPathParams;
      body: Types.PostContactRelationshipRequestBody;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.postContactRelationship(
          variables.path,
          variables.body,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * React hook for DELETE /contacts/{contactId}/relationships/{id}
 * Returns a mutate function that must be called manually
 */
export function useDeleteContactRelationship(
  options?: QueryOptions<Types.DeleteContactRelationshipResponse>,
): MutationResult<
  Types.DeleteContactRelationshipResponse,
  { path: Types.DeleteContactRelationshipPathParams }
> {
  const [data, setData] =
    useState<Types.DeleteContactRelationshipResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: {
      path: Types.DeleteContactRelationshipPathParams;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await Api.deleteContactRelationship(
          variables.path,
          options,
        );
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}
