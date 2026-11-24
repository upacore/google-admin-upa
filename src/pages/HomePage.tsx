import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { SafeImage } from '../components/SafeImage';

function formatAOA(value: number): string {
  return new Intl.NumberFormat('pt-AO', {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function HomePage() {
  const [programMode, setProgramMode] = useState<'parceiro_frota' | 'afiliado_comercial'>(
    'parceiro_frota'
  );
  const [unitCount, setUnitCount] = useState<number>(6);
  const [dailyTrips, setDailyTrips] = useState<number>(14);

  // Realistic Huambo average fare ~1.350 Kz per trip, 26 active days/month
  const avgFareAOA = 1350;
  const workingDays = 26;
  const monthlyGrossAOA = unitCount * dailyTrips * avgFareAOA * workingDays;
  // Fleet partner net share after 12% UPA fee & operational split (~28% fleet net margin)
  // Affiliate commercial bonus: 3.5% recurring bonus on gross referred rides + 15.000 Kz activation per driver
  const estimatedPartnerMonthlyAOA =
    programMode === 'parceiro_frota'
      ? monthlyGrossAOA * 0.28
      : monthlyGrossAOA * 0.035 + unitCount * 15000;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0A192F]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Split */}
        <section className="bg-white border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between gap-8 py-2">
              <div>
                <p className="text-xs font-medium text-slate-500 tracking-wide mb-4">
                  Huambo, Angola · Sede Nacional em Cidade Alta · Rede de Parceiros
                </p>
                <h1
                  className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0A192F] leading-[1.1] mb-6"
                  style={{ textWrap: 'balance', fontSize: 'clamp(2.25rem, 4vw, 3.35rem)' }}
                >
                  Parcerias, afiliados e gestão de frotas da UPA em Angola
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  Expanda a mobilidade urbana no Huambo com comissão fixa de 12% para motoristas,
                  tarifas transparentes em Kwanzas e liquidação rápida via Multicaixa Express.
                  Solicite as suas credenciais de parceiro ou aceda à área administrativa.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/solicitar-credenciais"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Solicitar Credenciais
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#0A192F] bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Entrar no Portal Admin
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-[#E2E8F0] min-h-[320px] lg:min-h-[440px]">
              <SafeImage
                src="/src/assets/images/hero_upa_huambo_fleet_1795520753906.jpg"
                alt="Frota moderna da UPA Mobilidade Angola estacionada em avenida arborizada no Huambo"
                className="w-full h-full lg:h-full object-cover"
                fallbackTitle="Frota UPA Huambo"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A192F]/90 via-[#0A192F]/45 to-transparent p-6 text-white">
                <p className="text-xs font-mono text-emerald-300 mb-1">
                  Operação ativa · Huambo & Caála
                </p>
                <p className="text-sm font-medium text-slate-100">
                  Sede operacional na Rua Rainha Ginga, Cidade Alta — verificação presencial e
                  suporte local 24/7.
                </p>
              </div>
            </div>
          </div>

          {/* 4-column KPI strip in full-width row below hero */}
          <div className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0A192F] tabular-nums">12%</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Comissão fixa aplicada aos motoristas parceiros
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0A192F] tabular-nums">6</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Categorias ativas: Ride, Delivery, Moto, Driver, Van e Business
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0A192F] tabular-nums">24h</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Liquidação rápida para contas angolanas e Multicaixa Express
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0A192F] tabular-nums">100%</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Destino visível antes de aceitar, sem corridas às escuras
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Programas de Parceria e Afiliacao (Asymmetric Bento Grid) */}
        <section id="programas" className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-medium text-[#008F4B] mb-2">
              Ecossistema de Crescimento UPA
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Programas estruturados para frotas, afiliados comerciais e gestão operacional
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 01 - Featured col-span-2 dark card */}
            <div className="lg:col-span-2 bg-[#0A192F] text-white rounded-xl p-8 flex flex-col justify-between gap-8">
              <div>
                <p className="text-xs font-mono text-emerald-400 mb-3">
                  01. Parceiro de Frota & UPA Business
                </p>
                <h3 className="text-2xl font-bold tracking-tight mb-3">
                  Operadores com 3 a 50+ viaturas em regime de frota
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Associe viaturas ligeiras, carrinhas UPA Van ou motorizadas UPA Delivery à sua
                  conta empresarial. Acompanhe o estado documental de cada motorista e receba
                  relatórios semanais consolidados em Kwanzas.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10">
                <div className="text-xs text-slate-300">
                  <span>Categorias elegíveis: UPA Ride · UPA Van · UPA Business</span>
                </div>
                <Link
                  to="/solicitar-credenciais?perfil=parceiro_frota"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0A192F] bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Registar Frota
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* 02 - Affiliate card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-mono text-[#008F4B] mb-3">02. Afiliado Comercial</p>
                <h3 className="text-xl font-bold text-[#0A192F] tracking-tight mb-3">
                  Indicação de novos motoristas no Huambo
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Receba um código exclusivo <span className="font-mono">UPA-HUA</span> para indicar
                  motoristas e estafetas. Ganhe bónus de ativação e percentagem recorrente por
                  cada motorista validado presencialmente em Cidade Alta.
                </p>
              </div>
              <Link
                to="/solicitar-credenciais?perfil=afiliado_comercial"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#008F4B] hover:underline underline-offset-4 whitespace-nowrap"
              >
                Tornar-se Afiliado
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 03 - Hub Manager card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-mono text-[#008F4B] mb-3">03. Ponto de Apoio</p>
                <h3 className="text-xl font-bold text-[#0A192F] tracking-tight mb-3">
                  Gestor de Ponto Local (Caála, Bailundo e municípios)
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Apoie o processo presencial de conferência de Bilhete de Identidade, Carta de
                  Condução e inspeção rápida de viaturas nos municípios em expansão.
                </p>
              </div>
              <Link
                to="/solicitar-credenciais?perfil=gestor_ponto"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#008F4B] hover:underline underline-offset-4 whitespace-nowrap"
              >
                Candidatar Ponto de Apoio
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 04 - Admin Operations col-span-2 */}
            <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-mono text-slate-500 mb-3">
                  04. Consola Administrativa Interna
                </p>
                <h3 className="text-xl font-bold text-[#0A192F] tracking-tight mb-3">
                  Área reservada para administradores e equipa de operações UPA
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                  Registe novos motoristas e viaturas, valide documentação angolana (BI e Carta),
                  aprove ou rejeite solicitações de credenciais de parceiros e atribua códigos de
                  afiliado com controlo de acessos em tempo real.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0A192F] hover:bg-[#112240] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Aceder à Área Admin
                </Link>
                <Link
                  to="/solicitar-credenciais?perfil=admin_operacoes"
                  className="text-sm font-medium text-slate-600 hover:text-[#0A192F] hover:underline underline-offset-4 whitespace-nowrap"
                >
                  Solicitar credencial de operador
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Simulador de Rendimentos em Kwanzas */}
        <section id="simulador" className="bg-white border-y border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-medium text-[#008F4B] mb-2">
                Planeamento Financeiro em Kwanzas
              </p>
              <h2
                className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-4"
                style={{ textWrap: 'balance' }}
              >
                Simulador de receita para frotas e afiliados
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                Estime o volume mensal movimentado com base na tarifa média urbana no Huambo
                (1.350 Kz por viagem, 26 dias úteis) e compare o retorno entre gerir uma frota
                própria ou atuar como afiliado comercial.
              </p>

              <div className="inline-flex items-center gap-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <button
                  type="button"
                  onClick={() => setProgramMode('parceiro_frota')}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    programMode === 'parceiro_frota'
                      ? 'bg-[#0A192F] text-white'
                      : 'text-slate-600 hover:text-[#0A192F]'
                  }`}
                >
                  Parceiro de Frota
                </button>
                <button
                  type="button"
                  onClick={() => setProgramMode('afiliado_comercial')}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    programMode === 'afiliado_comercial'
                      ? 'bg-[#0A192F] text-white'
                      : 'text-slate-600 hover:text-[#0A192F]'
                  }`}
                >
                  Afiliado Comercial
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <label htmlFor="unit-slider" className="font-medium text-[#0A192F]">
                      {programMode === 'parceiro_frota'
                        ? 'Viaturas na frota'
                        : 'Motoristas indicados'}
                    </label>
                    <span className="font-mono font-semibold text-[#008F4B] tabular-nums">
                      {unitCount}
                    </span>
                  </div>
                  <input
                    id="unit-slider"
                    type="range"
                    min={1}
                    max={30}
                    value={unitCount}
                    onChange={(e) => setUnitCount(Number(e.target.value))}
                    className="w-full accent-[#00A859] cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 tabular-nums">
                    <span>1</span>
                    <span>15</span>
                    <span>30</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <label htmlFor="trips-slider" className="font-medium text-[#0A192F]">
                      Corridas por dia / viatura
                    </label>
                    <span className="font-mono font-semibold text-[#008F4B] tabular-nums">
                      {dailyTrips}
                    </span>
                  </div>
                  <input
                    id="trips-slider"
                    type="range"
                    min={6}
                    max={25}
                    value={dailyTrips}
                    onChange={(e) => setDailyTrips(Number(e.target.value))}
                    className="w-full accent-[#00A859] cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 tabular-nums">
                    <span>6</span>
                    <span>15</span>
                    <span>25</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#E2E8F0]">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Volume bruto mensal estimado</p>
                  <p className="text-2xl font-bold text-[#0A192F] font-mono tabular-nums">
                    {formatAOA(monthlyGrossAOA)} Kz
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    {programMode === 'parceiro_frota'
                      ? 'Margem líquida estimada do parceiro'
                      : 'Bónus mensal estimado do afiliado'}
                  </p>
                  <p className="text-2xl font-bold text-[#008F4B] font-mono tabular-nums">
                    {formatAOA(estimatedPartnerMonthlyAOA)} Kz
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Valores indicativos baseados em tarifa média urbana no Huambo.
                </p>
                <Link
                  to={`/solicitar-credenciais?perfil=${programMode}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Solicitar este perfil
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Segurança & Operação Huambo */}
        <section id="seguranca" className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#E2E8F0] min-h-[300px]">
              <SafeImage
                src="/src/assets/images/upa_partner_driver_1795520754918.jpg"
                alt="Motorista parceiro verificado da UPA Angola ao volante no Huambo"
                className="w-full h-full lg:h-full object-cover"
                fallbackTitle="Motorista Parceiro UPA"
              />
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center gap-6">
              <div>
                <p className="text-xs font-medium text-[#008F4B] mb-2">
                  Rigor Documental & Segurança Local
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-4"
                  style={{ textWrap: 'balance' }}
                >
                  Cada motorista é verificado presencialmente antes de ativar na plataforma
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  A confiança dos passageiros no Huambo começa na validação rigorosa feita pela
                  nossa equipa administrativa em Cidade Alta. Todas as viaturas e condutores
                  passam por conferência de documentos antes da ativação.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0A192F] mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#00A859] shrink-0" />
                    <span>Conferência de BI e Carta</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Validação de Bilhete de Identidade, Carta de Condução, Livrete e Seguro
                    obrigatório na sede UPA.
                  </p>
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0A192F] mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00A859] shrink-0" />
                    <span>PIN de Embarque & GPS</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Código PIN entre passageiro e motorista, botão de emergência GPS e suporte
                    local contínuo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-[#0A192F] text-slate-300 border-t border-[#112240]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-base font-bold text-white tracking-tight">
              UPA Mobilidade Angola, Lda.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00A859]" />
                Rua Rainha Ginga, Cidade Alta, Huambo
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-[#00A859]" />
                +244 923 000 410
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link to="/solicitar-credenciais" className="hover:text-white transition-colors">
              Solicitar Credenciais
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Login & Área Admin
            </Link>
            <span className="text-xs text-slate-500">
              © {new Date().getFullYear()} UPA Mobilidade Angola
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
