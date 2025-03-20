"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Download, Loader2, Filter, Calendar, Thermometer } from "lucide-react";
import { DataAggregation, ExportField, ExportOptions, WeatherData } from "@/lib/types/weather";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<WeatherData[]>;
  previewData?: WeatherData[];
}

type DatePreset = '7d' | '30d' | '90d' | 'custom';

const datePresets = [
  { label: 'Últimos 7 dias', value: '7d', days: 7 },
  { label: 'Últimos 30 dias', value: '30d', days: 30 },
  { label: 'Últimos 90 dias', value: '90d', days: 90 },
  { label: 'Personalizado', value: 'custom', days: null }
];

const defaultFields: ExportField[] = [
  { key: 'timestamp', label: 'Data/Hora', checked: true },
  { key: 'temperature', label: 'Temperatura (°C)', checked: true },
  { key: 'humidity', label: 'Umidade (%)', checked: true },
  { key: 'windSpeed', label: 'Velocidade do Vento (km/h)', checked: true },
  { key: 'solarRadiation', label: 'Radiação Solar (W/m²)', checked: true },
  { key: 'precipitation', label: 'Precipitação (mm)', checked: true },
  { key: 'evapotranspiration', label: 'Evapotranspiração (mm)', checked: true },
];

export function ExportDialog({ isOpen, onClose, onExport, previewData = [] }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('7d');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    dateRange: {
      startDate: startOfDay(subDays(new Date(), 7)),
      endDate: endOfDay(new Date()),
    },
    aggregation: 'daily',
    fields: defaultFields,
  });

  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: exportOptions.dateRange.startDate,
    to: exportOptions.dateRange.endDate
  });

  const handlePresetChange = (preset: DatePreset) => {
    if (preset === 'custom') {
      setSelectedPreset(preset);
      setIsCalendarOpen(true);
      return;
    }

    const presetConfig = datePresets.find(p => p.value === preset);
    if (!presetConfig?.days) return;

    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, presetConfig.days - 1));
    
    setSelectedPreset(preset);
    setDateRange({ from: start, to: end });
    setExportOptions(prev => ({
      ...prev,
      dateRange: { startDate: start, endDate: end }
    }));
    setIsCalendarOpen(false);
  };

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (!range?.from || !range?.to) return;
    
    setDateRange({
      from: range.from,
      to: range.to
    });
    
    setExportOptions(prev => ({
      ...prev,
      dateRange: {
        startDate: startOfDay(range.from),
        endDate: endOfDay(range.to)
      }
    }));
    setSelectedPreset('custom');
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const data = await onExport(exportOptions);

      const headers = exportOptions.fields
        .filter(field => field.checked)
        .map(field => field.label)
        .join(',');

      const rows = data.map(row => 
        exportOptions.fields
          .filter(field => field.checked)
          .map(field => {
            if (field.key === 'timestamp') {
              return format(new Date(row[field.key]), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
            }
            const value = row[field.key];
            return typeof value === 'number' ? value.toFixed(2) : '';
          })
          .join(',')
      );

      const csv = [headers, ...rows].join('\n');
      
      clearInterval(progressInterval);
      setProgress(100);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const filename = `dados_meteorologicos_${format(exportOptions.dateRange.startDate, 'yyyy-MM-dd')}_a_${format(exportOptions.dateRange.endDate, 'yyyy-MM-dd')}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setProgress(0);
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar dados');
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5" />
            Exportar Dados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Período</Label>
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
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[300px] justify-between">
                    <span>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <Calendar className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Aggregation */}
          <div className="space-y-2">
            <Label>Agregação dos Dados</Label>
            <Select
              value={exportOptions.aggregation}
              onValueChange={(value: DataAggregation) => 
                setExportOptions(prev => ({ ...prev, aggregation: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fields */}
          <div className="space-y-2">
            <Label>Campos para Exportar</Label>
            <div className="grid grid-cols-2 gap-4">
              {exportOptions.fields.map((field, index) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={field.checked}
                    onCheckedChange={(checked) => {
                      const newFields = [...exportOptions.fields];
                      newFields[index] = { ...field, checked: checked as boolean };
                      setExportOptions(prev => ({ ...prev, fields: newFields }));
                    }}
                  />
                  <Label htmlFor={field.key}>{field.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <Label>Prévia dos Dados</Label>
              <div className="max-h-40 overflow-auto border rounded-md p-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {exportOptions.fields
                        .filter(field => field.checked)
                        .map(field => (
                          <th key={field.key} className="p-2 text-left font-medium">
                            {field.label}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {exportOptions.fields
                          .filter(field => field.checked)
                          .map(field => (
                            <td key={field.key} className="p-2">
                              {field.key === 'timestamp'
                                ? format(new Date(row[field.key]), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
                                : row[field.key] != null ? (row[field.key] as number).toFixed(2) : ''}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {isExporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-gray-500">
                {progress < 30 ? "Preparando dados..." :
                 progress < 60 ? "Processando..." :
                 progress < 90 ? "Gerando arquivo..." :
                 "Concluindo..."}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
