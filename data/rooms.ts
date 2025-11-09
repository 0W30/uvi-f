// data/rooms.ts
export interface Slot {
  id: string;
  time: string;
  booked: boolean;
}

export interface Room {
  id: string;
  name: string;
  slots: Slot[];
}

export const rooms: Room[] = [
  {
    id: 'b502',
    name: 'B502',
    slots: [
      { id: 'b502-1', time: '09:00–10:00', booked: false },
      { id: 'b502-2', time: '10:00–11:00', booked: true },
      { id: 'b502-3', time: '11:00–12:00', booked: false },
    ],
  },
  {
    id: 'b504',
    name: 'B504',
    slots: [
      { id: 'b504-1', time: '09:00–10:00', booked: false },
      { id: 'b504-2', time: '10:00–11:00', booked: false },
      { id: 'b504-3', time: '11:00–12:00', booked: true },
    ],
  },
  {
    id: 'b506',
    name: 'B506',
    slots: [
      { id: 'b506-1', time: '09:00–10:00', booked: true },
      { id: 'b506-2', time: '10:00–11:00', booked: false },
      { id: 'b506-3', time: '11:00–12:00', booked: false },
    ],
  },
];
