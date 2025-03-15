"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isSameMonth, isWithinInterval, startOfMonth, endOfMonth, isSameDay, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
}

type PresetRange = '7d' | '30d' | '90d' | 'custom';

const presets = [
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Últimos 30 dias', value: '30d' },
  { label: 'Últimos 90 dias', value: '90d' },
  { label: 'Personalizado', value: 'custom' },
];

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetRange>('7d');
  const [tempRange, setTempRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startDate,
    to: endDate
  });
  const calendarRef = useRef<HTMLDivElement>(null);
  const [firstMonth, setFirstMonth] = useState(startDate);
  const [secondMonth, setSecondMonth] = useState(new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1));

  const applyPresetRange = (days: number) => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days));
    setTempRange({ from: start, to: end });
    onRangeChange(start, end);
  };

  const handlePresetChange = (preset: PresetRange) => {
    setSelectedPreset(preset);
    
    if (preset === 'custom') {
      setIsOpen(true);
      return;
    }

    const days = parseInt(preset);
    applyPresetRange(days);
    setIsOpen(false);
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      setTempRange({ from: undefined, to: undefined });
      return;
    }

    const newRange = {
      from: range.from ? startOfDay(range.from) : undefined,
      to: range.to ? endOfDay(range.to) : undefined
    };

    setTempRange(newRange);

    if (newRange.from && newRange.to) {
      onRangeChange(newRange.from, newRange.to);
      setSelectedPreset('custom');
      setIsOpen(false);
    }
  };

  const handleMonthChange = (month: Date) => {
    setFirstMonth(month);
    setSecondMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        if (!tempRange.from || !tempRange.to) return;
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tempRange]);

  useEffect(() => {
    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const matchingPreset = presets.find(p => {
      if (p.value === 'custom') return false;
      return parseInt(p.value) === daysDiff;
    });

    setSelectedPreset(matchingPreset ? matchingPreset.value as PresetRange : 'custom');
    setTempRange({ from: startDate, to: endDate });
  }, [startDate, endDate]);

  const modifiers = {
    selected: (date: Date) => {
      if (!tempRange.from || !tempRange.to) return false;
      return isSameDay(date, tempRange.from) || isSameDay(date, tempRange.to);
    },
    rangeStart: (date: Date) => {
      if (!tempRange.from) return false;
      return isSameDay(date, tempRange.from);
    },
    rangeEnd: (date: Date) => {
      if (!tempRange.to) return false;
      return isSameDay(date, tempRange.to);
    },
    inRange: (date: Date) => {
      if (!tempRange.from || !tempRange.to) return false;
      
      // Check if the date is within the selected range
      const isInRange = isWithinInterval(date, {
        start: startOfDay(tempRange.from),
        end: endOfDay(tempRange.to)
      });

      // Check if the date belongs to either the first or second month
      const belongsToVisibleMonths = 
        isSameMonth(date, firstMonth) || 
        isSameMonth(date, secondMonth);

      return isInRange && belongsToVisibleMonths;
    },
    outside: (date: Date) => {
      return !isSameMonth(date, firstMonth) && !isSameMonth(date, secondMonth);
    }
  };

  const modifiersStyles = {
    selected: {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      fontWeight: "500"
    },
    rangeStart: {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      borderTopLeftRadius: "0.375rem",
      borderBottomLeftRadius: "0.375rem",
      fontWeight: "500"
    },
    rangeEnd: {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      borderTopRightRadius: "0.375rem",
      borderBottomRightRadius: "0.375rem",
      fontWeight: "500"
    },
    inRange: {
      backgroundColor: "hsl(var(--accent) / 0.5)",
      borderRadius: "0"
    },
    outside: {
      opacity: 0.5,
      cursor: "default"
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Select 
        value={selectedPreset} 
        onValueChange={handlePresetChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            {presets.find(p => p.value === selectedPreset)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover 
        open={isOpen} 
        onOpenChange={(open) => {
          if (open) {
            setSelectedPreset('custom');
          }
          setIsOpen(open);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[300px] justify-start text-left font-normal"
            onClick={() => {
              setSelectedPreset('custom');
              setIsOpen(true);
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>
              {format(startDate, "dd/MM/yyyy", { locale: ptBR })} -{" "}
              {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" ref={calendarRef}>
          <Calendar
            mode="range"
            defaultMonth={startDate}
            selected={{
              from: tempRange.from,
              to: tempRange.to,
            }}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            locale={ptBR}
            disabled={{ after: new Date() }}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            onMonthChange={handleMonthChange}
            showOutsideDays={true}
            fromMonth={firstMonth}
            toMonth={secondMonth}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}