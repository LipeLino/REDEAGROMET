"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { Icon, LatLngTuple, Marker as LeafletMarker } from "leaflet";
import { weatherStations } from "@/lib/data/stations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Thermometer, CloudRain } from "lucide-react";

interface MapComponentProps {
  selectedDate: Date;
  onStationSelect: (stationId: string) => void;
  selectedStation: string;
}

// Custom station marker icon
const createStationIcon = (isSelected: boolean) => new Icon({
  iconUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 44'%3E%3Cpath d='M16 0C7.164 0 0 7.164 0 16c0 8.837 16 28 16 28s16-19.163 16-28C32 7.164 24.836 0 16 0zm0 24c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z' fill='${isSelected ? '%23003366' : '%23999999'}' /%3E%3Ccircle cx='16' cy='16' r='6' fill='white' /%3E%3C/svg%3E`,
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -44],
});

function MapController({ selectedStation }: { selectedStation: string }) {
  const map = useMap();
  
  useEffect(() => {
    const station = weatherStations.find(s => s.id === selectedStation);
    if (station) {
      map.setView(station.coordinates, map.getZoom(), {
        animate: true,
        duration: 0.5
      });
    }
  }, [selectedStation, map]);

  return null;
}

export default function MapComponent({ selectedDate, onStationSelect, selectedStation }: MapComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const markerRefs = useRef<{ [key: string]: LeafletMarker | null }>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to handle popup state when selected station changes
  useEffect(() => {
    // Close all popups first
    Object.values(markerRefs.current).forEach(marker => {
      if (marker) {
        marker.closePopup();
      }
    });

    // Open popup for selected station
    const selectedMarker = markerRefs.current[selectedStation];
    if (selectedMarker) {
      selectedMarker.openPopup();
    }
  }, [selectedStation]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    );
  }

  // Mock weather data for demonstration
  const getStationWeatherData = (stationId: string) => {
    // In a real application, this would come from your actual weather data
    return {
      temperature: 25 + Math.random() * 5,
      precipitation: Math.random() * 10
    };
  };

  return (
    <MapContainer
      center={[-19.8833, -48.5000] as LatLngTuple}
      zoom={9}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <MapController selectedStation={selectedStation} />
      
      <TileLayer
        url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
        maxZoom={20}
        subdomains={["mt0", "mt1", "mt2", "mt3"]}
        attribution="&copy; Google Maps"
      />

      {weatherStations.map((station) => {
        const weatherData = getStationWeatherData(station.id);
        return (
          <Marker
            key={station.id}
            position={station.coordinates}
            icon={createStationIcon(station.id === selectedStation)}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[station.id] = ref;
              }
            }}
            eventHandlers={{
              click: () => {
                // Close all other popups
                Object.values(markerRefs.current).forEach(marker => {
                  if (marker && marker !== markerRefs.current[station.id]) {
                    marker.closePopup();
                  }
                });
                // Open this popup
                const marker = markerRefs.current[station.id];
                if (marker) {
                  marker.openPopup();
                }
              }
            }}
          >
            <Popup>
              <div className="text-center space-y-3 p-2">
                <h3 className="font-semibold text-lg text-[#003366]">{station.name}</h3>
                <div className="flex justify-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Thermometer className="w-4 h-4 mr-1 text-[#003366]" />
                    <span>{weatherData.temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex items-center">
                    <CloudRain className="w-4 h-4 mr-1 text-[#003366]" />
                    <span>{weatherData.precipitation.toFixed(1)} mm</span>
                  </div>
                </div>
                {station.id === selectedStation ? (
                  <Button 
                    className="w-full bg-gray-600 hover:bg-gray-600 cursor-default text-white font-medium"
                    disabled
                  >
                    Estação Selecionada
                  </Button>
                ) : (
                  <Button 
                    className={cn(
                      "w-full text-white font-medium",
                      "bg-[#003366] hover:bg-[#004080]"
                    )}
                    onClick={() => onStationSelect(station.id)}
                  >
                    Selecionar Estação
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}