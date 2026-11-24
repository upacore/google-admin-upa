import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Copy, LogOut, MapPin, ShieldCheck, Users } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { PARTNER_STATUS_LABELS, ROLE_LABELS } from '../types/upa';

export function PartnerPortalPage() {
  const { user, authReady, partnerProfile, signOutUser } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!partnerProfile?.referralCode) return;
    await navigator.clipboard.writeText(partnerProfile.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00A859] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !partnerProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
            <Users className="w-8 h-8 text-[#00A859] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-[#0A192F] mb-2">
              Portal Exclusivo para Parceiros & Afiliados
            </h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Inicie sessão com uma conta aprovada ou solicite a sua credencial de parceiro UPA.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0A192F] rounded-lg"
              >
                Iniciar Sessão
              </Link>
              <Link
                to="/solicitar-credenciais"
                className="px-5 py-2.5 text-sm font-semibold text-[#008F4B] border border-[#E2E8F0] rounded-lg"
              >
                Solicitar Credenciais
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
        <div className="bg-[#0A192F] text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-mono text-emerald-400 mb-2">
              {ROLE_LABELS[partnerProfile.partnerType]} ·{' '}
              {PARTNER_STATUS_LABELS[partnerProfile.status]}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Olá, {partnerProfile.fullName}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              {partnerProfile.companyName ? `${partnerProfile.companyName} · ` : ''}
              {partnerProfile.municipality}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-3">
              <div>
                <p className="text-[11px] text-slate-300">Código de Credencial / Indicação</p>
                <p className="text-lg font-mono font-bold text-white tracking-wider">
                  {partnerProfile.referralCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCopyCode()}
                className="p-2 rounded-lg bg-[#00A859] hover:bg-[#008F4B] text-white transition-colors cursor-pointer"
                aria-label="Copiar código"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={async () => {
                await signOutUser();
                navigate('/login');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Terminar Sessão
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
            <p className="text-xs text-slate-500">Regime de Comissão</p>
            <p className="text-lg font-bold text-[#0A192F] mt-1">
              {partnerProfile.commissionTier}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Liquidação em Kwanzas via Multicaixa Express ou transferência bancária.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
            <p className="text-xs text-slate-500">Zona de Atuação</p>
            <p className="text-lg font-bold text-[#0A192F] mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#00A859] shrink-0" />
              <span>{partnerProfile.municipality}</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Atendimento presencial na sede da Rua Rainha Ginga, Cidade Alta.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
            <p className="text-xs text-slate-500">Estado da Credencial</p>
            <p className="text-lg font-bold text-[#008F4B] mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{PARTNER_STATUS_LABELS[partnerProfile.status]}</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Partilhe o código <span className="font-mono">{partnerProfile.referralCode}</span> com
              novos motoristas no registo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
