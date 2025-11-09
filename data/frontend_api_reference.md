# Frontend API Reference

## Authentication and Access
- All endpoints require the header `Authorization: Bearer <token>` unless marked as public.
- Moderation endpoints additionally require the authenticated user role to be either `admin` or `curator`.

## Auth (`/auth`)

### Routes
| Method | Path | Auth | Query | Body | Response | Status |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /auth/login | Public | – | `LoginPayload` | `TokenPayload` | 200 |
| POST | /auth/register | Public | – | `RegisterPayload` | `UserRecord` | 201 |
| GET | /auth/me | Bearer | – | – | `UserRecord` | 200 |
| POST | /auth/refresh | Bearer | – | – | `TokenPayload` | 200 |

### Schemas

#### LoginPayload
| Field | Type | Description |
| --- | --- | --- |
| login | str | User login identifier |
| password | str | Plain-text password |

#### RegisterPayload
| Field | Type | Description |
| --- | --- | --- |
| login | str | Unique login |
| password | str | Plain-text password |
| role | `UserRole` | Defaults to `student` |
| telegram_username | str \| None | Optional Telegram username |
| telegram_chat_id | str \| None | Optional Telegram chat id |

#### TokenPayload
| Field | Type | Description |
| --- | --- | --- |
| access_token | str | JWT access token |
| token_type | str | Always `bearer` |
| user_id | UUID | Authenticated user id |

## Users (`/users`)

### Routes
| Method | Path | Auth | Query | Body | Response | Status |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /users/ | Bearer | `UserListParams` | – | list[`UserRecord`] | 200 |
| POST | /users/ | Bearer | – | `UserCreatePayload` | `UserRecord` | 201 |
| GET | /users/{user_id} | Bearer | – | – | `UserRecord` | 200 |
| PUT | /users/{user_id} | Bearer | – | `UserUpdatePayload` | `UserRecord` | 200 |
| DELETE | /users/{user_id} | Bearer | – | – | `UserRecord` | 200 |
| GET | /users/profiles | Bearer | `UserProfileListParams` | – | list[`UserProfileRecord`] | 200 |
| POST | /users/profiles | Bearer | – | `UserProfileCreatePayload` | `UserProfileRecord` | 201 |
| GET | /users/profiles/{profile_id} | Bearer | – | – | `UserProfileRecord` | 200 |
| PUT | /users/profiles/{profile_id} | Bearer | – | `UserProfileUpdatePayload` | `UserProfileRecord` | 200 |
| DELETE | /users/profiles/{profile_id} | Bearer | – | – | `UserProfileRecord` | 200 |
| GET | /users/{user_id}/profile | Bearer | – | – | `UserProfileRecord` | 200 |

### Schemas

#### UserCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| login | str | Unique login |
| password_hash | str | Pre-hashed password |
| role | `UserRole` | Defaults to `student` |
| telegram_username | str \| None | Optional Telegram username |
| telegram_chat_id | str \| None | Optional Telegram chat id |

#### UserUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| login | str \| None | Updated login |
| password_hash | str \| None | Updated password hash |
| role | `UserRole` \| None | Updated role |
| telegram_username | str \| None | Updated Telegram username |
| telegram_chat_id | str \| None | Updated Telegram chat id |

#### UserListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| role | `UserRole` \| None | Filter by role |

#### UserRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | User id |
| login | str | Login |
| role | `UserRole` | Role |
| telegram_username | str \| None | Telegram username |
| telegram_chat_id | str \| None | Telegram chat id |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

#### UserProfileCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| user_id | UUID | Related user id |
| faculty | str \| None | Faculty info |
| study_group | str \| None | Study group |
| interests | dict[str, Any] \| None | Arbitrary interests |
| notification_preferences | dict[str, Any] \| None | Notification preferences |

#### UserProfileUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| faculty | str \| None | Updated faculty |
| study_group | str \| None | Updated study group |
| interests | dict[str, Any] \| None | Updated interests |
| notification_preferences | dict[str, Any] \| None | Updated notification preferences |

#### UserProfileListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| user_id | UUID \| None | Filter by user id |

#### UserProfileRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Profile id |
| user_id | UUID | Related user id |
| faculty | str \| None | Faculty |
| study_group | str \| None | Study group |
| interests | dict[str, Any] \| None | Interests |
| notification_preferences | dict[str, Any] \| None | Notification prefs |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

## Rooms (`/rooms`)

### Routes
| Method | Path | Auth | Query | Body | Response | Status |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /rooms/ | Bearer | `RoomListParams` | – | list[`RoomRecord`] | 200 |
| POST | /rooms/ | Bearer | – | `RoomCreatePayload` | `RoomRecord` | 201 |
| GET | /rooms/{room_id} | Bearer | – | – | `RoomRecord` | 200 |
| PUT | /rooms/{room_id} | Bearer | – | `RoomUpdatePayload` | `RoomRecord` | 200 |
| DELETE | /rooms/{room_id} | Bearer | – | – | `RoomRecord` | 200 |

### Schemas

#### RoomCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| name | str | Room name |
| capacity | int | Capacity |
| location | str \| None | Location description |
| equipment | dict[str, Any] \| None | Equipment metadata |
| is_available | bool | Defaults to true |

#### RoomUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| name | str \| None | Updated name |
| capacity | int \| None | Updated capacity |
| location | str \| None | Updated location |
| equipment | dict[str, Any] \| None | Updated equipment |
| is_available | bool \| None | Updated availability |

#### RoomListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| is_available | bool \| None | Filter by availability |

#### RoomRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Room id |
| name | str | Room name |
| capacity | int | Capacity |
| location | str \| None | Location |
| equipment | dict[str, Any] \| None | Equipment |
| is_available | bool | Availability flag |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

## Events (`/events`)

### Routes
| Method | Path | Auth | Query | Body | Response | Status |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /events/ | Bearer | `EventListParams` | – | list[`EventRecord`] | 200 |
| POST | /events/ | Bearer | – | `EventCreatePayload` | `EventRecord` | 201 |
| GET | /events/{event_id} | Bearer | – | – | `EventRecord` | 200 |
| PUT | /events/{event_id} | Bearer | – | `EventUpdatePayload` | `EventRecord` | 200 |
| DELETE | /events/{event_id} | Bearer | – | – | `EventRecord` | 200 |
| GET | /events/categories | Bearer | `EventCategoryListParams` | – | list[`EventCategoryRecord`] | 200 |
| POST | /events/categories | Bearer | – | `EventCategoryCreatePayload` | `EventCategoryRecord` | 201 |
| GET | /events/categories/{category_id} | Bearer | – | – | `EventCategoryRecord` | 200 |
| PUT | /events/categories/{category_id} | Bearer | – | `EventCategoryUpdatePayload` | `EventCategoryRecord` | 200 |
| DELETE | /events/categories/{category_id} | Bearer | – | – | `EventCategoryRecord` | 200 |
| GET | /events/category-mappings | Bearer | `EventCategoryMappingListParams` | – | list[`EventCategoryMappingRecord`] | 200 |
| POST | /events/category-mappings | Bearer | – | `EventCategoryMappingCreatePayload` | `EventCategoryMappingRecord` | 201 |
| GET | /events/category-mappings/{mapping_id} | Bearer | – | – | `EventCategoryMappingRecord` | 200 |
| PUT | /events/category-mappings/{mapping_id} | Bearer | – | `EventCategoryMappingUpdatePayload` | `EventCategoryMappingRecord` | 200 |
| DELETE | /events/category-mappings/{mapping_id} | Bearer | – | – | `EventCategoryMappingRecord` | 200 |
| GET | /events/registrations | Bearer | `EventRegistrationListParams` | – | list[`EventRegistrationRecord`] | 200 |
| POST | /events/registrations | Bearer | – | `EventRegistrationCreatePayload` | `EventRegistrationRecord` | 201 |
| GET | /events/registrations/{registration_id} | Bearer | – | – | `EventRegistrationRecord` | 200 |
| PUT | /events/registrations/{registration_id} | Bearer | – | `EventRegistrationUpdatePayload` | `EventRegistrationRecord` | 200 |
| DELETE | /events/registrations/{registration_id} | Bearer | – | – | `EventRegistrationRecord` | 200 |
| GET | /events/applications | Bearer | `EventApplicationListParams` | – | list[`EventApplicationRecord`] | 200 |
| POST | /events/applications | Bearer | – | `EventApplicationCreatePayload` | `EventApplicationRecord` | 201 |
| GET | /events/applications/{application_id} | Bearer | – | – | `EventApplicationRecord` | 200 |
| PUT | /events/applications/{application_id} | Bearer | – | `EventApplicationUpdatePayload` | `EventApplicationRecord` | 200 |
| DELETE | /events/applications/{application_id} | Bearer | – | – | `EventApplicationRecord` | 200 |

### Schemas

#### EventCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| title | str | Event title |
| description | str \| None | Event description |
| event_date | date | Event date |
| start_time | time | Start time |
| end_time | time | End time |
| max_participants | int \| None | Max participants |
| status | `EventStatus` | Defaults to `draft` |
| event_type | `EventType` | Defaults to `student` |
| creator_id | UUID | Creator user id |
| curator_id | UUID | Responsible curator id |
| is_external_venue | bool | Defaults to false |
| room_id | UUID \| None | Linked room |
| external_location | str \| None | External venue |
| need_approve_candidates | bool | Defaults to false |

#### EventUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| title | str \| None | Updated title |
| description | str \| None | Updated description |
| event_date | date \| None | Updated date |
| start_time | time \| None | Updated start time |
| end_time | time \| None | Updated end time |
| registered_count | int \| None | Override registered count |
| max_participants | int \| None | Updated capacity |
| status | `EventStatus` \| None | Updated status |
| event_type | `EventType` \| None | Updated type |
| creator_id | UUID \| None | Updated creator |
| curator_id | UUID \| None | Updated curator |
| is_external_venue | bool \| None | Updated external flag |
| room_id | UUID \| None | Updated room |
| external_location | str \| None | Updated location |
| need_approve_candidates | bool \| None | Updated approval flag |

#### EventListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| status | `EventStatus` \| None | Filter by status |
| event_type | `EventType` \| None | Filter by type |
| creator_id | UUID \| None | Filter by creator |
| curator_id | UUID \| None | Filter by curator |
| room_id | UUID \| None | Filter by room |
| date_from | date \| None | Filter start date |
| date_to | date \| None | Filter end date |

#### EventRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Event id |
| title | str | Title |
| description | str \| None | Description |
| event_date | date | Date |
| start_time | time | Start time |
| end_time | time | End time |
| registered_count | int | Current registrations |
| max_participants | int \| None | Capacity |
| status | `EventStatus` | Moderation status |
| event_type | `EventType` | Event type |
| creator_id | UUID | Creator id |
| curator_id | UUID | Curator id |
| is_external_venue | bool | External venue flag |
| room_id | UUID \| None | Assigned room |
| external_location | str \| None | External location |
| need_approve_candidates | bool | Requires approval flag |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |
| moderation_comment | str \| None | Latest curator rejection comment |

#### EventCategoryCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| name | str | Category name |
| description | str \| None | Description |
| color | str \| None | Display color |

#### EventCategoryUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| name | str \| None | Updated name |
| description | str \| None | Updated description |
| color | str \| None | Updated color |

#### EventCategoryListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| name | str \| None | Filter by name |

#### EventCategoryRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Record id |
| name | str | Category name |
| description | str \| None | Description |
| color | str \| None | Color |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

#### EventCategoryMappingCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| event_id | UUID | Event id |
| category_id | UUID | Category id |

#### EventCategoryMappingUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| event_id | UUID \| None | Updated event id |
| category_id | UUID \| None | Updated category id |

#### EventCategoryMappingListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| event_id | UUID \| None | Filter by event |
| category_id | UUID \| None | Filter by category |

#### EventCategoryMappingRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Mapping id |
| event_id | UUID | Event id |
| category_id | UUID | Category id |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

#### EventRegistrationCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| event_id | UUID | Event id |
| user_id | UUID | User id |
| comment | str \| None | Optional comment |

#### EventRegistrationUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| comment | str \| None | Updated comment |

#### EventRegistrationListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| event_id | UUID \| None | Filter by event |
| user_id | UUID \| None | Filter by user |

#### EventRegistrationRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Registration id |
| event_id | UUID | Event id |
| user_id | UUID | User id |
| comment | str \| None | Registration comment |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

#### EventApplicationCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| event_id | UUID | Event id |
| applicant_id | UUID | Applicant id |
| status | `ApplicationStatus` | Defaults to `pending` |
| motivation | str \| None | Motivation text |

#### EventApplicationUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| status | `ApplicationStatus` \| None | Updated status |
| motivation | str \| None | Updated motivation |

#### EventApplicationListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| event_id | UUID \| None | Filter by event |
| applicant_id | UUID \| None | Filter by applicant |
| status | `ApplicationStatus` \| None | Filter by status |

#### EventApplicationRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Application id |
| event_id | UUID | Event id |
| applicant_id | UUID | Applicant id |
| status | str | Application status |
| motivation | str \| None | Motivation |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

## Notifications (`/notifications`)

### Routes
| Method | Path | Auth | Query | Body | Response | Status |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /notifications/ | Bearer | `NotificationListParams` | – | list[`NotificationRecord`] | 200 |
| POST | /notifications/ | Bearer | – | `NotificationCreatePayload` | `NotificationRecord` | 201 |
| GET | /notifications/{notification_id} | Bearer | – | – | `NotificationRecord` | 200 |
| PUT | /notifications/{notification_id} | Bearer | – | `NotificationUpdatePayload` | `NotificationRecord` | 200 |
| DELETE | /notifications/{notification_id} | Bearer | – | – | `NotificationRecord` | 200 |

### Schemas

#### NotificationCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| user_id | UUID | Recipient user id |
| type | `NotificationType` | Notification type |
| title | str | Title |
| message | str | Message body |
| is_read | bool | Defaults to false |
| related_event_id | UUID \| None | Linked event |

#### NotificationUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| type | `NotificationType` \| None | Updated type |
| title | str \| None | Updated title |
| message | str \| None | Updated message |
| is_read | bool \| None | Updated read flag |
| related_event_id | UUID \| None | Updated event link |

#### NotificationListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| user_id | UUID \| None | Filter by user |
| type | `NotificationType` \| None | Filter by type |
| is_read | bool \| None | Filter by read flag |

#### NotificationRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Notification id |
| user_id | UUID | Recipient id |
| type | `NotificationType` | Type |
| title | str | Title |
| message | str | Message body |
| is_read | bool | Read flag |
| related_event_id | UUID \| None | Linked event |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

## Moderation (`/moderation`)

### Routes
| Method | Path | Auth | Query | Body | Response | Status |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /moderation/event-history | Bearer (admin or curator) | `EventModerationHistoryListParams` | – | list[`EventModerationHistoryRecord`] | 200 |
| POST | /moderation/event-history | Bearer (admin or curator) | – | `EventModerationHistoryCreatePayload` | `EventModerationHistoryRecord` | 201 |
| GET | /moderation/event-history/{history_id} | Bearer (admin or curator) | – | – | `EventModerationHistoryRecord` | 200 |
| PUT | /moderation/event-history/{history_id} | Bearer (admin or curator) | – | `EventModerationHistoryUpdatePayload` | `EventModerationHistoryRecord` | 200 |
| DELETE | /moderation/event-history/{history_id} | Bearer (admin or curator) | – | – | `EventModerationHistoryRecord` | 200 |
| GET | /moderation/application-history | Bearer (admin or curator) | `ApplicationHistoryListParams` | – | list[`ApplicationHistoryRecord`] | 200 |
| POST | /moderation/application-history | Bearer (admin or curator) | – | `ApplicationHistoryCreatePayload` | `ApplicationHistoryRecord` | 201 |
| GET | /moderation/application-history/{history_id} | Bearer (admin or curator) | – | – | `ApplicationHistoryRecord` | 200 |
| PUT | /moderation/application-history/{history_id} | Bearer (admin or curator) | – | `ApplicationHistoryUpdatePayload` | `ApplicationHistoryRecord` | 200 |
| DELETE | /moderation/application-history/{history_id} | Bearer (admin or curator) | – | – | `ApplicationHistoryRecord` | 200 |

### Schemas

#### EventModerationHistoryCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| event_id | UUID | Event id |
| curator_id | UUID | Curator id |
| action | `ModerationAction` | Moderation action |
| comment | str \| None | Optional comment |

#### EventModerationHistoryUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| action | `ModerationAction` \| None | Updated action |
| comment | str \| None | Updated comment |

#### EventModerationHistoryListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| event_id | UUID \| None | Filter by event |
| curator_id | UUID \| None | Filter by curator |

#### EventModerationHistoryRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Record id |
| event_id | UUID | Event id |
| curator_id | UUID | Curator id |
| action | `ModerationAction` | Action |
| comment | str \| None | Comment |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

#### ApplicationHistoryCreatePayload
| Field | Type | Description |
| --- | --- | --- |
| application_id | UUID | Application id |
| moderator_id | UUID | Moderator id |
| action | `ModerationAction` | Action |
| comment | str \| None | Optional comment |

#### ApplicationHistoryUpdatePayload
| Field | Type | Description |
| --- | --- | --- |
| action | `ModerationAction` \| None | Updated action |
| comment | str \| None | Updated comment |

#### ApplicationHistoryListParams
| Field | Type | Description |
| --- | --- | --- |
| offset | int | Offset, default 0 |
| limit | int | Page size, default 100, max 500 |
| application_id | UUID \| None | Filter by application |
| moderator_id | UUID \| None | Filter by moderator |

#### ApplicationHistoryRecord
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Record id |
| application_id | UUID | Application id |
| moderator_id | UUID | Moderator id |
| action | `ModerationAction` | Action |
| comment | str \| None | Comment |
| created_at | datetime | Creation timestamp |
| updated_at | datetime \| None | Update timestamp |

## Shared Enumerations

| Enum | Values |
| --- | --- |
| `UserRole` | `admin`, `curator`, `student` |
| `EventStatus` | `draft`, `pending`, `approved`, `rejected`, `cancelled`, `completed` |
| `EventType` | `student`, `official` |
| `ApplicationStatus` | `pending`, `approved`, `rejected` |
| `ModerationAction` | `submit`, `approve`, `reject`, `request_changes` |
| `NotificationType` | `application_status`, `event_reminder`, `new_event`, `system` |
