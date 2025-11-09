// Типы на основе API reference

export type UserRole = 'admin' | 'curator' | 'student';
export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type EventType = 'student' | 'official';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ModerationAction = 'submit' | 'approve' | 'reject' | 'request_changes';
export type NotificationType = 'application_status' | 'event_reminder' | 'new_event' | 'system';

// Auth
export interface LoginPayload {
  login: string;
  password: string;
}

export interface RegisterPayload {
  login: string;
  password: string;
  role?: UserRole;
  telegram_username?: string | null;
  telegram_chat_id?: string | null;
}

export interface TokenPayload {
  access_token: string;
  token_type: string;
  user_id: string;
}

// Users
export interface UserRecord {
  id: string;
  login: string;
  role: UserRole;
  telegram_username: string | null;
  telegram_chat_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface UserCreatePayload {
  login: string;
  password_hash: string;
  role?: UserRole;
  telegram_username?: string | null;
  telegram_chat_id?: string | null;
}

export interface UserUpdatePayload {
  login?: string | null;
  password_hash?: string | null;
  role?: UserRole | null;
  telegram_username?: string | null;
  telegram_chat_id?: string | null;
}

export interface UserListParams {
  offset?: number;
  limit?: number;
  role?: UserRole | null;
}

export interface UserProfileRecord {
  id: string;
  user_id: string;
  faculty: string | null;
  study_group: string | null;
  interests: Record<string, any> | null;
  notification_preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string | null;
}

export interface UserProfileCreatePayload {
  user_id: string;
  faculty?: string | null;
  study_group?: string | null;
  interests?: Record<string, any> | null;
  notification_preferences?: Record<string, any> | null;
}

export interface UserProfileUpdatePayload {
  faculty?: string | null;
  study_group?: string | null;
  interests?: Record<string, any> | null;
  notification_preferences?: Record<string, any> | null;
}

export interface UserProfileListParams {
  offset?: number;
  limit?: number;
  user_id?: string | null;
}

// Rooms
export interface RoomRecord {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  equipment: Record<string, any> | null;
  is_available: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface RoomCreatePayload {
  name: string;
  capacity: number;
  location?: string | null;
  equipment?: Record<string, any> | null;
  is_available?: boolean;
}

export interface RoomUpdatePayload {
  name?: string | null;
  capacity?: number | null;
  location?: string | null;
  equipment?: Record<string, any> | null;
  is_available?: boolean | null;
}

export interface RoomListParams {
  offset?: number;
  limit?: number;
  is_available?: boolean | null;
}

// Events
export interface EventRecord {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  registered_count: number;
  max_participants: number | null;
  status: EventStatus;
  event_type: EventType;
  creator_id: string;
  curator_id: string;
  is_external_venue: boolean;
  room_id: string | null;
  external_location: string | null;
  need_approve_candidates: boolean;
  created_at: string;
  updated_at: string | null;
  moderation_comment?: string | null;
}

export interface EventCreatePayload {
  title: string;
  description?: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  max_participants?: number | null;
  status?: EventStatus;
  event_type?: EventType;
  creator_id: string;
  curator_id: string;
  is_external_venue?: boolean;
  room_id?: string | null;
  external_location?: string | null;
  need_approve_candidates?: boolean;
}

export interface EventUpdatePayload {
  title?: string | null;
  description?: string | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  registered_count?: number | null;
  max_participants?: number | null;
  status?: EventStatus | null;
  event_type?: EventType | null;
  creator_id?: string | null;
  curator_id?: string | null;
  is_external_venue?: boolean | null;
  room_id?: string | null;
  external_location?: string | null;
  need_approve_candidates?: boolean | null;
}

export interface EventListParams {
  offset?: number;
  limit?: number;
  status?: EventStatus | null;
  event_type?: EventType | null;
  creator_id?: string | null;
  curator_id?: string | null;
  room_id?: string | null;
  date_from?: string | null;
  date_to?: string | null;
}

// Event Categories
export interface EventCategoryRecord {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EventCategoryCreatePayload {
  name: string;
  description?: string | null;
  color?: string | null;
}

export interface EventCategoryUpdatePayload {
  name?: string | null;
  description?: string | null;
  color?: string | null;
}

export interface EventCategoryListParams {
  offset?: number;
  limit?: number;
  name?: string | null;
}

// Event Category Mappings
export interface EventCategoryMappingRecord {
  id: string;
  event_id: string;
  category_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface EventCategoryMappingCreatePayload {
  event_id: string;
  category_id: string;
}

export interface EventCategoryMappingUpdatePayload {
  event_id?: string | null;
  category_id?: string | null;
}

export interface EventCategoryMappingListParams {
  offset?: number;
  limit?: number;
  event_id?: string | null;
  category_id?: string | null;
}

// Event Registrations
export interface EventRegistrationRecord {
  id: string;
  event_id: string;
  user_id: string;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EventRegistrationCreatePayload {
  event_id: string;
  user_id: string;
  comment?: string | null;
}

export interface EventRegistrationUpdatePayload {
  comment?: string | null;
}

export interface EventRegistrationListParams {
  offset?: number;
  limit?: number;
  event_id?: string | null;
  user_id?: string | null;
}

// Event Applications
export interface EventApplicationRecord {
  id: string;
  event_id: string;
  applicant_id: string;
  status: string;
  motivation: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EventApplicationCreatePayload {
  event_id: string;
  applicant_id: string;
  status?: ApplicationStatus;
  motivation?: string | null;
}

export interface EventApplicationUpdatePayload {
  status?: ApplicationStatus | null;
  motivation?: string | null;
}

export interface EventApplicationListParams {
  offset?: number;
  limit?: number;
  event_id?: string | null;
  applicant_id?: string | null;
  status?: ApplicationStatus | null;
}

// Notifications
export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_event_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface NotificationCreatePayload {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read?: boolean;
  related_event_id?: string | null;
}

export interface NotificationUpdatePayload {
  type?: NotificationType | null;
  title?: string | null;
  message?: string | null;
  is_read?: boolean | null;
  related_event_id?: string | null;
}

export interface NotificationListParams {
  offset?: number;
  limit?: number;
  user_id?: string | null;
  type?: NotificationType | null;
  is_read?: boolean | null;
}

// Moderation
export interface EventModerationHistoryRecord {
  id: string;
  event_id: string;
  curator_id: string;
  action: ModerationAction;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EventModerationHistoryCreatePayload {
  event_id: string;
  curator_id: string;
  action: ModerationAction;
  comment?: string | null;
}

export interface EventModerationHistoryUpdatePayload {
  action?: ModerationAction | null;
  comment?: string | null;
}

export interface EventModerationHistoryListParams {
  offset?: number;
  limit?: number;
  event_id?: string | null;
  curator_id?: string | null;
}

export interface ApplicationHistoryRecord {
  id: string;
  application_id: string;
  moderator_id: string;
  action: ModerationAction;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ApplicationHistoryCreatePayload {
  application_id: string;
  moderator_id: string;
  action: ModerationAction;
  comment?: string | null;
}

export interface ApplicationHistoryUpdatePayload {
  action?: ModerationAction | null;
  comment?: string | null;
}

export interface ApplicationHistoryListParams {
  offset?: number;
  limit?: number;
  application_id?: string | null;
  moderator_id?: string | null;
}

