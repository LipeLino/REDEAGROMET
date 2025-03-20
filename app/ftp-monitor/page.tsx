"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeatherData } from "@/lib/types/weather";
import { parseWeatherTextFile } from "@/lib/utils/textParser";
import { formatToBrazilianDateTime } from "@/lib/utils/dateUtils";
import { Loader2, RefreshCw, CalendarClock, ChevronDown, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Header } from "@/components/layout/Header";

interface StationData {
  stationId: string;
  stationName: string;
  latestData: WeatherData | null;
  historicalData: WeatherData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const stations = [
  { id: 'FRUTALAG', name: 'Aparecida de Minas' },
  { id: 'FRUTALMT', name: 'Frutal' }
];

export default function FtpMonitorPage() {
  const [activeTab, setActiveTab] = useState("latest");
  const [stationsData, setStationsData] = useState<Record<string, StationData>>({});
  const [selectedHistoricalDays, setSelectedHistoricalDays] = useState(1);

  // Initialize station data
  useEffect(() => {
    const initialData: Record<string, StationData> = {};
    stations.forEach(station => {
      initialData[station.id] = {
        stationId: station.id,
        stationName: station.name,
        latestData: null,
        historicalData: [],
        isLoading: false,
        error: null,
        lastUpdated: null
      };
    });
    setStationsData(initialData);
    
    // Fetch initial data for all stations
    fetchAllLatestData();
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchAllLatestData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Fetch latest data for all stations
  const fetchAllLatestData = async () => {
    for (const station of stations) {
      fetchLatestData(station.id);
    }
  };

  // Fetch latest data for a specific station
  const fetchLatestData = async (stationId: string) => {
    setStationsData(prev => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        isLoading: true,
        error: null
      }
    }));
    
    try {
      const response = await fetch(`/api/ftp/${stationId}/latest.txt`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const textData = await response.text();
      const parsedData = parseWeatherTextFile(textData, stationId);
      
      if (!parsedData) {
        throw new Error("Failed to parse weather data");
      }
      
      setStationsData(prev => ({
        ...prev,
        [stationId]: {
          ...prev[stationId],
          latestData: parsedData,
          isLoading: false,
          lastUpdated: new Date()
        }
      }));
    } catch (error) {
      console.error(`Error fetching latest data for ${stationId}:`, error);
      setStationsData(prev => ({
        ...prev,
        [stationId]: {
          ...prev[stationId],
          isLoading: false,
          error: error instanceof Error ? error.message : "Erro desconhecido"
        }
      }));
    }
  };

  // Fetch historical data for a specific station
  const fetchHistoricalData = async (stationId: string, days: number) => {
    setStationsData(prev => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        isLoading: true,
        error: null
      }
    }));
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');
      
      const response = await fetch(`/api/ftp/${stationId}/range?start=${startStr}&end=${endStr}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const textData = await response.text();
      
      // Parse multiple files
      const fileContents = textData.split('---FILE_SEPARATOR---').filter(Boolean);
      const parsedDataPoints: WeatherData[] = [];
      
      for (const fileContent of fileContents) {
        const parsedData = parseWeatherTextFile(fileContent, stationId);
        if (parsedData) {
          parsedDataPoints.push(parsedData);
        }
      }
      
      // Sort by timestamp
      parsedDataPoints.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setStationsData(prev => ({
        ...prev,
        [stationId]: {
          ...prev[stationId],
          historicalData: parsedDataPoints,
          isLoading: false,
          lastUpdated: new Date()
        }
      }));
    } catch (error) {
      console.error(`Error fetching historical data for ${stationId}:`, error);
      setStationsData(prev => ({
        ...prev,
        [stationId]: {
          ...prev[stationId],
          isLoading: false,
          error: error instanceof Error ? error.message : "Erro desconhecido"
        }
      }));
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "historical") {
      // Load historical data when switching to that tab
      stations.forEach(station => {
        fetchHistoricalData(station.id, selectedHistoricalDays);
      });
    }
  };

  // Handle historical days selection change
  const handleHistoricalDaysChange = (days: number) => {
    setSelectedHistoricalDays(days);
    stations.forEach(station => {
      fetchHistoricalData(station.id, days);
    });
  };

  return (
    <>
      <Header />
      <PageWrapper>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 text-[#003366]">Monitoramento FTP</h1>
          
          <Tabs defaultValue="latest" value={activeTab} onValueChange={handleTabChange}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="latest">Dados Atuais</TabsTrigger>
                <TabsTrigger value="historical">Histórico</TabsTrigger>
              </TabsList>
              
              {activeTab === "latest" ? (
                <Button 
                  onClick={fetchAllLatestData} 
                  variant="outline"
                  className="bg-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Dados
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Período:</span>
                  <select 
                    value={selectedHistoricalDays} 
                    onChange={(e) => handleHistoricalDaysChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-md p-2 text-sm bg-white"
                  >
                    <option value={1}>Último dia</option>
                    <option value={3}>Últimos 3 dias</option>
                    <option value={7}>Últimos 7 dias</option>
                    <option value={14}>Últimos 14 dias</option>
                    <option value={30}>Últimos 30 dias</option>
                  </select>
                </div>
              )}
            </div>
            
            <TabsContent value="latest" className="space-y-6">
              {stations.map(station => {
                const stationData = stationsData[station.id];
                
                return (
                  <Card key={station.id} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-[#003366]">{station.name} ({station.id})</h2>
                      <div className="flex items-center space-x-4">
                        {stationData?.lastUpdated && (
                          <span className="text-sm text-gray-500">
                            <CalendarClock className="inline-block w-4 h-4 mr-1" />
                            Última atualização: {format(stationData.lastUpdated, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </span>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => fetchLatestData(station.id)}
                          disabled={stationData?.isLoading}
                        >
                          {stationData?.isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Atualizar
                        </Button>
                      </div>
                    </div>
                    
                    {stationData?.error && (
                      <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                        Erro: {stationData.error}
                      </div>
                    )}
                    
                    {stationData?.isLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-[#003366]" />
                      </div>
                    ) : stationData?.latestData ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ParameterCard
                          label="Temperatura"
                          value={`${stationData.latestData.temperature.toFixed(1)}°C`}
                          timestamp={stationData.latestData.timestamp}
                        />
                        <ParameterCard
                          label="Umidade"
                          value={`${stationData.latestData.humidity.toFixed(1)}%`}
                          timestamp={stationData.latestData.timestamp}
                        />
                        <ParameterCard
                          label="Velocidade do Vento"
                          value={`${stationData.latestData.windSpeed.toFixed(1)} km/h`}
                          timestamp={stationData.latestData.timestamp}
                        />
                        <ParameterCard
                          label="Precipitação"
                          value={`${stationData.latestData.precipitation.toFixed(1)} mm`}
                          timestamp={stationData.latestData.timestamp}
                        />
                        <ParameterCard
                          label="Radiação Solar"
                          value={`${stationData.latestData.solarRadiation.toFixed(1)} W/m²`}
                          timestamp={stationData.latestData.timestamp}
                        />
                        <ParameterCard
                          label="Evapotranspiração"
                          value={`${stationData.latestData.evapotranspiration.toFixed(2)} mm`}
                          timestamp={stationData.latestData.timestamp}
                        />
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 p-8">
                        Nenhum dado disponível. Clique em Atualizar para buscar dados.
                      </div>
                    )}
                  </Card>
                );
              })}
            </TabsContent>
            
            <TabsContent value="historical" className="space-y-6">
              {stations.map(station => {
                const stationData = stationsData[station.id];
                
                return (
                  <Card key={station.id} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-[#003366]">{station.name} ({station.id})</h2>
                      {stationData?.lastUpdated && (
                        <span className="text-sm text-gray-500">
                          <CalendarClock className="inline-block w-4 h-4 mr-1" />
                          Última atualização: {format(stationData.lastUpdated, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    
                    {stationData?.error && (
                      <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                        Erro: {stationData.error}
                      </div>
                    )}
                    
                    {stationData?.isLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-[#003366]" />
                      </div>
                    ) : stationData?.historicalData.length ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableCaption>
                            Histórico de dados para {station.name}
                          </TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data/Hora</TableHead>
                              <TableHead>Temperatura (°C)</TableHead>
                              <TableHead>Umidade (%)</TableHead>
                              <TableHead>Vento (km/h)</TableHead>
                              <TableHead>Chuva (mm)</TableHead>
                              <TableHead>Radiação (W/m²)</TableHead>
                              <TableHead>Evapo. (mm)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stationData.historicalData.slice(0, 20).map((data, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {formatToBrazilianDateTime(data.timestamp)}
                                </TableCell>
                                <TableCell>{data.temperature.toFixed(1)}</TableCell>
                                <TableCell>{data.humidity.toFixed(1)}</TableCell>
                                <TableCell>{data.windSpeed.toFixed(1)}</TableCell>
                                <TableCell>{data.precipitation.toFixed(1)}</TableCell>
                                <TableCell>{data.solarRadiation.toFixed(1)}</TableCell>
                                <TableCell>{data.evapotranspiration.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {stationData.historicalData.length > 20 && (
                          <Accordion type="single" collapsible className="mt-4">
                            <AccordionItem value="more-data">
                              <AccordionTrigger className="text-[#003366]">
                                Ver mais dados ({stationData.historicalData.length - 20} registros adicionais)
                              </AccordionTrigger>
                              <AccordionContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Data/Hora</TableHead>
                                      <TableHead>Temperatura (°C)</TableHead>
                                      <TableHead>Umidade (%)</TableHead>
                                      <TableHead>Vento (km/h)</TableHead>
                                      <TableHead>Chuva (mm)</TableHead>
                                      <TableHead>Radiação (W/m²)</TableHead>
                                      <TableHead>Evapo. (mm)</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {stationData.historicalData.slice(20).map((data, index) => (
                                      <TableRow key={index + 20}>
                                        <TableCell className="font-medium">
                                          {formatToBrazilianDateTime(data.timestamp)}
                                        </TableCell>
                                        <TableCell>{data.temperature.toFixed(1)}</TableCell>
                                        <TableCell>{data.humidity.toFixed(1)}</TableCell>
                                        <TableCell>{data.windSpeed.toFixed(1)}</TableCell>
                                        <TableCell>{data.precipitation.toFixed(1)}</TableCell>
                                        <TableCell>{data.solarRadiation.toFixed(1)}</TableCell>
                                        <TableCell>{data.evapotranspiration.toFixed(2)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 p-8">
                        Nenhum dado histórico disponível para o período selecionado.
                      </div>
                    )}
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
          
          {/* Connection Information */}
          <Card className="mt-10 p-6 bg-gray-50">
            <h2 className="text-xl font-bold text-[#003366] mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Informações de Conexão FTP
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Detalhes do Servidor</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Servidor:</strong> eq0.ativasolucoes.com.br</li>
                  <li><strong>Porta:</strong> 21</li>
                  <li><strong>Usuário:</strong> uemg052023</li>
                  <li><strong>Diretórios:</strong> /FRUTALAG, /FRUTALMT</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Formato dos Arquivos</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>FRUTALAG:</strong> Formato CSV com cabeçalho</li>
                  <li><strong>FRUTALMT:</strong> Formato de texto com pares chave-valor</li>
                  <li><strong>Frequência:</strong> Atualizados a cada hora</li>
                  <li><strong>Intervalo de amostragem na interface:</strong> 5 minutos</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}

// Parameter Card component for displaying weather parameters
function ParameterCard({ label, value, timestamp }: { label: string; value: string; timestamp: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-[#003366]">{value}</div>
      <div className="text-xs text-gray-400 mt-2">
        {formatToBrazilianDateTime(timestamp)}
      </div>
    </div>
  );
}
