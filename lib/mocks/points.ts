// NOT IMPLEMENTED (MVP): mock data for the "CAiPuntos" view. Nicknames are
// fictional and no reward is real. Replace with real data when wired.

import type { PointsAccount, PointsLevel, PointsMovement, PointsRankingEntry, PointsReward } from "@/lib/types/points";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const pointsLevels: PointsLevel[] = [
  { level: 1, name: "Mechón", minPoints: 0 },
  { level: 2, name: "Novato", minPoints: 100 },
  { level: 3, name: "Integral", minPoints: 300 },
  { level: 4, name: "Capo", minPoints: 600 },
  { level: 5, name: "Leyenda", minPoints: 1000 },
];

export const mockPointsAccount: PointsAccount = {
  balance: 320,
  totalEarned: 540,
};

export const mockPointsMovements: PointsMovement[] = [
  { id: "mov-001", type: "earned", amount: 45, reason: "Participaste en la alianza de otoño", createdAt: daysAgo(1) },
  { id: "mov-002", type: "spent", amount: 120, reason: "Canje: polera del CAi", createdAt: daysAgo(3) },
  { id: "mov-003", type: "earned", amount: 25, reason: "Asististe a la charla de titulación", createdAt: daysAgo(5) },
  { id: "mov-004", type: "earned", amount: 50, reason: "Noche de estudio en la biblioteca", createdAt: daysAgo(9) },
  { id: "mov-005", type: "spent", amount: 100, reason: "Canje: entrada al carrete de bienvenida", createdAt: daysAgo(14) },
  { id: "mov-006", type: "earned", amount: 30, reason: "Primer carrete del CAi", createdAt: daysAgo(16) },
  { id: "mov-007", type: "earned", amount: 20, reason: "Encuesta de carga académica respondida", createdAt: daysAgo(22) },
  { id: "mov-008", type: "earned", amount: 100, reason: "Bono de bienvenida", createdAt: daysAgo(60) },
];

export const mockRewards: PointsReward[] = [
  { id: "rw-cafe", name: "Café en el casino", description: "Un café a elección en el casino de la escuela.", cost: 60, stock: null },
  { id: "rw-sticker", name: "Pack de stickers del CAi", description: "Cinco stickers para decorar el notebook.", cost: 90, stock: 25 },
  { id: "rw-entrada", name: "Entrada a un carrete", description: "Una entrada general para el próximo carrete del CAi.", cost: 150, stock: 10 },
  { id: "rw-polera", name: "Polera del CAi", description: "Polera oficial de la temporada, talla a elección.", cost: 280, stock: 6 },
  { id: "rw-poleron", name: "Polerón de la escuela", description: "Polerón con capucha, edición limitada.", cost: 450, stock: 3 },
  { id: "rw-mesa", name: "Mesa reservada en el casino", description: "Una mesa reservada durante una semana de pruebas.", cost: 600, stock: 1 },
];

export const mockRanking: PointsRankingEntry[] = [
  { rank: 1, nickname: "Capibara Integral", points: 1240, isMe: false },
  { rank: 2, nickname: "Derivada Parcial", points: 1105, isMe: false },
  { rank: 3, nickname: "Matriz Invertible", points: 980, isMe: false },
  { rank: 4, nickname: "Semáforo de Vicuña", points: 870, isMe: false },
  { rank: 5, nickname: "Café Sin Azúcar", points: 790, isMe: false },
  { rank: 6, nickname: "Ley de Ohm", points: 655, isMe: false },
  { rank: 7, nickname: "Estudiante de Ejemplo", points: 540, isMe: true },
  { rank: 8, nickname: "Pato Lúcuma", points: 510, isMe: false },
  { rank: 9, nickname: "Ecuación Diferencial", points: 460, isMe: false },
  { rank: 10, nickname: "Micro Llena", points: 420, isMe: false },
];
