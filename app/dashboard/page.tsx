"use client";

import { useEffect, useState } from "react";
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
import { fetchWeatherData } from "@/lib/services/api";
import { WeatherData, MonitoringState } from "@/lib/types/weather";
import { weatherStations } from "@/lib/data/stations";

const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentData, setCurrentData] = useState<WeatherData | null>(null);
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

  const loadCurrentData = async () => {
    try {
      setMonitoringState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const station = weatherStations.find(s => s.id === monitoringState.selectedStation);
      if (!station) throw new Error("Estação não encontrada");

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
      const data = await fetchWeatherData(station.deviceId, startDate, endDate);
      
      if (data.length > 0) {
        setCurrentData(data[data.length - 1]);
        setMonitoringState(prev => ({
          ...prev,
          lastUpdate: new Date(),
          isLoading: false,
        }));
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
      const intervalId = setInterval(loadCurrentData, REFRESH_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [monitoringState.selectedStation, mounted]);

  const handleStationChange = (stationId: string) => {
    setMonitoringState(prev => ({
      ...prev,
      selectedStation: stationId,
    }));
  };

  if (!mounted) {
    return null;
  }

  const parameters = [
    { icon: Thermometer, label: "Temperatura", value: currentData ? `${currentData.temperature.toFixed(1)}°C` : "..." },
    { icon: Droplets, label: "Umidade", value: currentData ? `${currentData.humidity.toFixed(1)}%` : "..." },
    { icon: Wind, label: "Velocidade do Vento", value: currentData ? `${currentData.windSpeed.toFixed(1)} km/h` : "..." },
    { icon: Sun, label: "Radiação Solar", value: currentData ? `${currentData.solarRadiation.toFixed(1)} W/m²` : "..." },
    { icon: CloudRain, label: "Precipitação", value: currentData ? `${currentData.precipitation.toFixed(1)} mm` : "..." },
    { icon: Waves, label: "Evapotranspiração", value: currentData ? `${currentData.evapotranspiration.toFixed(1)} mm` : "..." },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <MonitoringHeader
          lastUpdate={monitoringState.lastUpdate}
          selectedStation={monitoringState.selectedStation}
          onStationChange={handleStationChange}
          isLoading={monitoringState.isLoading}
        />
        
        {monitoringState.error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg">
            {monitoringState.error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
          onStationChange={handleStationChange}
        />
      </main>
    </div>
  );
}