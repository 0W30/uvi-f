'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PdfViewer from '../../components/PdfViewer';
import RoomMarker from '@/app/components/RoomMarker';
import { apiClient } from '../../../lib/api/client';
import type { RoomRecord, EventRecord } from '../../../lib/types/api';
import { useAuth } from '../../../lib/contexts/AuthContext';

interface MapPageClientProps {
  pageNumber: number;
}

// Статическое позиционирование комнат на карте для страницы 6
const ROOM_POSITIONS: Record<string, { top: string; left: string }> = {
  B502: { top: '50%', left: '38%' },
  B504: { top: '35%', left: '40%' },
  B506: { top: '25%', left: '40%' },
};

// Комнаты, которые отображаются на странице 6
const MAP_PAGE_6_ROOMS = ['B502', 'B504', 'B506'];

export default function MapPageClient({ pageNumber }: MapPageClientProps) {
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [roomsData, eventsData] = await Promise.all([
          apiClient.getRooms({ limit: 100 }),
          apiClient.getEvents({ limit: 100 }),
        ]);
        
        // Фильтруем комнаты только B502, B504, B506
        const filteredRooms = roomsData.filter((room) =>
          MAP_PAGE_6_ROOMS.includes(room.name)
        );
        setRooms(filteredRooms);
        
        setEvents(eventsData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load rooms:', err);
        setLoading(false);
      }
    };

    // Загружаем данные независимо от авторизации
    loadData();
  }, [user, pageNumber]);

  const getRoomEvents = (roomId: string) => {
    return events.filter((e) => e.room_id === roomId);
  };


  const prevPage = pageNumber > 1 ? pageNumber - 1 : null;
  const nextPage = totalPages && pageNumber < totalPages ? pageNumber + 1 : null;
  const isLastPage = totalPages !== null && pageNumber === totalPages;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <div className="container mx-auto px-4 py-8 max-w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Карта кампуса
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Страница {pageNumber}{totalPages ? ` из ${totalPages}` : ''}
          </p>
          <div className="flex gap-2">
            {prevPage && (
              <Link
                href={`/map/${prevPage}`}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                ← Предыдущая
              </Link>
            )}
            {nextPage ? (
              <Link
                href={`/map/${nextPage}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Следующая →
              </Link>
            ) : isLastPage ? (
              <span className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg cursor-not-allowed">
                Последняя страница
              </span>
            ) : (
              <Link
                href={`/map/${pageNumber + 1}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Следующая →
              </Link>
            )}
          </div>
        </div>
        {/* Контейнер для PDF и маркеров с relative позиционированием */}
        <div className="relative w-full">
          <PdfViewer 
            pdfPath="/map.pdf" 
            pageNumber={pageNumber}
            onTotalPagesChange={setTotalPages}
          />
          {/* Показываем маркеры для комнат B502, B504, B506 */}
          {!loading && rooms.length > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
              {rooms
                .filter((room) => MAP_PAGE_6_ROOMS.includes(room.name) && ROOM_POSITIONS[room.name])
                .map((room) => {
                  const position = ROOM_POSITIONS[room.name];
                  const roomEvents = getRoomEvents(room.id);

                  return (
                    <RoomMarker
                      key={room.id}
                      roomId={room.id}
                      name={room.name}
                      top={position.top}
                      left={position.left}
                      events={roomEvents}
                    />
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

