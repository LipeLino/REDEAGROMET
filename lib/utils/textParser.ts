import { WeatherData } from '@/lib/types/weather';
import { toBrazilianTimezone } from './dateUtils';

/**
 * Parses a weather data text file from an FTP server into a structured WeatherData object
 * 
 * @param fileContent The raw text content from the FTP file
 * @param deviceId The ID of the device/station
 * @returns A structured WeatherData object or null if parsing fails
 */
export function parseWeatherTextFile(fileContent: string, deviceId: string): WeatherData | null {
  try {
    // Trim whitespace and check for empty content
    const content = fileContent.trim();
    if (!content) {
      console.error('Empty file content received');
      return null;
    }

    console.log(`Parsing text file for device ${deviceId}, content length: ${content.length} bytes`);
    
    // Different station types have different file formats
    if (deviceId === 'FRUTALAG') {
      return parseAgrometStationFormat(content);
    } else if (deviceId === 'FRUTALMT') {
      return parseMeteorologicalStationFormat(content);
    } else {
      console.error(`Unknown device format for ${deviceId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error parsing weather text file for ${deviceId}:`, error);
    return null;
  }
}

/**
 * Parses text file from the agricultural station format
 */
function parseAgrometStationFormat(content: string): WeatherData | null {
  try {
    // Example of expected format:
    // DATE,TIME,TEMP,HUM,WIND,RAIN,RAD,PRESSURE,BAT
    // 2025-05-20,14:30:00,25.6,72.4,12.8,0.2,876.3,1012.5,95.2
    
    // Split by lines and find the data line (typically the second line after a header)
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    
    if (lines.length < 2) {
      console.error('Invalid file format: expected at least 2 lines');
      return null;
    }
    
    // Get header and data lines
    const headerLine = lines[0];
    const dataLine = lines[1];
    
    // Parse the header to understand the column position
    const headers = headerLine.split(',').map(h => h.trim().toUpperCase());
    const values = dataLine.split(',').map(v => v.trim());
    
    if (headers.length !== values.length) {
      console.error('Header and data columns count mismatch');
      return null;
    }
    
    // Map indexes for known headers
    const getColumnValue = (columnName: string): string | null => {
      const index = headers.indexOf(columnName);
      return index !== -1 ? values[index] : null;
    };
    
    // Extract timestamp components
    const dateStr = getColumnValue('DATE');
    const timeStr = getColumnValue('TIME');
    
    if (!dateStr || !timeStr) {
      console.error('Missing date or time in data');
      return null;
    }
    
    // Create timestamp
    const timestamp = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(timestamp.getTime())) {
      console.error('Invalid date/time format:', dateStr, timeStr);
      return null;
    }
    
    // Build the WeatherData object, handling potential missing values
    const weatherData: WeatherData = {
      timestamp: toBrazilianTimezone(timestamp).toISOString(),
      temperature: parseNumberField(getColumnValue('TEMP')),
      humidity: parseNumberField(getColumnValue('HUM')),
      windSpeed: parseNumberField(getColumnValue('WIND')),
      precipitation: parseNumberField(getColumnValue('RAIN')),
      solarRadiation: parseNumberField(getColumnValue('RAD')),
      pressure: parseNumberField(getColumnValue('PRESSURE')),
      batteryLevel: parseNumberField(getColumnValue('BAT')),
      // Calculate derived values
      dewPoint: calculateDewPoint(
        parseNumberField(getColumnValue('TEMP')), 
        parseNumberField(getColumnValue('HUM'))
      ),
      // Use default or null for unavailable values
      evapotranspiration: parseNumberField(getColumnValue('ETO')) || calculateEstimatedEvapo(
        parseNumberField(getColumnValue('TEMP')),
        parseNumberField(getColumnValue('HUM')),
        parseNumberField(getColumnValue('RAD'))
      ),
      uv: parseNumberField(getColumnValue('UV')) || null,
      groundTemp: parseNumberField(getColumnValue('GTEMP')) || null,
      groundHumidity: parseNumberField(getColumnValue('GHUM')) || null,
      wifiSignal: 85, // Default value for FTP stations
      gprsSignal: 0, // Not applicable for FTP
      thermalSensation: calculateThermalSensation(
        parseNumberField(getColumnValue('TEMP')),
        parseNumberField(getColumnValue('HUM')),
        parseNumberField(getColumnValue('WIND'))
      ),
    };
    
    return weatherData;
  } catch (error) {
    console.error('Error parsing agricultural station format:', error);
    return null;
  }
}

/**
 * Parses text file from the meteorological station format
 */
function parseMeteorologicalStationFormat(content: string): WeatherData | null {
  try {
    // Example of different format for meteorological station:
    // ESTACAO_METEOROLOGICA_FRUTAL
    // DATA: 2025-05-20
    // HORA: 14:30:00
    // TEMPERATURA: 25.6 C
    // UMIDADE: 72.4 %
    // VELOCIDADE_VENTO: 12.8 km/h
    // DIRECAO_VENTO: 180 graus
    // PRECIPITACAO: 0.2 mm
    // RADIACAO_SOLAR: 876.3 W/m2
    // PRESSAO: 1012.5 hPa
    // BATERIA: 95.2 %
    
    // Split by lines and process key-value pairs
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    
    if (lines.length < 3) { // At least station name, date, and time
      console.error('Invalid meteorological station format');
      return null;
    }
    
    // Extract date and time
    const dateMatch = lines.find(line => line.startsWith('DATA:'))?.match(/DATA:\s*(\d{4}-\d{2}-\d{2})/);
    const timeMatch = lines.find(line => line.startsWith('HORA:'))?.match(/HORA:\s*(\d{2}:\d{2}:\d{2})/);
    
    if (!dateMatch || !timeMatch) {
      console.error('Missing date or time in meteorological station data');
      return null;
    }
    
    const dateStr = dateMatch[1];
    const timeStr = timeMatch[1];
    
    // Create timestamp
    const timestamp = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(timestamp.getTime())) {
      console.error('Invalid date/time format in meteorological file:', dateStr, timeStr);
      return null;
    }
    
    // Extract other values with regex pattern matching
    const extractValue = (pattern: RegExp, line: string): number | null => {
      const match = line.match(pattern);
      return match ? parseFloat(match[1]) : null;
    };
    
    // Find the lines containing each metric
    const tempLine = lines.find(line => line.includes('TEMPERATURA:')) || '';
    const humidityLine = lines.find(line => line.includes('UMIDADE:')) || '';
    const windLine = lines.find(line => line.includes('VELOCIDADE_VENTO:')) || '';
    const rainLine = lines.find(line => line.includes('PRECIPITACAO:')) || '';
    const radLine = lines.find(line => line.includes('RADIACAO_SOLAR:')) || '';
    const pressureLine = lines.find(line => line.includes('PRESSAO:')) || '';
    const batteryLine = lines.find(line => line.includes('BATERIA:')) || '';
    const etoLine = lines.find(line => line.includes('EVAPOTRANSPIRACAO:')) || '';
    
    // Extract values with regex
    const temp = extractValue(/TEMPERATURA:\s*([\d.]+)/, tempLine);
    const humidity = extractValue(/UMIDADE:\s*([\d.]+)/, humidityLine);
    const windSpeed = extractValue(/VELOCIDADE_VENTO:\s*([\d.]+)/, windLine);
    const precipitation = extractValue(/PRECIPITACAO:\s*([\d.]+)/, rainLine);
    const solarRadiation = extractValue(/RADIACAO_SOLAR:\s*([\d.]+)/, radLine);
    const pressure = extractValue(/PRESSAO:\s*([\d.]+)/, pressureLine);
    const batteryLevel = extractValue(/BATERIA:\s*([\d.]+)/, batteryLine);
    const evapotranspiration = extractValue(/EVAPOTRANSPIRACAO:\s*([\d.]+)/, etoLine);
    
    // Build the WeatherData object
    const weatherData: WeatherData = {
      timestamp: toBrazilianTimezone(timestamp).toISOString(),
      temperature: temp || 0,
      humidity: humidity || 0,
      windSpeed: windSpeed || 0,
      precipitation: precipitation || 0,
      solarRadiation: solarRadiation || 0,
      pressure: pressure || 0,
      batteryLevel: batteryLevel || 95,
      // Calculate derived values
      dewPoint: calculateDewPoint(temp || 0, humidity || 0),
      evapotranspiration: evapotranspiration || calculateEstimatedEvapo(temp || 0, humidity || 0, solarRadiation || 0),
      uv: null, // Not available
      groundTemp: null, // Not available
      groundHumidity: null, // Not available
      wifiSignal: 85, // Default value for FTP stations
      gprsSignal: 0, // Not applicable for FTP
      thermalSensation: calculateThermalSensation(temp || 0, humidity || 0, windSpeed || 0),
    };
    
    return weatherData;
  } catch (error) {
    console.error('Error parsing meteorological station format:', error);
    return null;
  }
}

/**
 * Helper function to parse number fields from string, handling null and empty values
 */
function parseNumberField(value: string | null): number | null {
  if (value === null || value === '' || value.toLowerCase() === 'null') {
    return null;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Calculate dew point from temperature and humidity
 */
function calculateDewPoint(temperature: number | null, humidity: number | null): number | null {
  if (temperature === null || humidity === null) {
    return null;
  }
  
  // Magnus formula for dew point
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
}

/**
 * Calculate thermal sensation based on temperature, humidity and wind speed
 */
function calculateThermalSensation(temperature: number | null, humidity: number | null, windSpeed: number | null): number | null {
  if (temperature === null || humidity === null || windSpeed === null) {
    return null;
  }
  
  // Simplified thermal sensation estimation
  if (temperature > 27 && humidity > 40) {
    // Hot weather - heat index
    const hi = -8.78469475556 +
      1.61139411 * temperature +
      2.33854883889 * humidity -
      0.14611605 * temperature * humidity -
      0.012308094 * Math.pow(temperature, 2) -
      0.0164248277778 * Math.pow(humidity, 2) +
      0.002211732 * Math.pow(temperature, 2) * humidity +
      0.00072546 * temperature * Math.pow(humidity, 2) -
      0.000003582 * Math.pow(temperature, 2) * Math.pow(humidity, 2);
    return hi;
  } else if (temperature < 10 && windSpeed > 5) {
    // Cold weather - wind chill
    const wc = 13.12 + 0.6215 * temperature - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temperature * Math.pow(windSpeed, 0.16);
    return wc;
  } else {
    // Moderate weather - average
    return temperature;
  }
}

/**
 * Estimate evapotranspiration when not directly available
 */
function calculateEstimatedEvapo(temperature: number | null, humidity: number | null, radiation: number | null): number | null {
  if (temperature === null || humidity === null || radiation === null) {
    return null;
  }
  
  // Very simplified Penman-Monteith derived formula
  // This is a rough approximation for demonstration purposes
  return (0.0023 * (temperature + 17.8) * Math.sqrt(radiation/120) * (100 - humidity) / 100);
}
