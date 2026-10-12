"use client";

// NOT IMPLEMENTED (MVP): mock "Logros / bucket list". Completion state lives
// in memory and is lost on reload. No uploads, no API calls.

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  CameraIcon,
  CheckCircle2Icon,
  CircleIcon,
  CoffeeIcon,
  LockIcon,
  MapIcon,
  MoonIcon,
  PartyPopperIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/format";
import { achievementBadges, achievementCategories, mockAchievements } from "@/lib/mocks/achievements";
import type { Achievement, AchievementBadge, AchievementBadgeIcon, AchievementStatus } from "@/lib/types/achievement";

const BADGE_ICON: Record<AchievementBadgeIcon, typeof StarIcon> = {
  star: StarIcon,
  moon: MoonIcon,
  coffee: CoffeeIcon,
  users: UsersIcon,
  map: MapIcon,
  party: PartyPopperIcon,
};

const STATUS_LABEL: Record<AchievementStatus, string> = {
  locked: "Bloqueado",
  available: "Disponible",
  completed: "Cumplido",
};

function initialCompleted(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const a of mockAchievements) if (a.completedAt) map[a.id] = a.completedAt;
  return map;
}

export function AchievementsMock() {
  // id -> ISO completion date
  const [completed, setCompleted] = useState<Record<string, string>>(initialCompleted);

  const statusOf = (a: Achievement): AchievementStatus => {
    if (completed[a.id]) return "completed";
    if (a.requires && !completed[a.requires]) return "locked";
    return "available";
  };

  const total = mockAchievements.length;
  const done = Object.keys(completed).length;
  const percent = Math.round((done / total) * 100);

  const earnedBadges = useMemo(
    () => achievementBadges.filter((b) => b.requiredAchievements.every((id) => Boolean(completed[id]))),
    [completed],
  );

  function toggle(id: string) {
    setCompleted((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = new Date().toISOString();
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="badges-heading" className="space-y-2">
        <h2 id="badges-heading" className="font-heading text-lg font-semibold">
          Insignias
        </h2>
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Insignias ganadas y pendientes">
          {achievementBadges.map((badge) => (
            <BadgeChip key={badge.id} badge={badge} earned={earnedBadges.includes(badge)} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="progress-heading" className="rounded-xl border p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-sm">
          <h2 id="progress-heading" className="font-medium">
            Progreso global
          </h2>
          <span className="text-muted-foreground tabular-nums">
            {done}/{total} misiones · {percent}%
          </span>
        </div>
        <Progress value={percent} aria-label="Progreso global de misiones" />
      </section>

      {achievementCategories.map((category) => {
        const missions = mockAchievements.filter((a) => a.category === category.slug);
        return (
          <section key={category.slug} aria-labelledby={`cat-${category.slug}`} className="space-y-3">
            <div>
              <h2 id={`cat-${category.slug}`} className="font-heading text-lg font-semibold">
                {category.label}
              </h2>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  status={statusOf(mission)}
                  completedAt={completed[mission.id] ?? null}
                  onToggle={() => toggle(mission.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function BadgeChip({ badge, earned }: { badge: AchievementBadge; earned: boolean }) {
  const Icon = BADGE_ICON[badge.icon];
  return (
    <li
      className={cn(
        "flex w-24 shrink-0 flex-col items-center gap-1 rounded-xl border p-2 text-center",
        earned ? "border-amber-400/60 bg-amber-50 dark:bg-amber-950/30" : "opacity-60",
      )}
      title={badge.description}
      aria-label={`${badge.name}: ${earned ? "ganada" : "pendiente"}. ${badge.description}`}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          earned ? "bg-amber-400 text-amber-950" : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <span className="text-xs font-medium leading-tight">{badge.name}</span>
      <span className="text-[10px] text-muted-foreground">{earned ? "Ganada" : "Pendiente"}</span>
    </li>
  );
}

function MissionCard({
  mission,
  status,
  completedAt,
  onToggle,
}: {
  mission: Achievement;
  status: AchievementStatus;
  completedAt: string | null;
  onToggle: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const isCompleted = status === "completed";
  const isLocked = status === "locked";

  return (
    <motion.li
      layout={!reduceMotion}
      animate={isCompleted ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10",
        isCompleted && "ring-emerald-500/40",
        isLocked && "bg-muted/40",
      )}
      data-status={status}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            isCompleted
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-muted text-muted-foreground",
          )}
          aria-hidden
        >
          {isCompleted ? (
            <motion.span
              key="done"
              initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex"
            >
              <CheckCircle2Icon className="size-5" />
            </motion.span>
          ) : isLocked ? (
            <LockIcon className="size-4" />
          ) : (
            <CircleIcon className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <h3 className={cn("font-medium", isLocked && "text-muted-foreground")}>{mission.title}</h3>
            <Badge variant={isCompleted ? "default" : "outline"} className={cn(isCompleted && "bg-emerald-600 text-white")}>
              {STATUS_LABEL[status]}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">{mission.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">+{mission.points} CAiPuntos</p>
        </div>
      </div>

      {isLocked ? (
        <p className="flex items-start gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {mission.unlockHint ?? "Completa otra misión para desbloquear esta."}
        </p>
      ) : (
        <>
          <div className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground">
            <CameraIcon className="size-5" aria-hidden />
            Foto de evidencia (próximamente)
          </div>
          <div className="flex items-center justify-between gap-2">
            {isCompleted && completedAt && <span className="text-xs text-muted-foreground">Cumplido el {formatDate(completedAt)}</span>}
            <Button
              type="button"
              variant={isCompleted ? "outline" : "default"}
              className="h-11 ml-auto"
              onClick={onToggle}
              aria-pressed={isCompleted}
              aria-label={`${isCompleted ? "Desmarcar" : "Marcar como cumplido"}: ${mission.title}`}
            >
              {isCompleted ? "Desmarcar" : "Marcar como cumplido"}
            </Button>
          </div>
        </>
      )}
    </motion.li>
  );
}
