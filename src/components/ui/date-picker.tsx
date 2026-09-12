import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function toDateOnly(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string | Date;
  variant?: "outline" | "ghost";
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className, minDate, variant = "outline" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = toDateOnly(value);
  const min = minDate ? (typeof minDate === "string" ? toDateOnly(minDate) : minDate) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={variant}
          className={cn("w-full justify-start gap-2 font-normal", !selected && "text-muted-foreground", className)}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          {selected
            ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(toISODate(date));
              setOpen(false);
            }
          }}
          disabled={min ? { before: min } : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
