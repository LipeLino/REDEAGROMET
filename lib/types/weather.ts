import { LatLngTuple } from 'leaflet';

export interface WeatherStation {
  id: string;
  name: string;
  city: string;
  state: string;
  deviceId: string;
  coordinates: LatLngTuple;
  data: WeatherData[];
}

export interface WeatherData {
  timestamp: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
  precipitation: number;
  evapotranspiration: number;
  dewPoint?: number;
  pressure?: number;
  uv?: number;
  groundTemp?: number | null;
  groundHumidity?: number | null;
  batteryLevel?: number;
  wifiSignal?: number;
  gprsSignal?: number;
  thermalSensation?: number;
}

export interface TimelineState {
  startDate: Date;
  endDate: Date;
  currentDate: Date;
}

export interface MonitoringState {
  lastUpdate: Date;
  selectedStation: string;
  connectionType: string;
  isLoading: boolean;
  error: string | null;
  stationConfig?: StationConfig;
}

export type DataAggregation = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ExportField {
  key: keyof WeatherData;
  label: string;
  checked: boolean;
}

export interface ExportOptions {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  aggregation: DataAggregation;
  fields: ExportField[];
}

export interface StationConfig {
  refreshInterval: number; // in seconds
  lastSync: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface StationStatus {
  stationId: string;
  deviceId: string;
  name: string;
  status: {
    refreshInterval: number;
    lastSync: string;
    status: 'active' | 'inactive' | 'maintenance';
    batteryLevel: number;
    signalStrength: {
      wifi: number;
      gprs: number;
    };
    lastMaintenance?: string | null;
    nextMaintenance?: string | null;
    errors: string[];
    warnings: string[];
  };
  latestData: WeatherData;
}

export interface PlugfieldResponse {
  id: number;
  deviceId: number;
  temp: number;
  tempCount: number;
  tempMax: number;
  tempMaxCount: number;
  tempMin: number;
  tempMinCount: number;
  wind: number;
  windCount: number;
  windBurst: number;
  windBurstCount: number;
  direction: number;
  directionCount: number;
  rain: number;
  rainCount: number;
  rainAccum: number;
  rainAccumCount: number;
  humidity: number;
  humidityCount: number;
  radiation: number;
  radiationCount: number;
  radiationWatts: number;
  radiationWattsCount: number;
  pressure: number;
  pressureCount: number;
  uv: number;
  uvCount: number;
  dewPoint: number;
  dewPointCount: number;
  groundTemp: number | null;
  groundTempCount: number | null;
  groundHumi: number | null;
  groundHumiCount: number | null;
  wetnessTemp: number | null;
  wetnessTempCount: number | null;
  wetnessHumi: number | null;
  wetnessHumiCount: number | null;
  latitude: string;
  longitude: string;
  deviceName: string;
  localDateTime: string;
  timestamp: number;
  additionalSensors: {
    sensorId: number;
    sensorName: string;
    sensorUnit: string;
    sensorOrder: number;
    sensorValue: number;
    sensorValueCount: number;
  }[];
}
