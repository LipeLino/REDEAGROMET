"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangeManager, type DateRange } from "@/lib/utils/dateRangeUtils";
import { DayPicker } from "react-day-picker";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
}

type PresetRange = '7d' | '30d' | '90d' | 'custom';

const presets = [
  { label: 'Últimos 7 dias', value: '7d', days: 7 },
  { label: 'Últimos 30 dias', value: '30d', days: 30 },
  { label: 'Últimos 90 dias', value: '90d', days: 90 },
  { label: 'Personalizado', value: 'custom', days: null }
];

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetRange>('7d');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateRangeManager] = useState(() => new DateRangeManager(currentMonth));
  const [range, setRange] = useState<DateRange>({ from: startDate, to: endDate });

  const updateRange = useCallback((newRange: DateRange) => {
    if (newRange.from && newRange.to) {
      const start = startOfDay(newRange.from);
      const end = endOfDay(newRange.to);
      setRange({ from: start, to: end });
      dateRangeManager.setRange({ from: start, to: end });
      onRangeChange(start, end);
    }
  }, [dateRangeManager, onRangeChange]);

  const handlePresetChange = useCallback((preset: PresetRange) => {
    setSelectedPreset(preset);
    
    if (preset === 'custom') {
      setIsOpen(true);
      return;
    }

    const presetConfig = presets.find(p => p.value === preset);
    if (presetConfig?.days) {
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(end, presetConfig.days - 1));
      updateRange({ from: start, to: end });
      setIsOpen(false);
    }
  }, [updateRange]);

  const handleMonthChange = useCallback((month: Date) => {
    setCurrentMonth(month);
    dateRangeManager.setCurrentMonth(month);
  }, [dateRangeManager]);

  useEffect(() => {
    const newRange = { from: startDate, to: endDate };
    setRange(newRange);
    dateRangeManager.setRange(newRange);
    
    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const matchingPreset = presets.find(p => p.value !== 'custom' && p.days === daysDiff);
    setSelectedPreset(matchingPreset ? matchingPreset.value as PresetRange : 'custom');
  }, [startDate, endDate, dateRangeManager]);

  const modifiers = dateRangeManager.getModifiers();

  const modifiersStyles = {
    selected: {
      backgroundColor: '#003366',
      color: 'white',
      borderRadius: '6px',
    },
    rangeStart: {
      backgroundColor: '#003366',
      color: 'white',
      borderRadius: '6px 0 0 6px',
    },
    rangeEnd: {
      backgroundColor: '#003366',
      color: 'white',
      borderRadius: '0 6px 6px 0',
    },
    inRange: {
      backgroundColor: 'rgba(0, 51, 102, 0.1)',
      color: '#003366',
    },
  };

  return (
    <div className="flex items-center space-x-4">
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
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

      <Popover open={isOpen} onOpenChange={setIsOpen}>
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
              {format(range.from!, "dd/MM/yyyy", { locale: ptBR })} -{" "}
              {format(range.to!, "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="center">
          <div className="space-y-4">
            <DayPicker
              mode="range"
              selected={range}
              month={currentMonth}
              onMonthChange={handleMonthChange}
              onSelect={(newRange) => {
                if (newRange?.from && newRange?.to) {
                  updateRange(newRange);
                }
              }}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              showOutsideDays={false}
              locale={ptBR}
              styles={{
                months: { display: 'flex', gap: '1rem' },
                month: { margin: 0 },
                caption: { position: 'relative', marginBottom: '0.5rem' },
                caption_label: { fontSize: '0.875rem', fontWeight: 500 },
                nav: { display: 'flex', gap: '0.25rem' },
                nav_button: {
                  padding: '0.25rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  opacity: 0.5,
                  transition: 'opacity 0.2s',
                  ':hover': { opacity: 1 },
                },
                table: { width: '100%', borderCollapse: 'collapse' },
                head_row: { display: 'flex', marginBottom: '0.5rem' },
                head_cell: { 
                  width: '2.25rem', 
                  textAlign: 'center',
                  color: 'var(--muted-foreground)',
                  fontSize: '0.75rem'
                },
                row: { display: 'flex', width: '100%', marginTop: '0.5rem' },
                cell: { 
                  width: '2.25rem',
                  height: '2.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  position: 'relative',
                  cursor: 'pointer',
                  userSelect: 'none',
                  ':hover': {
                    backgroundColor: 'rgba(0, 51, 102, 0.1)',
                  }
                },
                day: {
                  margin: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                day_outside: { opacity: 0.5 },
                day_disabled: { opacity: 0.5, cursor: 'not-allowed' },
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
