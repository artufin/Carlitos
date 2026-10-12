"use client";

// NOT IMPLEMENTED (MVP): mock "CAiPuntos" wallet. Balance, movements and
// redemptions live in memory and are lost on reload. No API calls.

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDownLeftIcon, ArrowUpRightIcon, CoinsIcon, GiftIcon, PartyPopperIcon, TrophyIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelative } from "@/lib/format";
import { mockPointsAccount, mockPointsMovements, mockRanking, mockRewards, pointsLevels } from "@/lib/mocks/points";
import type { PointsAccount, PointsLevel, PointsMovement, PointsReward } from "@/lib/types/points";

const CONFETTI_COLORS = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"];
const CONFETTI_MS = 2600;

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
  color: string;
}

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.4 + Math.random() * 0.9,
    rotate: Math.random() * 720 - 360,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
}

function levelFor(totalEarned: number): { current: PointsLevel; next: PointsLevel | null; percent: number } {
  let current = pointsLevels[0];
  for (const lvl of pointsLevels) if (totalEarned >= lvl.minPoints) current = lvl;
  const next = pointsLevels.find((l) => l.level === current.level + 1) ?? null;
  const percent = next ? Math.round(((totalEarned - current.minPoints) / (next.minPoints - current.minPoints)) * 100) : 100;
  return { current, next, percent: Math.min(100, Math.max(0, percent)) };
}

export function PointsMock() {
  const reduceMotion = useReducedMotion();
  const [account, setAccount] = useState<PointsAccount>(mockPointsAccount);
  const [movements, setMovements] = useState<PointsMovement[]>(mockPointsMovements);
  const [rewards, setRewards] = useState<PointsReward[]>(mockRewards);
  const [selected, setSelected] = useState<PointsReward | null>(null);
  const [stage, setStage] = useState<"confirm" | "done">("confirm");
  const [confetti, setConfetti] = useState<ConfettiPiece[] | null>(null);

  useEffect(() => {
    if (!confetti) return;
    const timer = setTimeout(() => setConfetti(null), CONFETTI_MS);
    return () => clearTimeout(timer);
  }, [confetti]);

  const { current, next, percent } = levelFor(account.totalEarned);

  function openRedeem(reward: PointsReward) {
    setStage("confirm");
    setSelected(reward);
  }

  function closeDialog() {
    setSelected(null);
  }

  function confirmRedeem() {
    if (!selected || account.balance < selected.cost) return;
    const reward = selected;
    setAccount((prev) => ({ ...prev, balance: prev.balance - reward.cost }));
    setMovements((prev) => [
      { id: `mov-${Date.now()}`, type: "spent", amount: reward.cost, reason: `Canje: ${reward.name}`, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setRewards((prev) => prev.map((r) => (r.id === reward.id && r.stock !== null ? { ...r, stock: Math.max(0, r.stock - 1) } : r)));
    setStage("done");
    if (!reduceMotion) setConfetti(makeConfetti());
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <section aria-labelledby="balance-heading" className="rounded-xl bg-primary p-4 text-primary-foreground">
          <h2 id="balance-heading" className="flex items-center gap-2 text-sm font-medium opacity-90">
            <CoinsIcon className="size-4" aria-hidden />
            Saldo disponible
          </h2>
          <p className="mt-2 font-heading text-4xl font-semibold tabular-nums" aria-live="polite">
            {account.balance} <span className="text-base font-normal opacity-80">CAiPuntos</span>
          </p>
          <p className="mt-1 text-xs opacity-80">Acumulados en total: {account.totalEarned}</p>
        </section>

        <section aria-labelledby="level-heading" className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="level-heading" className="flex items-center gap-2 text-sm font-medium">
              <TrophyIcon className="size-4 text-amber-500" aria-hidden />
              Nivel {current.level} · {current.name}
            </h2>
            {next && <span className="text-xs text-muted-foreground">Siguiente: {next.name}</span>}
          </div>
          <div className="mt-3">
            <Progress value={percent} aria-label={`Progreso al nivel ${next ? next.name : "máximo"}`} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {next ? `Te faltan ${next.minPoints - account.totalEarned} puntos para ser ${next.name}.` : "Llegaste al nivel máximo."}
          </p>
        </section>
      </div>

      <Tabs defaultValue="recompensas">
        <TabsList className="w-full">
          <TabsTrigger value="recompensas" className="h-full min-h-10">
            Recompensas
          </TabsTrigger>
          <TabsTrigger value="historial" className="h-full min-h-10">
            Historial
          </TabsTrigger>
          <TabsTrigger value="ranking" className="h-full min-h-10">
            Ranking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recompensas">
          <h2 className="sr-only">Catálogo de recompensas</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {rewards.map((reward) => {
              const affordable = account.balance >= reward.cost;
              const soldOut = reward.stock !== null && reward.stock <= 0;
              const disabled = !affordable || soldOut;
              return (
                <li key={reward.id} className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
                      <GiftIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">{reward.name}</h3>
                      <p className="text-muted-foreground">{reward.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {reward.stock === null ? "Sin límite" : soldOut ? "Agotado" : `Quedan ${reward.stock}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium tabular-nums">{reward.cost} pts</span>
                    <Button
                      type="button"
                      className="h-11 min-w-28"
                      disabled={disabled}
                      onClick={() => openRedeem(reward)}
                      aria-label={`Canjear ${reward.name}`}
                    >
                      Canjear
                    </Button>
                  </div>
                  {!affordable && !soldOut && (
                    <p className="text-xs text-muted-foreground">Te faltan {reward.cost - account.balance} puntos.</p>
                  )}
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="historial">
          <h2 className="sr-only">Historial de movimientos</h2>
          <ul className="divide-y rounded-xl border">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center gap-3 p-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    m.type === "earned"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {m.type === "earned" ? <ArrowDownLeftIcon className="size-4" /> : <ArrowUpRightIcon className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{m.reason}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(m.createdAt)}</p>
                </div>
                <span
                  className={cn("font-medium tabular-nums", m.type === "earned" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")}
                >
                  {m.type === "earned" ? "+" : "−"}
                  {m.amount}
                </span>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="ranking">
          <h2 className="sr-only">Ranking</h2>
          <p className="mb-2 text-xs text-muted-foreground">Top 10 del semestre. Los apodos son ficticios.</p>
          <ol className="divide-y rounded-xl border">
            {mockRanking.map((entry) => (
              <li
                key={entry.rank}
                className={cn("flex items-center gap-3 p-3", entry.isMe && "bg-primary/5 font-medium")}
                aria-current={entry.isMe ? "true" : undefined}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs tabular-nums",
                    entry.rank <= 3 ? "bg-amber-400 text-amber-950" : "bg-muted text-muted-foreground",
                  )}
                >
                  {entry.rank}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {entry.nickname}
                  {entry.isMe && <span className="ml-1 text-xs text-muted-foreground">(tú)</span>}
                </span>
                <span className="tabular-nums">{entry.points} pts</span>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          {selected && stage === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Canjear {selected.name}</DialogTitle>
                <DialogDescription>
                  Se descontarán {selected.cost} CAiPuntos de tu saldo ({account.balance} disponibles). En esta demo no se genera ningún
                  cupón real.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" className="h-11" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="button" className="h-11" onClick={confirmRedeem}>
                  Confirmar canje
                </Button>
              </DialogFooter>
            </>
          )}
          {selected && stage === "done" && (
            <>
              <DialogHeader className="items-center text-center">
                <motion.span
                  initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  aria-hidden
                >
                  <PartyPopperIcon className="size-7" />
                </motion.span>
                <DialogTitle>¡Canje listo!</DialogTitle>
                <DialogDescription>
                  Canjeaste {selected.name}. Tu saldo quedó en {account.balance} CAiPuntos. Comprobante de demostración, sin validez.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" className="h-11" onClick={closeDialog}>
                  Listo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {confetti && <Confetti pieces={confetti} />}
    </div>
  );
}

/** Tiny confetti: 30 falling spans animating transform/opacity only. */
function Confetti({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-60 overflow-hidden" data-testid="confetti">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "-10vh", opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute top-0 block rounded-sm"
          style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.4, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}
