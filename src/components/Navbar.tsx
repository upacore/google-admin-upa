import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, isAdmin, partnerProfile } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = location.pathname === '/';

  const primaryDestination = user
    ? isAdmin
      ? { to: '/admin', label: 'Painel Admin' }
      : partnerProfile && partnerProfile.status === 'ativo'
        ? { to: '/parceiro', label: 'Portal Parceiro' }
        : { to: '/login', label: 'Minha Conta' }
    : { to: '/login', label: 'Entrar no Portal' };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-[#0A192F] whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#00A859]" aria-hidden="true" />
          <span>UPA Mobilidade</span>
        </Link>

        {/* Zone 2: 4 concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          {isHome ? (
            <>
              <a
                href="#programas"
                className="hover:text-[#0A192F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Programas
              </a>
              <a
                href="#simulador"
                className="hover:text-[#0A192F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Simulador
              </a>
              <a
                href="#seguranca"
                className="hover:text-[#0A192F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Operação Huambo
              </a>
            </>
          ) : (
            <Link
              to="/"
              className="hover:text-[#0A192F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Início Parceiros
            </Link>
          )}
          <Link
            to="/solicitar-credenciais"
            className="hover:text-[#0A192F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Solicitar Credenciais
          </Link>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={primaryDestination.to}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {primaryDestination.label}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E2E8F0] text-[#0A192F] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white px-6 py-4 flex flex-col gap-3 text-sm font-medium text-slate-700">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="py-2 hover:text-[#0A192F]"
          >
            Início Parceiros
          </Link>
          <Link
            to="/solicitar-credenciais"
            onClick={() => setMobileOpen(false)}
            className="py-2 hover:text-[#0A192F]"
          >
            Solicitar Credenciais
          </Link>
          <Link
            to={primaryDestination.to}
            onClick={() => setMobileOpen(false)}
            className="mt-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors"
          >
            {primaryDestination.label}
          </Link>
        </div>
      )}
    </header>
  );
}
