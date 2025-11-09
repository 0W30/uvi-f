'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';
import type { EventRecord, EventRegistrationRecord, RoomRecord, EventApplicationRecord, UserRecord } from '../../lib/types/api';
import { useAuth } from '../../lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function MyEventsPage() {
  const [createdEvents, setCreatedEvents] = useState<EventRecord[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<EventRecord[]>([]);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [applications, setApplications] = useState<Record<string, EventApplicationRecord[]>>({});
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [allEvents, registrations, roomsData, usersData] = await Promise.all([
          apiClient.getEvents({ limit: 100 }),
          apiClient.getEventRegistrations({ user_id: user!.id, limit: 100 }),
          apiClient.getRooms({ limit: 100 }),
          apiClient.getUsers({ limit: 100 }),
        ]);

        setRooms(roomsData);
        setUsers(usersData);

        // События, созданные пользователем
        const myCreated = allEvents.filter((e) => e.creator_id === user!.id);
        setCreatedEvents(myCreated);

        // События, на которые пользователь зарегистрирован
        const registeredEventIds = registrations.map((r) => r.event_id);
        const myRegistered = allEvents.filter((e) =>
          registeredEventIds.includes(e.id)
        );
        setRegisteredEvents(myRegistered);

        // Загружаем заявки для событий с предварительным отбором
        const eventsWithApplications = myCreated.filter((e) => e.need_approve_candidates);
        const applicationsMap: Record<string, EventApplicationRecord[]> = {};
        
        for (const event of eventsWithApplications) {
          try {
            const eventApplications = await apiClient.getEventApplications({
              event_id: event.id,
              limit: 100,
            });
            applicationsMap[event.id] = eventApplications;
          } catch (err) {
            console.error(`Failed to load applications for event ${event.id}:`, err);
            applicationsMap[event.id] = [];
          }
        }
        
        setApplications(applicationsMap);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const toggleEventApplications = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleApplicationStatusChange = async (
    applicationId: string,
    eventId: string,
    newStatus: 'approved' | 'rejected'
  ) => {
    try {
      await apiClient.updateEventApplication(applicationId, { status: newStatus });
      
      // Обновляем локальное состояние
      const updatedApplications = applications[eventId].map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      );
      setApplications({ ...applications, [eventId]: updatedApplications });
    } catch (err: any) {
      alert(err.message || 'Ошибка при изменении статуса заявки');
    }
  };

  const handleComplete = async (eventId: string) => {
    if (!user) return;

    if (!confirm('Завершить это событие? Это действие изменит статус события на "Завершено".')) {
      return;
    }

    try {
      await apiClient.updateEvent(eventId, { status: 'completed' });
      
      // Обновляем локальное состояние
      setCreatedEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === eventId ? { ...e, status: 'completed' } : e
        )
      );
      
      alert('Событие успешно завершено!');
    } catch (err: any) {
      alert(err.message || 'Ошибка при завершении события');
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
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Мои события</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
          Созданные мной
        </h2>
        {createdEvents.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Вы ещё не создали события.
          </p>
        ) : (
          <div className="space-y-4">
            {createdEvents.map((event) => {
              const room = rooms.find((r) => r.id === event.room_id);
              const eventApplications = applications[event.id] || [];
              const pendingApplications = eventApplications.filter((a) => a.status === 'pending');
              const isExpanded = expandedEvents.has(event.id);
              
              return (
                <div
                  key={event.id}
                  className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">
                      {event.title}
                    </h3>
                    {event.need_approve_candidates && (
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        С отбором
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      {event.description}
                    </p>
                  )}
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Дата: {event.event_date} | Время: {event.start_time} -{' '}
                    {event.end_time}
                    <br />
                    {room && `Аудитория: ${room.name}`}
                    {event.is_external_venue &&
                      `Место: ${event.external_location || 'Внешняя площадка'}`}
                    <br />
                    Статус: {event.status}
                    {event.max_participants &&
                      ` | Участников: ${event.registered_count}/${event.max_participants}`}
                  </p>

                  {/* Показываем комментарии из истории модерации для событий на доработке */}
                  {event.status === 'draft' && (
                    <div className="mt-2 mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                        Комментарии модератора:
                      </p>
                      {/* Используем moderation_comment из EventRecord */}
                      {event.moderation_comment ? (
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">
                          {event.moderation_comment}
                        </div>
                      ) : (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          Нет комментариев
                        </p>
                      )}
                    </div>
                  )}
                  
                  {event.status === 'approved' && (
                    <div className="mt-2 mb-3">
                      <button
                        onClick={() => handleComplete(event.id)}
                        className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
                      >
                        Завершить событие
                      </button>
                    </div>
                  )}
                  
                  {event.need_approve_candidates && event.status === 'approved' && (
                    <div className="mt-3 border-t border-zinc-200 dark:border-zinc-700 pt-3">
                      <button
                        onClick={() => toggleEventApplications(event.id)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
                      >
                        {isExpanded ? 'Скрыть' : 'Показать'} заявки ({pendingApplications.length} на рассмотрении, {eventApplications.length} всего)
                      </button>
                      
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          {eventApplications.length === 0 ? (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              Заявок пока нет
                            </p>
                          ) : (
                            eventApplications.map((application) => {
                              const applicant = users.find((u) => u.id === application.applicant_id);
                              return (
                                <div
                                  key={application.id}
                                  className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
                                        {applicant?.login || 'Неизвестный пользователь'}
                                      </p>
                                      {application.motivation && (
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                          {application.motivation}
                                        </p>
                                      )}
                                    </div>
                                    <span
                                      className={`px-2 py-1 text-xs rounded ${
                                        application.status === 'approved'
                                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                          : application.status === 'rejected'
                                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                      }`}
                                    >
                                      {application.status === 'approved'
                                        ? 'Одобрено'
                                        : application.status === 'rejected'
                                        ? 'Отклонено'
                                        : 'На рассмотрении'}
                                    </span>
                                  </div>
                                  {application.status === 'pending' && (
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() =>
                                          handleApplicationStatusChange(
                                            application.id,
                                            event.id,
                                            'approved'
                                          )
                                        }
                                        className="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        Одобрить
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleApplicationStatusChange(
                                            application.id,
                                            event.id,
                                            'rejected'
                                          )
                                        }
                                        className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white"
                                      >
                                        Отклонить
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
          На которые я записался
        </h2>
        {registeredEvents.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Вы ещё не записаны на события.
          </p>
        ) : (
          <div className="space-y-4">
            {registeredEvents.map((event) => {
              const room = rooms.find((r) => r.id === event.room_id);
              return (
                <div
                  key={event.id}
                  className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow"
                >
                  <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 mb-2">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      {event.description}
                    </p>
                  )}
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Дата: {event.event_date} | Время: {event.start_time} -{' '}
                    {event.end_time}
                    <br />
                    {room && `Аудитория: ${room.name}`}
                    {event.is_external_venue &&
                      `Место: ${event.external_location || 'Внешняя площадка'}`}
                    <br />
                    Статус: {event.status}
                    {event.max_participants &&
                      ` | Участников: ${event.registered_count}/${event.max_participants}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
