// Generated API client functions for BaseApi
// Do not edit manually - regenerate with: ./mason types:generate

import { http, type HttpOptions } from "./http";
import { buildPath } from "./routes";
import * as Types from "./types";

/**
 * GET /health
 * @tags API
 */
export async function getHealth(
  query?: Types.GetHealthQueryParams,
  options?: HttpOptions,
): Promise<Types.GetHealthResponse> {
  const url = "/health";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /benchmark
 * @tags API
 */
export async function getBenchmark(
  options?: HttpOptions,
): Promise<Types.GetBenchmarkResponse> {
  const url = "/benchmark";

  return http.get(url, options);
}

/**
 * POST /auth/signup
 * @tags Authentication
 */
export async function postSignup(
  body: Types.PostSignupRequestBody,
  options?: HttpOptions,
): Promise<Types.PostSignupResponse> {
  const url = "/auth/signup";

  return http.post(url, body, options);
}

/**
 * POST /auth/login
 * @tags Authentication
 */
export async function postLogin(
  body: Types.PostLoginRequestBody,
  options?: HttpOptions,
): Promise<Types.PostLoginResponse> {
  const url = "/auth/login";

  return http.post(url, body, options);
}

/**
 * POST /auth/logout
 * @tags Authentication
 */
export async function postLogout(
  options?: HttpOptions,
): Promise<Types.PostLogoutResponse> {
  const url = "/auth/logout";

  return http.post(url, options);
}

/**
 * GET /me
 * @tags Authentication
 */
export async function getMe(
  options?: HttpOptions,
): Promise<Types.GetMeResponse> {
  const url = "/me";

  return http.get(url, options);
}

/**
 * GET /api-tokens
 * @tags Authentication
 */
export async function getApiToken(
  query?: Types.GetApiTokenQueryParams,
  options?: HttpOptions,
): Promise<Types.GetApiTokenResponse> {
  const url = "/api-tokens";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * POST /api-tokens
 * @tags Authentication
 */
export async function postApiToken(
  body: Types.PostApiTokenRequestBody,
  options?: HttpOptions,
): Promise<Types.PostApiTokenResponse> {
  const url = "/api-tokens";

  return http.post(url, body, options);
}

/**
 * DELETE /api-tokens/{id}
 * @tags Authentication
 */
export async function deleteApiTokenById(
  path: Types.DeleteApiTokenByIdPathParams,
  query?: Types.DeleteApiTokenByIdQueryParams,
  options?: HttpOptions,
): Promise<Types.DeleteApiTokenByIdResponse> {
  const url = buildPath("DeleteApiTokenById", path);
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.delete(fullUrl, options);
}

/**
 * POST /files/upload
 * @tags Files
 */
export async function postFileUpload(
  options?: HttpOptions,
): Promise<Types.PostFileUploadResponse> {
  const url = "/files/upload";

  return http.post(url, options);
}

/**
 * GET /files/info
 * @tags Files
 */
export async function getFileUpload(
  options?: HttpOptions,
): Promise<Types.GetFileUploadResponse> {
  const url = "/files/info";

  return http.get(url, options);
}

/**
 * DELETE /files
 * @tags Files
 */
export async function deleteFileUpload(
  options?: HttpOptions,
): Promise<Types.DeleteFileUploadResponse> {
  const url = "/files";

  return http.delete(url, options);
}

/**
 * GET /offices
 * @tags API
 */
export async function getOfficeList(
  options?: HttpOptions,
): Promise<Types.GetOfficeListResponse> {
  const url = "/offices";

  return http.get(url, options);
}

/**
 * GET /offices/{id}
 * @tags API
 */
export async function getOfficeShowById(
  path: Types.GetOfficeShowByIdPathParams,
  options?: HttpOptions,
): Promise<Types.GetOfficeShowByIdResponse> {
  const url = buildPath("GetOfficeShowById", path);

  return http.get(url, options);
}

/**
 * POST /offices
 * @tags API
 */
export async function postOfficeCreate(
  body: Types.PostOfficeCreateRequestBody,
  options?: HttpOptions,
): Promise<Types.PostOfficeCreateResponse> {
  const url = "/offices";

  return http.post(url, body, options);
}

/**
 * PATCH /offices/{id}
 * @tags API
 */
export async function patchOfficeUpdateById(
  path: Types.PatchOfficeUpdateByIdPathParams,
  body: Types.PatchOfficeUpdateByIdRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchOfficeUpdateByIdResponse> {
  const url = buildPath("PatchOfficeUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /offices/{id}
 * @tags API
 */
export async function deleteOfficeDeleteById(
  path: Types.DeleteOfficeDeleteByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteOfficeDeleteByIdResponse> {
  const url = buildPath("DeleteOfficeDeleteById", path);

  return http.delete(url, options);
}

/**
 * GET /users
 * @tags API
 */
export async function getUserList(
  query?: Types.UserListQueryParams,
  options?: HttpOptions,
): Promise<Types.GetUserListResponse> {
  const url = "/users";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /users/{id}
 * @tags API
 */
export async function getUserShowById(
  path: Types.GetUserShowByIdPathParams,
  options?: HttpOptions,
): Promise<Types.GetUserShowByIdResponse> {
  const url = buildPath("GetUserShowById", path);

  return http.get(url, options);
}

/**
 * POST /users
 * @tags API
 */
export async function postUserCreate(
  body: Types.PostUserCreateRequestBody,
  options?: HttpOptions,
): Promise<Types.PostUserCreateResponse> {
  const url = "/users";

  return http.post(url, body, options);
}

/**
 * PATCH /users/{id}
 * @tags API
 */
export async function patchUserUpdateById(
  path: Types.PatchUserUpdateByIdPathParams,
  body: Types.PatchUserUpdateByIdRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchUserUpdateByIdResponse> {
  const url = buildPath("PatchUserUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /users/{id}
 * @tags API
 */
export async function deleteUserDeleteById(
  path: Types.DeleteUserDeleteByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteUserDeleteByIdResponse> {
  const url = buildPath("DeleteUserDeleteById", path);

  return http.delete(url, options);
}

/**
 * POST /onboarding/workspace
 * @tags Onboarding
 */
export async function postOnboardingWorkspace(
  body: {
    office_name: string;
    address?: string | null;
    city?: string | null;
    zip?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
  },
  options?: HttpOptions,
): Promise<{ office: Record<string, unknown>; user: Record<string, unknown> }> {
  const url = "/onboarding/workspace";

  return http.post(url, body, options);
}

/**
 * POST /offices/{office_id}/invitations
 * @tags Invitations
 */
export async function postInvitation(
  officeId: string,
  body: { email: string; role?: string },
  options?: HttpOptions,
): Promise<
  Types.Envelope<{
    id: string;
    email: string;
    role: string;
    office_id: string;
    expires_at: string;
    invite_url: string;
    created_at: string;
  }>
> {
  const url = `/offices/${encodeURIComponent(officeId)}/invitations`;

  return http.post(url, body, options);
}

/**
 * GET /invitations/{token}
 * @tags Invitations
 */
export async function getInvitationByToken(
  token: string,
  options?: HttpOptions,
): Promise<
  Types.Envelope<{
    email: string;
    role: string;
    office_name: string;
  }>
> {
  const url = `/invitations/${encodeURIComponent(token)}`;

  return http.get(url, options);
}

/**
 * POST /invitations/{token}/accept
 * @tags Invitations
 */
export async function postAcceptInvitation(
  token: string,
  body: { name: string; email: string; password: string },
  options?: HttpOptions,
): Promise<Types.Envelope<Types.User>> {
  const url = `/invitations/${encodeURIComponent(token)}/accept`;

  return http.post(url, body, options);
}

/**
 * GET /openapi.json
 * @tags API
 */
export async function getOpenApi(
  options?: HttpOptions,
): Promise<Types.GetOpenApiResponse> {
  const url = "/openapi.json";

  return http.get(url, options);
}

/**
 * GET /stream
 * @tags API
 */
export async function getStream(
  query?: Types.GetStreamQueryParams,
  options?: HttpOptions,
): Promise<Types.GetStreamResponse> {
  const url = "/stream";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /estates
 * @tags Estates
 */
export async function getEstateList(
  query?: Types.EstateListQueryParams,
  options?: HttpOptions,
): Promise<Types.EstateListResponse> {
  const url = "/estates";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /estates/{id}
 * @tags Estates
 */
export async function getEstateShowById(
  path: Types.GetEstateShowByIdPathParams,
  options?: HttpOptions,
): Promise<Types.GetEstateShowByIdResponse> {
  const url = buildPath("GetEstateShowById", path);

  return http.get(url, options);
}

/**
 * POST /estates
 * @tags Estates
 */
export async function postEstateCreate(
  body: Types.PostEstateCreateRequestBody,
  options?: HttpOptions,
): Promise<Types.PostEstateCreateResponse> {
  const url = "/estates";

  return http.post(url, body, options);
}

/**
 * PATCH /estates/{id}
 * @tags Estates
 */
export async function patchEstateUpdateById(
  path: Types.PatchEstateUpdateByIdPathParams,
  body: Types.PatchEstateUpdateByIdRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchEstateUpdateByIdResponse> {
  const url = buildPath("PatchEstateUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /estates/{id}
 * @tags Estates
 */
export async function deleteEstateById(
  path: Types.DeleteEstateByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteEstateByIdResponse> {
  const url = buildPath("DeleteEstateById", path);

  return http.delete(url, options);
}

/**
 * GET /tasks
 * @tags Tasks
 */
export async function getTaskList(
  query?: Types.TaskListQueryParams,
  options?: HttpOptions,
): Promise<Types.TaskListResponse> {
  const url = "/tasks";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /tasks/{id}
 * @tags Tasks
 */
export async function getTaskShowById(
  path: Types.GetTaskShowByIdPathParams,
  options?: HttpOptions,
): Promise<Types.GetTaskShowByIdResponse> {
  const url = buildPath("GetTaskShowById", path);

  return http.get(url, options);
}

/**
 * POST /tasks
 * @tags Tasks
 */
export async function postTaskCreate(
  body: Types.PostTaskCreateRequestBody,
  options?: HttpOptions,
): Promise<Types.PostTaskCreateResponse> {
  const url = "/tasks";

  return http.post(url, body, options);
}

/**
 * PATCH /tasks/{id}
 * @tags Tasks
 */
export async function patchTaskUpdateById(
  path: Types.PatchTaskUpdateByIdPathParams,
  body: Types.PatchTaskUpdateByIdRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchTaskUpdateByIdResponse> {
  const url = buildPath("PatchTaskUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /tasks/{id}
 * @tags Tasks
 */
export async function deleteTaskById(
  path: Types.DeleteTaskByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteTaskByIdResponse> {
  const url = buildPath("DeleteTaskById", path);

  return http.delete(url, options);
}

/**
 * GET /contacts
 * @tags Contacts
 */
export async function getContactList(
  query?: Types.ContactListQueryParams,
  options?: HttpOptions,
): Promise<Types.ContactListResponse> {
  const url = "/contacts";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /contacts/{id}
 * @tags Contacts
 */
export async function getContactShowById(
  path: Types.GetContactShowByIdPathParams,
  options?: HttpOptions,
): Promise<Types.GetContactShowByIdResponse> {
  const url = buildPath("GetContactShowById", path);

  return http.get(url, options);
}

/**
 * POST /contacts
 * @tags Contacts
 */
export async function postContactCreate(
  body: Types.PostContactCreateRequestBody,
  options?: HttpOptions,
): Promise<Types.PostContactCreateResponse> {
  const url = "/contacts";

  return http.post(url, body, options);
}

/**
 * PATCH /contacts/{id}
 * @tags Contacts
 */
export async function patchContactUpdateById(
  path: Types.PatchContactUpdateByIdPathParams,
  body: Types.PatchContactUpdateByIdRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchContactUpdateByIdResponse> {
  const url = buildPath("PatchContactUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /contacts/{id}
 * @tags Contacts
 */
export async function deleteContactById(
  path: Types.DeleteContactByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteContactByIdResponse> {
  const url = buildPath("DeleteContactById", path);

  return http.delete(url, options);
}

/**
 * GET /appointments
 * @tags Appointments
 */
export async function getAppointmentList(
  query?: Types.AppointmentListQueryParams,
  options?: HttpOptions,
): Promise<Types.AppointmentListResponse> {
  const url = "/appointments";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /appointments/{id}
 * @tags Appointments
 */
export async function getAppointmentShowById(
  path: Types.GetAppointmentShowByIdPathParams,
  options?: HttpOptions,
): Promise<Types.GetAppointmentShowByIdResponse> {
  const url = buildPath("GetAppointmentShowById", path);

  return http.get(url, options);
}

/**
 * POST /appointments
 * @tags Appointments
 */
export async function postAppointmentCreate(
  body: Types.PostAppointmentCreateRequestBody,
  options?: HttpOptions,
): Promise<Types.PostAppointmentCreateResponse> {
  const url = "/appointments";

  return http.post(url, body, options);
}

/**
 * PATCH /appointments/{id}
 * @tags Appointments
 */
export async function patchAppointmentUpdateById(
  path: Types.PatchAppointmentUpdateByIdPathParams,
  body: Types.PatchAppointmentUpdateByIdRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchAppointmentUpdateByIdResponse> {
  const url = buildPath("PatchAppointmentUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /appointments/{id}
 * @tags Appointments
 */
export async function deleteAppointmentById(
  path: Types.DeleteAppointmentByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteAppointmentByIdResponse> {
  const url = buildPath("DeleteAppointmentById", path);

  return http.delete(url, options);
}

/**
 * GET /email-accounts
 * @tags Email
 */
export async function getEmailAccountList(
  query?: Types.EmailAccountListQueryParams,
  options?: HttpOptions,
): Promise<Types.EmailAccountListResponse> {
  const url = "/email-accounts";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * POST /email-accounts
 * @tags Email
 */
export async function postEmailAccountCreate(
  body: Types.PostEmailAccountCreateRequestBody,
  options?: HttpOptions,
): Promise<Types.PostEmailAccountCreateResponse> {
  const url = "/email-accounts";

  return http.post(url, body, options);
}

/**
 * GET /email-accounts/{id}
 * @tags Email
 */
export async function getEmailAccountShowById(
  path: Types.EmailAccountByIdPathParams,
  options?: HttpOptions,
): Promise<Types.EmailAccount> {
  const url = buildPath("GetEmailAccountShowById", path);

  return http.get(url, options);
}

/**
 * PATCH /email-accounts/{id}
 * @tags Email
 */
export async function patchEmailAccountUpdateById(
  path: Types.EmailAccountByIdPathParams,
  body: Types.PatchEmailAccountUpdateRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchEmailAccountUpdateResponse> {
  const url = buildPath("PatchEmailAccountUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /email-accounts/{id}
 * @tags Email
 */
export async function deleteEmailAccountById(
  path: Types.EmailAccountByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteEmailAccountResponse> {
  const url = buildPath("DeleteEmailAccountById", path);

  return http.delete(url, options);
}

/**
 * POST /email-accounts/{id}/test
 * @tags Email
 */
export async function postEmailAccountTestById(
  path: Types.EmailAccountByIdPathParams,
  options?: HttpOptions,
): Promise<Types.EmailAccountTestResponse> {
  const url = buildPath("PostEmailAccountTestById", path);

  return http.post(url, {}, options);
}

/**
 * GET /emails
 * @tags Email
 */
export async function getEmailList(
  query?: Types.EmailListQueryParams,
  options?: HttpOptions,
): Promise<Types.EmailListResponse> {
  const url = "/emails";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /emails/{id}
 * @tags Email
 */
export async function getEmailShowById(
  path: Types.EmailByIdPathParams,
  options?: HttpOptions,
): Promise<Types.GetEmailShowByIdResponse> {
  const url = buildPath("GetEmailShowById", path);

  return http.get(url, options);
}

/**
 * POST /emails
 * @tags Email
 */
export async function postEmailSend(
  body: Types.PostEmailSendRequestBody,
  options?: HttpOptions,
): Promise<Types.PostEmailSendResponse> {
  const url = "/emails";

  return http.post(url, body, options);
}

/**
 * PATCH /emails/{id}
 * @tags Email
 */
export async function patchEmailUpdateById(
  path: Types.EmailByIdPathParams,
  body: Types.PatchEmailUpdateRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchEmailUpdateResponse> {
  const url = buildPath("PatchEmailUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /emails/{id}
 * @tags Email
 */
export async function deleteEmailById(
  path: Types.EmailByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteEmailResponse> {
  const url = buildPath("DeleteEmailById", path);

  return http.delete(url, options);
}

/**
 * POST /email-accounts/{id}/sync
 * @tags Email
 */
export async function postEmailAccountSyncById(
  path: Types.EmailAccountByIdPathParams,
  options?: HttpOptions,
): Promise<Types.EmailSyncResponse> {
  const url = buildPath("PostEmailAccountSyncById", path);

  return http.post(url, {}, options);
}

/**
 * POST /emails/{id}/create-task
 * @tags Email
 */
export async function postEmailCreateTask(
  path: Types.PostEmailCreateTaskPathParams,
  options?: HttpOptions,
): Promise<Types.PostEmailCreateTaskResponse> {
  const url = buildPath("PostEmailCreateTask", path);

  return http.post(url, {}, options);
}

/**
 * GET /contacts/{id}/matches
 * @tags Matching
 */
export async function getContactMatchesById(
  path: Types.ContactMatchByIdPathParams,
  options?: HttpOptions,
): Promise<Types.ContactMatchesResponse> {
  const url = buildPath("GetContactMatchesById", path);

  return http.get(url, options);
}

/**
 * GET /estates/{id}/matches
 * @tags Matching
 */
export async function getEstateMatchesById(
  path: Types.EstateMatchByIdPathParams,
  options?: HttpOptions,
): Promise<Types.EstateMatchesResponse> {
  const url = buildPath("GetEstateMatchesById", path);

  return http.get(url, options);
}

/**
 * GET /estates/{id}/contacts
 * @tags Estates
 */
export async function getEstateContactList(
  path: Types.EstateContactListPathParams,
  options?: HttpOptions,
): Promise<Types.EstateContactListResponse> {
  const url = buildPath("GetEstateContactList", path);

  return http.get(url, options);
}

/**
 * POST /estates/{id}/contacts
 * @tags Estates
 */
export async function postEstateContactLink(
  path: Types.EstateContactListPathParams,
  body: Types.PostEstateContactLinkRequestBody,
  options?: HttpOptions,
): Promise<Types.EstateContactItem> {
  const url = buildPath("PostEstateContactLink", path);

  return http.post(url, body, options);
}

/**
 * DELETE /estates/{id}/contacts
 * Uses POST-style body via fetchApi
 * @tags Estates
 */
export async function deleteEstateContactUnlink(
  path: Types.EstateContactListPathParams,
  body: Types.DeleteEstateContactUnlinkRequestBody,
  options?: HttpOptions,
): Promise<{ message: string }> {
  const url = buildPath("DeleteEstateContactUnlink", path);
  const queryParams = new URLSearchParams();
  queryParams.append("contact_id", body.contact_id);
  if (body.role) {
    queryParams.append("role", body.role);
  }
  const fullUrl = `${url}?${queryParams}`;

  return http.delete(fullUrl, options);
}

/**
 * POST /estates/{id}/images (multipart/form-data)
 * @tags Estate Images
 */
export async function postEstateImageUpload(
  estateId: string,
  formData: FormData,
  options?: HttpOptions,
): Promise<Types.PostEstateImageUploadResponse> {
  const url = `http://127.0.0.1:7273/estates/${encodeURIComponent(estateId)}/images`;

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
    signal: options?.signal,
    headers: options?.headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data;
}

/**
 * PATCH /estates/{id}/images/{imageId}
 * @tags Estate Images
 */
export async function patchEstateImageUpdate(
  path: Types.EstateImagePathParams,
  body: Types.PatchEstateImageUpdateRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchEstateImageUpdateResponse> {
  const url = buildPath("PatchEstateImageUpdate", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /estates/{id}/images/{imageId}
 * @tags Estate Images
 */
export async function deleteEstateImage(
  path: Types.EstateImagePathParams,
  options?: HttpOptions,
): Promise<Types.DeleteEstateImageResponse> {
  const url = buildPath("DeleteEstateImage", path);

  return http.delete(url, options);
}

/**
 * Build URL for serving an estate image
 * @tags Estate Images
 */
export function getEstateImageUrl(
  estateId: string,
  imageId: string,
): string {
  return `http://127.0.0.1:7273/estates/${encodeURIComponent(estateId)}/images/${encodeURIComponent(imageId)}`;
}

/**
 * Build URL for downloading an estate brochure PDF
 * @tags Estates
 */
export function getEstateBrochureUrl(estateId: string): string {
  return `http://127.0.0.1:7273/estates/${encodeURIComponent(estateId)}/brochure`;
}

/**
 * GET /documents
 * @tags Documents
 */
export async function getDocumentList(
  query?: Types.DocumentListQueryParams,
  options?: HttpOptions,
): Promise<Types.DocumentListResponse> {
  const url = "/documents";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /documents/{id}
 * @tags Documents
 */
export async function getDocumentShowById(
  path: Types.DocumentByIdPathParams,
  options?: HttpOptions,
): Promise<Types.GetDocumentShowByIdResponse> {
  const url = buildPath("GetDocumentShowById", path);

  return http.get(url, options);
}

/**
 * POST /documents (multipart/form-data)
 * @tags Documents
 */
export async function postDocumentCreate(
  formData: FormData,
  options?: HttpOptions,
): Promise<Types.Document> {
  const url = "http://127.0.0.1:7273/documents";

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
    signal: options?.signal,
    headers: options?.headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data;
}

/**
 * PATCH /documents/{id}
 * @tags Documents
 */
export async function patchDocumentUpdateById(
  path: Types.DocumentByIdPathParams,
  body: Types.PatchDocumentUpdateByIdRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchDocumentUpdateByIdResponse> {
  const url = buildPath("PatchDocumentUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /documents/{id}
 * @tags Documents
 */
export async function deleteDocumentById(
  path: Types.DocumentByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteDocumentByIdResponse> {
  const url = buildPath("DeleteDocumentById", path);

  return http.delete(url, options);
}

/**
 * Build download URL for a document
 * @tags Documents
 */
export function getDocumentDownloadUrl(id: string): string {
  return `http://127.0.0.1:7273/documents/${encodeURIComponent(id)}/download`;
}

/**
 * GET /activities
 * @tags Activities
 */
export async function getActivityList(
  query?: Types.ActivityListQueryParams,
  options?: HttpOptions,
): Promise<Types.ActivityListResponse> {
  const url = "/activities";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * POST /activities
 * @tags Activities
 */
export async function postActivityCreate(
  body: Types.PostActivityCreateRequestBody,
  options?: HttpOptions,
): Promise<Types.PostActivityCreateResponse> {
  const url = "/activities";

  return http.post(url, body, options);
}

/**
 * GET /dashboard/stats
 * @tags Dashboard
 */
export async function getDashboardStats(
  options?: HttpOptions,
): Promise<Types.DashboardStatsResponse> {
  const url = "/dashboard/stats";

  return http.get(url, options);
}

// --- Email Templates ---

/**
 * GET /email-templates/placeholders
 * @tags EmailTemplates
 */
export async function getEmailTemplatePlaceholders(
  options?: HttpOptions,
): Promise<Types.EmailTemplatePlaceholdersResponse> {
  const url = "/email-templates/placeholders";

  return http.get(url, options);
}

/**
 * GET /email-templates
 * @tags EmailTemplates
 */
export async function getEmailTemplateList(
  query?: Types.EmailTemplateListQueryParams,
  options?: HttpOptions,
): Promise<Types.EmailTemplateListResponse> {
  const url = "/email-templates";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}

/**
 * GET /email-templates/{id}
 * @tags EmailTemplates
 */
export async function getEmailTemplateShowById(
  path: Types.EmailTemplateByIdPathParams,
  options?: HttpOptions,
): Promise<Types.GetEmailTemplateShowByIdResponse> {
  const url = buildPath("GetEmailTemplateShowById", path);

  return http.get(url, options);
}

/**
 * POST /email-templates
 * @tags EmailTemplates
 */
export async function postEmailTemplateCreate(
  body: Types.PostEmailTemplateCreateRequestBody,
  options?: HttpOptions,
): Promise<Types.PostEmailTemplateCreateResponse> {
  const url = "/email-templates";

  return http.post(url, body, options);
}

/**
 * PATCH /email-templates/{id}
 * @tags EmailTemplates
 */
export async function patchEmailTemplateUpdateById(
  path: Types.EmailTemplateByIdPathParams,
  body: Types.PatchEmailTemplateUpdateRequestBody,
  options?: HttpOptions,
): Promise<Types.PatchEmailTemplateUpdateResponse> {
  const url = buildPath("PatchEmailTemplateUpdateById", path);

  return http.patch(url, body, options);
}

/**
 * DELETE /email-templates/{id}
 * @tags EmailTemplates
 */
export async function deleteEmailTemplateById(
  path: Types.EmailTemplateByIdPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteEmailTemplateResponse> {
  const url = buildPath("DeleteEmailTemplateById", path);

  return http.delete(url, options);
}

/**
 * POST /email-templates/{id}/preview
 * @tags EmailTemplates
 */
export async function postEmailTemplatePreviewById(
  path: Types.EmailTemplateByIdPathParams,
  body: Types.PostEmailTemplatePreviewRequestBody,
  options?: HttpOptions,
): Promise<Types.EmailTemplatePreviewResponse> {
  const url = buildPath("PostEmailTemplatePreviewById", path);

  return http.post(url, body, options);
}

/**
 * POST /contacts/{id}/relationships
 * @tags Contacts
 */
export async function postContactRelationship(
  path: Types.PostContactRelationshipPathParams,
  body: Types.PostContactRelationshipRequestBody,
  options?: HttpOptions,
): Promise<Types.PostContactRelationshipResponse> {
  const url = buildPath("PostContactRelationship", path);

  return http.post(url, body, options);
}

/**
 * DELETE /contacts/{contactId}/relationships/{id}
 * @tags Contacts
 */
export async function deleteContactRelationship(
  path: Types.DeleteContactRelationshipPathParams,
  options?: HttpOptions,
): Promise<Types.DeleteContactRelationshipResponse> {
  const url = buildPath("DeleteContactRelationship", path);

  return http.delete(url, options);
}

/**
 * POST /estates/bulk-action
 * @tags Estates
 */
export async function postEstateBulkAction(
  body: Types.PostEstateBulkActionRequestBody,
  options?: HttpOptions,
): Promise<Types.PostEstateBulkActionResponse> {
  return http.post("/estates/bulk-action", body, options);
}

/**
 * GET /audit-logs
 * @tags AuditLog
 */
export async function getAuditLogList(
  query?: Types.AuditLogListQueryParams,
  options?: HttpOptions,
): Promise<Types.AuditLogListResponse> {
  const url = "/audit-logs";
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
  }
  const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

  return http.get(fullUrl, options);
}
