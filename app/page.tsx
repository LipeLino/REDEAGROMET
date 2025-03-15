"use client";

import { CloudRain, ArrowDownWideNarrow, Droplets } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { HeroSection } from "@/components/sections/HeroSection";
import { MonitoredParameters } from "@/components/sections/MonitoredParameters";
import { BulletinSection } from "@/components/sections/BulletinSection";

export default function Home() {
  return (
    <>
      <Header />
      <PageWrapper>
        <main className="min-h-screen bg-white">
          <HeroSection />

          {/* Features Section */}
          <section className="relative py-20 bg-gray-50">
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/[0.075] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/[0.075] to-transparent" />
            <div className="container mx-auto px-4 relative">
              <h2 className="text-3xl font-bold text-center mb-16 text-[#003366]">
                Recursos do Sistema
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard
                  icon={<CloudRain className="w-12 h-12 text-[#003366]" />}
                  title="Monitoramento em Tempo Real"
                  description="Dados climáticos atualizados constantemente através de seis estações agrometeorológicas estrategicamente posicionadas."
                />
                <FeatureCard
                  icon={<ArrowDownWideNarrow className="w-12 h-12 text-[#003366]" />}
                  title="Análise de Dados"
                  description="Visualização intuitiva de dados através de gráficos e relatórios personalizados para tomada de decisão."
                />
                <FeatureCard
                  icon={<Droplets className="w-12 h-12 text-[#003366]" />}
                  title="Gestão de Recursos"
                  description="Otimização do uso de recursos hídricos e planejamento agrícola baseado em dados precisos."
                />
              </div>
            </div>
          </section>

          {/* Section Separator */}
          <div className="relative h-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className="container mx-auto px-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <div className="px-4 bg-gradient-to-r from-gray-50 via-white to-gray-50">
                      <div className="w-2 h-2 rounded-full bg-[#003366]/40"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <MonitoredParameters />
          
          {/* Section Separator */}
          <div className="relative h-16 bg-gradient-to-b from-white to-gray-50">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className="container mx-auto px-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <div className="px-4 bg-gradient-to-r from-white via-gray-50 to-white">
                      <div className="w-2 h-2 rounded-full bg-[#003366]/40"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <BulletinSection />

          {/* About Project Section */}
          <section className="relative py-20 bg-[#003366] text-white">
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/[0.1] to-transparent" />
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-8">Sobre o Projeto</h2>
                <p className="text-lg mb-6">
                  Os projetos "Utilização da internet das coisas (IoT) na disseminação da informação agrometeorológica na região sul do Triângulo Mineiro" e "Rede agrometeorológica do Triângulo Mineiro Sul", são financiados pela Fundação de Amparo a Pesquisa do Estado de Minas Gerais (FAPEMIG) e visam criar um sistema de vigilância agrometeorológica para a região do Triângulo Mineiro Sul, focando na obtenção de dados climáticos locais e sua disponibilização em plataformas online.
                </p>
                <p className="text-lg">
                  Utilizando tecnologia IoT e seis estações agrometeorológicas, fornece dados precisos e atualizados para auxiliar agricultores e profissionais na tomada de decisões.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="relative bg-gray-900 text-white py-8">
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/[0.15] to-transparent" />
            <div className="container mx-auto px-4 text-center">
              <p className="mb-4">© 2024 UEMG - Universidade do Estado de Minas Gerais</p>
              <p className="text-gray-400">Unidade Frutal</p>
            </div>
          </footer>
        </main>
      </PageWrapper>
    </>
  );
}