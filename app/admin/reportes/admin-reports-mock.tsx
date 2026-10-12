"use client";

// NOT IMPLEMENTED (MVP): in-memory admin list of reports with filters.

import { useMemo, useState } from "react";
import { NativeSelect } from "@/components/native-select";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import { mockReports, reportCategories, reportStatusLabel } from "@/lib/mocks/reports";
import type { MockReport, MockReportStatus } from "@/lib/types/report";

const STATUSES: MockReportStatus[] = ["received", "in_review", "resolved"];

export function AdminReportsMock() {
  const [reports, setReports] = useState<MockReport[]>(mockReports);
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(
    () =>
      reports.filter((r) => {
        const cat = r.classification?.category ?? r.category ?? "";
        if (category && cat !== category) return false;
        if (severity && String(r.classification?.severity ?? "") !== severity) return false;
        if (status && r.status !== status) return false;
        return true;
      }),
    [reports, category, severity, status],
  );

  function changeStatus(id: string, next: MockReportStatus) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor="f-category" className="text-xs">
            Categoría
          </Label>
          <NativeSelect id="f-category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9">
            <option value="">Todas</option>
            {reportCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-severity" className="text-xs">
            Gravedad
          </Label>
          <NativeSelect id="f-severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className="h-9">
            <option value="">Todas</option>
            <option value="1">1 · baja</option>
            <option value="2">2 · media</option>
            <option value="3">3 · alta</option>
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-status" className="text-xs">
            Estado
          </Label>
          <NativeSelect id="f-status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9">
            <option value="">Todos</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {reportStatusLabel[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <ul className="divide-y rounded-xl border text-sm">
        {filtered.map((report) => (
          <li key={report.id} className="space-y-2 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDateTime(report.createdAt)}</span>
              <span>· {report.anonymous ? "anónimo" : "identificado"}</span>
              {report.classification ? (
                <span>
                  · {report.classification.category} · gravedad {report.classification.severity}
                  {report.classification.place ? ` · ${report.classification.place}` : ""}
                  {report.classification.missingInfo ? " · falta info" : ""}
                </span>
              ) : (
                <span className="rounded-sm bg-muted px-1 py-0.5">sin clasificar</span>
              )}
            </div>
            <p className="font-medium">{report.classification?.summary ?? report.text.slice(0, 80)}</p>
            <p className="text-muted-foreground">{report.text}</p>
            <div className="flex items-center gap-2">
              <Label htmlFor={`status-${report.id}`} className="text-xs">
                Estado
              </Label>
              <NativeSelect
                id={`status-${report.id}`}
                value={report.status}
                onChange={(e) => changeStatus(report.id, e.target.value as MockReportStatus)}
                className="h-9 w-40"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {reportStatusLabel[s]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <li className="p-6 text-center text-muted-foreground">Sin reportes para esos filtros.</li>}
      </ul>
    </div>
  );
}
