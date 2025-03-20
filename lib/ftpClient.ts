// Import dependencies
import * as ftp from 'basic-ftp';
import fs from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

// Cache directory for storing downloaded files temporarily
const CACHE_DIR = path.join(process.cwd(), 'cache');

// Ensure cache directory exists
async function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    try {
      mkdirSync(CACHE_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating cache directory:', error);
      // Create an alternative path if the primary fails
      const altPath = path.join(process.cwd(), 'tmp');
      if (!existsSync(altPath)) {
        mkdirSync(altPath, { recursive: true });
      }
      return altPath;
    }
  }
  return CACHE_DIR;
}

/**
 * Creates an FTP client with preset configuration
 */
export function createFtpClient(): ftp.Client {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === 'development';
  
  return client;
}

/**
 * Connects to the FTP server using credentials from environment variables
 */
export async function connectToFtp(client: ftp.Client): Promise<void> {
  try {
    await client.access({
      host: process.env.FTP_HOST || 'eq0.ativasolucoes.com.br',
      user: process.env.FTP_USER || 'uemg052023',
      password: process.env.FTP_PASSWORD || 'uemg445566',
      port: Number(process.env.FTP_PORT || 21),
      secure: false
    });
    
    console.log('FTP connection established');
  } catch (error) {
    console.error('FTP connection error:', error);
    throw new Error('Failed to connect to FTP server');
  }
}

/**
 * Gets the latest text file from a specific FTP folder
 */
export async function getLatestTextFile(stationId: string): Promise<string> {
  const client = createFtpClient();
  
  try {
    await connectToFtp(client);
    const cacheDir = await ensureCacheDir();
    
    // Navigate to the station directory
    await client.cd(`/${stationId}`);
    
    // List all .txt files
    const fileList = await client.list('*.txt');
    
    if (fileList.length === 0) {
      throw new Error(`No .txt files found in /${stationId}`);
    }
    
    // Sort by date (newest first)
    fileList.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Get the latest file
    const latestFile = fileList[0];
    const localFilePath = path.join(cacheDir, `${stationId}_${latestFile.name}`);
    
    // Download the file
    await client.downloadTo(localFilePath, latestFile.name);
    
    // Read the file content
    const content = await fs.readFile(localFilePath, 'utf-8');
    
    // Clean up cache file
    try {
      await fs.unlink(localFilePath);
    } catch (err) {
      console.warn('Could not delete cache file:', err);
    }
    
    return content;
  } catch (error) {
    console.error(`Error fetching latest file for ${stationId}:`, error);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Gets files in a date range from a specific FTP folder
 */
export async function getFilesInDateRange(
  stationId: string, 
  startDate: Date, 
  endDate: Date
): Promise<{ name: string, content: string }[]> {
  const client = createFtpClient();
  
  try {
    await connectToFtp(client);
    const cacheDir = await ensureCacheDir();
    
    // Navigate to the station directory
    await client.cd(`/${stationId}`);
    
    // List all .txt files
    const fileList = await client.list('*.txt');
    
    if (fileList.length === 0) {
      throw new Error(`No .txt files found in /${stationId}`);
    }
    
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    // Filter files within date range
    const filesInRange = fileList.filter(file => {
      const fileTime = file.date.getTime();
      return fileTime >= startTime && fileTime <= endTime;
    });
    
    if (filesInRange.length === 0) {
      throw new Error(`No files found in date range for ${stationId}`);
    }
    
    // Download and read each file
    const files = await Promise.all(filesInRange.map(async (file) => {
      const localFilePath = path.join(cacheDir, `${stationId}_${file.name}`);
      
      // Download the file
      await client.downloadTo(localFilePath, file.name);
      
      // Read the file content
      const content = await fs.readFile(localFilePath, 'utf-8');
      
      // Clean up cache file
      try {
        await fs.unlink(localFilePath);
      } catch (err) {
        console.warn('Could not delete cache file:', err);
      }
      
      return {
        name: file.name,
        content
      };
    }));
    
    return files;
  } catch (error) {
    console.error(`Error fetching files in range for ${stationId}:`, error);
    throw error;
  } finally {
    client.close();
  }
}
