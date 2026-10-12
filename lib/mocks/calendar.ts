// NOT IMPLEMENTED (MVP): mock events for the calendar view. Dates are computed
// relative to the moment the module loads so the current month always has
// events. Places are fictional/generic; no real people are mentioned.

import type { CalendarEvent, EventType } from "@/lib/types/calendar";

export const eventTypeLabel: Record<EventType, string> = {
  carrete: "Carrete",
  academico: "Académico",
  alianza: "Alianza",
  taller: "Taller",
};

export const eventTypes: EventType[] = ["carrete", "academico", "alianza", "taller"];

/** Reference "now" for the mock (module load time). */
export const mockNow = new Date();

/** Event starting `offsetDays` from today at `hour:minute`, lasting `durationMinutes`. */
function fromToday(offsetDays: number, hour: number, minute: number, durationMinutes: number) {
  const start = new Date(mockNow.getFullYear(), mockNow.getMonth(), mockNow.getDate() + offsetDays, hour, minute);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

/** Event anchored to a day of the current month (+`monthOffset`). */
function onMonthDay(monthOffset: number, day: number, hour: number, minute: number, durationMinutes: number) {
  const start = new Date(mockNow.getFullYear(), mockNow.getMonth() + monthOffset, day, hour, minute);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

export const mockEvents: CalendarEvent[] = [
  {
    id: "evt-001",
    title: "Taller de Excel para ramos de primer año",
    type: "taller",
    description: "Fórmulas, tablas dinámicas y gráficos básicos para sobrevivir a los informes. Trae tu notebook.",
    ...onMonthDay(0, 2, 15, 0, 90),
    place: "Sala de computación, piso 2",
    capacity: 30,
    registered: 30,
    points: 40,
    extraFields: [],
  },
  {
    id: "evt-002",
    title: "Charla: cómo elegir major sin morir en el intento",
    type: "academico",
    description: "Estudiantes de distintos majors cuentan su experiencia y responden preguntas.",
    ...fromToday(1, 13, 0, 60),
    place: "Auditorio central",
    capacity: 120,
    registered: 64,
    points: 30,
    extraFields: [
      {
        id: "major-interest",
        label: "¿Qué major te interesa?",
        type: "select",
        options: ["Todavía no sé", "Computación", "Industrial", "Civil", "Mecánica", "Eléctrica", "Otro"],
        required: false,
      },
    ],
  },
  {
    id: "evt-003",
    title: "Carrete de bienvenida",
    type: "carrete",
    description: "La fiesta de inicio de semestre. Entrada con credencial, hay bebestibles sin alcohol y música hasta la 1.",
    ...fromToday(3, 21, 0, 240),
    place: "Patio de Ingeniería",
    capacity: 400,
    registered: 312,
    points: 20,
    extraFields: [
      {
        id: "dietary",
        label: "Restricciones alimentarias",
        type: "text",
        placeholder: "Ej: vegetariano, sin gluten",
        required: false,
      },
    ],
  },
  {
    id: "evt-004",
    title: "Alianzas: lanzamiento y sorteo de colores",
    type: "alianza",
    description: "Se presentan los equipos, se sortean los colores y parte la primera prueba del año.",
    ...fromToday(6, 12, 30, 90),
    place: "Explanada frente a la biblioteca",
    capacity: 250,
    registered: 98,
    points: 50,
    extraFields: [
      {
        id: "team",
        label: "¿Con qué equipo quieres ir?",
        type: "select",
        options: ["Me da lo mismo", "Equipo Rojo", "Equipo Azul", "Equipo Verde"],
        required: true,
      },
    ],
  },
  {
    id: "evt-005",
    title: "Taller de LaTeX y escritura de informes",
    type: "taller",
    description: "Plantillas listas para usar, referencias y cómo no pelear con las imágenes.",
    ...fromToday(9, 16, 0, 120),
    place: "Sala B-14",
    capacity: 25,
    registered: 17,
    points: 40,
    extraFields: [
      {
        id: "laptop",
        label: "¿Traes notebook?",
        type: "select",
        options: ["Sí", "No, necesito uno prestado"],
        required: true,
      },
    ],
  },
  {
    id: "evt-006",
    title: "Ayudantía abierta de Cálculo",
    type: "academico",
    description: "Repaso antes de la primera interrogación, con ejercicios tipo prueba.",
    ...fromToday(13, 18, 0, 120),
    place: "Sala A-22",
    capacity: 60,
    registered: 41,
    points: 25,
    extraFields: [],
  },
  {
    id: "evt-007",
    title: "Noche de karaoke CAi",
    type: "carrete",
    description: "Karaoke, pizza y premios al peor cantante de la noche. Entrada liberada para estudiantes.",
    ...onMonthDay(1, 4, 20, 0, 180),
    place: "Casino de la escuela",
    capacity: 150,
    registered: 72,
    points: 20,
    extraFields: [
      {
        id: "dietary",
        label: "Restricciones alimentarias",
        type: "text",
        placeholder: "Ej: vegano, alergia a frutos secos",
        required: false,
      },
    ],
  },
  {
    id: "evt-008",
    title: "Alianzas: gymkana por el campus",
    type: "alianza",
    description: "Pruebas por estaciones en zonas comunes del campus. Ropa cómoda y mucha agua.",
    ...onMonthDay(1, 11, 10, 0, 240),
    place: "Patio de Ingeniería",
    capacity: 300,
    registered: 120,
    points: 60,
    extraFields: [
      {
        id: "team",
        label: "Equipo",
        type: "select",
        options: ["Equipo Rojo", "Equipo Azul", "Equipo Verde"],
        required: true,
      },
      {
        id: "shirt-size",
        label: "Talla de polera",
        type: "select",
        options: ["S", "M", "L", "XL"],
        required: false,
      },
    ],
  },
  {
    id: "evt-009",
    title: "Taller de CV y primera práctica",
    type: "taller",
    description: "Cómo armar un CV de una página y dónde buscar prácticas de verano.",
    ...onMonthDay(1, 18, 15, 30, 90),
    place: "Sala de reuniones del CAi",
    capacity: 40,
    registered: 12,
    points: 35,
    extraFields: [],
  },
];

/** Fake subscription URL shown in the ".ics" dialog. Nothing is served there. */
export const mockIcsUrl = "https://cai.ejemplo.cl/calendario/demo.ics";
