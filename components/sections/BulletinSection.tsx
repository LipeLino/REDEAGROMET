"use client";

import { FileText, Download, Calendar, Clock, Target, Info, Users, UserCog, FileIcon, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function BulletinSection() {
  const bulletinInfo = {
    title: "Boletim de Monitoramento Agrometeorológico",
    lastUpdate: "20/02/2025",
    fileSize: "0.3 MB",
    description: `O Boletim de Monitoramento Agrometeorológico do Triângulo Mineiro Sul reúne dados climatológicos para apoiar a agricultura, o meio ambiente e o setor público. Produzido pela UEMG – Frutal com apoio da FAPEMIG, a edição de 2024 foca em Frutal-MG, com expansão para outras cidades nas próximas edições.`,
    downloadUrl: "/BOLETIM DE MONITORAMENTO AGROMETEOROLÓGICO DO TRIÂNGULO MINEIRO SUL 2024.pdf",
    previewUrl: "/images/pag1.png",
  };

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Centered Title */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-4">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-[#003366]" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#003366] tracking-tight text-center">
              {bulletinInfo.title}
            </h2>
          </div>
          <div className="w-16 sm:w-24 h-1 bg-[#003366] mx-auto rounded-full opacity-50" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start justify-center">
          {/* Preview Image and Download - Left Side */}
          <div className="w-full sm:w-[350px] lg:w-[400px] space-y-6 sm:space-y-8 animate-slide-up">
            <div className="relative w-full h-[400px] sm:h-[450px] overflow-hidden rounded-lg shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
              <Image
                src={bulletinInfo.previewUrl}
                alt="Prévia do último boletim"
                fill
                className="object-cover object-top"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 350px, 400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Atualizado em: {bulletinInfo.lastUpdate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileIcon className="w-4 h-4" />
                  <span>Tamanho: {bulletinInfo.fileSize}</span>
                </div>
              </div>

              <Button 
                className="bg-[#003366] hover:bg-[#004080] transform hover:scale-105 transition-all duration-300 h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full"
                onClick={() => window.open(bulletinInfo.downloadUrl, '_blank')}
              >
                <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Baixar Boletim
              </Button>
            </div>
          </div>

          {/* Description - Right Side */}
          <div className="w-full lg:w-[600px] space-y-6 sm:space-y-8 animate-slide-up">
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-justify">
              {bulletinInfo.description}
            </p>

            <div className="grid grid-cols-1 divide-y divide-gray-200">
              <div className="flex items-center gap-3 text-gray-700 py-4">
                <Clock className="w-5 h-5 text-[#003366] flex-shrink-0" />
                <div>
                  <span className="font-medium">Frequência:</span>
                  <span className="text-gray-600 ml-2">anual e mensal</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 py-4">
                <Info className="w-5 h-5 text-[#003366] flex-shrink-0" />
                <div>
                  <span className="font-medium">Informações:</span>
                  <span className="text-gray-600 ml-2">temperatura, precipitação, balanço hídrico</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 py-4">
                <Target className="w-5 h-5 text-[#003366] flex-shrink-0" />
                <div>
                  <span className="font-medium">Público:</span>
                  <span className="text-gray-600 ml-2">produtores, pesquisadores, órgãos públicos</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 py-4">
                <UserCog className="w-5 h-5 text-[#003366] flex-shrink-0" />
                <div>
                  <span className="font-medium">Autores:</span>
                  <span className="text-gray-600 ml-2">equipe de pesquisadores e bolsistas da UEMG Frutal</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-gray-600 text-sm italic">
                A produção deste boletim conta com o apoio da FAPEMIG e parceiros.
              </p>

              {/* Logos and Instagram */}
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-28 sm:w-32 h-10 sm:h-12">
                    <Image
                      src="/images/fapemig-logo.png"
                      alt="Logo FAPEMIG"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 112px, 128px"
                    />
                  </div>
                  <div className="relative w-36 sm:w-40 h-14 sm:h-16">
                    <Image
                      src="/images/uemg-logo.png"
                      alt="Logo UEMG"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 144px, 160px"
                    />
                  </div>
                </div>

                <a 
                  href="https://instagram.com/redeagromet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-[#003366] transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                  <span className="font-medium">@redeagromet</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out;
        }

        @media (max-width: 640px) {
          .animate-slide-up {
            animation-duration: 0.8s;
          }
        }
      `}</style>
    </section>
  );
}