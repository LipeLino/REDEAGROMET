"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wifi, Clock } from "lucide-react";
import { weatherStations } from "@/lib/data/stations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonitoringHeaderProps {
  lastUpdate: Date;
  selectedStation: string;
  onStationChange: (stationId: string) => void;
  isLoading: boolean;
}

export function MonitoringHeader({
  lastUpdate,
  selectedStation,
  onStationChange,
  isLoading,
}: MonitoringHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Card className="p-4 mb-6 bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedStation} onValueChange={onStationChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione uma estação" />
            </SelectTrigger>
            <SelectContent>
              {weatherStations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name} - {station.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span suppressHydrationWarning>
              Última atualização em:{" "}
              {format(lastUpdate, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span>Via Wi-Fi</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>GMT-3</span>
          </div>
        </div>
      </div>
    </Card>
  );
}