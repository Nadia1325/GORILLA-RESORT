import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ExportPeriod = "weekly" | "monthly" | "yearly" | "date";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(CURRENT_YEAR + 1 - i));

interface ExportSectionProps {
  exportPeriod: ExportPeriod;
  setExportPeriod: (period: ExportPeriod) => void;
  exportDate: string;
  setExportDate: (value: string) => void;
  exportMonth: string;
  setExportMonth: (value: string) => void;
  exportYear: string;
  setExportYear: (value: string) => void;
  exportBusy: string;
  exportError: string;
  getSelectedWeekRange: () => string;
  onDownload: (period: ExportPeriod, format: "xlsx" | "pdf") => void;
}

export function ExportSection({
  exportPeriod,
  setExportPeriod,
  exportDate,
  setExportDate,
  exportMonth,
  setExportMonth,
  exportYear,
  setExportYear,
  exportBusy,
  exportError,
  getSelectedWeekRange,
  onDownload,
}: ExportSectionProps) {
  return (
    <Card>
      <CardHeader>
        <span className="eyebrow">Export & records</span>
        <CardTitle>Export resort activities</CardTitle>
        <CardDescription>
          Choose Weekly, Monthly, Yearly, or Selected date. The report period controls exactly which activities are
          included. Export the same report as a professional Excel workbook or PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Label>Report period</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ["weekly", "Weekly"],
                  ["monthly", "Monthly"],
                  ["yearly", "Yearly"],
                  ["date", "Selected date"],
                ] as const
              ).map(([period, label]) => (
                <Button
                  key={period}
                  type="button"
                  variant={exportPeriod === period ? "default" : "outline"}
                  onClick={() => setExportPeriod(period)}
                  className="w-full"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="min-w-[220px]">
            {exportPeriod === "monthly" ? (
              <div>
                <Label className="block">Choose month</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Select
                    value={String(Number(exportMonth.split("-")[1] || 1))}
                    onValueChange={(month) => {
                      const year = exportMonth.split("-")[0] || String(CURRENT_YEAR);
                      setExportMonth(`${year}-${month.padStart(2, "0")}`);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((name, i) => (
                        <SelectItem key={name} value={String(i + 1)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={exportMonth.split("-")[0] || String(CURRENT_YEAR)}
                    onValueChange={(year) => {
                      const month = exportMonth.split("-")[1] || "01";
                      setExportMonth(`${year}-${month}`);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : exportPeriod === "yearly" ? (
              <div>
                <Label className="block">Choose year</Label>
                <Select value={exportYear} onValueChange={setExportYear}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="block">
                  {exportPeriod === "weekly" ? "Choose a date in the week" : "Choose date"}
                </Label>
                <DatePicker value={exportDate} onChange={setExportDate} className="mt-2" />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/10 bg-secondary/40 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-tide-900 dark:text-sand-50">
                {exportPeriod === "weekly"
                  ? "Weekly report"
                  : exportPeriod === "monthly"
                    ? "Monthly report"
                    : exportPeriod === "yearly"
                      ? "Yearly report"
                      : "Selected-date report"}
              </p>
              <p className="mt-1 text-xs opacity-60">
                {exportPeriod === "weekly"
                  ? `Week: ${getSelectedWeekRange()} — all activities from Monday through Sunday.`
                  : exportPeriod === "monthly"
                    ? `Month: ${new Date(`${exportMonth}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })} — all activities in this calendar month.`
                    : exportPeriod === "yearly"
                      ? `Year: ${exportYear} — all activities from January through December.`
                      : `Date: ${exportDate} — only actions recorded on this calendar date.`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                disabled={Boolean(exportBusy)}
                loading={exportBusy === `${exportPeriod}-xlsx`}
                onClick={() => onDownload(exportPeriod, "xlsx")}
                className="min-w-[160px]"
              >
                {exportBusy === `${exportPeriod}-xlsx` ? "Preparing Excel…" : "Export Excel (.xlsx)"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(exportBusy)}
                loading={exportBusy === `${exportPeriod}-pdf`}
                onClick={() => onDownload(exportPeriod, "pdf")}
                className="min-w-[160px]"
              >
                {exportBusy === `${exportPeriod}-pdf` ? "Preparing PDF…" : "Export PDF (.pdf)"}
              </Button>
            </div>
          </div>
        </div>

        {exportError && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{exportError}</p>}
      </CardContent>
    </Card>
  );
}
