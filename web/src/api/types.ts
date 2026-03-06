// Generated TypeScript definitions for BaseApi
// Do not edit manually - regenerate with: ./mason types:generate

export type UUID = string;
export type Envelope<T> = T;

export interface ErrorResponse {
  error: string;
  requestId: string;
  errors?: Record<string, string>;
}

export interface User {
  name?: string;
  password?: string;
  email?: string;
  active?: boolean;
  role?: string;
  office_id?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GetHealthQueryParams {
  db?: string;
  cache?: string;
}

export type GetHealthResponse = Envelope<unknown>;

export type GetBenchmarkResponse = Envelope<unknown>;

export interface PostSignupRequestBody {
  name?: string;
  email?: string;
  password?: string;
}

export type PostSignupResponse = Envelope<User>;

export interface PostLoginRequestBody {
  email?: string;
  password?: string;
}

export type PostLoginResponse = Envelope<{ user: unknown[] }>;

export type PostLogoutResponse = Envelope<{ message: string }>;

export type GetMeResponse = Envelope<{ user: unknown[] }>;

export interface GetApiTokenQueryParams {
  name?: string;
  expires_at?: string | null;
  id?: string;
}

export type GetApiTokenResponse = Envelope<{ tokens: unknown[] }>;

export interface PostApiTokenRequestBody {
  name?: string;
  expires_at?: string | null;
  id?: string;
}

export type PostApiTokenResponse = Envelope<{
  token: string;
  id: string;
  name: string;
  expires_at: unknown;
  created_at: string;
}>;

export interface DeleteApiTokenByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface DeleteApiTokenByIdQueryParams {
  name?: string;
  expires_at?: string | null;
}

export type DeleteApiTokenByIdResponse = Envelope<{ message: string }>;

export type PostFileUploadResponse = Envelope<{
  path: string;
  url: string;
  size: number;
  type: string;
}>;

export type GetFileUploadResponse = Envelope<unknown>;

export type DeleteFileUploadResponse = Envelope<unknown>;

export type GetOfficeListResponse = Envelope<unknown>;

export interface GetOfficeShowByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type GetOfficeShowByIdResponse = Envelope<unknown>;

export interface PostOfficeCreateRequestBody {
  name?: string;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

export type PostOfficeCreateResponse = Envelope<unknown>;

export interface PatchOfficeUpdateByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PatchOfficeUpdateByIdRequestBody {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

export type PatchOfficeUpdateByIdResponse = Envelope<unknown>;

export interface DeleteOfficeDeleteByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type DeleteOfficeDeleteByIdResponse = Envelope<unknown>;

export interface UserListQueryParams {
  q?: string;
  role?: string;
  active?: string;
  page?: number;
  per_page?: number;
}

export interface UserListResponse {
  items: User[];
  pagination: PaginationMeta;
}

export type GetUserListResponse = UserListResponse;

export interface GetUserShowByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type GetUserShowByIdResponse = Envelope<User>;

export interface PostUserCreateRequestBody {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  office_id?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

export type PostUserCreateResponse = Envelope<unknown>;

export interface PatchUserUpdateByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PatchUserUpdateByIdRequestBody {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  role?: string | null;
  office_id?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

export type PatchUserUpdateByIdResponse = Envelope<unknown>;

export interface DeleteUserDeleteByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type DeleteUserDeleteByIdResponse = Envelope<unknown>;

export type GetOpenApiResponse = Envelope<unknown>;

export interface GetStreamQueryParams {
  prompt?: string;
}

export type GetStreamResponse = Envelope<unknown>;

// --- Estate types ---

export interface Estate {
  id?: string;
  title?: string;
  description?: string | null;
  property_type?: string;
  marketing_type?: string;
  status?: string;
  external_id?: string | null;
  street?: string | null;
  house_number?: string | null;
  zip?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price?: number | null;
  area_total?: number | null;
  area_living?: number | null;
  area_plot?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  floors_total?: number | null;
  year_built?: number | null;
  parking_spaces?: number | null;
  heating_type?: string | null;
  energy_rating?: string | null;
  condition?: string | null;
  furnished?: boolean;
  balcony?: boolean;
  garden?: boolean;
  elevator?: boolean;
  cellar?: boolean;
  virtual_tour_url?: string | null;
  owner_contact_id?: string | null;
  assigned_user_id?: string | null;
  office_id?: string | null;
  custom_fields?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EstateImage {
  id?: string;
  estate_id?: string;
  file_path?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  category?: string;
  sort_order?: number;
  title?: string | null;
  alt_text?: string | null;
  is_primary?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EstateWithImages extends Estate {
  images?: EstateImage[];
}

export interface EstateListQueryParams {
  status?: string;
  property_type?: string;
  marketing_type?: string;
  city?: string;
  price_min?: number;
  price_max?: number;
  q?: string;
  page?: number;
  per_page?: number;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

export interface EstateListResponse {
  items: Estate[];
  pagination: PaginationMeta;
}

export type GetEstateShowByIdResponse = EstateWithImages;

export interface GetEstateShowByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PostEstateCreateRequestBody {
  title?: string;
  description?: string | null;
  property_type?: string;
  marketing_type?: string;
  status?: string;
  external_id?: string | null;
  street?: string | null;
  house_number?: string | null;
  zip?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price?: number | null;
  area_total?: number | null;
  area_living?: number | null;
  area_plot?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  floors_total?: number | null;
  year_built?: number | null;
  parking_spaces?: number | null;
  heating_type?: string | null;
  energy_rating?: string | null;
  condition?: string | null;
  furnished?: boolean;
  balcony?: boolean;
  garden?: boolean;
  elevator?: boolean;
  cellar?: boolean;
  virtual_tour_url?: string | null;
  owner_contact_id?: string | null;
  assigned_user_id?: string | null;
  office_id?: string | null;
}

export type PostEstateCreateResponse = Envelope<Estate>;

export interface PatchEstateUpdateByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type PatchEstateUpdateByIdRequestBody =
  Partial<PostEstateCreateRequestBody> & {
    custom_fields?: Record<string, unknown> | null;
  };

export type PatchEstateUpdateByIdResponse = Envelope<Estate>;

export interface DeleteEstateByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type DeleteEstateByIdResponse = Envelope<{ message: string }>;

// --- Task types ---

export interface Task {
  id?: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  type?: string;
  task_number?: number;
  due_date?: string | null;
  completed_at?: string | null;
  position?: number | null;
  estate_id?: string | null;
  contact_id?: string | null;
  office_id?: string | null;
  created_by_user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  task_users?: TaskUser[];
}

export interface TaskUser {
  id?: string;
  task_id?: string;
  user_id?: string;
  user?: User;
}

export interface TaskComment {
  id?: string;
  task_id?: string;
  user_id?: string;
  body?: string;
  user?: User;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TaskListQueryParams {
  status?: string;
  priority?: string;
  type?: string;
  estate_id?: string;
  contact_id?: string;
  assigned_user_id?: string;
  due_before?: string;
  due_after?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export interface TaskListResponse {
  items: Task[];
  pagination: PaginationMeta;
}

export interface TaskWithRelations extends Task {
  comments?: TaskComment[];
  estate?: Estate | null;
  contact?: Contact | null;
}

export type GetTaskShowByIdResponse = TaskWithRelations;

export interface GetTaskShowByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PostTaskCreateRequestBody {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  type?: string;
  due_date?: string | null;
  estate_id?: string | null;
  contact_id?: string | null;
  position?: number | null;
  assignee_ids?: string[];
}

export type PostTaskCreateResponse = Envelope<Task>;

export interface PatchTaskUpdateByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type PatchTaskUpdateByIdRequestBody = Partial<
  Omit<PostTaskCreateRequestBody, "assignee_ids">
>;

export type PatchTaskUpdateByIdResponse = Envelope<Task>;

export interface DeleteTaskByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type DeleteTaskByIdResponse = Envelope<{ message: string }>;

// --- Search Profile types ---

export interface SearchProfile {
  id: string;
  name: string;
  property_types: string[];
  marketing_type: string | null;
  price_min: number | null;
  price_max: number | null;
  area_min: number | null;
  area_max: number | null;
  rooms_min: number | null;
  rooms_max: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  cities: string[];
  furnished: boolean | null;
  balcony: boolean | null;
  garden: boolean | null;
  elevator: boolean | null;
  cellar: boolean | null;
  created_at: string;
}

// --- Matching types ---

export interface ContactMatchByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface EstateMatchByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface EstateMatchResult {
  estate: Estate;
  score: number;
  profile_id: string;
  profile_name: string;
  matched: string[];
  unmatched: string[];
}

export interface ContactMatchResult {
  contact: Contact;
  score: number;
  profile_id: string;
  profile_name: string;
  matched: string[];
  unmatched: string[];
}

export interface ContactMatchesResponse {
  items: EstateMatchResult[];
  total: number;
}

export interface EstateMatchesResponse {
  items: ContactMatchResult[];
  total: number;
}

// --- Match Explain types ---

export interface MatchExplainRequest {
  estate_id: string;
  contact_id: string;
  profile_id: string;
}

export interface MatchExplanation {
  strong_fits: string[];
  stretches: string[];
  suggested_pitch: string;
}

// --- Contact types ---

export interface Contact {
  id?: string;
  type?: string;
  entity_type?: string;
  company_name?: string | null;
  salutation?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  country?: string | null;
  stage?: string;
  assigned_user_id?: string | null;
  office_id?: string | null;
  custom_fields?: Record<string, unknown>;
  search_profiles?: SearchProfile[];
  gdpr_consent?: boolean;
  gdpr_consent_date?: string | null;
  gdpr_deletion_requested?: boolean;
  gdpr_deletion_requested_at?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ContactRelationship {
  id: string;
  contact_id: string;
  related_contact_id: string;
  type: string;
  notes: string | null;
  related_contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    email: string | null;
    entity_type: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ContactWithRelations extends Contact {
  relationships?: ContactRelationship[];
  activities?: unknown[];
}

export interface PostContactRelationshipPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PostContactRelationshipRequestBody {
  related_contact_id: string;
  type: string;
  notes?: string | null;
}

export type PostContactRelationshipResponse = Envelope<ContactRelationship>;

export interface DeleteContactRelationshipPathParams {
  contactId: string;
  id: string;
  [key: string]: string | number | null;
}

export type DeleteContactRelationshipResponse = Envelope<{ message: string }>;

export interface ContactListQueryParams {
  type?: string;
  entity_type?: string;
  stage?: string;
  assigned_user_id?: string;
  city?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export interface ContactListResponse {
  items: Contact[];
  pagination: PaginationMeta;
}

export type GetContactShowByIdResponse = ContactWithRelations;

export interface GetContactShowByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PostContactCreateRequestBody {
  entity_type: string;
  type?: string;
  company_name?: string | null;
  salutation?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  country?: string | null;
  stage?: string;
  gdpr_consent?: boolean;
  gdpr_consent_date?: string | null;
  notes?: string | null;
}

export type PostContactCreateResponse = Envelope<Contact>;

export interface PatchContactUpdateByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type PatchContactUpdateByIdRequestBody =
  Partial<PostContactCreateRequestBody> & {
    assigned_user_id?: string | null;
    gdpr_deletion_requested?: boolean;
    gdpr_deletion_requested_at?: string | null;
    search_profiles?: SearchProfile[];
    custom_fields?: Record<string, unknown>;
  };

export type PatchContactUpdateByIdResponse = Envelope<Contact>;

export interface DeleteContactByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type DeleteContactByIdResponse = Envelope<{ message: string }>;

// --- Appointment types ---

export interface Appointment {
  id?: string;
  title?: string;
  description?: string | null;
  type?: string;
  is_all_day?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  location?: string | null;
  estate_id?: string | null;
  office_id?: string | null;
  created_by_user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  appointment_users?: AppointmentUserRecord[];
  appointment_contacts?: AppointmentContactRecord[];
  estate?: Estate | null;
}

export interface AppointmentUserRecord {
  id?: string;
  appointment_id?: string;
  user_id?: string;
  role?: string;
  user?: User;
}

export interface AppointmentContactRecord {
  id?: string;
  appointment_id?: string;
  contact_id?: string;
  contact?: Contact;
}

export interface AppointmentListQueryParams {
  type?: string;
  estate_id?: string;
  user_id?: string;
  starts_after?: string;
  starts_before?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export interface AppointmentListResponse {
  items: Appointment[];
  pagination: PaginationMeta;
}

export type GetAppointmentShowByIdResponse = Appointment;

export interface GetAppointmentShowByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PostAppointmentCreateRequestBody {
  title: string;
  description?: string | null;
  type?: string;
  is_all_day?: boolean;
  starts_at: string;
  ends_at?: string;
  location?: string | null;
  estate_id?: string | null;
  user_ids?: string[];
  contact_ids?: string[];
}

export type PostAppointmentCreateResponse = Envelope<AppointmentWithConflicts>;

export interface PatchAppointmentUpdateByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type PatchAppointmentUpdateByIdRequestBody =
  Partial<PostAppointmentCreateRequestBody>;

export type PatchAppointmentUpdateByIdResponse = Envelope<AppointmentWithConflicts>;

export interface DeleteAppointmentByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type DeleteAppointmentByIdResponse = Envelope<{ message: string }>;

export interface AppointmentConflict {
  user_id: string;
  appointment_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
}

export interface AppointmentWithConflicts extends Appointment {
  conflicts?: AppointmentConflict[];
}

// --- Activity types ---

export interface Activity {
  id?: string;
  type?: string;
  subject?: string;
  description?: string | null;
  office_id?: string | null;
  user_id?: string | null;
  estate_id?: string | null;
  contact_id?: string | null;
  appointment_id?: string | null;
  task_id?: string | null;
  email_id?: string | null;
  document_id?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  metadata?: Record<string, unknown>;
  user?: User | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ActivityListQueryParams {
  type?: string;
  estate_id?: string;
  contact_id?: string;
  user_id?: string;
  task_id?: string;
  email_id?: string;
  date_from?: string;
  date_to?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export interface ActivityListResponse {
  items: Activity[];
  pagination: PaginationMeta;
}

export interface PostActivityCreateRequestBody {
  type: string;
  subject: string;
  description?: string | null;
  estate_id?: string | null;
  contact_id?: string | null;
}

export type PostActivityCreateResponse = Envelope<{ message: string }>;

// --- Email Account types ---

export interface EmailAccount {
  id?: string;
  name?: string;
  email_address?: string;
  imap_host?: string;
  imap_port?: number;
  imap_encryption?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_encryption?: string;
  username?: string;
  scope?: string;
  active?: boolean;
  last_sync_at?: string | null;
  last_error?: string | null;
  office_id?: string | null;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EmailAccountListQueryParams {
  active?: boolean;
  page?: number;
  per_page?: number;
}

export interface EmailAccountListResponse {
  items: EmailAccount[];
  pagination: PaginationMeta;
}

export interface EmailAccountByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PostEmailAccountCreateRequestBody {
  name: string;
  email_address: string;
  imap_host: string;
  imap_port: number;
  imap_encryption: string;
  smtp_host: string;
  smtp_port: number;
  smtp_encryption: string;
  username: string;
  password: string;
  scope: string;
}

export type PatchEmailAccountUpdateRequestBody =
  Partial<PostEmailAccountCreateRequestBody>;

export type PostEmailAccountCreateResponse = Envelope<EmailAccount>;
export type PatchEmailAccountUpdateResponse = Envelope<EmailAccount>;
export type DeleteEmailAccountResponse = Envelope<{ message: string }>;

export interface EmailAccountTestResponse {
  success: boolean;
  error?: string;
}

// --- Email Message types ---

export interface EmailMessage {
  id?: string;
  email_account_id?: string;
  office_id?: string | null;
  direction?: string;
  status?: string;
  folder?: string | null;
  read?: boolean;
  message_id?: string | null;
  in_reply_to?: string | null;
  from_address?: string;
  from_name?: string | null;
  to_addresses?: string;
  to_names?: string | null;
  cc_addresses?: string | null;
  cc_names?: string | null;
  bcc_addresses?: string | null;
  subject?: string;
  body_html?: string | null;
  body_text?: string | null;
  sent_at?: string | null;
  received_at?: string | null;
  contact_id?: string | null;
  estate_id?: string | null;
  email_template_id?: string | null;
  contact?: Contact | null;
  estate?: Estate | null;
  email_account?: EmailAccount | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EmailListQueryParams {
  account_id?: string;
  direction?: string;
  status?: string;
  folder?: string;
  contact_id?: string;
  q?: string;
  include_archived?: string;
  page?: number;
  per_page?: number;
}

export interface EmailListResponse {
  items: EmailMessage[];
  pagination: PaginationMeta;
}

export interface EmailByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type GetEmailShowByIdResponse = EmailMessage;

export interface PostEmailSendRequestBody {
  email_account_id: string;
  to: string;
  cc?: string | null;
  bcc?: string | null;
  subject: string;
  body_html: string;
  body_text?: string | null;
  in_reply_to?: string | null;
  contact_id?: string | null;
  estate_id?: string | null;
  email_template_id?: string | null;
}

export type PostEmailSendResponse = Envelope<EmailMessage>;

export interface PatchEmailUpdateRequestBody {
  status?: string;
  read?: boolean;
  contact_id?: string | null;
  estate_id?: string | null;
}

export type PatchEmailUpdateResponse = Envelope<EmailMessage>;
export type DeleteEmailResponse = Envelope<{ message: string }>;

export interface PostEmailCreateTaskPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type PostEmailCreateTaskResponse = Envelope<Task>;

export interface EmailSyncResponse {
  success: boolean;
  synced: number;
  error?: string;
}

// --- EstateContact types ---

export interface EstateContactItem {
  id?: string;
  estate_id?: string;
  contact_id?: string;
  role?: string;
  notes?: string | null;
  contact?: Contact | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EstateContactListPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface EstateContactListResponse {
  items: EstateContactItem[];
  pagination: PaginationMeta;
}

export interface PostEstateContactLinkRequestBody {
  contact_id: string;
  role?: string;
  notes?: string | null;
}

export interface DeleteEstateContactUnlinkRequestBody {
  contact_id: string;
  role?: string;
}

// --- Estate Image types ---

export const ESTATE_IMAGE_CATEGORIES = [
  "photo",
  "exterior",
  "interior",
  "floor_plan",
  "other",
] as const;

export type EstateImageCategory = (typeof ESTATE_IMAGE_CATEGORIES)[number];

export const ESTATE_IMAGE_CATEGORY_LABELS: Record<
  EstateImageCategory,
  string
> = {
  photo: "Photo",
  exterior: "Exterior",
  interior: "Interior",
  floor_plan: "Floor Plan",
  other: "Other",
};

export interface EstateImagePathParams {
  id: string;
  imageId: string;
  [key: string]: string | number | null;
}

export type PostEstateImageUploadResponse = EstateImage;

export interface PatchEstateImageUpdateRequestBody {
  sort_order?: number;
  title?: string | null;
  alt_text?: string | null;
  is_primary?: boolean;
  category?: string;
}

export type PatchEstateImageUpdateResponse = EstateImage;

export type DeleteEstateImageResponse = { message: string };

// --- Document types ---

export const DOCUMENT_CATEGORIES = [
  "photo",
  "floor_plan",
  "contract",
  "id_document",
  "energy_certificate",
  "expose",
  "invoice",
  "protocol",
  "correspondence",
  "other",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  photo: "Photo",
  floor_plan: "Floor Plan",
  contract: "Contract",
  id_document: "ID Document",
  energy_certificate: "Energy Certificate",
  expose: "Expose",
  invoice: "Invoice",
  protocol: "Protocol",
  correspondence: "Correspondence",
  other: "Other",
};

export interface Document {
  id?: string;
  file_path?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  category?: DocumentCategory | null;
  office_id?: string | null;
  estate_id?: string | null;
  contact_id?: string | null;
  appointment_id?: string | null;
  email_id?: string | null;
  uploaded_by_user_id?: string | null;
  uploaded_by_user?: User | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DocumentListQueryParams {
  category?: string;
  estate_id?: string;
  contact_id?: string;
  appointment_id?: string;
  email_id?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export interface DocumentListResponse {
  items: Document[];
  pagination: PaginationMeta;
}

export interface DocumentByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type GetDocumentShowByIdResponse = Document;

export interface PatchDocumentUpdateByIdRequestBody {
  category?: string | null;
  estate_id?: string | null;
  contact_id?: string | null;
  appointment_id?: string | null;
  email_id?: string | null;
}

export type PatchDocumentUpdateByIdResponse = Envelope<Document>;

export type DeleteDocumentByIdResponse = Envelope<{ message: string }>;

// --- Dashboard types ---

export interface DashboardTaskStats {
  open: number;
  overdue: number;
  due_soon: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  upcoming: Task[];
}

export interface DashboardContactStats {
  total: number;
  by_type: Record<string, number>;
  by_stage: Record<string, number>;
  by_entity_type: Record<string, number>;
  recent: Contact[];
}

export interface DashboardEmailStats {
  total: number;
  unread: number;
  sent: number;
  recent: DashboardRecentEmail[];
}

export interface DashboardRecentEmail {
  id: string;
  subject: string;
  from_address: string;
  direction: string;
  read: boolean;
  received_at: string | null;
}

export interface DashboardMatchingTopMatch {
  estate_id: string;
  estate_title: string;
  contact_id: string;
  contact_name: string;
  contact_type: string;
  score: number;
  profile_name: string;
}

export interface DashboardMatchingStats {
  contacts_with_profiles: number;
  top_matches: DashboardMatchingTopMatch[];
}

export interface DashboardStatsResponse {
  total_estates: number;
  estates_by_status: Record<string, number>;
  estates_by_property_type: Record<string, number>;
  estates_by_marketing_type: Record<string, number>;
  recent_estates: Estate[];
  tasks: DashboardTaskStats;
  contacts: DashboardContactStats;
  emails: DashboardEmailStats;
  matching: DashboardMatchingStats;
}

// --- EmailTemplate types ---

export interface EmailTemplate {
  id?: string;
  name?: string;
  subject?: string;
  body_html?: string | null;
  body_text?: string | null;
  category?: string | null;
  scope?: string;
  active?: boolean;
  office_id?: string | null;
  created_by_user_id?: string | null;
  created_by_user?: User | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EmailTemplateListQueryParams {
  scope?: string;
  category?: string;
  active?: string;
  q?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  order?: string;
}

export interface EmailTemplateListResponse {
  items: EmailTemplate[];
  pagination: PaginationMeta;
}

export interface EmailTemplateByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export type GetEmailTemplateShowByIdResponse = EmailTemplate;

export interface PostEmailTemplateCreateRequestBody {
  name: string;
  subject: string;
  body_html?: string | null;
  body_text?: string | null;
  category?: string | null;
  scope: string;
}

export type PostEmailTemplateCreateResponse = Envelope<EmailTemplate>;

export interface PatchEmailTemplateUpdateRequestBody {
  name?: string;
  subject?: string;
  body_html?: string | null;
  body_text?: string | null;
  category?: string | null;
  active?: boolean;
}

export type PatchEmailTemplateUpdateResponse = Envelope<EmailTemplate>;
export type DeleteEmailTemplateResponse = Envelope<{ message: string }>;

export interface EmailTemplatePlaceholder {
  key: string;
  label: string;
}

export type EmailTemplatePlaceholdersResponse = Record<
  string,
  EmailTemplatePlaceholder[]
>;

export interface PostEmailTemplatePreviewRequestBody {
  contact_id?: string | null;
  estate_id?: string | null;
}

export interface EmailTemplatePreviewResponse {
  subject: string;
  body_html: string | null;
  body_text: string | null;
}

export interface PostEstateDescriptionGenerateRequestBody {
  estate_data: Record<string, unknown>;
  tone: string;
  additional_notes?: string;
}

export interface PostEstateDescriptionGenerateResponse {
  description: string;
}

// --- Brochure AI Content types ---

export interface BrochureContent {
  headline: string;
  description: string;
  highlights: string[];
  location_summary: string;
  call_to_action: string;
}

export interface PostBrochureContentGenerateRequestBody {
  tone: string;
}

export type PostBrochureContentGenerateResponse = BrochureContent;

export interface PostBrochureCreateRequestBody {
  headline: string;
  description: string;
  highlights: string[];
  location_summary: string;
  call_to_action: string;
  image_ids: string[];
}

export type PostBrochureCreateResponse = Document;

// --- Email Template types ---

export interface PostEmailTemplateGenerateRequestBody {
  description: string;
  tone?: string;
  category?: string | null;
}

export interface PostEmailTemplateGenerateResponse {
  subject: string;
  body_html: string;
  body_text: string;
}

// --- Email Draft Generate ---

export interface PostEmailDraftGenerateRequestBody {
  intent: string;
  contact_id?: string | null;
  estate_id?: string | null;
  context_notes?: string | null;
}

export interface PostEmailDraftGenerateResponse {
  subject: string;
  body_html: string;
  body_text: string;
}

// --- Custom Field Definition types ---

export type CustomFieldType = 'text' | 'number' | 'select' | 'boolean' | 'date' | 'textarea';
export type CustomFieldEntityType = 'estate' | 'contact' | 'both';

export interface CustomFieldDefinition {
  id?: string;
  name?: string;
  label?: string;
  field_type?: CustomFieldType;
  entity_type?: CustomFieldEntityType;
  options?: string[] | null;
  required?: boolean;
  sort_order?: number;
  active?: boolean;
  office_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CustomFieldDefinitionListQueryParams {
  entity_type?: string;
  active?: string;
  page?: number;
  per_page?: number;
}

export interface CustomFieldDefinitionListResponse {
  items: CustomFieldDefinition[];
  pagination: PaginationMeta;
}

export interface CustomFieldDefinitionByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PostCustomFieldDefinitionCreateRequestBody {
  name: string;
  label: string;
  field_type: CustomFieldType;
  entity_type: CustomFieldEntityType;
  options?: string[] | null;
  required?: boolean;
  sort_order?: number;
}

export type PostCustomFieldDefinitionCreateResponse = Envelope<CustomFieldDefinition>;

export interface PatchCustomFieldDefinitionUpdateRequestBody {
  label?: string;
  field_type?: CustomFieldType;
  entity_type?: CustomFieldEntityType;
  options?: string[] | null;
  required?: boolean;
  sort_order?: number;
  active?: boolean;
}

export type PatchCustomFieldDefinitionUpdateResponse = Envelope<CustomFieldDefinition>;
export type DeleteCustomFieldDefinitionResponse = Envelope<{ message: string }>;

// --- AuditLog types ---

export interface AuditLog {
  id?: string;
  user_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string | null;
  office_id?: string | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
  user?: User | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type EstateBulkAction = 'status_change' | 'assign' | 'archive';

export interface PostEstateBulkActionRequestBody {
  ids: string[];
  action: EstateBulkAction;
  status?: string;
  assigned_user_id?: string | null;
}

export interface PostEstateBulkActionResponse {
  updated: number;
  skipped: number;
  errors: string[];
}

export interface AuditLogListQueryParams {
  entity_type?: string;
  entity_id?: string;
  action?: string;
  user_id?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  pagination: PaginationMeta;
}

// ================================
// Website Builder Types
// ================================

export interface Website {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  published: boolean;
  user_id?: string | null;
  office_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  pages?: WebsitePage[];
}

export interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  html_content?: string | null;
  sort_order: number;
  published: boolean;
  website_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface WebsitePageVersion {
  id: string;
  page_id?: string | null;
  html_content?: string | null;
  version_number: number;
  change_summary?: string | null;
  created_by_user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface WebsiteChatMessage {
  id: string;
  role: string;
  content?: string | null;
  website_id?: string | null;
  page_id?: string | null;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Website List
export interface WebsiteListQueryParams {
  q?: string;
  published?: string;
  page?: number;
  per_page?: number;
}

export interface WebsiteListResponse {
  items: Website[];
  pagination: PaginationMeta;
}

// Website Show
export interface WebsiteShowPathParams {
  id: string;
}

export type WebsiteShowResponse = Website;

// Website Create
export interface WebsiteCreateRequestBody {
  name: string;
  slug: string;
  description?: string | null;
}

export type WebsiteCreateResponse = Website;

// Website Update
export interface WebsiteUpdatePathParams {
  id: string;
}

export interface WebsiteUpdateRequestBody {
  name?: string;
  slug?: string;
  description?: string | null;
  published?: boolean;
}

export type WebsiteUpdateResponse = Website;

// Website Delete
export interface WebsiteDeletePathParams {
  id: string;
}

export type WebsiteDeleteResponse = { message: string };

// Website Pages
export interface WebsitePageListPathParams {
  websiteId: string;
}

export interface WebsitePageListResponse {
  items: WebsitePage[];
}

export interface WebsitePageShowPathParams {
  websiteId: string;
  id: string;
}

export type WebsitePageShowResponse = WebsitePage;

export interface WebsitePageCreatePathParams {
  websiteId: string;
}

export interface WebsitePageCreateRequestBody {
  title: string;
  slug: string;
  html_content?: string | null;
  sort_order?: number;
}

export type WebsitePageCreateResponse = WebsitePage;

export interface WebsitePageUpdatePathParams {
  websiteId: string;
  id: string;
}

export interface WebsitePageUpdateRequestBody {
  title?: string;
  slug?: string;
  html_content?: string | null;
  sort_order?: number;
  published?: boolean;
}

export type WebsitePageUpdateResponse = WebsitePage;

export interface WebsitePageDeletePathParams {
  websiteId: string;
  id: string;
}

export type WebsitePageDeleteResponse = { message: string };

// Chat
export interface WebsiteChatSendPathParams {
  websiteId: string;
}

export interface WebsiteChatSendRequestBody {
  message: string;
  page_id?: string | null;
}

export interface WebsiteChatSendResponse {
  message: string;
  html: string;
  summary: string;
  page: WebsitePage | null;
}

export interface WebsiteChatListPathParams {
  websiteId: string;
}

export interface WebsiteChatListQueryParams {
  page_id?: string;
}

export interface WebsiteChatListResponse {
  items: WebsiteChatMessage[];
}

// Versions
export interface WebsitePageVersionListPathParams {
  websiteId: string;
  pageId: string;
}

export interface WebsitePageVersionListResponse {
  items: WebsitePageVersion[];
}

export interface WebsitePageVersionRestorePathParams {
  websiteId: string;
  pageId: string;
  versionId: string;
}

export interface WebsitePageVersionRestoreResponse {
  message: string;
  page: WebsitePage;
}

// ================================
// Portal Syndication Types
// ================================

export interface Portal {
  id?: string;
  name?: string;
  portal_type?: 'ftp' | 'api';
  ftp_host?: string | null;
  ftp_port?: number | null;
  ftp_username?: string | null;
  ftp_path?: string | null;
  ftp_passive?: boolean;
  ftp_ssl?: boolean;
  api_url?: string | null;
  provider_id?: string | null;
  active?: boolean;
  last_sync_at?: string | null;
  last_error?: string | null;
  office_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PortalListResponse {
  items: Portal[];
  pagination: PaginationMeta;
}

export interface PostPortalCreateRequestBody {
  name: string;
  portal_type: 'ftp' | 'api';
  ftp_host?: string | null;
  ftp_port?: number | null;
  ftp_username?: string | null;
  ftp_password?: string | null;
  ftp_path?: string | null;
  ftp_passive?: boolean;
  ftp_ssl?: boolean;
  api_url?: string | null;
  api_key?: string | null;
  provider_id?: string | null;
}

export type PostPortalCreateResponse = Envelope<Portal>;

export interface PatchPortalUpdateRequestBody {
  name?: string;
  portal_type?: 'ftp' | 'api';
  ftp_host?: string | null;
  ftp_port?: number | null;
  ftp_username?: string | null;
  ftp_password?: string | null;
  ftp_path?: string | null;
  ftp_passive?: boolean;
  ftp_ssl?: boolean;
  api_url?: string | null;
  api_key?: string | null;
  provider_id?: string | null;
  active?: boolean;
}

export type PatchPortalUpdateResponse = Envelope<Portal>;

export interface PortalByIdPathParams {
  id: string;
  [key: string]: string | number | null;
}

export interface PortalTestResponse {
  success: boolean;
  error?: string | null;
}

export interface SyncResult {
  success: boolean;
  estates_synced: number;
  estates_failed: number;
  error: string | null;
  sync_log_id: string;
}

export interface SyncLog {
  id?: string;
  portal_id?: string;
  estate_id?: string | null;
  action?: string;
  status?: 'started' | 'success' | 'failed';
  error_message?: string | null;
  details?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SyncLogListResponse {
  items: SyncLog[];
  pagination: PaginationMeta;
}

export interface EstateSyndication {
  id?: string;
  estate_id?: string;
  portal_id?: string;
  enabled?: boolean;
  sync_status?: 'pending' | 'syncing' | 'synced' | 'error';
  last_synced_at?: string | null;
  last_error?: string | null;
  external_id?: string | null;
  portal?: Portal;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EstateSyndicationListResponse {
  items: EstateSyndication[];
}

export interface PatchEstateSyndicationUpdateRequestBody {
  enabled?: boolean;
}

export interface EstateSyndicationByIdPathParams {
  id: string;
  syndicationId: string;
  [key: string]: string | number | null;
}

export interface PostEstateSyndicationBulkRequestBody {
  portal_ids: string[];
  enabled: boolean;
}

export interface EstateSyndicationBulkResponse {
  items: EstateSyndication[];
}

export interface FeedbackImportResponse {
  imported: number;
  errors: string[];
}
