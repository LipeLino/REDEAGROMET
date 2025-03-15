import { NextResponse } from 'next/server';
import { WeatherData } from '@/lib/types/weather';

// Mock data generator for development
function generateMockData(deviceId: string): WeatherData {
  return {
    timestamp: new Date().toISOString(),
    temperature: 24.5 + Math.random() * 5,
    humidity: 65 + Math.random() * 10,
    windSpeed: 12 + Math.random() * 5,
    solarRadiation: 850 + Math.random() * 100,
    precipitation: Math.random() * 2,
    evapotranspiration: 4.2 + Math.random(),
  };
}

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    // For now, return mock data
    // In production, implement actual FTP logic here
    const mockData = generateMockData(params.deviceId);
    
    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}