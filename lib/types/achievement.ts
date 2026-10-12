// NOT IMPLEMENTED (MVP): shapes used by the mock "Logros / bucket list" view.
// Designed to become Prisma models (`Achievement`, `AchievementBadge`,
// `UserAchievement`) once the feature is wired for real.

export type AchievementStatus = "locked" | "available" | "completed";

export interface AchievementCategory {
  slug: string;
  label: string;
  /** Short line shown under the category heading. */
  description: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** `AchievementCategory.slug`. */
  category: string;
  /** CAiPuntos granted when completed. */
  points: number;
  /**
   * Id of another achievement that must be completed first. While it is not,
   * the mission shows as locked with `unlockHint`.
   */
  requires: string | null;
  /** Human hint on how to unlock, e.g. "Completa 'Primer carrete'". */
  unlockHint: string | null;
  /** ISO date when the mock user completed it, null if pending. */
  completedAt: string | null;
  /** Placeholder for the future evidence photo URL. Always null in the mock. */
  evidenceUrl: string | null;
}

export type AchievementBadgeIcon = "star" | "moon" | "coffee" | "users" | "map" | "party";

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: AchievementBadgeIcon;
  /**
   * Achievements that must be completed to earn the badge. Earned state is
   * derived from the user's completed achievements.
   */
  requiredAchievements: string[];
}
