import { WeatherData, PlugfieldResponse, StationConfig, StationStatus } from '@/lib/types/weather';
import { weatherStations } from '@/lib/data/stations';
import { toBrazilianTimezone } from '@/lib/utils/dateUtils';
import { parseWeatherTextFile } from '@/lib/utils/textParser';

const API_BASE_URL = 'https://prod-api.plugfield.com.br';
const API_KEY = 'LFtc9EgwlJ5hErrluKss68gWrHjyBWiE6oWI8pqb';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjI0OTgsImFjY291bnRJZCI6NjU4OTAsInVzZXJuYW1lIjoiam9hby5maXNjaGVyQHVlbWcuYnIiLCJpYXQiOjE3MzQzNjIzMzF9.nKzch3EVu-7vIFwGo-I6cBKrOnOsbhwcsJ1hWMTsGeU';

// FTP Server config
const FTP_BASE_URL = '/api/ftp'; // API proxy for FTP access

// Mock data generator for development
function generateMockData(startDate: Date, endDate: Date): WeatherData[] {
  const data: WeatherData[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    data.push({
      timestamp: currentDate.toISOString(),
      temperature: 24.5 + Math.random() * 5,
      humidity: 65 + Math.random() * 10,
      windSpeed: 12 + Math.random() * 5,
      solarRadiation: 850 + Math.random() * 100,
      precipitation: Math.random() * 2,
      evapotranspiration: 4.2 + Math.random(),
      dewPoint: 19.5 + Math.random() * 2,
      pressure: 1013 + Math.random() * 5,
      uv: Math.random() * 10,
      groundTemp: Math.random() > 0.5 ? 22 + Math.random() * 3 : null,
      groundHumidity: Math.random() > 0.5 ? 60 + Math.random() * 10 : null,
      batteryLevel: 85 + Math.random() * 15,
      wifiSignal: 45 + Math.random() * 30,
      gprsSignal: Math.random() > 0.5 ? 60 + Math.random() * 20 : 0,
      thermalSensation: 23 + Math.random() * 4,
    });
    currentDate.setHours(currentDate.getHours() + 1);
  }
  
  return data;
}

export async function fetchAllStationsStatus(): Promise<StationStatus[]> {
  const stationStatuses: StationStatus[] = [];

  for (const station of weatherStations) {
    try {
      // Handle FTP-based stations separately
      if (station.deviceId === 'FRUTALAG' || station.deviceId === 'FRUTALMT') {
        // Use simplified API for FTP station status
        const ftpStationStatus = await fetchFtpStationStatus(station.deviceId, station.id, station.name);
        stationStatuses.push(ftpStationStatus);
        continue;
      }

      const url = `${API_BASE_URL}/device/${station.deviceId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-key': API_KEY,
          'Authorization': AUTH_TOKEN,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      stationStatuses.push({
        stationId: station.id,
        deviceId: station.deviceId,
        name: station.name,
        status: {
          refreshInterval: data.refreshInterval || 3600,
          lastSync: data.lastSync || new Date().toISOString(),
          status: data.status || 'active',
          batteryLevel: data.batteryLevel || 100,
          signalStrength: {
            wifi: data.wifiSignal || 0,
            gprs: data.gprsSignal || 0
          },
          lastMaintenance: data.lastMaintenance || null,
          nextMaintenance: data.nextMaintenance || null,
          errors: data.errors || [],
          warnings: data.warnings || []
        },
        latestData: {
          timestamp: data.lastUpdate || new Date().toISOString(),
          temperature: data.currentTemp || 0,
          humidity: data.currentHumidity || 0,
          windSpeed: data.currentWind || 0,
          solarRadiation: data.currentRadiation || 0,
          precipitation: data.currentRain || 0,
          evapotranspiration: data.currentEto || 0,
          dewPoint: data.currentDewPoint || 0,
          pressure: data.currentPressure || 0,
          uv: data.currentUv || 0,
          groundTemp: data.currentGroundTemp || null,
          groundHumidity: data.currentGroundHumi || null,
          batteryLevel: data.currentBattery || 100,
          wifiSignal: data.currentWifiSignal || 0,
          gprsSignal: data.currentGprsSignal || 0,
          thermalSensation: data.currentThermalSensation || 0
        }
      });
    } catch (error) {
      console.error(`Error fetching status for station ${station.id}:`, error);
      // Add mock status for failed requests
      stationStatuses.push({
        stationId: station.id,
        deviceId: station.deviceId,
        name: station.name,
        status: {
          refreshInterval: 3600,
          lastSync: new Date().toISOString(),
          status: 'active',
          batteryLevel: 100,
          signalStrength: {
            wifi: 80,
            gprs: 0
          },
          errors: [],
          warnings: []
        },
        latestData: {
          timestamp: new Date().toISOString(),
          temperature: 25 + Math.random() * 5,
          humidity: 65 + Math.random() * 10,
          windSpeed: 12 + Math.random() * 5,
          solarRadiation: 850 + Math.random() * 100,
          precipitation: Math.random() * 2,
          evapotranspiration: 4.2 + Math.random(),
          dewPoint: 19.5 + Math.random() * 2,
          pressure: 1013 + Math.random() * 5,
          uv: Math.random() * 10,
          groundTemp: Math.random() > 0.5 ? 22 + Math.random() * 3 : null,
          groundHumidity: Math.random() > 0.5 ? 60 + Math.random() * 10 : null,
          batteryLevel: 85 + Math.random() * 15,
          wifiSignal: 45 + Math.random() * 30,
          gprsSignal: Math.random() > 0.5 ? 60 + Math.random() * 20 : 0,
          thermalSensation: 23 + Math.random() * 4
        }
      });
    }
  }

  return stationStatuses;
}

async function fetchFtpStationStatus(deviceId: string, stationId: string, stationName: string): Promise<StationStatus> {
  try {
    // Get the latest data file for this station
    const latestDataUrl = `${FTP_BASE_URL}/${deviceId}/latest.txt`;
    
    const response = await fetch(latestDataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error fetching FTP data! status: ${response.status}`);
    }

    const textData = await response.text();
    
    // Parse the text file data
    const parsedData = parseWeatherTextFile(textData, deviceId);
    
    if (!parsedData) {
      throw new Error(`Failed to parse text file for station ${deviceId}`);
    }

    // Create station status from the parsed data
    return {
      stationId: stationId,
      deviceId: deviceId,
      name: stationName,
      status: {
        refreshInterval: 3600, // Typically FTP files are updated hourly
        lastSync: parsedData.timestamp,
        status: 'active',
        batteryLevel: parsedData.batteryLevel || 100,
        signalStrength: {
          wifi: parsedData.wifiSignal || 80,
          gprs: parsedData.gprsSignal || 0
        },
        errors: [],
        warnings: []
      },
      latestData: parsedData
    };
  } catch (error) {
    console.error(`Error fetching FTP status for station ${deviceId}:`, error);
    // Fall back to mock data for the status
    return {
      stationId: stationId,
      deviceId: deviceId,
      name: stationName,
      status: {
        refreshInterval: 3600,
        lastSync: new Date().toISOString(),
        status: 'active',
        batteryLevel: 100,
        signalStrength: {
          wifi: 80,
          gprs: 0
        },
        errors: [],
        warnings: []
      },
      latestData: {
        timestamp: new Date().toISOString(),
        temperature: 25 + Math.random() * 5,
        humidity: 65 + Math.random() * 10,
        windSpeed: 12 + Math.random() * 5,
        solarRadiation: 850 + Math.random() * 100,
        precipitation: Math.random() * 2,
        evapotranspiration: 4.2 + Math.random(),
        dewPoint: 19.5 + Math.random() * 2,
        pressure: 1013 + Math.random() * 5,
        uv: Math.random() * 10,
        groundTemp: null,
        groundHumidity: null,
        batteryLevel: 85 + Math.random() * 15,
        wifiSignal: 45 + Math.random() * 30,
        gprsSignal: 0,
        thermalSensation: 23 + Math.random() * 4
      }
    };
  }
}

export async function fetchStationConfig(deviceId: string): Promise<StationConfig> {
  try {
    // For FTP stations, use a simplified config approach
    if (deviceId === 'FRUTALAG' || deviceId === 'FRUTALMT') {
      return {
        refreshInterval: 3600, // Typical 1-hour refresh for FTP stations
        lastSync: new Date().toISOString(),
        status: 'active',
      };
    }
    
    const url = `${API_BASE_URL}/device/${deviceId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-key': API_KEY,
        'Authorization': AUTH_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      refreshInterval: data.refreshInterval || 3600, // Default to 1 hour if not provided
      lastSync: data.lastSync || new Date().toISOString(),
      status: data.status || 'active',
    };
  } catch (error) {
    console.error('Error fetching station config:', error);
    // Return mock data in case of error
    return {
      refreshInterval: 3600,
      lastSync: new Date().toISOString(),
      status: 'active',
    };
  }
}

export async function fetchWeatherData(deviceId: string, startDate: Date, endDate: Date): Promise<WeatherData[]> {
  // Handle FTP-based stations
  if (deviceId === 'FRUTALAG' || deviceId === 'FRUTALMT') {
    return fetchFtpWeatherData(deviceId, startDate, endDate);
  }

  try {
    // Get the device data directly, which includes the dashboard
    const deviceUrl = `${API_BASE_URL}/device/${deviceId}`;
    
    console.log(`Fetching device data from: ${deviceUrl}`);
    
    const deviceResponse = await fetch(deviceUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-key': API_KEY,
        'Authorization': AUTH_TOKEN,
      }
    });
    
    if (!deviceResponse.ok) {
      throw new Error(`HTTP error fetching device data! status: ${deviceResponse.status}`);
    }
    
    const deviceData = await deviceResponse.json();
    console.log("Device data received:", JSON.stringify(deviceData.dashboard, null, 2));
    
    // Safety check that dashboard exists
    if (!deviceData.dashboard) {
      throw new Error("Dashboard data not found in API response");
    }
    
    // Extract sensor values from sensorDataList if available
    let wifiSignal = 0;
    let gprsSignal = 0;
    let batteryLevel = deviceData.dashboard.bat || 0; // Fallback to bat property
    let thermalSensation = deviceData.dashboard.feel || 0; // Fallback to feel property
    
    if (deviceData.dashboard.lastSensorData && 
        Array.isArray(deviceData.dashboard.lastSensorData.sensorDataList)) {
      
      const sensorList = deviceData.dashboard.lastSensorData.sensorDataList;
      
      // Find the WiFi signal sensor (ID 25)
      const wifiSensor = sensorList.find((s: any) => s.sensorId === 25);
      if (wifiSensor) {
        wifiSignal = wifiSensor.dataValue;
        console.log(`WiFi signal found: ${wifiSignal}`);
      }
      
      // Find the GPRS signal sensor (ID 26)
      const gprsSensor = sensorList.find((s: any) => s.sensorId === 26);
      if (gprsSensor) {
        gprsSignal = gprsSensor.dataValue;
        console.log(`GPRS signal found: ${gprsSignal}`);
      }
      
      // Find the battery level sensor (ID 1)
      const batterySensor = sensorList.find((s: any) => s.sensorId === 1);
      if (batterySensor) {
        batteryLevel = batterySensor.dataValue;
        console.log(`Battery level found: ${batteryLevel}`);
      }
      
      // Find the thermal sensation sensor (ID 27)
      const thermalSensor = sensorList.find((s: any) => s.sensorId === 27);
      if (thermalSensor) {
        thermalSensation = thermalSensor.dataValue;
        console.log(`Thermal sensation found: ${thermalSensation}`);
      }
    }
    
    // Extract the values we need from the dashboard
    console.log("Extracting critical values:");
    console.log(`- Temperature: ${deviceData.dashboard.temp}`);
    console.log(`- Humidity: ${deviceData.dashboard.humi}`);
    console.log(`- Wind Speed: ${deviceData.dashboard.wind}`);
    console.log(`- Solar Radiation: ${deviceData.dashboard.radi}`);
    console.log(`- Precipitation (rainDay): ${deviceData.dashboard.rainDay}`);
    console.log(`- Evapotranspiration (evapDay): ${deviceData.dashboard.evapDay}`);
    
    // Create a weather data object with all the values
    const dashboardData: WeatherData = {
      timestamp: toBrazilianTimezone(deviceData.dashboard.updateDateTime || new Date()).toISOString(),
      temperature: deviceData.dashboard.temp || 0,
      humidity: deviceData.dashboard.humi || 0,
      windSpeed: deviceData.dashboard.wind || 0,
      solarRadiation: deviceData.dashboard.radi || 0,
      precipitation: deviceData.dashboard.rainDay || 0,
      evapotranspiration: deviceData.dashboard.evapDay || 0,
      dewPoint: deviceData.dashboard.duep || 0,
      pressure: deviceData.dashboard.pres || 0,
      uv: deviceData.dashboard.uv || 0,
      groundTemp: deviceData.dashboard.groundTemp || null,
      groundHumidity: deviceData.dashboard.groundHumi || null,
      batteryLevel: batteryLevel,
      wifiSignal: wifiSignal,
      gprsSignal: gprsSignal,
      thermalSensation: thermalSensation,
    };
    
    console.log("Created weather data object:", dashboardData);
    
    // Return the dashboard data as our single data point
    return [dashboardData];
  } catch (error) {
    console.error('API Error:', error);
    // Return mock data in case of error
    return generateMockData(startDate, endDate);
  }
}

async function fetchFtpWeatherData(deviceId: string, startDate: Date, endDate: Date): Promise<WeatherData[]> {
  try {
    console.log(`Fetching FTP data for station ${deviceId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Format dates for filenames (YYYY-MM-DD format)
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Request all data files within the date range
    const dataUrl = `${FTP_BASE_URL}/${deviceId}/range?start=${formattedStartDate}&end=${formattedEndDate}`;
    
    const response = await fetch(dataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error fetching FTP data! status: ${response.status}`);
    }
    
    const textData = await response.text();
    
    // Split the response if it contains multiple files
    const fileContents = textData.split('---FILE_SEPARATOR---').filter(Boolean);
    
    console.log(`Received ${fileContents.length} data files from FTP server`);
    
    // Parse each file and collect all data points
    const allDataPoints: WeatherData[] = [];
    
    for (const fileContent of fileContents) {
      try {
        const dataPoint = parseWeatherTextFile(fileContent, deviceId);
        if (dataPoint) {
          // Check if timestamp is within requested range
          const timestamp = new Date(dataPoint.timestamp);
          if (timestamp >= startDate && timestamp <= endDate) {
            allDataPoints.push(dataPoint);
          }
        }
      } catch (error) {
        console.error(`Error parsing FTP data file for ${deviceId}:`, error);
        // Continue processing other files
      }
    }
    
    // Sort data by timestamp
    allDataPoints.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    console.log(`Successfully parsed ${allDataPoints.length} data points from FTP files`);
    
    return allDataPoints.length > 0 ? allDataPoints : generateMockData(startDate, endDate);
  } catch (error) {
    console.error(`Error fetching FTP data for ${deviceId}:`, error);
    // Fall back to mock data
    return generateMockData(startDate, endDate);
  }
}
