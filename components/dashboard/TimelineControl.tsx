"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  SkipBack, 
  Download, 
  Trash2, 
  Filter, 
  Calendar,
  CloudSun,
  Check,
  X
} from "lucide-react";
import { TimelineState } from "@/lib/types/weather";
import { weatherStations } from "@/lib/data/stations";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay, isValid, parse, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type DatePreset = '7d' | '30d' | '90d' | 'custom';

const datePresets = [
  { label: 'Últimos 7 dias', value: '7d', days: 7 },
  { label: 'Últimos 30 dias', value: '30d', days: 30 },
  { label: 'Últimos 90 dias', value: '90d', days: 90 },
  { label: 'Personalizado', value: 'custom', days: null }
];

const DATE_FORMAT = "dd/MM/yyyy";

interface TimelineControlProps {
  onTimeChange: (date: Date) => void;
  onExport: () => void;
  timelineState: TimelineState;
  setTimelineState: (state: TimelineState) => void;
}

export function TimelineControl({
  onTimeChange,
  onExport,
  timelineState,
  setTimelineState,
}: TimelineControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStations, setSelectedStations] = useState<string[]>([weatherStations[0]?.id].filter(Boolean));
  const [isStationSelectorOpen, setIsStationSelectorOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('7d');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: timelineState.startDate,
    to: timelineState.endDate
  });
  const [inputValues, setInputValues] = useState({
    start: format(timelineState.startDate, DATE_FORMAT),
    end: format(timelineState.endDate, DATE_FORMAT),
  });
  const [inputErrors, setInputErrors] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    setInputValues({
      start: format(timelineState.startDate, DATE_FORMAT),
      end: format(timelineState.endDate, DATE_FORMAT),
    });
    setDateRange({
      from: timelineState.startDate,
      to: timelineState.endDate,
    });
  }, [timelineState.startDate, timelineState.endDate]);

  useEffect(() => {
    const savedStations = sessionStorage.getItem('selectedStations');
    if (savedStations) {
      const parsedStations = JSON.parse(savedStations);
      const validStations = parsedStations.filter((id: string) => 
        weatherStations.some(station => station.id === id)
      );
      setSelectedStations(validStations.length ? validStations : [weatherStations[0]?.id].filter(Boolean));
    }
  }, []);

  useEffect(() => {
    if (selectedStations.length > 0) {
      sessionStorage.setItem('selectedStations', JSON.stringify(selectedStations));
    }
  }, [selectedStations]);

  const togglePlayback = () => setIsPlaying(!isPlaying);

  const resetTimeline = () => {
    setTimelineState({ ...timelineState, currentDate: timelineState.startDate });
    setIsPlaying(false);
  };

  const clearFilters = () => {
    const defaultStation = weatherStations[0]?.id;
    if (defaultStation) {
      setSelectedStations([defaultStation]);
    }
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, 7));
    
    setTimelineState({
      startDate: start,
      endDate: end,
      currentDate: start,
    });
    setIsPlaying(false);
    setSelectedPreset('7d');
    setDateRange({
      from: start,
      to: end
    });
    setInputValues({
      start: format(start, DATE_FORMAT),
      end: format(end, DATE_FORMAT),
    });
    setInputErrors({ start: "", end: "" });
  };

  const handleStationToggle = (stationId: string) => {
    setSelectedStations(prev => {
      if (prev.includes(stationId)) {
        return prev.length > 1 ? prev.filter(id => id !== stationId) : prev;
      }
      return [...prev, stationId];
    });
  };

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

    const today = endOfDay(new Date());
    if (isValid(parsed) && isAfter(parsed, today)) {
      setInputErrors(prev => ({
        ...prev,
        [field]: "Data não pode ser futura",
      }));
      return undefined;
    }

    if (field === "end" && dateRange.from && isBefore(parsed, dateRange.from)) {
      setInputErrors(prev => ({
        ...prev,
        end: "Data final deve ser posterior à data inicial",
      }));
      return undefined;
    }

    if (field === "start" && dateRange.to && isAfter(parsed, dateRange.to)) {
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

    setInputErrors(prev => ({
      ...prev,
      [field]: "",
    }));

    if (value.length === DATE_FORMAT.length) {
      const validDate = validateDate(value, field);
      if (validDate) {
        setDateRange(prev => ({
          from: field === "start" ? validDate : prev.from,
          to: field === "end" ? validDate : prev.to,
        }));
      }
    }
  };

  const handlePresetChange = (preset: DatePreset) => {
    setSelectedPreset(preset);
    
    if (preset === 'custom') {
      setIsCalendarOpen(true);
      return;
    }

    const presetConfig = datePresets.find(p => p.value === preset);
    if (!presetConfig) return;

    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, presetConfig.days!));
    
    setDateRange({ from: start, to: end });
    setTimelineState(prev => ({
      ...prev,
      startDate: start,
      endDate: end,
      currentDate: start
    }));
    setInputValues({
      start: format(start, DATE_FORMAT),
      end: format(end, DATE_FORMAT),
    });
    setInputErrors({ start: "", end: "" });
    setIsCalendarOpen(false);
  };

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (!range) {
      setDateRange({ from: timelineState.startDate, to: timelineState.endDate });
      setInputValues({ start: "", end: "" });
      return;
    }
    
    if (range.from && range.to) {
      setDateRange({
        from: range.from,
        to: range.to
      });
      
      setInputValues({
        start: format(range.from, DATE_FORMAT),
        end: format(range.to, DATE_FORMAT),
      });

      const start = startOfDay(range.from);
      const end = endOfDay(range.to);
      
      setTimelineState(prev => ({
        ...prev,
        startDate: start,
        endDate: end,
        currentDate: start
      }));
      setSelectedPreset('custom');
    }
  };

  const handleApplyDateRange = () => {
    if (inputErrors.start || inputErrors.end) return;
    if (!dateRange.from || !dateRange.to) return;

    const start = startOfDay(dateRange.from);
    const end = endOfDay(dateRange.to);

    setTimelineState(prev => ({
      ...prev,
      startDate: start,
      endDate: end,
      currentDate: start
    }));
    setIsCalendarOpen(false);
  };

  // Desktop layout rendering
  const desktopLayout = (
    <div className="hidden sm:flex items-center gap-4 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-4">
        <Popover 
          open={isStationSelectorOpen} 
          onOpenChange={setIsStationSelectorOpen}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[300px] justify-between">
              <span>Estações ({selectedStations.length})</span>
              <CloudSun className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar estação..." />
              <CommandList>
                <CommandEmpty>Nenhuma estação encontrada.</CommandEmpty>
                <CommandGroup>
                  <div className="p-2 border-b">
                    <div className="flex justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStations(weatherStations.map(s => s.id));
                          setIsStationSelectorOpen(false);
                        }}
                        className="text-xs hover:text-[#003366] hover:bg-[#003366]/10"
                      >
                        Selecionar Todas
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const defaultStation = weatherStations[0]?.id;
                          if (defaultStation) {
                            setSelectedStations([defaultStation]);
                          }
                          setIsStationSelectorOpen(false);
                        }}
                        className="text-xs hover:text-[#003366] hover:bg-[#003366]/10"
                      >
                        Limpar Seleção
                      </Button>
                    </div>
                  </div>
                  {weatherStations.map((station) => (
                    <CommandItem
                      key={station.id}
                      value={station.name}
                      className="flex items-center justify-between py-2 cursor-pointer data-[disabled]:pointer-events-auto hover:bg-[#003366]/10"
                      onSelect={(currentValue) => {
                        handleStationToggle(station.id);
                      }}
                    >
                      <span>{station.name}</span>
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border transition-colors cursor-pointer",
                          selectedStations.includes(station.id)
                            ? "bg-[#003366] border-[#003366] text-white"
                            : "border-[#003366] hover:border-[#004080]"
                        )}
                      >
                        {selectedStations.includes(station.id) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap gap-2">
          {selectedStations.map(stationId => {
            const station = weatherStations.find(s => s.id === stationId);
            if (!station) return null;
            return (
              <Badge
                key={station.id}
                variant="secondary"
                className="flex items-center gap-1 bg-[#003366]/10 text-[#003366] hover:bg-[#003366]/20"
              >
                {station.name}
                {selectedStations.length > 1 && (
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-[#004080]"
                    onClick={() => handleStationToggle(station.id)}
                  />
                )}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Mobile layout - station selection drawer
  const mobileStationSelector = (
    <div className="sm:hidden mb-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="truncate">Estações ({selectedStations.length})</span>
            <CloudSun className="h-4 w-4 ml-2 flex-shrink-0" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Selecionar Estações</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <div className="flex justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStations(weatherStations.map(s => s.id));
                }}
                className="text-xs"
              >
                Selecionar Todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const defaultStation = weatherStations[0]?.id;
                  if (defaultStation) {
                    setSelectedStations([defaultStation]);
                  }
                }}
                className="text-xs"
              >
                Limpar Seleção
              </Button>
            </div>
            
            <div className="space-y-3 mt-4">
              {weatherStations.map((station) => (
                <div 
                  key={station.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <span>{station.name}</span>
                  <Button
                    variant={selectedStations.includes(station.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStationToggle(station.id)}
                    className={selectedStations.includes(station.id) ? "bg-[#003366]" : ""}
                  >
                    {selectedStations.includes(station.id) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      "Selecionar"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="flex flex-wrap gap-2 mt-3">
        {selectedStations.map(stationId => {
          const station = weatherStations.find(s => s.id === stationId);
          if (!station) return null;
          return (
            <Badge
              key={station.id}
              variant="secondary"
              className="flex items-center gap-1 bg-[#003366]/10 text-[#003366] hover:bg-[#003366]/20"
            >
              {station.name}
              {selectedStations.length > 1 && (
                <X
                  className="h-3 w-3 cursor-pointer hover:text-[#004080]"
                  onClick={() => handleStationToggle(station.id)}
                />
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );

  // Controls section - desktop view
  const controlsDesktop = (
    <div className="hidden sm:flex items-center justify-between pt-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayback}
          className="hover:bg-[#003366]/10 hover:text-[#003366]"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimeline}
          className="hover:bg-[#003366]/10 hover:text-[#003366]"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {datePresets.find(p => p.value === selectedPreset)?.label}
            </SelectValue>
            <Filter className="w-4 h-4 ml-2" />
          </SelectTrigger>
          <SelectContent>
            {datePresets.map((preset) => (
              <SelectItem 
                key={preset.value} 
                value={preset.value}
                className="hover:bg-[#003366]/10 focus:bg-[#003366]/10 focus:text-[#003366]"
              >
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover 
          open={isCalendarOpen} 
          onOpenChange={(open) => {
            if (open) {
              setSelectedPreset('custom');
            }
            setIsCalendarOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[300px] justify-between">
              <span>
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, DATE_FORMAT, { locale: ptBR })} -{" "}
                      {format(dateRange.to, DATE_FORMAT, { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, DATE_FORMAT, { locale: ptBR })
                  )
                ) : (
                  "Selecione um período"
                )}
              </span>
              <Calendar className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="center">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <TooltipProvider>
                    <Tooltip open={!!inputErrors.start}>
                      <TooltipTrigger asChild>
                        <div>
                          <Input
                            placeholder={DATE_FORMAT}
                            value={inputValues.start}
                            onChange={(e) => handleInputChange(e.target.value, "start")}
                            className={cn(
                              inputErrors.start && "border-red-500 focus-visible:ring-red-500",
                              "focus-visible:ring-[#003366] focus-visible:border-[#003366]"
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
                <div>
                  <TooltipProvider>
                    <Tooltip open={!!inputErrors.end}>
                      <TooltipTrigger asChild>
                        <div>
                          <Input
                            placeholder={DATE_FORMAT}
                            value={inputValues.end}
                            onChange={(e) => handleInputChange(e.target.value, "end")}
                            className={cn(
                              inputErrors.end && "border-red-500 focus-visible:ring-red-500",
                              "focus-visible:ring-[#003366] focus-visible:border-[#003366]"
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
              
              <CalendarComponent
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to
                }}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
                locale={ptBR}
                className="rounded-md border shadow"
                showOutsideDays={true}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    "hover:bg-[#003366] hover:text-white rounded-md transition-colors"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                    "[&:has([aria-selected])]:bg-transparent"
                  ),
                  day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                    "hover:bg-[#003366]/10 hover:text-[#003366]",
                    "focus:bg-[#003366]/10 focus:text-[#003366]",
                    "transition-colors rounded-md"
                  ),
                  day_range_start: "rounded-l-md bg-[#003366] text-white hover:bg-[#004080] hover:text-white focus:bg-[#004080] focus:text-white",
                  day_range_end: "rounded-r-md bg-[#003366] text-white hover:bg-[#004080] hover:text-white focus:bg-[#004080] focus:text-white",
                  day_selected: "bg-[#003366] text-white hover:bg-[#004080] hover:text-white focus:bg-[#004080] focus:text-white",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground hover:bg-transparent hover:text-muted-foreground focus:bg-transparent focus:text-muted-foreground",
                  day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                  day_range_middle: "aria-selected:bg-[#003366]/10 aria-selected:text-[#003366] [&.day_outside]:bg-transparent [&.day_outside]:text-muted-foreground",
                  day_hidden: "invisible"
                }}
              />

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateRange({ from: timelineState.startDate, to: timelineState.endDate });
                    setInputValues({ start: "", end: "" });
                    setInputErrors({ start: "", end: "" });
                  }}
                  className="text-muted-foreground hover:text-[#003366] hover:bg-[#003366]/10"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: timelineState.startDate,
                        to: timelineState.endDate
                      });
                      setInputValues({
                        start: format(timelineState.startDate, DATE_FORMAT),
                        end: format(timelineState.endDate, DATE_FORMAT)
                      });
                      setInputErrors({ start: "", end: "" });
                      setIsCalendarOpen(false);
                    }}
                    className="hover:bg-[#003366]/10 hover:text-[#003366]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyDateRange}
                    disabled={!dateRange.from || !dateRange.to || !!inputErrors.start || !!inputErrors.end}
                    className="bg-[#003366] hover:bg-[#004080] text-white"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          onClick={clearFilters}
          className="flex items-center gap-2 hover:bg-[#003366]/10 hover:text-[#003366]"
        >
          <span>Limpar Filtros</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={onExport}
        className="flex items-center gap-2 hover:bg-[#003366]/10 hover:text-[#003366]"
        disabled={selectedStations.length === 0}
      >
        <span>Gerar Relatório</span>
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );

  // Controls section - mobile view
  const controlsMobile = (
    <div className="sm:hidden">
      <div className="flex flex-col gap-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayback}
              className="hover:bg-[#003366]/10 hover:text-[#003366]"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimeline}
              className="hover:bg-[#003366]/10 hover:text-[#003366]"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Período</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Selecionar Período</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <Select value={selectedPreset} onValueChange={handlePresetChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {datePresets.find(p => p.value === selectedPreset)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {datePresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium mb-1">Data inicial</p>
                    <Input
                      placeholder={DATE_FORMAT}
                      value={inputValues.start}
                      onChange={(e) => handleInputChange(e.target.value, "start")}
                      className={cn(
                        inputErrors.start && "border-red-500"
                      )}
                    />
                    {inputErrors.start && (
                      <p className="text-xs text-red-500 mt-1">{inputErrors.start}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Data final</p>
                    <Input
                      placeholder={DATE_FORMAT}
                      value={inputValues.end}
                      onChange={(e) => handleInputChange(e.target.value, "end")}
                      className={cn(
                        inputErrors.end && "border-red-500"
                      )}
                    />
                    {inputErrors.end && (
                      <p className="text-xs text-red-500 mt-1">{inputErrors.end}</p>
                    )}
                  </div>
                </div>
                
                <CalendarComponent
                  mode="range"
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to
                  }}
                  onSelect={handleDateRangeSelect}
                  disabled={{ after: new Date() }}
                  locale={ptBR}
                  className="rounded-md border shadow"
                />

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  <Button
                    onClick={handleApplyDateRange}
                    disabled={!dateRange.from || !dateRange.to || !!inputErrors.start || !!inputErrors.end}
                    className="bg-[#003366]"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex-1 mr-2"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>

          <Button
            variant="outline"
            onClick={onExport}
            className="flex-1 ml-2"
            disabled={selectedStations.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative z-50">
      <Card className="p-4 relative bg-white">
        {desktopLayout}
        {mobileStationSelector}
        {controlsDesktop}
        {controlsMobile}
      </Card>
    </div>
  );
}
