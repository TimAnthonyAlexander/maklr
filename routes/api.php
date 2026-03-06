<?php

use BaseApi\App;
use App\Controllers\HealthController;
use App\Controllers\LoginController;
use App\Controllers\LogoutController;
use App\Controllers\MeController;
use App\Controllers\SignupController;
use App\Controllers\FileUploadController;
use App\Controllers\BenchmarkController;
use App\Controllers\OpenApiController;
use App\Controllers\ApiTokenController;
use App\Controllers\StreamController;
use App\Controllers\TranslationController;
use App\Controllers\UpdateLanguageController;
use App\Controllers\Estate\EstateBulkActionController;
use App\Controllers\Estate\EstateCreateController;
use App\Controllers\Estate\EstateListController;
use App\Controllers\Estate\EstateShowController;
use App\Controllers\Estate\EstateUpdateController;
use App\Controllers\Estate\EstateDeleteController;
use App\Controllers\Estate\EstateContactListController;
use App\Controllers\Estate\EstateContactLinkController;
use App\Controllers\Estate\EstateContactUnlinkController;
use App\Controllers\Estate\EstateImageUploadController;
use App\Controllers\Estate\EstateImageUpdateController;
use App\Controllers\Estate\EstateImageDeleteController;
use App\Controllers\Estate\EstateImageServeController;
use App\Controllers\Estate\EstateMatchController;
use App\Controllers\Office\OfficeListController;
use App\Controllers\Office\OfficeShowController;
use App\Controllers\Office\OfficeCreateController;
use App\Controllers\Office\OfficeUpdateController;
use App\Controllers\Office\OfficeDeleteController;
use App\Controllers\User\UserListController;
use App\Controllers\User\UserShowController;
use App\Controllers\User\UserCreateController;
use App\Controllers\User\UserUpdateController;
use App\Controllers\User\UserDeleteController;
use App\Controllers\Dashboard\DashboardStatsController;
use App\Controllers\Onboarding\CreateWorkspaceController;
use App\Controllers\Invitation\CreateInvitationController;
use App\Controllers\Invitation\ValidateInvitationController;
use App\Controllers\Invitation\AcceptInvitationController;
use App\Controllers\Task\TaskListController;
use App\Controllers\Task\TaskShowController;
use App\Controllers\Task\TaskCreateController;
use App\Controllers\Task\TaskUpdateController;
use App\Controllers\Task\TaskDeleteController;
use App\Controllers\Task\TaskAssigneeController;
use App\Controllers\Task\TaskCommentController;
use App\Controllers\Task\TaskCommentDeleteController;
use App\Controllers\Appointment\AppointmentListController;
use App\Controllers\Appointment\AppointmentCreateController;
use App\Controllers\Appointment\AppointmentShowController;
use App\Controllers\Appointment\AppointmentUpdateController;
use App\Controllers\Appointment\AppointmentDeleteController;
use App\Controllers\Activity\ActivityListController;
use App\Controllers\Activity\ActivityCreateController;
use App\Controllers\AuditLog\AuditLogListController;
use App\Controllers\Contact\ContactListController;
use App\Controllers\Contact\ContactShowController;
use App\Controllers\Contact\ContactCreateController;
use App\Controllers\Contact\ContactUpdateController;
use App\Controllers\Contact\ContactDeleteController;
use App\Controllers\Contact\ContactMatchController;
use App\Controllers\Contact\ContactRelationshipCreateController;
use App\Controllers\Contact\ContactRelationshipDeleteController;
use App\Controllers\Document\DocumentListController;
use App\Controllers\Document\DocumentShowController;
use App\Controllers\Document\DocumentCreateController;
use App\Controllers\Document\DocumentUpdateController;
use App\Controllers\Document\DocumentDeleteController;
use App\Controllers\Document\DocumentDownloadController;
use App\Controllers\EmailAccount\EmailAccountListController;
use App\Controllers\EmailAccount\EmailAccountCreateController;
use App\Controllers\EmailAccount\EmailAccountShowController;
use App\Controllers\EmailAccount\EmailAccountUpdateController;
use App\Controllers\EmailAccount\EmailAccountDeleteController;
use App\Controllers\EmailAccount\EmailAccountTestController;
use App\Controllers\Email\EmailListController;
use App\Controllers\Email\EmailShowController;
use App\Controllers\Email\EmailSendController;
use App\Controllers\Email\EmailUpdateController;
use App\Controllers\Email\EmailDeleteController;
use App\Controllers\Email\EmailSyncController;
use App\Controllers\Email\EmailCreateTaskController;
use App\Controllers\EmailTemplate\EmailTemplateListController;
use App\Controllers\EmailTemplate\EmailTemplateShowController;
use App\Controllers\EmailTemplate\EmailTemplateCreateController;
use App\Controllers\EmailTemplate\EmailTemplateUpdateController;
use App\Controllers\EmailTemplate\EmailTemplateDeleteController;
use App\Controllers\EmailTemplate\EmailTemplatePlaceholdersController;
use App\Controllers\EmailTemplate\EmailTemplatePreviewController;
use App\Middleware\CombinedAuthMiddleware;
use App\Middleware\RoleMiddleware;
use BaseApi\Http\Middleware\RateLimitMiddleware;
use BaseApi\Http\SessionStartMiddleware;
use BaseApi\Permissions\PermissionsMiddleware;

$router = App::router();

// ================================
// Public Endpoints (No Auth)
// ================================

// Health check
$router->get('/health', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    HealthController::class,
]);

// Translations (public, optional auth for admin namespace)
$router->get('/translations', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    TranslationController::class,
]);

// Benchmark endpoint (no middleware for performance testing)
$router->get('/benchmark', [BenchmarkController::class]);

// ================================  
// Authentication Endpoints
// ================================

// User registration
$router->post('/auth/signup', [
    SessionStartMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '5/1m'],
    SignupController::class,
]);

// User login
$router->post('/auth/login', [
    SessionStartMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    LoginController::class,
]);

// User logout (supports both session and API token auth)
$router->post('/auth/logout', [
    SessionStartMiddleware::class,
    CombinedAuthMiddleware::class,
    LogoutController::class,
]);

// ================================
// Onboarding Endpoints
// ================================

// Create workspace (first-time setup after signup)
$router->post('/onboarding/workspace', [
    SessionStartMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '5/1m'],
    CombinedAuthMiddleware::class,
    CreateWorkspaceController::class,
]);

// ================================
// Invitation Endpoints
// ================================

// Create invitation (admin/manager only)
$router->post('/offices/{office_id}/invitations', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['manager']],
    CreateInvitationController::class,
]);

// Validate invitation token (public)
$router->get('/invitations/{token}', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    ValidateInvitationController::class,
]);

// Accept invitation and sign up (public)
$router->post('/invitations/{token}/accept', [
    SessionStartMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '5/1m'],
    AcceptInvitationController::class,
]);

// ================================
// Dashboard Endpoints
// ================================

$router->get('/dashboard/stats', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    DashboardStatsController::class,
]);

// ================================
// Protected Endpoints (Combined Auth)
// ================================

// Get current user info (supports both session and API token)
$router->get('/me', [
    CombinedAuthMiddleware::class,
    MeController::class,
]);

// Update user language preference
$router->post('/me/language', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    UpdateLanguageController::class,
]);

// API token management (supports both session and API token)
$router->get('/api-tokens', [
    CombinedAuthMiddleware::class,
    ApiTokenController::class,
]);

$router->post('/api-tokens', [
    CombinedAuthMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '10/1h'],
    ApiTokenController::class,
]);

$router->delete('/api-tokens/{id}', [
    CombinedAuthMiddleware::class,
    ApiTokenController::class,
]);

// ================================
// File Upload Examples
// ================================

// Basic file upload
$router->post('/files/upload', [
    CombinedAuthMiddleware::class,
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    FileUploadController::class,
]);

// Get file info
$router->get('/files/info', [
    CombinedAuthMiddleware::class,
    FileUploadController::class,
]);

// Delete files (with permission check example)
$router->delete('/files', [
    CombinedAuthMiddleware::class,
    PermissionsMiddleware::class => ['node' => 'files.delete'],
    FileUploadController::class,
]);

// ================================
// Estate Endpoints
// ================================

$router->get('/estates', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateListController::class,
]);

$router->post('/estates/bulk-action', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateBulkActionController::class,
]);

$router->post('/estates', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateCreateController::class,
]);

$router->get('/estates/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateShowController::class,
]);

$router->patch('/estates/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateUpdateController::class,
]);

$router->delete('/estates/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['manager']],
    EstateDeleteController::class,
]);

$router->get('/estates/{id}/matches', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateMatchController::class,
]);

// Estate-Contact linking
$router->get('/estates/{id}/contacts', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateContactListController::class,
]);

$router->post('/estates/{id}/contacts', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateContactLinkController::class,
]);

$router->delete('/estates/{id}/contacts', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateContactUnlinkController::class,
]);

// Estate Images
$router->post('/estates/{id}/images', [
    RateLimitMiddleware::class => ['limit' => '20/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateImageUploadController::class,
]);

$router->patch('/estates/{id}/images/{imageId}', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateImageUpdateController::class,
]);

$router->get('/estates/{id}/images/{imageId}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateImageServeController::class,
]);

$router->delete('/estates/{id}/images/{imageId}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateImageDeleteController::class,
]);

// ================================
// Office Endpoints
// ================================

$router->get('/offices', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    OfficeListController::class,
]);

$router->get('/offices/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    OfficeShowController::class,
]);

$router->post('/offices', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['admin']],
    OfficeCreateController::class,
]);

$router->patch('/offices/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['admin']],
    OfficeUpdateController::class,
]);

$router->delete('/offices/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['admin']],
    OfficeDeleteController::class,
]);

// ================================
// User Management Endpoints
// ================================

$router->get('/users', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['manager']],
    UserListController::class,
]);

$router->get('/users/{id}', [
    CombinedAuthMiddleware::class,
    UserShowController::class,
]);

$router->post('/users', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['admin']],
    UserCreateController::class,
]);

$router->patch('/users/{id}', [
    CombinedAuthMiddleware::class,
    UserUpdateController::class,
]);

$router->delete('/users/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['admin']],
    UserDeleteController::class,
]);

// ================================
// Task Endpoints
// ================================

$router->get('/tasks', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    TaskListController::class,
]);

$router->post('/tasks', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    TaskCreateController::class,
]);

$router->get('/tasks/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    TaskShowController::class,
]);

$router->patch('/tasks/{id}', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    TaskUpdateController::class,
]);

$router->delete('/tasks/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['manager']],
    TaskDeleteController::class,
]);

// Task Assignees
$router->post('/tasks/{id}/assignees', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    TaskAssigneeController::class,
]);

$router->delete('/tasks/{id}/assignees', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    TaskAssigneeController::class,
]);

// Task Comments
$router->get('/tasks/{id}/comments', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    TaskCommentController::class,
]);

$router->post('/tasks/{id}/comments', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    TaskCommentController::class,
]);

$router->delete('/tasks/{id}/comments/{commentId}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    TaskCommentDeleteController::class,
]);

// ================================
// Appointment Endpoints
// ================================

$router->get('/appointments', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    AppointmentListController::class,
]);

$router->post('/appointments', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    AppointmentCreateController::class,
]);

$router->get('/appointments/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    AppointmentShowController::class,
]);

$router->patch('/appointments/{id}', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    AppointmentUpdateController::class,
]);

$router->delete('/appointments/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['manager']],
    AppointmentDeleteController::class,
]);

// ================================
// Activity Endpoints
// ================================

$router->get('/activities', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    ActivityListController::class,
]);

$router->post('/activities', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    ActivityCreateController::class,
]);

// ================================
// Audit Log Endpoints
// ================================

$router->get('/audit-logs', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['manager']],
    AuditLogListController::class,
]);

// ================================
// Contact Endpoints
// ================================

$router->get('/contacts', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    ContactListController::class,
]);

$router->post('/contacts', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    ContactCreateController::class,
]);

$router->get('/contacts/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    ContactShowController::class,
]);

$router->patch('/contacts/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    ContactUpdateController::class,
]);

$router->delete('/contacts/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['manager']],
    ContactDeleteController::class,
]);

$router->get('/contacts/{id}/matches', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    ContactMatchController::class,
]);

// Contact Relationships
$router->post('/contacts/{id}/relationships', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    ContactRelationshipCreateController::class,
]);

$router->delete('/contacts/{contactId}/relationships/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    ContactRelationshipDeleteController::class,
]);

// ================================
// Document Endpoints
// ================================

$router->get('/documents', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    DocumentListController::class,
]);

$router->post('/documents', [
    RateLimitMiddleware::class => ['limit' => '20/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    DocumentCreateController::class,
]);

$router->get('/documents/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    DocumentShowController::class,
]);

$router->patch('/documents/{id}', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    DocumentUpdateController::class,
]);

$router->delete('/documents/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['manager']],
    DocumentDeleteController::class,
]);

$router->get('/documents/{id}/download', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    DocumentDownloadController::class,
]);

// ================================
// Email Account Endpoints
// ================================

$router->get('/email-accounts', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailAccountListController::class,
]);

$router->post('/email-accounts', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailAccountCreateController::class,
]);

$router->get('/email-accounts/{id}', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailAccountShowController::class,
]);

$router->patch('/email-accounts/{id}', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailAccountUpdateController::class,
]);

$router->delete('/email-accounts/{id}', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailAccountDeleteController::class,
]);

$router->post('/email-accounts/{id}/test', [
    RateLimitMiddleware::class => ['limit' => '5/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailAccountTestController::class,
]);

// ================================
// Email Message Endpoints
// ================================

$router->get('/emails', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailListController::class,
]);

$router->post('/emails', [
    RateLimitMiddleware::class => ['limit' => '20/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailSendController::class,
]);

$router->get('/emails/{id}', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailShowController::class,
]);

$router->patch('/emails/{id}', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailUpdateController::class,
]);

$router->delete('/emails/{id}', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailDeleteController::class,
]);

$router->post('/emails/{id}/create-task', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailCreateTaskController::class,
]);

$router->post('/email-accounts/{id}/sync', [
    RateLimitMiddleware::class => ['limit' => '5/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailSyncController::class,
]);

// ================================
// Email Templates
// ================================

// Placeholders must be before {id} routes
$router->get('/email-templates/placeholders', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailTemplatePlaceholdersController::class,
]);

$router->get('/email-templates', [
    RateLimitMiddleware::class => ['limit' => '60/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailTemplateListController::class,
]);

$router->post('/email-templates', [
    RateLimitMiddleware::class => ['limit' => '20/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailTemplateCreateController::class,
]);

$router->get('/email-templates/{id}', [
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailTemplateShowController::class,
]);

$router->patch('/email-templates/{id}', [
    RateLimitMiddleware::class => ['limit' => '20/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailTemplateUpdateController::class,
]);

$router->delete('/email-templates/{id}', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailTemplateDeleteController::class,
]);

$router->post('/email-templates/{id}/preview', [
    RateLimitMiddleware::class => ['limit' => '30/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EmailTemplatePreviewController::class,
]);

// ================================
// Permission-Protected Examples
// ================================
// 
// Examples of using PermissionsMiddleware:
//
// $router->post('/admin/users', [
//     CombinedAuthMiddleware::class,
//     PermissionsMiddleware::class => ['node' => 'admin.users.create'],
//     AdminUsersController::class,
// ]);
//
// $router->get('/premium/content', [
//     CombinedAuthMiddleware::class,
//     PermissionsMiddleware::class => ['node' => 'content.premium'],
//     PremiumContentController::class,
// ]);
//
// Wildcard permission example:
// $router->post('/export/csv', [
//     CombinedAuthMiddleware::class,
//     PermissionsMiddleware::class => ['node' => 'export.csv'],
//     ExportController::class,
// ]);
// 
// This would match permissions like 'export.*' or 'export.csv'

// ================================
// Development Only
// ================================

if (App::config('app.env') === 'local') {
    // OpenAPI schema for API documentation
    $router->get('/openapi.json', [OpenApiController::class]);

    $router->get('/stream', [
        RateLimitMiddleware::class => ['limit' => '10/1m'],
        StreamController::class,
    ]);
}
