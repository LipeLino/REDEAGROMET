"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Wifi, Clock, RotateCw, Info, Menu } from "lucide-react";
import { weatherStations } from "@/lib/data/stations";
import { format, differenceInMinutes, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { WeatherData, StationConfig } from "@/lib/types/weather";
import { useNotification } from "@/hooks/use-notification";
import { formatToBrazilianDateTime } from "@/lib/utils/dateUtils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const UPDATE_INTERVAL_MINUTES = 5;
const UPDATE_INTERVAL_MS = UPDATE_INTERVAL_MINUTES * 60 * 1000;

interface MonitoringHeaderProps {
  currentData: WeatherData | null;
  selectedStation: string;
  onStationChange: (stationId: string) => void;
  isLoading: boolean;
  onRefresh?: () => Promise<void>;
  stationConfig?: StationConfig;
  lastRefreshTime?: Date;
}

export function MonitoringHeader({
  currentData,
  selectedStation,
  onStationChange,
  isLoading,
  onRefresh,
  stationConfig,
  lastRefreshTime
}: MonitoringHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update the time until next refresh
  useEffect(() => {
    if (!lastRefreshTime) return;

    const updateRemainingTime = () => {
      const now = new Date();
      const elapsedMs = now.getTime() - lastRefreshTime.getTime();
      const remainingMs = Math.max(0, UPDATE_INTERVAL_MS - elapsedMs);
      setTimeUntilNextUpdate(Math.ceil(remainingMs / 1000));
    };

    // Update immediately
    updateRemainingTime();

    // Update every second
    const intervalId = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(intervalId);
  }, [lastRefreshTime]);

  // Check if refresh is available
  const isRefreshAvailable = !lastRefreshTime || 
    (new Date().getTime() - lastRefreshTime.getTime() >= UPDATE_INTERVAL_MS);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    setRefreshError(null);

    try {
      // Check if enough time has passed since last update
      const canUpdate = !lastRefreshTime || 
                         differenceInMinutes(new Date(), lastRefreshTime) >= UPDATE_INTERVAL_MINUTES;
      
      // Check if current data is already the latest
      const isLatestData = currentData && lastRefreshTime && 
                          differenceInMinutes(new Date(currentData.timestamp), lastRefreshTime) < 1;
      
      if (isLatestData) {
        showNotification("info", "Os dados exibidos já estão atualizados", lastRefreshTime);
        setIsRefreshing(false);
        return;
      }
      
      if (!canUpdate) {
        const minutesRemaining = UPDATE_INTERVAL_MINUTES - 
                                 differenceInMinutes(new Date(), lastRefreshTime!);
        showNotification("info", `Próxima atualização disponível em ${minutesRemaining} minuto(s)`, lastRefreshTime);
        setIsRefreshing(false);
        return;
      }
      
      await onRefresh();
      
      showNotification("success", "Dados atualizados com sucesso", new Date());
    } catch (error) {
      setRefreshError("Erro ao atualizar dados");
      console.error("Refresh error:", error);
      
      showNotification("error", "Não foi possível atualizar os dados", lastRefreshTime);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const formatInterval = (seconds: number): string => {
    if (seconds < 60) return `${seconds} segundos`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`;
    return `${Math.floor(seconds / 3600)} horas`;
  };

  const formatTimeRemaining = (seconds: number | null): string => {
    if (seconds === null || seconds <= 0) return "Disponível agora";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWifiSignalClass = (signal: number | undefined) => {
    if (signal === undefined) return "text-gray-500";
    if (signal > 60) return "text-green-500";
    if (signal > 30) return "text-yellow-500";
    return "text-red-500";
  };

  // This function renders the info section (timestamp, wifi signal, etc)
  const renderInfoSection = () => (
    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row items-start sm:items-center sm:gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span suppressHydrationWarning>
          Última atualização em:{" "}
          {currentData ? (
            formatToBrazilianDateTime(currentData.timestamp)
          ) : (
            "Carregando..."
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Wifi className={cn(
          "w-4 h-4",
          getWifiSignalClass(currentData?.wifiSignal)
        )} />
        <span>
          {currentData?.wifiSignal !== undefined ? (
            `Wi-Fi (${Math.round(currentData.wifiSignal)}%)`
          ) : (
            "Wi-Fi"
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span>GMT-3</span>
      </div>
    </div>
  );

  // Desktop layout
  return (
    <>
      {/* Main card for desktop and tablet */}
      <Card className="p-4 mb-6 bg-white">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 justify-between items-start lg:items-center">
          {/* Station selector group - always visible on all screens */}
          <div className="flex items-center w-full lg:w-auto gap-4">
            <Select value={selectedStation} onValueChange={onStationChange}>
              <SelectTrigger className="w-full sm:w-[280px]">
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

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className={cn(
                  "relative",
                  (isRefreshing || isLoading) && "cursor-not-allowed opacity-50",
                  refreshError && "border-red-500 text-red-500 hover:text-red-600"
                )}
                title={refreshError || "Atualizar dados"}
              >
                <RotateCw 
                  className={cn(
                    "h-4 w-4",
                    (isRefreshing || isLoading) && "animate-spin"
                  )} 
                />
                
                {/* Blue indicator dot for when refresh is available */}
                {isRefreshAvailable && !isRefreshing && !isLoading && (
                  <span 
                    className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500
                             animate-pulse shadow-lg shadow-blue-500/50"
                  />
                )}
              </Button>

              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <Info className="h-4 w-4" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Informações da Estação</h4>
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        Intervalo de atualização: {stationConfig ? formatInterval(stationConfig.refreshInterval) : "Carregando..."}
                      </p>
                      <p className="text-muted-foreground">
                        Status: {stationConfig?.status === 'active' ? 'Ativo' : stationConfig?.status === 'maintenance' ? 'Em Manutenção' : 'Inativo'}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              
              {/* Mobile Info Drawer Trigger */}
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex sm:hidden">
                    <Info className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Informações da Estação</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 space-y-4">
                    <div className="space-y-2">
                      <p className="font-semibold">Intervalo de atualização:</p>
                      <p>{stationConfig ? formatInterval(stationConfig.refreshInterval) : "Carregando..."}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">Status:</p>
                      <p>{stationConfig?.status === 'active' ? 'Ativo' : stationConfig?.status === 'maintenance' ? 'Em Manutenção' : 'Inativo'}</p>
                    </div>
                    {renderInfoSection()}
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">Fechar</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          {/* Info section - hidden on mobile, visible on tablet/desktop */}
          <div className="hidden sm:block w-full lg:w-auto mt-4 lg:mt-0">
            {renderInfoSection()}
          </div>
        </div>
      </Card>
    </>
  );
}
