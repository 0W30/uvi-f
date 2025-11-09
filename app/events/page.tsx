'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';
import type { EventRecord, RoomRecord, EventRegistrationRecord, EventApplicationRecord } from '../../lib/types/api';
import { useAuth } from '../../lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AllEventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistrationRecord[]>([]);
  const [applications, setApplications] = useState<EventApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<Set<string>>(new Set());
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Фильтры
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed',
    event_type: 'all' as 'all' | 'student' | 'official',
    room_id: 'all' as string,
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Формируем параметры запроса для фильтрации
        const eventParams: any = { limit: 100 };
        if (filters.status !== 'all') {
          eventParams.status = filters.status;
        }
        if (filters.event_type !== 'all') {
          eventParams.event_type = filters.event_type;
        }
        if (filters.room_id !== 'all') {
          eventParams.room_id = filters.room_id;
        }
        if (filters.date_from) {
          eventParams.date_from = filters.date_from;
        }
        if (filters.date_to) {
          eventParams.date_to = filters.date_to;
        }

        const [eventsData, roomsData, registrationsData, applicationsData] = await Promise.all([
          apiClient.getEvents(eventParams),
          apiClient.getRooms({ limit: 100 }),
          user ? apiClient.getEventRegistrations({ user_id: user.id, limit: 100 }) : Promise.resolve([]),
          user ? apiClient.getEventApplications({ applicant_id: user.id, limit: 100 }) : Promise.resolve([]),
        ]);
        setEvents(eventsData);
        setRooms(roomsData);
        setRegistrations(registrationsData);
        setApplications(applicationsData);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, authLoading, router, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      event_type: 'all',
      room_id: 'all',
      date_from: '',
      date_to: '',
    });
  };

  const isRegistered = (eventId: string) => {
    return registrations.some((r) => r.event_id === eventId);
  };

  const hasApplication = (eventId: string) => {
    return applications.some((a) => a.event_id === eventId);
  };

  const getApplicationStatus = (eventId: string) => {
    const application = applications.find((a) => a.event_id === eventId);
    return application?.status;
  };

  const handleRegister = async (eventId: string) => {
    if (!user) return;

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    // Проверка на максимальное количество участников
    if (event.max_participants && event.registered_count >= event.max_participants) {
      alert('Достигнуто максимальное количество участников');
      return;
    }

    // Проверка, не зарегистрирован ли уже
    if (isRegistered(eventId)) {
      alert('Вы уже зарегистрированы на это событие');
      return;
    }

    try {
      setRegistering((prev) => new Set(prev).add(eventId));
      await apiClient.createEventRegistration({
        event_id: eventId,
        user_id: user.id,
        comment: null,
      });

      // Обновляем список регистраций
      const updatedRegistrations = await apiClient.getEventRegistrations({
        user_id: user.id,
        limit: 100,
      });
      setRegistrations(updatedRegistrations);

      // Обновляем счетчик зарегистрированных в событии
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === eventId
            ? { ...e, registered_count: e.registered_count + 1 }
            : e
        )
      );

      alert('Вы успешно зарегистрированы на событие!');
    } catch (err: any) {
      alert(err.message || 'Ошибка при регистрации на событие');
    } finally {
      setRegistering((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const handleApply = async (eventId: string) => {
    if (!user) return;

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    // Проверка, не подал ли уже заявку
    if (hasApplication(eventId)) {
      const status = getApplicationStatus(eventId);
      if (status === 'pending') {
        alert('Вы уже подали заявку на это событие. Ожидайте рассмотрения.');
      } else if (status === 'approved') {
        alert('Ваша заявка уже одобрена!');
      } else if (status === 'rejected') {
        alert('Ваша заявка была отклонена.');
      }
      return;
    }

    const motivation = prompt('Укажите мотивацию для участия (необязательно):');
    if (motivation === null) return; // Пользователь отменил

    try {
      setApplying((prev) => new Set(prev).add(eventId));
      await apiClient.createEventApplication({
        event_id: eventId,
        applicant_id: user.id,
        status: 'pending',
        motivation: motivation || null,
      });

      // Обновляем список заявок
      const updatedApplications = await apiClient.getEventApplications({
        applicant_id: user.id,
        limit: 100,
      });
      setApplications(updatedApplications);

      alert('Заявка успешно подана! Ожидайте рассмотрения.');
    } catch (err: any) {
      alert(err.message || 'Ошибка при подаче заявки');
    } finally {
      setApplying((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-6 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-6">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-6">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Доступные мероприятия</h1>

      {/* Панель фильтров */}
      <div className="mb-6 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Фильтры
          </h2>
          <button
            onClick={resetFilters}
            className="px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 underline"
          >
            Сбросить
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Фильтр по статусу */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Статус
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            >
              <option value="all">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="pending">На модерации</option>
              <option value="approved">Одобрено</option>
              <option value="rejected">Отклонено</option>
              <option value="cancelled">Отменено</option>
              <option value="completed">Завершено</option>
            </select>
          </div>

          {/* Фильтр по типу события */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Тип события
            </label>
            <select
              value={filters.event_type}
              onChange={(e) => handleFilterChange('event_type', e.target.value)}
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            >
              <option value="all">Все типы</option>
              <option value="student">Студенческое</option>
              <option value="official">Официальное</option>
            </select>
          </div>

          {/* Фильтр по аудитории */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Аудитория
            </label>
            <select
              value={filters.room_id}
              onChange={(e) => handleFilterChange('room_id', e.target.value)}
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            >
              <option value="all">Все аудитории</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Фильтр по дате от */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Дата от
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          {/* Фильтр по дате до */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Дата до
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            />
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          Нет доступных мероприятий.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const room = rooms.find((r) => r.id === event.room_id);
            return (
              <div
                key={event.id}
                className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 mb-2">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    {event.description}
                  </p>
                )}
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Дата: {event.event_date}
                  <br />
                  Время: {event.start_time} - {event.end_time}
                  <br />
                  {room && `Аудитория: ${room.name}`}
                  {event.is_external_venue &&
                    `Место: ${event.external_location || 'Внешняя площадка'}`}
                  <br />
                  Статус: {event.status}
                  <br />
                  {event.max_participants &&
                    `Участников: ${event.registered_count}/${event.max_participants}`}
                </p>
                {event.status === 'approved' && event.creator_id !== user?.id && (
                  <div className="mt-3">
                    {event.need_approve_candidates ? (
                      // Для событий с предварительным отбором
                      (() => {
                        const applicationStatus = getApplicationStatus(event.id);
                        const hasApp = hasApplication(event.id);
                        
                        if (hasApp && applicationStatus === 'pending') {
                          return (
                            <div className="px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-sm text-center">
                              Заявка на рассмотрении
                            </div>
                          );
                        } else if (hasApp && applicationStatus === 'approved') {
                          return (
                            <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm text-center">
                              Заявка одобрена
                            </div>
                          );
                        } else if (hasApp && applicationStatus === 'rejected') {
                          return (
                            <div className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm text-center">
                              Заявка отклонена
                            </div>
                          );
                        } else {
                          return (
                            <button
                              onClick={() => handleApply(event.id)}
                              disabled={
                                applying.has(event.id) ||
                                (event.max_participants !== null &&
                                  event.registered_count >= event.max_participants)
                              }
                              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                                applying.has(event.id) ||
                                (event.max_participants !== null &&
                                  event.registered_count >= event.max_participants)
                                  ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {applying.has(event.id)
                                ? 'Отправка...'
                                : event.max_participants !== null &&
                                  event.registered_count >= event.max_participants
                                ? 'Мест нет'
                                : 'Подать заявку'}
                            </button>
                          );
                        }
                      })()
                    ) : (
                      // Для обычных событий
                      isRegistered(event.id) ? (
                        <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm text-center">
                          Вы зарегистрированы
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegister(event.id)}
                          disabled={
                            registering.has(event.id) ||
                            (event.max_participants !== null &&
                              event.registered_count >= event.max_participants)
                          }
                          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                            registering.has(event.id) ||
                            (event.max_participants !== null &&
                              event.registered_count >= event.max_participants)
                              ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {registering.has(event.id)
                            ? 'Регистрация...'
                            : event.max_participants !== null &&
                              event.registered_count >= event.max_participants
                            ? 'Мест нет'
                            : 'Записаться на событие'}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
