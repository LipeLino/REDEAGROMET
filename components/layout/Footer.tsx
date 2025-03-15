"use client";

import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#003366] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contato</h3>
            <div className="space-y-2">
              <a href="mailto:contato@uemg.br" className="flex items-center gap-2 hover:text-gray-300">
                <Mail className="w-4 h-4" />
                contato@uemg.br
              </a>
              <a href="tel:+553434234433" className="flex items-center gap-2 hover:text-gray-300">
                <Phone className="w-4 h-4" />
                (34) 3423-4433
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <address className="not-italic">
                  Av. Prof. Mário Palmério, 1001<br />
                  Frutal - MG, 38200-000
                </address>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://www.uemg.br" className="hover:text-gray-300">UEMG</a>
              </li>
              <li>
                <a href="https://www.uemg.br/frutal" className="hover:text-gray-300">UEMG Frutal</a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-gray-300">Dashboard</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-300">
          <p>© {new Date().getFullYear()} UEMG - Universidade do Estado de Minas Gerais. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}