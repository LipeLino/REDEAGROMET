"use client";

import * as React from "react";
import { format, isValid, parse, isBefore, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DATE_FORMAT = "dd/MM/yyyy";

interface DualDatePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onRangeChange: (start: Date | undefined, end: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disabled?: boolean;
}

export function DualDatePicker({
  startDate,
  endDate,
  onRangeChange,
  minDate,
  maxDate,
  className,
  disabled = false,
}: DualDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startDate,
    to: endDate,
  });
  const [inputValues, setInputValues] = React.useState({
    start: startDate ? format(startDate, DATE_FORMAT) : "",
    end: endDate ? format(endDate, DATE_FORMAT) : "",
  });
  const [inputErrors, setInputErrors] = React.useState({
    start: "",
    end: "",
  });

  // Update input values when props change
  React.useEffect(() => {
    setInputValues({
      start: startDate ? format(startDate, DATE_FORMAT) : "",
      end: endDate ? format(endDate, DATE_FORMAT) : "",
    });
  }, [startDate, endDate]);

  const validateDate = (dateStr: string, field: "start" | "end"): Date | undefined => {
    if (!dateStr) return undefined;

    const parsed = parse(dateStr, DATE_FORMAT, new Date());
    if (!isValid(parsed)) {
      setInputErrors(prev => ({
        ...prev,
        [field]: "Data inválida",
      }));
      return undefined;
    }

    const today = startOfDay(new Date());
    if (minDate && isBefore(parsed, minDate)) {
      setInputErrors(prev => ({
        ...prev,
        [field]: `Data não pode ser anterior a ${format(minDate, DATE_FORMAT)}`,
      }));
      return undefined;
    }

    if (maxDate && isAfter(parsed, maxDate)) {
      setInputErrors(prev => ({
        ...prev,
        [field]: `Data não pode ser posterior a ${format(maxDate, DATE_FORMAT)}`,
      }));
      return undefined;
    }

    if (field === "end" && tempRange.from && isBefore(parsed, tempRange.from)) {
      setInputErrors(prev => ({
        ...prev,
        end: "Data final deve ser posterior à data inicial",
      }));
      return undefined;
    }

    if (field === "start" && tempRange.to && isAfter(parsed, tempRange.to)) {
      setInputErrors(prev => ({
        ...prev,
        start: "Data inicial deve ser anterior à data final",
      }));
      return undefined;
    }

    setInputErrors(prev => ({
      ...prev,
      [field]: "",
    }));
    return parsed;
  };

  const handleInputChange = (value: string, field: "start" | "end") => {
    setInputValues(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when input changes
    setInputErrors(prev => ({
      ...prev,
      [field]: "",
    }));

    // Only validate complete dates
    if (value.length === DATE_FORMAT.length) {
      const validDate = validateDate(value, field);
      if (validDate) {
        setTempRange(prev => ({
          from: field === "start" ? validDate : prev.from,
          to: field === "end" ? validDate : prev.to,
        }));
      }
    }
  };

  const handleCalendarSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (!range) return;
    
    setTempRange(range);
    setInputValues({
      start: range.from ? format(range.from, DATE_FORMAT) : "",
      end: range.to ? format(range.to, DATE_FORMAT) : "",
    });
    setInputErrors({ start: "", end: "" });
  };

  const handleApply = () => {
    if (inputErrors.start || inputErrors.end) return;
    onRangeChange(tempRange.from, tempRange.to);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange({ from: startDate, to: endDate });
    setInputValues({
      start: startDate ? format(startDate, DATE_FORMAT) : "",
      end: endDate ? format(endDate, DATE_FORMAT) : "",
    });
    setInputErrors({ start: "", end: "" });
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempRange({ from: undefined, to: undefined });
    setInputValues({ start: "", end: "" });
    setInputErrors({ start: "", end: "" });
    onRangeChange(undefined, undefined);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !startDate && !endDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? (
              endDate ? (
                <>
                  {format(startDate, DATE_FORMAT)} - {format(endDate, DATE_FORMAT)}
                </>
              ) : (
                format(startDate, DATE_FORMAT)
              )
            ) : (
              "Selecione um período"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip open={!!inputErrors.start}>
                    <TooltipTrigger asChild>
                      <div>
                        <Input
                          placeholder={DATE_FORMAT}
                          value={inputValues.start}
                          onChange={(e) => handleInputChange(e.target.value, "start")}
                          className={cn(
                            inputErrors.start && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    {inputErrors.start && (
                      <TooltipContent>
                        <p>{inputErrors.start}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip open={!!inputErrors.end}>
                    <TooltipTrigger asChild>
                      <div>
                        <Input
                          placeholder={DATE_FORMAT}
                          value={inputValues.end}
                          onChange={(e) => handleInputChange(e.target.value, "end")}
                          className={cn(
                            inputErrors.end && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    {inputErrors.end && (
                      <TooltipContent>
                        <p>{inputErrors.end}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <Calendar
              mode="range"
              selected={tempRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              disabled={{ before: minDate, after: maxDate }}
              locale={ptBR}
              className="rounded-md border"
            />
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!tempRange.from || !tempRange.to || !!inputErrors.start || !!inputErrors.end}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}