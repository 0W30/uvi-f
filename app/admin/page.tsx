'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';
import type {
  EventRecord,
  EventModerationHistoryCreatePayload,
  RoomRecord,
  UserRecord,
  EventApplicationRecord,
  EventModerationHistoryRecord,
} from '../../lib/types/api';
import { useAuth } from '../../lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [pendingEvents, setPendingEvents] = useState<EventRecord[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<EventRecord[]>([]);
  const [rejectedEvents, setRejectedEvents] = useState<EventRecord[]>([]);
  const [draftEvents, setDraftEvents] = useState<EventRecord[]>([]);
  const [applications, setApplications] = useState<Record<string, EventApplicationRecord[]>>({});
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [draftModerationHistory, setDraftModerationHistory] = useState<Record<string, EventModerationHistoryRecord[]>>({});
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'admin' && user.role !== 'curator') {
        router.push('/');
        return;
      }
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [eventsData, roomsData, usersData] = await Promise.all([
          apiClient.getEvents({ limit: 100 }),
          apiClient.getRooms({ limit: 100 }),
          apiClient.getUsers({ limit: 100 }),
        ]);

        setRooms(roomsData);
        setUsers(usersData);

        const pending = eventsData.filter((e) => e.status === 'pending');
        const approved = eventsData.filter((e) => e.status === 'approved');
        const rejected = eventsData.filter((e) => e.status === 'rejected');
        const draft = eventsData.filter((e) => e.status === 'draft');

        setPendingEvents(pending);
        setApprovedEvents(approved);
        setRejectedEvents(rejected);
        setDraftEvents(draft);

        // Загружаем историю модерации для событий на доработке
        const draftHistoryMap: Record<string, EventModerationHistoryRecord[]> = {};
        for (const event of draft) {
          try {
            const history = await apiClient.getEventModerationHistory({
              event_id: event.id,
              limit: 100,
            });
            console.log(`Moderation history for event ${event.id}:`, history);
            draftHistoryMap[event.id] = history;
          } catch (err) {
            console.error(`Failed to load moderation history for event ${event.id}:`, err);
            draftHistoryMap[event.id] = [];
          }
        }
        setDraftModerationHistory(draftHistoryMap);

        // Загружаем заявки для событий с предварительным отбором
        const eventsWithApplications = approved.filter((e) => e.need_approve_candidates);
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

    if (user && (user.role === 'admin' || user.role === 'curator')) {
      loadData();
    }
  }, [user, authLoading, router]);

  const handleApprove = async (eventId: string) => {
    if (!user) return;

    try {
      await apiClient.updateEvent(eventId, { status: 'approved' });

      // Создаем запись в истории модерации
      const moderationPayload: EventModerationHistoryCreatePayload = {
        event_id: eventId,
        curator_id: user.id,
        action: 'approve',
        comment: null,
      };
      await apiClient.createEventModerationHistory(moderationPayload);

      // Обновляем локальное состояние
      const event = pendingEvents.find((e) => e.id === eventId);
      if (event) {
        setPendingEvents(pendingEvents.filter((e) => e.id !== eventId));
        setApprovedEvents([...approvedEvents, { ...event, status: 'approved' }]);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка при одобрении события');
    }
  };

  const handleReject = async (eventId: string) => {
    if (!user) return;

    try {
      await apiClient.updateEvent(eventId, { status: 'rejected' });

      // Создаем запись в истории модерации
      const moderationPayload: EventModerationHistoryCreatePayload = {
        event_id: eventId,
        curator_id: user.id,
        action: 'reject',
        comment: null,
      };
      await apiClient.createEventModerationHistory(moderationPayload);

      // Обновляем локальное состояние
      const event = pendingEvents.find((e) => e.id === eventId);
      if (event) {
        setPendingEvents(pendingEvents.filter((e) => e.id !== eventId));
        setRejectedEvents([...rejectedEvents, { ...event, status: 'rejected' }]);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка при отклонении события');
    }
  };

  const handleRequestRevision = async (eventId: string) => {
    if (!user) return;

    const comment = prompt('Укажите, что нужно доработать в событии:');
    if (comment === null) return; // Пользователь отменил

    try {
      // Отправляем на доработку - возвращаем статус в draft
      await apiClient.updateEvent(eventId, { status: 'draft' });

      // Создаем запись в истории модерации
      const moderationPayload: EventModerationHistoryCreatePayload = {
        event_id: eventId,
        curator_id: user.id,
        action: 'request_changes',
        comment: comment,
      };
      await apiClient.createEventModerationHistory(moderationPayload);

      // Обновляем локальное состояние - убираем из pending
      const event = pendingEvents.find((e) => e.id === eventId);
      if (event) {
        setPendingEvents(pendingEvents.filter((e) => e.id !== eventId));
      }

      alert('Событие отправлено на доработку');
    } catch (err: any) {
      alert(err.message || 'Ошибка при отправке события на доработку');
    }
  };

  const handleDelete = async (eventId: string, status: 'pending' | 'approved' | 'rejected') => {
    if (!user) return;

    if (!confirm('Вы уверены, что хотите удалить это событие? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await apiClient.deleteEvent(eventId);

      // Обновляем локальное состояние
      if (status === 'pending') {
        setPendingEvents(pendingEvents.filter((e) => e.id !== eventId));
      } else if (status === 'approved') {
        setApprovedEvents(approvedEvents.filter((e) => e.id !== eventId));
      } else if (status === 'rejected') {
        setRejectedEvents(rejectedEvents.filter((e) => e.id !== eventId));
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении события');
    }
  };

  const handleComplete = async (eventId: string) => {
    if (!user) return;

    if (!confirm('Завершить это событие? Это действие изменит статус события на "Завершено".')) {
      return;
    }

    try {
      await apiClient.updateEvent(eventId, { status: 'completed' });

      // Обновляем локальное состояние - перемещаем событие из одобренных
      const event = approvedEvents.find((e) => e.id === eventId);
      if (event) {
        setApprovedEvents(approvedEvents.filter((e) => e.id !== eventId));
        // Перезагружаем данные для обновления списков
        const [eventsData] = await Promise.all([
          apiClient.getEvents({ limit: 100 }),
        ]);
        const pending = eventsData.filter((e) => e.status === 'pending');
        const approved = eventsData.filter((e) => e.status === 'approved');
        const rejected = eventsData.filter((e) => e.status === 'rejected');
        setPendingEvents(pending);
        setApprovedEvents(approved);
        setRejectedEvents(rejected);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка при завершении события');
    }
  };

  const toggleEventApplications = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleApplicationRevision = async (applicationId: string, eventId: string) => {
    if (!user) return;

    const comment = prompt('Укажите, что нужно доработать в заявке:');
    if (comment === null) return; // Пользователь отменил

    try {
      // Отправляем на доработку - возвращаем статус в pending и обновляем мотивацию с комментарием
      const application = applications[eventId]?.find((a) => a.id === applicationId);
      const currentMotivation = application?.motivation || '';
      const revisionComment = `[Требуется доработка] ${comment}`;
      const updatedMotivation = currentMotivation 
        ? `${currentMotivation}\n\n${revisionComment}`
        : revisionComment;

      await apiClient.updateEventApplication(applicationId, {
        status: 'pending',
        motivation: updatedMotivation,
      });

      // Обновляем локальное состояние
      const updatedApplications = applications[eventId].map((app) =>
        app.id === applicationId
          ? { ...app, status: 'pending', motivation: updatedMotivation }
          : app
      );
      setApplications({ ...applications, [eventId]: updatedApplications });

      alert('Заявка отправлена на доработку');
    } catch (err: any) {
      alert(err.message || 'Ошибка при отправке заявки на доработку');
    }
  };

  const handleApplicationApprove = async (applicationId: string, eventId: string) => {
    if (!user) return;

    try {
      await apiClient.updateEventApplication(applicationId, { status: 'approved' });

      // Обновляем локальное состояние
      const updatedApplications = applications[eventId].map((app) =>
        app.id === applicationId ? { ...app, status: 'approved' } : app
      );
      setApplications({ ...applications, [eventId]: updatedApplications });
    } catch (err: any) {
      alert(err.message || 'Ошибка при одобрении заявки');
    }
  };

  const handleApplicationReject = async (applicationId: string, eventId: string) => {
    if (!user) return;

    try {
      await apiClient.updateEventApplication(applicationId, { status: 'rejected' });

      // Обновляем локальное состояние
      const updatedApplications = applications[eventId].map((app) =>
        app.id === applicationId ? { ...app, status: 'rejected' } : app
      );
      setApplications({ ...applications, [eventId]: updatedApplications });
    } catch (err: any) {
      alert(err.message || 'Ошибка при отклонении заявки');
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
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        Панель администратора
      </h1>

      {pendingEvents.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          Нет предложенных событий на проверку.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingEvents.map((event) => {
            const room = rooms.find((r) => r.id === event.room_id);
            const creator = users.find((u) => u.id === event.creator_id);
            const curator = users.find((u) => u.id === event.curator_id);

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
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  Дата: {event.event_date}
                  <br />
                  Время: {event.start_time} - {event.end_time}
                  <br />
                  {room && `Аудитория: ${room.name}`}
                  {event.is_external_venue &&
                    `Место: ${event.external_location || 'Внешняя площадка'}`}
                  <br />
                  Создатель: {creator?.login || 'Неизвестно'}
                  <br />
                  Куратор: {curator?.login || 'Неизвестно'}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => handleApprove(event.id)}
                    className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
                  >
                    Одобрить
                  </button>
                  <button
                    onClick={() => handleRequestRevision(event.id)}
                    className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white text-sm"
                  >
                    На доработку
                  </button>
                  <button
                    onClick={() => handleReject(event.id)}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    Отклонить
                  </button>
                  <button
                    onClick={() => handleDelete(event.id, 'pending')}
                    className="px-3 py-1 rounded bg-zinc-600 hover:bg-zinc-700 text-white text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
          Одобренные события
        </h2>
        <div className="space-y-4">
          {approvedEvents.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              Нет одобренных событий.
            </p>
          ) : (
            approvedEvents.map((event) => {
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
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Дата: {event.event_date} | Время: {event.start_time} -{' '}
                    {event.end_time}
                    {room && ` | Аудитория: ${room.name}`}
                    {event.is_external_venue &&
                      ` | Место: ${event.external_location || 'Внешняя площадка'}`}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleComplete(event.id)}
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
                    >
                      Завершить
                    </button>
                    <button
                      onClick={() => handleDelete(event.id, 'approved')}
                      className="px-3 py-1 rounded bg-zinc-600 hover:bg-zinc-700 text-white text-sm"
                    >
                      Удалить
                    </button>
                  </div>

                  {event.need_approve_candidates && (
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
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap">
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
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {application.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleApplicationApprove(application.id, event.id)
                                          }
                                          className="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          Одобрить
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleApplicationReject(application.id, event.id)
                                          }
                                          className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          Отклонить
                                        </button>
                                      </>
                                    )}
                                    {application.status === 'approved' && (
                                      <button
                                        onClick={() =>
                                          handleApplicationRevision(application.id, event.id)
                                        }
                                        className="px-3 py-1 text-xs rounded bg-orange-600 hover:bg-orange-700 text-white"
                                      >
                                        Отправить на доработку
                                      </button>
                                    )}
                                  </div>
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
            })
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
          События на доработке
        </h2>
        <div className="space-y-4">
          {draftEvents.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              Нет событий на доработке.
            </p>
          ) : (
            draftEvents.map((event) => {
              const room = rooms.find((r) => r.id === event.room_id);
              const creator = users.find((u) => u.id === event.creator_id);
              const eventHistory = draftModerationHistory[event.id] || [];
              const revisionComments = eventHistory.filter((h) => h.action === 'request_changes' && h.comment);
              
              console.log(`Event ${event.id} history:`, eventHistory);
              console.log(`Event ${event.id} revision comments:`, revisionComments);
              
              return (
                <div
                  key={event.id}
                  className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow border border-yellow-200 dark:border-yellow-800"
                >
                  <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">
                    {event.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Дата: {event.event_date} | Время: {event.start_time} -{' '}
                    {event.end_time}
                    {room && ` | Аудитория: ${room.name}`}
                    {event.is_external_venue &&
                      ` | Место: ${event.external_location || 'Внешняя площадка'}`}
                    <br />
                    Создатель: {creator?.login || 'Неизвестно'}
                  </p>
                  
                  {/* Показываем комментарии модератора */}
                  {(event.moderation_comment || revisionComments.length > 0) && (
                    <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded border border-yellow-300 dark:border-yellow-700">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        Комментарии для доработки:
                      </p>
                      {/* Используем moderation_comment из EventRecord, если есть */}
                      {event.moderation_comment && (
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          {event.moderation_comment}
                        </div>
                      )}
                      {/* Также показываем комментарии из истории модерации */}
                      {revisionComments.map((h, idx) => (
                        <div key={h.id} className="text-xs text-yellow-700 dark:text-yellow-300 mb-1 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          {idx + 1}. {h.comment}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Отладочная информация - показываем всю историю модерации */}
                  {process.env.NODE_ENV === 'development' && eventHistory.length > 0 && (
                    <div className="mt-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded border border-zinc-300 dark:border-zinc-700">
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                        [DEBUG] История модерации (всего записей: {eventHistory.length}):
                      </p>
                      {eventHistory.map((h, idx) => (
                        <div key={h.id} className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 p-1 bg-zinc-50 dark:bg-zinc-800 rounded">
                          {idx + 1}. Действие: {h.action}, Комментарий: {h.comment || '(нет)'}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleDelete(event.id, 'pending')}
                      className="px-3 py-1 rounded bg-zinc-600 hover:bg-zinc-700 text-white text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
          Отклоненные события
        </h2>
        <div className="space-y-4">
          {rejectedEvents.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              Нет отклоненных событий.
            </p>
          ) : (
            rejectedEvents.map((event) => {
              const room = rooms.find((r) => r.id === event.room_id);
              return (
                <div
                  key={event.id}
                  className="p-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg shadow"
                >
                  <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">
                    {event.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Дата: {event.event_date} | Время: {event.start_time} -{' '}
                    {event.end_time}
                    {room && ` | Аудитория: ${room.name}`}
                    {event.is_external_venue &&
                      ` | Место: ${event.external_location || 'Внешняя площадка'}`}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleDelete(event.id, 'rejected')}
                      className="px-3 py-1 rounded bg-zinc-600 hover:bg-zinc-700 text-white text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
