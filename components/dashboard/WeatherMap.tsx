"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { TimelineControl } from "./TimelineControl";
import { WeatherStation, TimelineState, WeatherData, ExportOptions } from "@/lib/types/weather";
import { fetchWeatherData } from "@/lib/services/api";
import { weatherStations } from "@/lib/data/stations";
import { ExportDialog } from "./ExportDialog";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 animate-pulse flex items-center justify-center">
      <p className="text-gray-500">Carregando mapa...</p>
    </div>
  ),
});

interface WeatherMapProps {
  selectedStation: string;
  onStationChange: (stationId: string) => void;
}

export function WeatherMap({ selectedStation, onStationChange }: WeatherMapProps) {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    startDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    currentDate: new Date(),
  });
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const loadWeatherData = async (stationId: string) => {
    try {
      const station = weatherStations.find(s => s.id === stationId);
      if (!station) throw new Error("Estação não encontrada");

      const data = await fetchWeatherData(
        station.deviceId,
        timelineState.startDate,
        timelineState.endDate
      );
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  useEffect(() => {
    loadWeatherData(selectedStation);
  }, [selectedStation, timelineState.startDate, timelineState.endDate]);

  const handleTimeChange = (date: Date) => {
    if (weatherData.length > 0) {
      const selectedTime = date.getTime();
      const closestData = weatherData.reduce((prev, curr) => {
        const prevDiff = Math.abs(new Date(prev.timestamp).getTime() - selectedTime);
        const currDiff = Math.abs(new Date(curr.timestamp).getTime() - selectedTime);
        return prevDiff < currDiff ? prev : curr;
      });
      console.log('Selected data:', closestData);
    }
  };

  const handleExport = async (options: ExportOptions): Promise<WeatherData[]> => {
    const station = weatherStations.find(s => s.id === selectedStation);
    if (!station) throw new Error("Estação não encontrada");

    const data = await fetchWeatherData(
      station.deviceId,
      options.dateRange.startDate,
      options.dateRange.endDate
    );

    // Apply aggregation
    // In a real application, this would be handled by the backend
    return data;
  };

  return (
    <div className="space-y-4">
      <TimelineControl
        timelineState={timelineState}
        setTimelineState={setTimelineState}
        onTimeChange={handleTimeChange}
        onExport={() => setIsExportDialogOpen(true)}
      />
      <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
        <MapComponent
          selectedDate={timelineState.currentDate}
          onStationSelect={onStationChange}
          selectedStation={selectedStation}
        />
      </div>
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExport}
        previewData={weatherData.slice(0, 5)}
      />
    </div>
  );
}