'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';
import type { UserRecord, EventCreatePayload } from '../../lib/types/api';
import { useAuth } from '../../lib/contexts/AuthContext';

interface EventFormProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

export default function EventForm({
  roomId,
  roomName,
  onClose,
}: EventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number | ''>('');
  const [curators, setCurators] = useState<UserRecord[]>([]);
  const [selectedCuratorId, setSelectedCuratorId] = useState<string>('');
  const [isExternalVenue, setIsExternalVenue] = useState(false);
  const [externalLocation, setExternalLocation] = useState('');
  const [needApproveCandidates, setNeedApproveCandidates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadCurators = async () => {
      try {
        const curatorsData = await apiClient.getUsers({
          role: 'curator',
          limit: 100,
        });
        setCurators(curatorsData);
        if (curatorsData.length > 0) {
          setSelectedCuratorId(curatorsData[0].id);
        }
      } catch (err) {
        console.error('Failed to load curators:', err);
      }
    };
    loadCurators();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setLoading(true);

    try {
      const payload: EventCreatePayload = {
        title,
        description: description || null,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        max_participants: maxParticipants ? Number(maxParticipants) : null,
        status: 'pending',
        event_type: 'student',
        creator_id: user.id,
        curator_id: selectedCuratorId,
        is_external_venue: isExternalVenue,
        room_id: isExternalVenue ? null : roomId,
        external_location: isExternalVenue ? externalLocation : null,
        need_approve_candidates: needApproveCandidates,
      };

      await apiClient.createEvent(payload);
      alert(`Событие "${title}" успешно создано и отправлено на модерацию`);
      onClose();
      
      // Вызываем callback для обновления данных, если он передан
      // Иначе перезагружаем страницу
      if (typeof window !== 'undefined') {
        // Небольшая задержка перед обновлением, чтобы дать время бэкенду обработать
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка создания события');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 p-6 rounded-lg shadow-lg w-[90%] max-w-4xl min-w-[700px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Создание события</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Аудитория: <b>{roomName}</b>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Название события *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Дата *</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Время начала *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Время окончания *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Максимум участников
            </label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) =>
                setMaxParticipants(e.target.value ? Number(e.target.value) : '')
              }
              min="1"
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Куратор *</label>
            <select
              value={selectedCuratorId}
              onChange={(e) => setSelectedCuratorId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            >
              {curators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.login}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isExternalVenue}
                onChange={(e) => setIsExternalVenue(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Внешняя площадка</span>
            </label>
          </div>

          {isExternalVenue && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Адрес внешней площадки *
              </label>
              <input
                type="text"
                value={externalLocation}
                onChange={(e) => setExternalLocation(e.target.value)}
                required={isExternalVenue}
                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={needApproveCandidates}
                onChange={(e) => setNeedApproveCandidates(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Требуется одобрение заявок</span>
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-6">
              Если включено, участники будут подавать заявки, которые вы сможете одобрять или отклонять
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать событие'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
