import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  LogOut,
  MailCheck,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { REQUEST_STATUS_LABELS, ROLE_LABELS } from '../types/upa';
import { formatUserIdentifier, isPhoneAuthEmail } from '../utils/authHelpers';

type AuthMode = 'login' | 'register' | 'reset';

export function LoginPage() {
  const {
    user,
    authReady,
    isAdmin,
    adminProfile,
    partnerProfile,
    myRequests,
    authLoading,
    authError,
    authNotice,
    clearAuthMessages,
    signInWithGoogle,
    signInWithCredentials,
    registerWithCredentials,
    sendPasswordReset,
    resendVerificationEmail,
    refreshUserSession,
    signOutUser,
  } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const latestRequest = myRequests[0] || null;
  const isPhoneAccount = isPhoneAuthEmail(user?.email);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setLocalError(null);
    clearAuthMessages();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthMessages();

    if (mode === 'login') {
      await signInWithCredentials(identifier, password);
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError('As senhas introduzidas não coincidem.');
        return;
      }
      await registerWithCredentials({ fullName, identifier, password });
      return;
    }

    if (mode === 'reset') {
      const ok = await sendPasswordReset(identifier);
      if (ok) {
        setMode('login');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 flex items-stretch">
        <div className="max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Architectural Brand Context */}
          <div className="lg:col-span-6 bg-[#0A192F] text-white rounded-2xl p-8 sm:p-12 flex flex-col justify-between min-h-[440px]">
            <div>
              <p className="text-xs font-mono text-emerald-400 mb-4">
                UPA Portal de Acesso · Huambo
              </p>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4"
                style={{ textWrap: 'balance' }}
              >
                Acesso para administradores, parceiros de frota e afiliados
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Entre utilizando o seu e-mail ou número de telefone e senha, ou ligue-se com um
                clique através da sua conta Google. O sistema identifica automaticamente as suas
                permissões e direciona para a área correspondente.
              </p>
            </div>

            <div className="pt-8 mt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div>
                <p className="font-semibold text-white mb-1">Área Administrativa</p>
                <p>Registo de motoristas, validação de documentos e emissão de credenciais.</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Parceiros & Afiliados</p>
                <p>Consulta de código de indicação, comissão contratada e estado da conta.</p>
              </div>
            </div>
          </div>

          {/* Right Auth Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8">
              {!authReady ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-[#00A859] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">A verificar sessão...</p>
                </div>
              ) : !user ? (
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-[#0A192F] tracking-tight">
                      {mode === 'login'
                        ? 'Entrar no Portal'
                        : mode === 'register'
                          ? 'Criar Conta'
                          : 'Recuperar Senha'}
                    </h2>

                    {mode !== 'reset' && (
                      <div className="flex items-center gap-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                            mode === 'login'
                              ? 'bg-[#0A192F] text-white'
                              : 'text-slate-600 hover:text-[#0A192F]'
                          }`}
                        >
                          Entrar
                        </button>
                        <button
                          type="button"
                          onClick={() => switchMode('register')}
                          className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                            mode === 'register'
                              ? 'bg-[#0A192F] text-white'
                              : 'text-slate-600 hover:text-[#0A192F]'
                          }`}
                        >
                          Criar Conta
                        </button>
                      </div>
                    )}
                  </div>

                  {(localError || authError) && (
                    <div
                      role="alert"
                      className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
                    >
                      {localError || authError}
                    </div>
                  )}

                  {authNotice && (
                    <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#0A192F] leading-relaxed">
                      {authNotice}
                    </div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {mode === 'register' && (
                      <div>
                        <label
                          htmlFor="auth-fullname"
                          className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                        >
                          Nome completo *
                        </label>
                        <input
                          id="auth-fullname"
                          type="text"
                          required
                          maxLength={100}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ex.: Mateus Cassinda"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="auth-identifier"
                        className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                      >
                        {mode === 'reset'
                          ? 'E-mail registado *'
                          : 'E-mail ou Número de Telefone *'}
                      </label>
                      <input
                        id="auth-identifier"
                        type="text"
                        required
                        autoComplete="username"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={
                          mode === 'reset'
                            ? 'exemplo@upa.ao'
                            : 'exemplo@upa.ao ou +244 923 000 410'
                        }
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                      />
                    </div>

                    {mode !== 'reset' && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="auth-password"
                            className="block text-xs font-semibold text-[#0A192F]"
                          >
                            Senha *
                          </label>
                          {mode === 'login' && (
                            <button
                              type="button"
                              onClick={() => switchMode('reset')}
                              className="text-xs font-medium text-[#008F4B] hover:underline cursor-pointer"
                            >
                              Esqueceu a senha?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            id="auth-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            autoComplete={
                              mode === 'login' ? 'current-password' : 'new-password'
                            }
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#0A192F] cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'register' && (
                      <div>
                        <label
                          htmlFor="auth-confirm-password"
                          className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                        >
                          Confirmar senha *
                        </label>
                        <input
                          id="auth-confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a senha"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {authLoading
                        ? 'A processar...'
                        : mode === 'login'
                          ? 'Entrar no Portal'
                          : mode === 'register'
                            ? 'Criar Conta e Entrar'
                            : 'Enviar E-mail de Recuperação'}
                    </button>

                    {mode === 'reset' && (
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="w-full py-2 text-xs font-medium text-slate-600 hover:text-[#0A192F] cursor-pointer"
                      >
                        Voltar ao login
                      </button>
                    )}
                  </form>

                  {mode !== 'reset' && (
                    <>
                      <div className="my-5 flex items-center gap-3">
                        <div className="flex-1 h-px bg-[#E2E8F0]" />
                        <span className="text-xs text-slate-400">ou</span>
                        <div className="flex-1 h-px bg-[#E2E8F0]" />
                      </div>

                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={() => void signInWithGoogle()}
                        className="w-full inline-flex items-center justify-center gap-3 px-5 py-2.5 text-sm font-semibold text-[#0A192F] bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="#4285F4"
                            d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
                          />
                        </svg>
                        Continuar com Google
                      </button>
                    </>
                  )}

                  <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
                    <p className="text-xs text-slate-500 mb-2">
                      Precisa de acesso oficial como parceiro, afiliado ou operador?
                    </p>
                    <Link
                      to="/solicitar-credenciais"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#008F4B] hover:underline underline-offset-4"
                    >
                      Solicitar Credenciais de Acesso
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Sessão ativa</p>
                      <p className="text-base font-bold text-[#0A192F] truncate">
                        {user.displayName || 'Utilizador UPA'}
                      </p>
                      <p className="text-xs font-mono text-slate-600 truncate">
                        {formatUserIdentifier(user.email)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void signOutUser()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-[#E2E8F0] rounded-lg hover:bg-slate-50 cursor-pointer shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sair
                    </button>
                  </div>

                  {authNotice && (
                    <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#0A192F]">
                      {authNotice}
                    </div>
                  )}

                  {authError && (
                    <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                      {authError}
                    </div>
                  )}

                  {!user.emailVerified && !isPhoneAccount && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <MailCheck className="w-4 h-4 text-amber-700" />
                        <span>Confirme o seu e-mail</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Para ativar permissões administrativas ou validação por e-mail, abra o link
                        de confirmação enviado para <span className="font-mono">{user.email}</span>.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          disabled={authLoading}
                          onClick={() => void refreshUserSession()}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0A192F] rounded-md cursor-pointer"
                        >
                          Já verifiquei
                        </button>
                        <button
                          type="button"
                          disabled={authLoading}
                          onClick={() => void resendVerificationEmail()}
                          className="px-3 py-1.5 text-xs font-medium text-amber-900 border border-amber-300 rounded-md cursor-pointer"
                        >
                          Reenviar e-mail
                        </button>
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#0A192F]">
                        <Shield className="w-4 h-4 text-[#00A859]" />
                        <span>Acesso Administrativo Verificado</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Perfil:{' '}
                        {adminProfile?.role === 'super_admin'
                          ? 'Super Administrador'
                          : 'Operações UPA'}{' '}
                        · {adminProfile?.city || 'Huambo'}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors cursor-pointer"
                      >
                        Abrir Área Administrativa
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {partnerProfile && (
                    <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#0A192F]">
                        <Users className="w-4 h-4 text-[#00A859]" />
                        <span>Conta de Parceiro / Afiliado</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Código:{' '}
                        <span className="font-mono font-semibold">
                          {partnerProfile.referralCode}
                        </span>{' '}
                        · Estado:{' '}
                        <span className="font-semibold capitalize">{partnerProfile.status}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/parceiro')}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0A192F] hover:bg-[#112240] rounded-lg transition-colors cursor-pointer"
                      >
                        Abrir Portal do Parceiro
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {!isAdmin && !partnerProfile && latestRequest && (
                    <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#0A192F]">
                        {latestRequest.status === 'aprovado' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#00A859]" />
                        ) : latestRequest.status === 'rejeitado' ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600" />
                        )}
                        <span>Solicitação {REQUEST_STATUS_LABELS[latestRequest.status]}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Perfil pedido: {ROLE_LABELS[latestRequest.requestedRole]} · Município:{' '}
                        {latestRequest.municipality}
                      </p>
                      {latestRequest.reviewNotes && (
                        <p className="text-xs text-slate-700 bg-white border border-[#E2E8F0] rounded-lg p-3">
                          Nota da administração: {latestRequest.reviewNotes}
                        </p>
                      )}
                      <Link
                        to="/solicitar-credenciais"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008F4B] hover:underline underline-offset-4 pt-1"
                      >
                        Ver detalhes ou enviar nova solicitação
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {!isAdmin && !partnerProfile && !latestRequest && (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Esta conta ainda não tem credenciais ativas na UPA Mobilidade. Envie uma
                        solicitação para aprovação da equipa administrativa no Huambo.
                      </p>
                      <Link
                        to="/solicitar-credenciais"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors"
                      >
                        Solicitar Credenciais Agora
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
