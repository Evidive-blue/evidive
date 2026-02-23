"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import {
  centerApi,
  type HolidayResponse,
  type HolidayRequest,
  type StaffMember,
} from "@/lib/api";
import {
  Plus,
  Trash2,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";

const STAFF_COLORS = [
  "bg-amber-500/20 border-amber-500/40",
  "bg-emerald-500/20 border-emerald-500/40",
  "bg-violet-500/20 border-violet-500/40",
  "bg-rose-500/20 border-rose-500/40",
  "bg-sky-500/20 border-sky-500/40",
  "bg-orange-500/20 border-orange-500/40",
];
const CENTER_HOLIDAY_COLOR = "bg-cyan-500/20 border-cyan-500/40";

function staffDisplayName(s: StaffMember): string {
  return (
    [s.first_name, s.last_name].filter(Boolean).join(" ") || s.email || s.id
  );
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isDateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

function getHolidayForDate(
  dateStr: string,
  holidays: HolidayResponse[]
): HolidayResponse | undefined {
  return holidays.find((h) => isDateInRange(dateStr, h.start_date, h.end_date));
}

export function DashboardHolidaysClient() {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const [holidays, setHolidays] = useState<HolidayResponse[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [prefillDate, setPrefillDate] = useState<string | null>(null);
  const [selectedHolidayId, setSelectedHolidayId] = useState<string | null>(
    null
  );
  const confirmDialog = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [holidaysData, staffData] = await Promise.all([
        centerApi.getHolidays(),
        centerApi.getStaff(),
      ]);
      setHolidays(holidaysData);
      setStaff(staffData);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    confirmDialog.confirm({
      title: t("confirmDelete"),
      description: t("confirmDeleteHoliday"),
      onConfirm: async () => {
        try {
          await centerApi.deleteHoliday(id);
          toast.success(t("holidayDeleted"));
          setHolidays((prev) => prev.filter((h) => h.id !== id));
          setSelectedHolidayId(null);
        } catch {
          toast.error(t("saveError"));
        }
      },
    });
  };

  const handleSaved = () => {
    setShowForm(false);
    setPrefillDate(null);
    load();
  };

  const handleDayClick = (dateStr: string) => {
    const holiday = getHolidayForDate(dateStr, holidays);
    if (holiday) {
      setSelectedHolidayId(holiday.id);
    } else {
      setSelectedHolidayId(null);
      setPrefillDate(dateStr);
      setShowForm(true);
    }
  };

  const staffColorMap = useMemo(() => {
    const map = new Map<string, string>();
    let idx = 0;
    staff.forEach((s) => {
      map.set(
        s.id,
        STAFF_COLORS[idx % STAFF_COLORS.length] ?? STAFF_COLORS[0] ?? ""
      );
      idx++;
    });
    return map;
  }, [staff]);

  function getHolidayColor(h: HolidayResponse): string {
    if (h.staff_id) {
      return staffColorMap.get(h.staff_id) ?? STAFF_COLORS[0] ?? "";
    }
    return CENTER_HOLIDAY_COLOR;
  }

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader titleKey="holidays" namespace="dashboard">
        <Button
          onClick={() => {
            setPrefillDate(null);
            setSelectedHolidayId(null);
            setShowForm(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="h-4 w-4" />
          {t("addHoliday")}
        </Button>
      </PageHeader>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={confirmDialog.onConfirm}
      />

      {/* Visual monthly calendar */}
      <HolidayCalendar
        t={t}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        holidays={holidays}
        staff={staff}
        getHolidayColor={getHolidayColor}
        selectedHolidayId={selectedHolidayId}
        onDayClick={handleDayClick}
      />

      {/* Legend */}
      <Legend t={t} staff={staff} staffColorMap={staffColorMap} />

      {/* Add holiday form */}
      {showForm && (
        <HolidayForm
          staff={staff}
          prefillDate={prefillDate}
          onCancel={() => {
            setShowForm(false);
            setPrefillDate(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Selected holiday delete option */}
      {selectedHolidayId && (
        <SelectedHolidayBanner
          t={t}
          holiday={holidays.find((h) => h.id === selectedHolidayId)}
          staff={staff}
          onDelete={() => handleDelete(selectedHolidayId)}
          onClear={() => setSelectedHolidayId(null)}
        />
      )}

      {/* Holidays list */}
      {holidays.length === 0 ? (
        <EmptyState icon={Calendar} title={t("noHolidays")} />
      ) : (
        <div className="space-y-3">
          {holidays.map((holiday) => {
            const staffMember = staff.find((s) => s.id === holiday.staff_id);
            const isSelected = selectedHolidayId === holiday.id;
            return (
              <div
                key={holiday.id}
                className={`flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors ${
                  isSelected ? "ring-1 ring-cyan-500" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-cyan-500" />
                  <div>
                    <p className="font-medium text-slate-300">
                      {holiday.title ||
                        (staffMember
                          ? staffDisplayName(staffMember)
                          : t("holidays"))}
                    </p>
                    <p className="text-sm text-slate-400">
                      {format.dateTime(new Date(holiday.start_date), {
                        dateStyle: "medium",
                      })}{" "}
                      &ndash;{" "}
                      {format.dateTime(new Date(holiday.end_date), {
                        dateStyle: "medium",
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {staffMember
                        ? staffDisplayName(staffMember)
                        : t("allStaff")}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleDelete(holiday.id)}
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:bg-red-500/10"
                  aria-label={t("deleteHoliday")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HolidayCalendar({
  t,
  currentMonth,
  onMonthChange,
  holidays,
  staff,
  getHolidayColor,
  selectedHolidayId,
  onDayClick,
}: {
  t: (key: string) => string;
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
  holidays: HolidayResponse[];
  staff: StaffMember[];
  getHolidayColor: (h: HolidayResponse) => string;
  selectedHolidayId: string | null;
  onDayClick: (dateStr: string) => void;
}) {
  const calFormat = useFormatter();
  const todayKey = toDateKey(new Date());

  const { days, monthStart } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    // Monday = 0
    const startOffset = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const endOffset = last.getDay() === 0 ? 0 : 7 - last.getDay();
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Leading days from prev month
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(year, month, 1 - i - 1);
      days.unshift({
        date: d,
        dateStr: toDateKey(d),
        isCurrentMonth: false,
      });
    }
    // Month days
    for (let i = 1; i <= last.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: toDateKey(d),
        isCurrentMonth: true,
      });
    }
    // Trailing days
    for (let i = 1; i <= endOffset; i++) {
      const d = new Date(year, month, last.getDate() + i);
      days.push({
        date: d,
        dateStr: toDateKey(d),
        isCurrentMonth: false,
      });
    }
    return { days, monthStart: first };
  }, [currentMonth]);

  const weekdayLabels = [
    t("monday"),
    t("tuesday"),
    t("wednesday"),
    t("thursday"),
    t("friday"),
    t("saturday"),
    t("sunday"),
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/950 p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">
        {t("holidayCalendar")}
      </h3>

      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() =>
              onMonthChange(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1
                )
              )
            }
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label={t("previousMonth")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium text-slate-200">
            {calFormat.dateTime(monthStart, {
              month: "long",
              year: "numeric",
            })}
          </span>
          <Button
            type="button"
            onClick={() =>
              onMonthChange(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1
                )
              )
            }
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label={t("nextMonth")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <Button
          type="button"
          onClick={() => onMonthChange(new Date())}
          variant="outline"
          size="sm"
          className="border-slate-700 bg-slate-800 text-slate-300"
        >
          {t("today")}
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-xs font-medium text-slate-500"
          >
            {label}
          </div>
        ))}
        {days.map(({ date, dateStr, isCurrentMonth }) => {
          const holiday = getHolidayForDate(dateStr, holidays);
          const color = holiday ? getHolidayColor(holiday) : "";
          const isToday = dateStr === todayKey;
          const isSelected = holiday && selectedHolidayId === holiday.id;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDayClick(dateStr)}
              className={`min-h-[60px] rounded-lg border p-2 text-left text-sm transition-colors ${
                isCurrentMonth ? "text-slate-200" : "text-slate-600"
              } ${
                holiday
                  ? `${color} ${isSelected ? "ring-1 ring-cyan-500" : ""}`
                  : "border-transparent bg-slate-800/50 hover:bg-slate-800"
              } ${isToday ? "ring-1 ring-cyan-500" : ""}`}
              title={holiday ? t("holidayRange") : t("addHolidayOnDate")}
            >
              <span>{date.getDate()}</span>
              {holiday && (
                <div className="mt-1 truncate text-xs opacity-90">
                  {holiday.title ||
                    (holiday.staff_id
                      ? (() => {
                          const s = staff.find(
                            (st) => st.id === holiday.staff_id
                          );
                          return s ? staffDisplayName(s) : t("holidays");
                        })()
                      : t("centerWideHoliday")) ||
                    t("holidays")}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">{t("clickToAdd")}</p>
    </div>
  );
}

function Legend({
  t,
  staff,
  staffColorMap,
}: {
  t: (key: string) => string;
  staff: StaffMember[];
  staffColorMap: Map<string, string>;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/95 p-3">
      <h4 className="mb-2 text-xs font-semibold text-slate-400">
        {t("legend")}
      </h4>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-3 w-6 rounded ${CENTER_HOLIDAY_COLOR}`}
          />
          <span className="text-xs text-slate-500">
            {t("centerWideHoliday")}
          </span>
        </div>
        {staff.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-6 rounded ${staffColorMap.get(s.id) ?? STAFF_COLORS[0]}`}
            />
            <span className="text-xs text-slate-500">
              {staffDisplayName(s)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectedHolidayBanner({
  t,
  holiday,
  staff,
  onDelete,
  onClear,
}: {
  t: (key: string) => string;
  holiday: HolidayResponse | undefined;
  staff: StaffMember[];
  onDelete: () => void;
  onClear: () => void;
}) {
  const bannerFormat = useFormatter();
  if (!holiday) {
    return null;
  }
  const staffMember = staff.find((s) => s.id === holiday.staff_id);
  return (
    <div className="flex items-center justify-between rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-3">
      <span className="text-sm text-slate-200">
        {holiday.title || t("holidays")} —{" "}
        {bannerFormat.dateTime(new Date(holiday.start_date), {
          dateStyle: "medium",
        })}{" "}
        &ndash;{" "}
        {bannerFormat.dateTime(new Date(holiday.end_date), {
          dateStyle: "medium",
        })}
        {staffMember && ` (${staffDisplayName(staffMember)})`}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onDelete}
          variant="destructive"
          size="sm"
        >
          <Trash2 className="h-4 w-4" />
          {t("deleteHoliday")}
        </Button>
        <Button
          type="button"
          onClick={onClear}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function HolidayForm({
  staff,
  prefillDate,
  onCancel,
  onSaved,
}: {
  staff: StaffMember[];
  prefillDate: string | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<HolidayRequest>({
    title: "",
    start_date: prefillDate ?? "",
    end_date: prefillDate ?? "",
    staff_id: "",
  });

  useEffect(() => {
    if (prefillDate) {
      setFormData((prev) => ({
        ...prev,
        start_date: prefillDate,
        end_date: prefillDate,
      }));
    }
  }, [prefillDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      toast.error(t("saveError"));
      return;
    }
    setSaving(true);
    try {
      const body: HolidayRequest = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        title: formData.title || undefined,
        staff_id: formData.staff_id || undefined,
      };
      await centerApi.createHoliday(body);
      toast.success(t("holidayCreated"));
      onSaved();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">{t("addHoliday")}</h3>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {t("holidayTitle")}
          </label>
          <Input
            type="text"
            value={formData.title ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="bg-slate-800 border-slate-700 text-white"
            placeholder={t("holidayTitle")}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              {t("holidayStart")}
            </label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              {t("holidayEnd")}
            </label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {t("holidayStaff")}
          </label>
          <select
            value={formData.staff_id ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, staff_id: e.target.value })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <option value="">{t("allStaff")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {staffDisplayName(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {saving ? "..." : t("addHoliday")}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-slate-300"
          >
            {t("cancelBooking")}
          </Button>
        </div>
      </form>
    </div>
  );
}
