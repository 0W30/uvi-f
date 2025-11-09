'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';
import type { RoomRecord, EventRecord } from '../../lib/types/api';
import { useAuth } from '../../lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import EventForm from '../components/EventForm';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
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
        const [roomsData, eventsData] = await Promise.all([
          apiClient.getRooms({ limit: 100, is_available: true }),
          apiClient.getEvents({ limit: 100 }),
        ]);
        setRooms(roomsData);
        setEvents(eventsData);
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

  const getRoomEvents = (roomId: string) => {
    return events.filter((e) => e.room_id === roomId);
  };

  const isRoomBusy = (roomId: string, date: string, time: string) => {
    const roomEvents = getRoomEvents(roomId);
    return roomEvents.some(
      (e) => e.event_date === date && e.start_time <= time && e.end_time > time
    );
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
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">
        Аудитории
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const roomEvents = getRoomEvents(room.id);
          const isExpanded = expandedRoom === room.id;

          return (
            <div
              key={room.id}
              className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">
                  {room.name}
                </h2>
                <span className="px-2 py-1 rounded text-sm bg-blue-500 text-white">
                  Вместимость: {room.capacity}
                </span>
              </div>
              {room.location && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  {room.location}
                </p>
              )}

              {isExpanded && (
                <div className="mt-2 space-y-2">
                  {roomEvents.length === 0 ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Нет забронированных событий
                    </p>
                  ) : (
                    roomEvents.map((event) => (
                      <div
                        key={event.id}
                        className="px-3 py-2 rounded-md border bg-zinc-100 dark:bg-zinc-900"
                      >
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {event.title}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {event.event_date} {event.start_time} - {event.end_time}
                        </p>
                      </div>
                    ))
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoom(room);
                    }}
                    className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                  >
                    Забронировать аудиторию
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Форма регистрации события */}
      {selectedRoom && (
        <EventForm
          roomId={selectedRoom.id}
          roomName={selectedRoom.name}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
