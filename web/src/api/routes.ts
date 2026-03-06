// Generated route constants and path builder for BaseApi
// Do not edit manually - regenerate with: ./mason types:generate

export const Routes = {
  GetHealth: "/health",
  GetBenchmark: "/benchmark",
  PostSignup: "/auth/signup",
  PostLogin: "/auth/login",
  PostLogout: "/auth/logout",
  GetMe: "/me",
  GetApiToken: "/api-tokens",
  PostApiToken: "/api-tokens",
  DeleteApiTokenById: "/api-tokens/{id}",
  PostFileUpload: "/files/upload",
  GetFileUpload: "/files/info",
  DeleteFileUpload: "/files",
  GetOfficeList: "/offices",
  GetOfficeShowById: "/offices/{id}",
  PostOfficeCreate: "/offices",
  PatchOfficeUpdateById: "/offices/{id}",
  DeleteOfficeDeleteById: "/offices/{id}",
  GetUserList: "/users",
  GetUserShowById: "/users/{id}",
  PostUserCreate: "/users",
  PatchUserUpdateById: "/users/{id}",
  DeleteUserDeleteById: "/users/{id}",
  GetOpenApi: "/openapi.json",
  GetStream: "/stream",
  GetEstateList: "/estates",
  GetEstateShowById: "/estates/{id}",
  PostEstateCreate: "/estates",
  PatchEstateUpdateById: "/estates/{id}",
  DeleteEstateById: "/estates/{id}",
  GetDashboardStats: "/dashboard/stats",
  GetTaskList: "/tasks",
  GetTaskShowById: "/tasks/{id}",
  PostTaskCreate: "/tasks",
  PatchTaskUpdateById: "/tasks/{id}",
  DeleteTaskById: "/tasks/{id}",
  GetContactList: "/contacts",
  GetContactShowById: "/contacts/{id}",
  PostContactCreate: "/contacts",
  PatchContactUpdateById: "/contacts/{id}",
  DeleteContactById: "/contacts/{id}",
  GetAppointmentList: "/appointments",
  GetAppointmentShowById: "/appointments/{id}",
  PostAppointmentCreate: "/appointments",
  PatchAppointmentUpdateById: "/appointments/{id}",
  DeleteAppointmentById: "/appointments/{id}",
  GetEmailAccountList: "/email-accounts",
  PostEmailAccountCreate: "/email-accounts",
  GetEmailAccountShowById: "/email-accounts/{id}",
  PatchEmailAccountUpdateById: "/email-accounts/{id}",
  DeleteEmailAccountById: "/email-accounts/{id}",
  PostEmailAccountTestById: "/email-accounts/{id}/test",
  GetDocumentList: "/documents",
  PostDocumentCreate: "/documents",
  GetDocumentShowById: "/documents/{id}",
  PatchDocumentUpdateById: "/documents/{id}",
  DeleteDocumentById: "/documents/{id}",
  GetDocumentDownloadById: "/documents/{id}/download",
  GetEmailList: "/emails",
  GetEmailShowById: "/emails/{id}",
  PostEmailSend: "/emails",
  PatchEmailUpdateById: "/emails/{id}",
  DeleteEmailById: "/emails/{id}",
  PostEmailAccountSyncById: "/email-accounts/{id}/sync",
  PostEmailCreateTask: "/emails/{id}/create-task",
  GetContactMatchesById: "/contacts/{id}/matches",
  GetEstateMatchesById: "/estates/{id}/matches",
  GetEstateContactList: "/estates/{id}/contacts",
  PostEstateContactLink: "/estates/{id}/contacts",
  DeleteEstateContactUnlink: "/estates/{id}/contacts",
  PostEstateImageUpload: "/estates/{id}/images",
  PatchEstateImageUpdate: "/estates/{id}/images/{imageId}",
  DeleteEstateImage: "/estates/{id}/images/{imageId}",
  GetEmailTemplatePlaceholders: "/email-templates/placeholders",
  GetEmailTemplateList: "/email-templates",
  PostEmailTemplateCreate: "/email-templates",
  GetEmailTemplateShowById: "/email-templates/{id}",
  PatchEmailTemplateUpdateById: "/email-templates/{id}",
  DeleteEmailTemplateById: "/email-templates/{id}",
  PostEmailTemplatePreviewById: "/email-templates/{id}/preview",
  GetCustomFieldDefinitionList: "/custom-fields",
  PostCustomFieldDefinitionCreate: "/custom-fields",
  PatchCustomFieldDefinitionUpdateById: "/custom-fields/{id}",
  DeleteCustomFieldDefinitionById: "/custom-fields/{id}",
  GetAuditLogList: "/audit-logs",
  PostContactRelationship: "/contacts/{id}/relationships",
  DeleteContactRelationship: "/contacts/{contactId}/relationships/{id}",
  GetWebsiteList: "/websites",
  PostWebsiteCreate: "/websites",
  GetWebsiteShowById: "/websites/{id}",
  PatchWebsiteUpdateById: "/websites/{id}",
  DeleteWebsiteById: "/websites/{id}",
  GetWebsitePageList: "/websites/{websiteId}/pages",
  PostWebsitePageCreate: "/websites/{websiteId}/pages",
  GetWebsitePageShowById: "/websites/{websiteId}/pages/{id}",
  PatchWebsitePageUpdateById: "/websites/{websiteId}/pages/{id}",
  DeleteWebsitePageById: "/websites/{websiteId}/pages/{id}",
  PostWebsiteChatSend: "/websites/{websiteId}/chat",
  GetWebsiteChatList: "/websites/{websiteId}/chat",
  GetWebsitePageVersionList: "/websites/{websiteId}/pages/{pageId}/versions",
  PostWebsitePageVersionRestore: "/websites/{websiteId}/pages/{pageId}/versions/{versionId}/restore",
  GetPortalList: "/portals",
  PostPortalCreate: "/portals",
  GetPortalShowById: "/portals/{id}",
  PatchPortalUpdateById: "/portals/{id}",
  DeletePortalById: "/portals/{id}",
  PostPortalTestById: "/portals/{id}/test",
  PostPortalSyncById: "/portals/{id}/sync",
  GetPortalSyncLogs: "/portals/{id}/sync-logs",
  GetEstateSyndications: "/estates/{id}/syndications",
  PatchEstateSyndicationUpdate: "/estates/{id}/syndications/{syndicationId}",
  PostEstateSyndicationBulk: "/estates/{id}/syndications/bulk",
} as const;

export type RouteKey = keyof typeof Routes;

/**
 * Build a path from a route key and parameters
 * @param key - The route key
 * @param params - Path parameters to substitute
 * @returns The built path
 */
export function buildPath<K extends RouteKey>(
  key: K,
  params?: Record<string, string | number | null>,
): string {
  let path: string = Routes[key];

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      if (paramValue !== null && paramValue !== undefined) {
        path = path.replace(
          `{${paramKey}}`,
          encodeURIComponent(String(paramValue)),
        );
      }
    }
  }

  return path;
}

// Type-safe path builders for each route

export function buildDeleteApiTokenByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteApiTokenById", params);
}

export function buildGetOfficeShowByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetOfficeShowById", params);
}

export function buildPatchOfficeUpdateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PatchOfficeUpdateById", params);
}

export function buildDeleteOfficeDeleteByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteOfficeDeleteById", params);
}

export function buildGetUserShowByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetUserShowById", params);
}

export function buildPatchUserUpdateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PatchUserUpdateById", params);
}

export function buildDeleteUserDeleteByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteUserDeleteById", params);
}

export function buildGetDocumentShowByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetDocumentShowById", params);
}

export function buildPatchDocumentUpdateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PatchDocumentUpdateById", params);
}

export function buildDeleteDocumentByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteDocumentById", params);
}

export function buildGetDocumentDownloadByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetDocumentDownloadById", params);
}

export function buildGetEstateShowByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetEstateShowById", params);
}

export function buildPatchEstateUpdateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PatchEstateUpdateById", params);
}

export function buildDeleteEstateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteEstateById", params);
}

export function buildGetTaskShowByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetTaskShowById", params);
}

export function buildPatchTaskUpdateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PatchTaskUpdateById", params);
}

export function buildDeleteTaskByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteTaskById", params);
}

export function buildGetContactShowByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetContactShowById", params);
}

export function buildPatchContactUpdateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PatchContactUpdateById", params);
}

export function buildDeleteContactByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteContactById", params);
}

export function buildGetEmailAccountShowByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetEmailAccountShowById", params);
}

export function buildPatchEmailAccountUpdateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PatchEmailAccountUpdateById", params);
}

export function buildDeleteEmailAccountByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteEmailAccountById", params);
}

export function buildPostEmailAccountTestByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PostEmailAccountTestById", params);
}

export function buildGetEmailShowByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetEmailShowById", params);
}

export function buildPatchEmailUpdateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PatchEmailUpdateById", params);
}

export function buildDeleteEmailByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteEmailById", params);
}

export function buildPostEmailAccountSyncByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PostEmailAccountSyncById", params);
}

export function buildPostEmailCreateTaskPath(params: {
  id: string | number;
}): string {
  return buildPath("PostEmailCreateTask", params);
}

export function buildGetEstateContactListPath(params: {
  id: string | number;
}): string {
  return buildPath("GetEstateContactList", params);
}

export function buildPostEstateContactLinkPath(params: {
  id: string | number;
}): string {
  return buildPath("PostEstateContactLink", params);
}

export function buildDeleteEstateContactUnlinkPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteEstateContactUnlink", params);
}

export function buildGetEmailTemplateShowByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("GetEmailTemplateShowById", params);
}

export function buildPatchEmailTemplateUpdateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PatchEmailTemplateUpdateById", params);
}

export function buildDeleteEmailTemplateByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("DeleteEmailTemplateById", params);
}

export function buildPostEmailTemplatePreviewByIdPath(params: {
  id: string | number;
}): string {
  return buildPath("PostEmailTemplatePreviewById", params);
}

export function buildPostContactRelationshipPath(params: {
  id: string | number;
}): string {
  return buildPath("PostContactRelationship", params);
}

export function buildDeleteContactRelationshipPath(params: {
  contactId: string | number;
  id: string | number;
}): string {
  return buildPath("DeleteContactRelationship", params);
}
