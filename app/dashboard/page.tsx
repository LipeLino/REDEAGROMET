"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MonitoringHeader } from "@/components/dashboard/MonitoringHeader";
import { WeatherMap } from "@/components/dashboard/WeatherMap";
import { Card } from "@/components/ui/card";
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  Waves,
} from "lucide-react";
import { fetchWeatherData, fetchStationConfig } from "@/lib/services/api";
import { WeatherData, MonitoringState, StationConfig } from "@/lib/types/weather";
import { weatherStations } from "@/lib/data/stations";
import { Toaster } from "@/components/ui/toaster";

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentData, setCurrentData] = useState<WeatherData | null>(null);
  const [stationConfig, setStationConfig] = useState<StationConfig>();
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>();
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    lastUpdate: new Date(),
    selectedStation: weatherStations[0].id,
    connectionType: "WIFI",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadStationConfig = async (deviceId: string) => {
    try {
      const config = await fetchStationConfig(deviceId);
      setStationConfig(config);
    } catch (error) {
      console.error('Error loading station config:', error);
    }
  };

  const loadCurrentData = async () => {
    try {
      setMonitoringState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const station = weatherStations.find(s => s.id === monitoringState.selectedStation);
      if (!station) throw new Error("Estação não encontrada");

      console.log(`Loading data for station: ${station.name} (${station.deviceId})`);
      
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
      const data = await fetchWeatherData(station.deviceId, startDate, endDate);
      
      console.log(`Data points received: ${data.length}`);
      
      if (data.length > 0) {
        // Extract the latest data point
        const latestData = data[data.length - 1];
        
        console.log("Latest data received:", latestData);
        console.log("Values of interest:");
        console.log(`- Temperature: ${latestData.temperature}`);
        console.log(`- Precipitation: ${latestData.precipitation}`);
        console.log(`- Evapotranspiration: ${latestData.evapotranspiration}`);
        
        setCurrentData(latestData);
        setLastRefreshTime(new Date());
        setMonitoringState(prev => ({
          ...prev,
          lastUpdate: new Date(latestData.timestamp),
          isLoading: false,
        }));
      } else {
        console.error("No data received from API");
        throw new Error("Não foi possível obter dados da estação");
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setMonitoringState(prev => ({
        ...prev,
        isLoading: false,
        error: "Erro ao carregar dados meteorológicos",
      }));
    }
  };

  useEffect(() => {
    if (mounted) {
      loadCurrentData();
      loadStationConfig(weatherStations.find(s => s.id === monitoringState.selectedStation)?.deviceId || '');
      
      // Set up auto-refresh based on station config
      const intervalId = setInterval(() => {
        if (stationConfig?.refreshInterval) {
          loadCurrentData();
        }
      }, (stationConfig?.refreshInterval || 3600) * 1000);

      return () => clearInterval(intervalId);
    }
  }, [monitoringState.selectedStation, mounted, stationConfig?.refreshInterval]);

  const handleStationChange = (stationId: string) => {
    setMonitoringState(prev => ({
      ...prev,
      selectedStation: stationId,
    }));
    loadStationConfig(weatherStations.find(s => s.id === stationId)?.deviceId || '');
  };

  const handleRefresh = async () => {
    await loadCurrentData();
  };

  if (!mounted) {
    return null;
  }

  const parameters = [
    { 
      icon: Thermometer, 
      label: "Temperatura", 
      value: currentData?.temperature !== undefined ? `${currentData.temperature.toFixed(1)}°C` : "..." 
    },
    { 
      icon: Droplets, 
      label: "Umidade", 
      value: currentData?.humidity !== undefined ? `${currentData.humidity.toFixed(1)}%` : "..." 
    },
    { 
      icon: Wind, 
      label: "Velocidade do Vento", 
      value: currentData?.windSpeed !== undefined ? `${currentData.windSpeed.toFixed(1)} km/h` : "..." 
    },
    { 
      icon: Sun, 
      label: "Radiação Solar", 
      value: currentData?.solarRadiation !== undefined ? `${currentData.solarRadiation.toFixed(1)} W/m²` : "..." 
    },
    { 
      icon: CloudRain, 
      label: "Precipitação", 
      value: currentData?.precipitation !== undefined ? `${currentData.precipitation.toFixed(1)} mm` : "..." 
    },
    { 
      icon: Waves, 
      label: "Evapotranspiração", 
      value: currentData?.evapotranspiration !== undefined ? `${currentData.evapotranspiration.toFixed(1)} mm` : "..." 
    },
  ];

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <MonitoringHeader
            currentData={currentData}
            selectedStation={monitoringState.selectedStation}
            onStationChange={handleStationChange}
            isLoading={monitoringState.isLoading}
            onRefresh={handleRefresh}
            stationConfig={stationConfig}
            lastRefreshTime={lastRefreshTime}
          />
          
          {monitoringState.error && (
            <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg">
              {monitoringState.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {parameters.map((param) => (
              <Card key={param.label} className={`p-4 ${monitoringState.isLoading ? 'animate-pulse' : ''}`}>
                <div className="flex items-center space-x-4">
                  <param.icon className="w-8 h-8 text-[#003366]" />
                  <div>
                    <p className="text-sm text-gray-500">{param.label}</p>
                    <p className="text-xl font-semibold">{param.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <WeatherMap 
            selectedStation={monitoringState.selectedStation}
            onStationSelect={handleStationChange}
          />
        </main>
        <Toaster />
      </div>
    </NotificationProvider>
  );
}
