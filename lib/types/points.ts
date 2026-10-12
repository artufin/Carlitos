// NOT IMPLEMENTED (MVP): shapes used by the mock "CAiPuntos" view. Designed
// to become Prisma models (`PointsAccount`, `PointsMovement`, `Reward`,
// `RewardRedemption`) once the feature is wired for real.

export interface PointsLevel {
  level: number;
  name: string;
  /** Lifetime points (total earned) required to reach this level. */
  minPoints: number;
}

export interface PointsAccount {
  /** Points available to spend. */
  balance: number;
  /** Lifetime points earned; drives the level. */
  totalEarned: number;
}

export type PointsMovementType = "earned" | "spent";

export interface PointsMovement {
  id: string;
  type: PointsMovementType;
  /** Always positive; `type` says the direction. */
  amount: number;
  reason: string;
  createdAt: string; // ISO
}

export interface PointsReward {
  id: string;
  name: string;
  description: string;
  cost: number;
  /** Remaining units, null when unlimited. */
  stock: number | null;
}

export interface PointsRankingEntry {
  rank: number;
  /** Fictional nickname, never a real name. */
  nickname: string;
  points: number;
  /** True for the mock user's own row. */
  isMe: boolean;
}
