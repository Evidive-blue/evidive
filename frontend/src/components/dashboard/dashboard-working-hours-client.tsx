"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { centerApi, type StaffMember, type WorkingHoursDay } from "@/lib/api";
import { Save, ChevronDown, UserCircle } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";

const DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday (API: 0=Sunday, 1=Monday...)
const HOUR_START = 6;
const HOUR_END = 22;
const HOURS = Array.from(
  { length: HOUR_END - HOUR_START + 1 },
  (_, i) => HOUR_START + i
);

function hourToTime(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

function parseTimeToHour(t: string): number {
  return parseInt(t.slice(0, 2), 10);
}

function staffDisplayName(s: StaffMember): string {
  return (
    [s.first_name, s.last_name].filter(Boolean).join(" ") || s.email || s.id
  );
}

export function DashboardWorkingHoursClient() {
  const t = useTranslations("dashboard");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [gridState, setGridState] = useState<Record<number, boolean[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{
    day: number;
    hourIndex: number;
    value: boolean;
  } | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      const data = await centerApi.getStaff();
      setStaff(data);
      if (data.length > 0 && !selectedStaffId) {
        setSelectedStaffId(data[0]?.id ?? "");
      }
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, selectedStaffId]);

  const workingHoursToGrid = useCallback(
    (hours: WorkingHoursDay[]): Record<number, boolean[]> => {
      const grid: Record<number, boolean[]> = {};
      for (const day of DAYS_OF_WEEK) {
        const h = hours.find((x) => x.day_of_week === day);
        const arr: boolean[] = [];
        if (!h || !h.is_available) {
          for (let i = 0; i < HOURS.length; i++) {
            arr.push(false);
          }
        } else {
          const startH = parseTimeToHour(h.start_time);
          const endH = parseTimeToHour(h.end_time);
          for (const hour of HOURS) {
            arr.push(hour >= startH && hour < endH);
          }
        }
        grid[day] = arr;
      }
      return grid;
    },
    []
  );

  const loadStaffHours = useCallback(
    async (staffId: string) => {
      try {
        const data = await centerApi.getStaffHours(staffId);
        const hoursMap = new Map(data.map((h) => [h.day_of_week, h]));
        const completeHours: WorkingHoursDay[] = DAYS_OF_WEEK.map((day) => {
          const existing = hoursMap.get(day);
          if (existing) {
            return existing;
          }
          const isWeekday = day >= 1 && day <= 5;
          return {
            day_of_week: day,
            start_time: isWeekday ? "08:00" : "00:00",
            end_time: isWeekday ? "17:00" : "00:00",
            is_available: isWeekday,
          };
        });
        setGridState(workingHoursToGrid(completeHours));
      } catch {
        toast.error(t("loadError"));
      }
    },
    [t, workingHoursToGrid]
  );

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (selectedStaffId) {
      loadStaffHours(selectedStaffId);
    }
  }, [selectedStaffId, loadStaffHours]);

  const getDayName = (dayOfWeek: number) => {
    const dayNames = [
      t("sunday"),
      t("monday"),
      t("tuesday"),
      t("wednesday"),
      t("thursday"),
      t("friday"),
      t("saturday"),
    ];
    return dayNames[dayOfWeek];
  };

  const toggleCell = useCallback((day: number, hourIndex: number) => {
    setGridState((prev) => {
      const next = { ...prev };
      const row = [...(next[day] ?? Array(HOURS.length).fill(false))];
      row[hourIndex] = !row[hourIndex];
      next[day] = row;
      return next;
    });
  }, []);

  const setCell = useCallback(
    (day: number, hourIndex: number, value: boolean) => {
      setGridState((prev) => {
        const next = { ...prev };
        const row = [...(next[day] ?? Array(HOURS.length).fill(false))];
        row[hourIndex] = value;
        next[day] = row;
        return next;
      });
    },
    []
  );

  const handleCellMouseDown = useCallback(
    (day: number, hourIndex: number) => {
      const row = gridState[day];
      const current = row?.[hourIndex] ?? false;
      dragRef.current = { day, hourIndex, value: !current };
      setCell(day, hourIndex, !current);
    },
    [gridState, setCell]
  );

  const handleCellMouseEnter = useCallback(
    (day: number, hourIndex: number) => {
      if (!dragRef.current) {
        return;
      }
      setCell(day, hourIndex, dragRef.current.value);
    },
    [setCell]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const setAllAvailable = useCallback(() => {
    setGridState((prev) => {
      const next = { ...prev };
      for (const day of DAYS_OF_WEEK) {
        next[day] = Array(HOURS.length).fill(true);
      }
      return next;
    });
  }, []);

  const setAllUnavailable = useCallback(() => {
    setGridState((prev) => {
      const next = { ...prev };
      for (const day of DAYS_OF_WEEK) {
        next[day] = Array(HOURS.length).fill(false);
      }
      return next;
    });
  }, []);

  const copyMondayToAll = useCallback(() => {
    const mondayRow = gridState[1];
    if (!mondayRow) {
      return;
    }
    setGridState((prev) => {
      const next = { ...prev };
      for (const day of DAYS_OF_WEEK) {
        next[day] = [...mondayRow];
      }
      return next;
    });
  }, [gridState]);

  const gridToWorkingHours = useCallback((): WorkingHoursDay[] => {
    return DAYS_OF_WEEK.map((day) => {
      const row = gridState[day] ?? Array(HOURS.length).fill(false);
      const first = row.findIndex((v) => v);
      const last = row.length - 1 - [...row].reverse().findIndex((v) => v);
      if (first === -1 || last === -1) {
        return {
          day_of_week: day,
          start_time: "00:00",
          end_time: "00:00",
          is_available: false,
        };
      }
      const startHour = HOURS[first] ?? 0;
      const endHour = (HOURS[last] ?? 0) + 1;
      return {
        day_of_week: day,
        start_time: hourToTime(startHour),
        end_time: hourToTime(endHour),
        is_available: true,
      };
    });
  }, [gridState]);

  const handleSave = async () => {
    if (!selectedStaffId) {
      toast.error(t("selectStaff"));
      return;
    }
    setSaving(true);
    try {
      const hours = gridToWorkingHours();
      await centerApi.setStaffHours(selectedStaffId, hours);
      toast.success(t("hoursUpdated"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const getTotalHoursForDay = (day: number): number => {
    const row = gridState[day] ?? [];
    return row.filter(Boolean).length;
  };

  const getTotalHoursWeek = (): number => {
    return DAYS_OF_WEEK.reduce((sum, day) => sum + getTotalHoursForDay(day), 0);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (staff.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader titleKey="workingHours" namespace="dashboard" />
        <EmptyState icon={UserCircle} title={t("noStaff")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader titleKey="workingHours" namespace="dashboard" />

      {/* Staff selector */}
      <div className="relative">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          {t("selectStaff")}
        </label>
        <div className="relative">
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 pr-10 text-sm text-slate-100 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {staffDisplayName(s)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={setAllAvailable}
          variant="outline"
          size="sm"
          className="border-slate-700 bg-slate-800 text-slate-200"
        >
          {t("setAllAvailable")}
        </Button>
        <Button
          type="button"
          onClick={setAllUnavailable}
          variant="outline"
          size="sm"
          className="border-slate-700 bg-slate-800 text-slate-200"
        >
          {t("setAllUnavailable")}
        </Button>
        <Button
          type="button"
          onClick={copyMondayToAll}
          variant="outline"
          size="sm"
          className="border-slate-700 bg-slate-800 text-slate-200"
        >
          {t("copyMondayToAll")}
        </Button>
      </div>

      {/* Hourly grid */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95">
        <p className="mt-2 mb-2 text-xs text-slate-400">{t("clickToToggle")}</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-24 border-b border-r border-slate-700 bg-slate-800/80 px-2 py-2 text-left text-xs font-medium text-slate-400">
                  {t("hourlyGrid")}
                </th>
                {HOURS.map((h) => (
                  <th
                    key={h}
                    className="min-w-[2rem] border-b border-slate-700 bg-slate-800/80 px-1 py-2 text-center text-xs font-medium text-slate-400"
                  >
                    {hourToTime(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day) => (
                <tr
                  key={day}
                  className="border-b border-slate-800 last:border-b-0"
                >
                  <td className="sticky left-0 z-10 w-24 border-r border-slate-700 bg-slate-900/95 px-2 py-1.5 text-sm font-medium text-slate-300">
                    {getDayName(day)}
                  </td>
                  {HOURS.map((_, hourIndex) => {
                    const row = gridState[day] ?? [];
                    const isAvailable = row[hourIndex] ?? false;
                    return (
                      <td
                        key={hourIndex}
                        role="button"
                        tabIndex={0}
                        onMouseDown={() => handleCellMouseDown(day, hourIndex)}
                        onMouseEnter={() =>
                          handleCellMouseEnter(day, hourIndex)
                        }
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            toggleCell(day, hourIndex);
                          }
                        }}
                        aria-label={`${getDayName(day)} ${hourToTime(HOURS[hourIndex] ?? 0)} ${isAvailable ? t("available") : t("unavailable")}`}
                        className={`min-w-[2rem] cursor-pointer border border-slate-800 p-0.5 transition-colors ${
                          isAvailable
                            ? "bg-cyan-500/30 hover:bg-cyan-500/40"
                            : "bg-slate-800 hover:bg-slate-700"
                        }`}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/95 p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-300">
          {t("hoursPerDay")}
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
          {DAYS_OF_WEEK.map((day) => (
            <span key={day}>
              {getDayName(day)}: {getTotalHoursForDay(day)}h
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm font-medium text-slate-300">
          {t("totalHoursWeek")}: {getTotalHoursWeek()}h
        </p>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !selectedStaffId}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Save className="h-4 w-4" />
          {saving ? "..." : t("setHours")}
        </Button>
      </div>
    </div>
  );
}
