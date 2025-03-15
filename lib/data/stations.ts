import { WeatherStation } from "@/lib/types/weather";
import { LatLngTuple } from "leaflet";

export const weatherStations: Omit<WeatherStation, 'data'>[] = [
  {
    id: "sao-francisco-sales",
    name: "São Francisco de Sales",
    city: "São Francisco de Sales",
    state: "MG",
    deviceId: "3424",
    coordinates: [-19.8612, -49.7689] as LatLngTuple,
  },
  {
    id: "prata",
    name: "Prata",
    city: "Prata",
    state: "MG",
    deviceId: "4971",
    coordinates: [-19.3088, -48.9276] as LatLngTuple,
  },
  {
    id: "aparecida-de-minas",
    name: "Aparecida de Minas",
    city: "Frutal",
    state: "MG",
    deviceId: "FRUTALAG",
    coordinates: [-20.1119, -49.2320] as LatLngTuple, // Updated to exact coordinates provided
  },
  {
    id: "frutal",
    name: "Frutal",
    city: "Frutal",
    state: "MG",
    deviceId: "FRUTALMT",
    coordinates: [-20.0303, -48.9356] as LatLngTuple,
  }
];