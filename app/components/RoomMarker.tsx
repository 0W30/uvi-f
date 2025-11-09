'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EventForm from './EventForm';
import type { EventRecord } from '../../lib/types/api';

interface RoomMarkerProps {
  roomId: string;
  name: string;
  top: string; // в процентах — например "45%"
  left: string;
  events: EventRecord[]; // Реальные события из API
}

export default function RoomMarker({
  roomId,
  name,
  top,
  left,
  events,
}: RoomMarkerProps) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Фильтруем только одобренные события
  const approvedEvents = events.filter((e) => e.status === 'approved');

  return (
    <div
      className="absolute z-50"
      style={{ top, left, transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}
    >
      {/* Метка */}
      <motion.div
        onClick={() => setOpen(!open)}
        className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm shadow-lg"
        whileHover={{ scale: 1.1 }}
      >
        {name}
      </motion.div>

      {/* Всплывающее окно с информацией */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-xl shadow-lg p-4 z-50"
          >
            <h3 className="font-semibold text-base mb-2">{name}</h3>
            
            {approvedEvents.length > 0 ? (
              <>
                <p className="text-sm mb-2 text-zinc-600 dark:text-zinc-400">
                  Запланированные события:
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {approvedEvents.map((event) => (
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
                      {event.max_participants && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                          {event.registered_count}/{event.max_participants} участников
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm mb-3 text-zinc-600 dark:text-zinc-400">
                Нет запланированных событий
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 text-sm rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                Закрыть
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                Создать событие
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showForm && (
        <EventForm
          roomId={roomId}
          roomName={name}
          onClose={() => {
            setShowForm(false);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
