"use client";

import { useEffect, useState, useRef, forwardRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { Icon, LatLngTuple, Marker as LeafletMarker } from "leaflet";
import { weatherStations } from "@/lib/data/stations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Thermometer, CloudRain } from "lucide-react";
import { WeatherData } from "@/lib/types/weather";
import { fetchWeatherData } from "@/lib/services/api";

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

const MapController = ({ selectedStation }: { selectedStation: string }) => {
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
};

// Interface for station weather data state
interface StationWeatherDataState {
  [stationId: string]: {
    data: WeatherData | null;
    isLoading: boolean;
    error: string | null;
  };
}

const MapComponent = forwardRef<HTMLDivElement, MapComponentProps>(
  ({ selectedDate, onStationSelect, selectedStation }, ref) => {
    const [isClient, setIsClient] = useState(false);
    const markerRefs = useRef<{ [key: string]: LeafletMarker | null }>({});
    const [stationsData, setStationsData] = useState<StationWeatherDataState>({});
    const [mapHeight, setMapHeight] = useState("600px");

    // Initialize stations data on component mount
    useEffect(() => {
      const initialData: StationWeatherDataState = {};
      weatherStations.forEach(station => {
        initialData[station.id] = {
          data: null,
          isLoading: false,
          error: null
        };
      });
      setStationsData(initialData);
      setIsClient(true);
      
      // Responsive map height
      const updateMapHeight = () => {
        if (window.innerWidth < 640) {
          setMapHeight("400px");
        } else if (window.innerWidth < 1024) {
          setMapHeight("500px");
        } else {
          setMapHeight("600px");
        }
      };
      
      updateMapHeight();
      window.addEventListener('resize', updateMapHeight);
      
      return () => {
        window.removeEventListener('resize', updateMapHeight);
      };
    }, []);
    
    // Fetch weather data for a specific station
    const fetchStationData = async (stationId: string) => {
      const station = weatherStations.find(s => s.id === stationId);
      if (!station) return;
      
      setStationsData(prev => ({
        ...prev,
        [stationId]: {
          ...prev[stationId],
          isLoading: true,
          error: null
        }
      }));
      
      try {
        // Calculate time window (last hour from selected date)
        const endDate = new Date(selectedDate);
        const startDate = new Date(endDate);
        startDate.setHours(startDate.getHours() - 1);
        
        // Fetch data from API
        const data = await fetchWeatherData(station.deviceId, startDate, endDate);
        
        // Get latest data point if available
        const latestData = data.length > 0 ? data[data.length - 1] : null;
        
        setStationsData(prev => ({
          ...prev,
          [stationId]: {
            data: latestData,
            isLoading: false,
            error: null
          }
        }));
      } catch (error) {
        console.error(`Error fetching data for station ${stationId}:`, error);
        setStationsData(prev => ({
          ...prev,
          [stationId]: {
            ...prev[stationId],
            isLoading: false,
            error: "Failed to load data"
          }
        }));
      }
    };
    
    // Fetch data for selected station when it changes
    useEffect(() => {
      if (isClient && selectedStation) {
        fetchStationData(selectedStation);
      }
    }, [selectedStation, selectedDate, isClient]);

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
        <div className="w-full h-60 sm:h-80 md:h-[500px] lg:h-[600px] bg-gray-100 animate-pulse flex items-center justify-center">
          <p className="text-gray-500">Carregando mapa...</p>
        </div>
      );
    }

    return (
      <div ref={ref} 
        className="relative w-full rounded-lg overflow-hidden shadow-lg" 
        style={{ height: mapHeight }}
      >
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
            const stationState = stationsData[station.id] || { data: null, isLoading: false, error: null };
            const weatherData = stationState.data;
            
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
                    
                    // Load data if not already loaded
                    if (!stationState.data && !stationState.isLoading) {
                      fetchStationData(station.id);
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
                        {stationState.isLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : weatherData ? (
                          <span>{weatherData.temperature.toFixed(1)}°C</span>
                        ) : (
                          <span>--°C</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <CloudRain className="w-4 h-4 mr-1 text-[#003366]" />
                        {stationState.isLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : weatherData ? (
                          <span>{weatherData.precipitation.toFixed(1)} mm</span>
                        ) : (
                          <span>-- mm</span>
                        )}
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
      </div>
    );
  }
);

MapComponent.displayName = "MapComponent";

export default MapComponent;
