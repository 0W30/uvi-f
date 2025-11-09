import type {
  LoginPayload,
  RegisterPayload,
  TokenPayload,
  UserRecord,
  UserCreatePayload,
  UserUpdatePayload,
  UserListParams,
  UserProfileRecord,
  UserProfileCreatePayload,
  UserProfileUpdatePayload,
  UserProfileListParams,
  RoomRecord,
  RoomCreatePayload,
  RoomUpdatePayload,
  RoomListParams,
  EventRecord,
  EventCreatePayload,
  EventUpdatePayload,
  EventListParams,
  EventCategoryRecord,
  EventCategoryCreatePayload,
  EventCategoryUpdatePayload,
  EventCategoryListParams,
  EventCategoryMappingRecord,
  EventCategoryMappingCreatePayload,
  EventCategoryMappingUpdatePayload,
  EventCategoryMappingListParams,
  EventRegistrationRecord,
  EventRegistrationCreatePayload,
  EventRegistrationUpdatePayload,
  EventRegistrationListParams,
  EventApplicationRecord,
  EventApplicationCreatePayload,
  EventApplicationUpdatePayload,
  EventApplicationListParams,
  NotificationRecord,
  NotificationCreatePayload,
  NotificationUpdatePayload,
  NotificationListParams,
  EventModerationHistoryRecord,
  EventModerationHistoryCreatePayload,
  EventModerationHistoryUpdatePayload,
  EventModerationHistoryListParams,
  ApplicationHistoryRecord,
  ApplicationHistoryCreatePayload,
  ApplicationHistoryUpdatePayload,
  ApplicationHistoryListParams,
} from '../types/api';

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || statusText);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // Определяем базовый URL в зависимости от окружения
    this.baseUrl = 
      typeof window !== 'undefined' 
        ? '/api' // В браузере используем прокси через Next.js
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'); // На сервере прямой URL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    // Всегда читаем из localStorage для актуальности
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Правильная обработка boolean значений
        if (typeof value === 'boolean') {
          searchParams.append(key, value ? 'true' : 'false');
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Всегда читаем токен из localStorage при каждом запросе
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token');
      this.token = token; // Обновляем внутреннее состояние
    } else {
      token = this.token;
    }

    // Очищаем токен от возможного префикса "Bearer "
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    const url = `${this.baseUrl}${endpoint}`;
    // Сначала устанавливаем базовые заголовки и заголовки из options
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Затем добавляем Authorization заголовок с префиксом Bearer (чтобы он не был перезаписан)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      
      // Если ошибка авторизации, очищаем токен
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          this.token = null;
        }
      }
      
      throw new ApiError(response.status, response.statusText, errorText);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Auth
  async login(payload: LoginPayload): Promise<TokenPayload> {
    return this.request<TokenPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async register(payload: RegisterPayload): Promise<UserRecord> {
    return this.request<UserRecord>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMe(): Promise<UserRecord> {
    return this.request<UserRecord>('/auth/me');
  }

  async refresh(): Promise<TokenPayload> {
    return this.request<TokenPayload>('/auth/refresh', {
      method: 'POST',
    });
  }

  // Users
  async getUsers(params?: UserListParams): Promise<UserRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<UserRecord[]>(`/users${query}`);
  }

  async createUser(payload: UserCreatePayload): Promise<UserRecord> {
    return this.request<UserRecord>('/users/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUser(userId: string): Promise<UserRecord> {
    return this.request<UserRecord>(`/users/${userId}`);
  }

  async updateUser(
    userId: string,
    payload: UserUpdatePayload
  ): Promise<UserRecord> {
    return this.request<UserRecord>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteUser(userId: string): Promise<UserRecord> {
    return this.request<UserRecord>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // User Profiles
  async getUserProfiles(
    params?: UserProfileListParams
  ): Promise<UserProfileRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<UserProfileRecord[]>(`/users/profiles${query}`);
  }

  async createUserProfile(
    payload: UserProfileCreatePayload
  ): Promise<UserProfileRecord> {
    return this.request<UserProfileRecord>('/users/profiles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUserProfile(profileId: string): Promise<UserProfileRecord> {
    return this.request<UserProfileRecord>(`/users/profiles/${profileId}`);
  }

  async updateUserProfile(
    profileId: string,
    payload: UserProfileUpdatePayload
  ): Promise<UserProfileRecord> {
    return this.request<UserProfileRecord>(`/users/profiles/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteUserProfile(profileId: string): Promise<UserProfileRecord> {
    return this.request<UserProfileRecord>(`/users/profiles/${profileId}`, {
      method: 'DELETE',
    });
  }

  async getUserProfileByUserId(userId: string): Promise<UserProfileRecord> {
    return this.request<UserProfileRecord>(`/users/${userId}/profile`);
  }

  // Rooms
  async getRooms(params?: RoomListParams): Promise<RoomRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<RoomRecord[]>(`/rooms${query}`);
  }

  async createRoom(payload: RoomCreatePayload): Promise<RoomRecord> {
    return this.request<RoomRecord>('/rooms/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getRoom(roomId: string): Promise<RoomRecord> {
    return this.request<RoomRecord>(`/rooms/${roomId}`);
  }

  async updateRoom(
    roomId: string,
    payload: RoomUpdatePayload
  ): Promise<RoomRecord> {
    return this.request<RoomRecord>(`/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteRoom(roomId: string): Promise<RoomRecord> {
    return this.request<RoomRecord>(`/rooms/${roomId}`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents(params?: EventListParams): Promise<EventRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<EventRecord[]>(`/events${query}`);
  }

  async createEvent(payload: EventCreatePayload): Promise<EventRecord> {
    return this.request<EventRecord>('/events/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getEvent(eventId: string): Promise<EventRecord> {
    return this.request<EventRecord>(`/events/${eventId}`);
  }

  async getEventModerationHistoryForUser(
    eventId: string
  ): Promise<EventModerationHistoryRecord[]> {
    return this.request<EventModerationHistoryRecord[]>(
      `/events/${eventId}/moderation-history`
    );
  }

  async updateEvent(
    eventId: string,
    payload: EventUpdatePayload
  ): Promise<EventRecord> {
    return this.request<EventRecord>(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteEvent(eventId: string): Promise<EventRecord> {
    return this.request<EventRecord>(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Event Categories
  async getEventCategories(
    params?: EventCategoryListParams
  ): Promise<EventCategoryRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<EventCategoryRecord[]>(`/events/categories${query}`);
  }

  async createEventCategory(
    payload: EventCategoryCreatePayload
  ): Promise<EventCategoryRecord> {
    return this.request<EventCategoryRecord>('/events/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getEventCategory(categoryId: string): Promise<EventCategoryRecord> {
    return this.request<EventCategoryRecord>(`/events/categories/${categoryId}`);
  }

  async updateEventCategory(
    categoryId: string,
    payload: EventCategoryUpdatePayload
  ): Promise<EventCategoryRecord> {
    return this.request<EventCategoryRecord>(`/events/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteEventCategory(
    categoryId: string
  ): Promise<EventCategoryRecord> {
    return this.request<EventCategoryRecord>(`/events/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Event Category Mappings
  async getEventCategoryMappings(
    params?: EventCategoryMappingListParams
  ): Promise<EventCategoryMappingRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<EventCategoryMappingRecord[]>(
      `/events/category-mappings${query}`
    );
  }

  async createEventCategoryMapping(
    payload: EventCategoryMappingCreatePayload
  ): Promise<EventCategoryMappingRecord> {
    return this.request<EventCategoryMappingRecord>(
      '/events/category-mappings',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  async getEventCategoryMapping(
    mappingId: string
  ): Promise<EventCategoryMappingRecord> {
    return this.request<EventCategoryMappingRecord>(
      `/events/category-mappings/${mappingId}`
    );
  }

  async updateEventCategoryMapping(
    mappingId: string,
    payload: EventCategoryMappingUpdatePayload
  ): Promise<EventCategoryMappingRecord> {
    return this.request<EventCategoryMappingRecord>(
      `/events/category-mappings/${mappingId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteEventCategoryMapping(
    mappingId: string
  ): Promise<EventCategoryMappingRecord> {
    return this.request<EventCategoryMappingRecord>(
      `/events/category-mappings/${mappingId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Event Registrations
  async getEventRegistrations(
    params?: EventRegistrationListParams
  ): Promise<EventRegistrationRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<EventRegistrationRecord[]>(
      `/events/registrations${query}`
    );
  }

  async createEventRegistration(
    payload: EventRegistrationCreatePayload
  ): Promise<EventRegistrationRecord> {
    return this.request<EventRegistrationRecord>('/events/registrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getEventRegistration(
    registrationId: string
  ): Promise<EventRegistrationRecord> {
    return this.request<EventRegistrationRecord>(
      `/events/registrations/${registrationId}`
    );
  }

  async updateEventRegistration(
    registrationId: string,
    payload: EventRegistrationUpdatePayload
  ): Promise<EventRegistrationRecord> {
    return this.request<EventRegistrationRecord>(
      `/events/registrations/${registrationId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteEventRegistration(
    registrationId: string
  ): Promise<EventRegistrationRecord> {
    return this.request<EventRegistrationRecord>(
      `/events/registrations/${registrationId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Event Applications
  async getEventApplications(
    params?: EventApplicationListParams
  ): Promise<EventApplicationRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<EventApplicationRecord[]>(`/events/applications${query}`);
  }

  async createEventApplication(
    payload: EventApplicationCreatePayload
  ): Promise<EventApplicationRecord> {
    return this.request<EventApplicationRecord>('/events/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getEventApplication(
    applicationId: string
  ): Promise<EventApplicationRecord> {
    return this.request<EventApplicationRecord>(
      `/events/applications/${applicationId}`
    );
  }

  async updateEventApplication(
    applicationId: string,
    payload: EventApplicationUpdatePayload
  ): Promise<EventApplicationRecord> {
    return this.request<EventApplicationRecord>(
      `/events/applications/${applicationId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteEventApplication(
    applicationId: string
  ): Promise<EventApplicationRecord> {
    return this.request<EventApplicationRecord>(
      `/events/applications/${applicationId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Notifications
  async getNotifications(
    params?: NotificationListParams
  ): Promise<NotificationRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<NotificationRecord[]>(`/notifications${query}`);
  }

  async createNotification(
    payload: NotificationCreatePayload
  ): Promise<NotificationRecord> {
    return this.request<NotificationRecord>('/notifications/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getNotification(notificationId: string): Promise<NotificationRecord> {
    return this.request<NotificationRecord>(`/notifications/${notificationId}`);
  }

  async updateNotification(
    notificationId: string,
    payload: NotificationUpdatePayload
  ): Promise<NotificationRecord> {
    return this.request<NotificationRecord>(`/notifications/${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteNotification(
    notificationId: string
  ): Promise<NotificationRecord> {
    return this.request<NotificationRecord>(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Moderation
  async getEventModerationHistory(
    params?: EventModerationHistoryListParams
  ): Promise<EventModerationHistoryRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<EventModerationHistoryRecord[]>(
      `/moderation/event-history${query}`
    );
  }

  async createEventModerationHistory(
    payload: EventModerationHistoryCreatePayload
  ): Promise<EventModerationHistoryRecord> {
    return this.request<EventModerationHistoryRecord>(
      '/moderation/event-history',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  async getEventModerationHistoryItem(
    historyId: string
  ): Promise<EventModerationHistoryRecord> {
    return this.request<EventModerationHistoryRecord>(
      `/moderation/event-history/${historyId}`
    );
  }

  async updateEventModerationHistory(
    historyId: string,
    payload: EventModerationHistoryUpdatePayload
  ): Promise<EventModerationHistoryRecord> {
    return this.request<EventModerationHistoryRecord>(
      `/moderation/event-history/${historyId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteEventModerationHistory(
    historyId: string
  ): Promise<EventModerationHistoryRecord> {
    return this.request<EventModerationHistoryRecord>(
      `/moderation/event-history/${historyId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async getApplicationHistory(
    params?: ApplicationHistoryListParams
  ): Promise<ApplicationHistoryRecord[]> {
    const query = params ? this.buildQueryString(params) : '';
    return this.request<ApplicationHistoryRecord[]>(
      `/moderation/application-history${query}`
    );
  }

  async createApplicationHistory(
    payload: ApplicationHistoryCreatePayload
  ): Promise<ApplicationHistoryRecord> {
    return this.request<ApplicationHistoryRecord>(
      '/moderation/application-history',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  async getApplicationHistoryItem(
    historyId: string
  ): Promise<ApplicationHistoryRecord> {
    return this.request<ApplicationHistoryRecord>(
      `/moderation/application-history/${historyId}`
    );
  }

  async updateApplicationHistory(
    historyId: string,
    payload: ApplicationHistoryUpdatePayload
  ): Promise<ApplicationHistoryRecord> {
    return this.request<ApplicationHistoryRecord>(
      `/moderation/application-history/${historyId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteApplicationHistory(
    historyId: string
  ): Promise<ApplicationHistoryRecord> {
    return this.request<ApplicationHistoryRecord>(
      `/moderation/application-history/${historyId}`,
      {
        method: 'DELETE',
      }
    );
  }
}

export const apiClient = new ApiClient();
export { ApiError };

