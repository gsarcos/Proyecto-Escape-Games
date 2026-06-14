export const roomSchedules = {
  'Catalepsia': [
    '09:15', '10:45', '12:15', '13:45', '15:15', '16:45', '18:15',
    '19:45', '21:15', '22:45', '00:15', '01:45', '03:15'
  ],
  'Los Extraños': [
    '09:15', '10:45', '12:15', '13:45', '15:15', '16:45', '18:15',
    '19:45', '21:15', '22:45', '00:15', '01:45', '03:15'
  ],
  'Búsqueda Implacable': [
    '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00',
    '19:30', '21:00', '22:30', '00:00', '01:30', '03:00'
  ],
  'Sherlock Holmes': [
    '08:45', '10:15', '11:45', '13:15', '14:45', '16:15', '17:45',
    '19:15', '20:45', '22:15', '23:45', '01:15', '02:45'
  ],
  'El Carnicero de Almagro': [
    '08:30', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30',
    '19:00', '20:30', '22:00', '23:30', '01:00', '02:30'
  ],
  'Psicosis': [
    '08:30', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30',
    '19:00', '20:30', '22:00', '23:30', '01:00', '02:30'
  ]
};

export const escapeRooms = Object.keys(roomSchedules);

export const legacyRoomMap = {
  'Misterio del Faraón': 'Sherlock Holmes',
  ['Misterio del Fara\u00c3\u00b3n']: 'Sherlock Holmes',
  'Laboratorio del Dr. Chaos': 'Catalepsia',
  'Laboratorio Zombie': 'Catalepsia',
  'La Mansión Embrujada': 'Los Extraños',
  ['La Mansi\u00c3\u00b3n Embrujada']: 'Los Extraños',
  'Atraco al Banco Central': 'Búsqueda Implacable',
  'Frankenstein': 'Psicosis'
};

const scheduleOrder = [
  '08:30', '08:45', '09:00', '09:15',
  '10:00', '10:15', '10:30', '10:45',
  '11:30', '11:45', '12:00', '12:15',
  '13:00', '13:15', '13:30', '13:45',
  '14:30', '14:45', '15:00', '15:15',
  '16:00', '16:15', '16:30', '16:45',
  '17:30', '17:45', '18:00', '18:15',
  '19:00', '19:15', '19:30', '19:45',
  '20:30', '20:45', '21:00', '21:15',
  '22:00', '22:15', '22:30', '22:45',
  '23:30', '23:45', '00:00', '00:15',
  '01:00', '01:15', '01:30', '01:45',
  '02:30', '02:45', '03:00', '03:15'
];

export const allRoomHours = scheduleOrder.filter((hour) =>
  escapeRooms.some((room) => roomSchedules[room].includes(hour))
);

export function normalizeRoomName(room) {
  return legacyRoomMap[room] || (escapeRooms.includes(room) ? room : escapeRooms[0]);
}

function toMinutes(hour) {
  if (!hour) return null;
  const [rawHour, rawMinutes = '00'] = String(hour).split(':');
  const parsedHour = Number(rawHour);
  const parsedMinutes = Number(rawMinutes);
  if (Number.isNaN(parsedHour) || Number.isNaN(parsedMinutes)) return null;
  return parsedHour * 60 + parsedMinutes;
}

export function normalizeRoomHour(room, hour) {
  const normalizedRoom = normalizeRoomName(room);
  const schedule = roomSchedules[normalizedRoom] || [];
  if (schedule.includes(hour)) return hour;
  const minutes = toMinutes(hour);
  if (minutes === null) return schedule[0] || hour;

  return schedule.reduce((closest, current) => {
    const currentDistance = Math.abs(toMinutes(current) - minutes);
    const closestDistance = Math.abs(toMinutes(closest) - minutes);
    return currentDistance < closestDistance ? current : closest;
  }, schedule[0]) || hour;
}
