import { CalendarDays } from "lucide-react";

import { DATE_RANGE_OPTIONS, type CustomRange, type DateRangeKey } from "@/lib/date-range";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface DateRangeFilterProps {
  value: DateRangeKey;
  onChange: (value: DateRangeKey) => void;
  customRange: CustomRange;
  onCustomRangeChange: (range: CustomRange) => void;
}

export function DateRangeFilter({ value, onChange, customRange, onCustomRangeChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value} onValueChange={(v) => onChange(v as DateRangeKey)}>
        <SelectTrigger className="w-auto gap-2 rounded-full">
          <CalendarDays className="h-4 w-4 opacity-70" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === "custom" && (
        <>
          <DatePicker
            value={customRange.start}
            onChange={(start) => onCustomRangeChange({ ...customRange, start })}
            placeholder="Start date"
            className="w-auto rounded-full"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <DatePicker
            value={customRange.end}
            onChange={(end) => onCustomRangeChange({ ...customRange, end })}
            minDate={customRange.start}
            placeholder="End date"
            className="w-auto rounded-full"
          />
        </>
      )}
    </div>
  );
}
