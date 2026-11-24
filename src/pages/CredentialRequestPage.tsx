import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Clock, FileCheck, XCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  HUAMBO_MUNICIPALITIES,
  REQUEST_ROLES,
  REQUEST_STATUS_LABELS,
  ROLE_LABELS,
  RequestedRole,
  UPA_CONSTRAINTS,
} from '../types/upa';
import { formatUserIdentifier, isPhoneAuthEmail } from '../utils/authHelpers';

export function CredentialRequestPage() {
  const [searchParams] = useSearchParams();
  const { user, myRequests, signInWithGoogle, authLoading, authError } = useAuth();

  const initialRoleParam = searchParams.get('perfil') as RequestedRole | null;
  const validInitialRole: RequestedRole =
    initialRoleParam && REQUEST_ROLES.includes(initialRoleParam)
      ? initialRoleParam
      : 'parceiro_frota';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+244 ');
  const [documentId, setDocumentId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [requestedRole, setRequestedRole] = useState<RequestedRole>(validInitialRole);
  const [municipality, setMunicipality] = useState<string>(HUAMBO_MUNICIPALITIES[0]);
  const [fleetSize, setFleetSize] = useState<string>('3');
  const [motivation, setMotivation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null);

  useEffect(() => {
    if (user?.displayName && !fullName) {
      setFullName(user.displayName);
    }
    if (user?.email && isPhoneAuthEmail(user.email) && phone.trim() === '+244') {
      setPhone(formatUserIdentifier(user.email));
    }
  }, [user, fullName, phone]);

  const validateFields = (): string | null => {
    const trimmedName = fullName.trim();
    if (
      trimmedName.length < UPA_CONSTRAINTS.fullName.min ||
      trimmedName.length > UPA_CONSTRAINTS.fullName.max
    ) {
      return 'O nome completo deve ter entre 3 e 100 caracteres.';
    }

    const trimmedPhone = phone.trim();
    if (
      trimmedPhone.length < UPA_CONSTRAINTS.phone.min ||
      trimmedPhone.length > UPA_CONSTRAINTS.phone.max ||
      !UPA_CONSTRAINTS.phone.pattern.test(trimmedPhone)
    ) {
      return 'Informe um número de telefone válido (ex.: +244 923 000 410).';
    }

    const trimmedDoc = documentId.trim();
    if (
      trimmedDoc.length < UPA_CONSTRAINTS.documentId.min ||
      trimmedDoc.length > UPA_CONSTRAINTS.documentId.max
    ) {
      return 'Informe o número de Bilhete de Identidade (BI) ou NIF válido (5 a 30 caracteres).';
    }

    if (companyName.trim().length > UPA_CONSTRAINTS.companyName.max) {
      return 'O nome da empresa não pode exceder 100 caracteres.';
    }

    const parsedFleet = Number.parseInt(fleetSize, 10);
    if (Number.isNaN(parsedFleet) || parsedFleet < 0 || parsedFleet > 500) {
      return 'O número de viaturas ou indicações deve estar entre 0 e 500.';
    }

    const trimmedMotivation = motivation.trim();
    if (
      trimmedMotivation.length < UPA_CONSTRAINTS.motivation.min ||
      trimmedMotivation.length > UPA_CONSTRAINTS.motivation.max
    ) {
      return 'Descreva a sua atuação ou objetivo com pelo menos 10 caracteres.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmittedProtocol(null);

    const validationErr = validateFields();
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    let currentUser = user;
    if (!currentUser) {
      currentUser = await signInWithGoogle();
      if (!currentUser) return;
    }

    if (!currentUser.email) {
      setFormError('Não foi possível identificar a sua conta autenticada.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        applicantUid: currentUser.uid,
        applicantEmail: currentUser.email.toLowerCase().slice(0, UPA_CONSTRAINTS.email.max),
        fullName: fullName.trim().slice(0, UPA_CONSTRAINTS.fullName.max),
        phone: phone.trim().slice(0, UPA_CONSTRAINTS.phone.max),
        documentId: documentId.trim().slice(0, UPA_CONSTRAINTS.documentId.max),
        companyName: companyName.trim().slice(0, UPA_CONSTRAINTS.companyName.max),
        requestedRole,
        municipality: municipality.trim().slice(0, UPA_CONSTRAINTS.municipality.max),
        fleetSize: Math.min(500, Math.max(0, Number.parseInt(fleetSize, 10) || 0)),
        motivation: motivation.trim().slice(0, UPA_CONSTRAINTS.motivation.max),
        status: 'pendente' as const,
        issuedCredentialCode: '',
        reviewNotes: '',
        reviewedByUid: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'credential_requests'), payload);
      setSubmittedProtocol(docRef.id);
      setMotivation('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'credential_requests');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-mono text-[#008F4B] mb-2">
              Credenciamento Oficial · UPA Mobilidade Angola
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-2">
              Solicitação de Credenciais
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Preencha os seus dados para solicitar acesso como Parceiro de Frota, Afiliado
              Comercial, Gestor de Ponto ou Administrador Operacional. A equipa no Huambo analisa
              e emite o seu código de credencial.
            </p>
          </div>

          {submittedProtocol && (
            <div className="mb-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0A192F] mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#00A859]" />
                <span>Solicitação registada com sucesso</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Protocolo: <span className="font-mono font-semibold">{submittedProtocol}</span>.
                Pode acompanhar a aprovação em tempo real no painel lateral ou na página de login.
              </p>
            </div>
          )}

          {(formError || authError) && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
            >
              {formError || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="req-fullname"
                  className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                >
                  Nome completo *
                </label>
                <input
                  id="req-fullname"
                  type="text"
                  required
                  maxLength={UPA_CONSTRAINTS.fullName.max}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex.: Mateus Ngola Cassinda"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                />
              </div>

              <div>
                <label
                  htmlFor="req-phone"
                  className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                >
                  Telemóvel / WhatsApp *
                </label>
                <input
                  id="req-phone"
                  type="tel"
                  required
                  maxLength={UPA_CONSTRAINTS.phone.max}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+244 923 000 000"
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="req-doc"
                  className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                >
                  Bilhete de Identidade (BI) ou NIF *
                </label>
                <input
                  id="req-doc"
                  type="text"
                  required
                  maxLength={UPA_CONSTRAINTS.documentId.max}
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="Ex.: 004519823HO041"
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                />
              </div>

              <div>
                <label
                  htmlFor="req-company"
                  className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                >
                  Empresa ou Frota (opcional)
                </label>
                <input
                  id="req-company"
                  type="text"
                  maxLength={UPA_CONSTRAINTS.companyName.max}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex.: Transportes Planalto Lda."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label
                  htmlFor="req-role"
                  className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                >
                  Perfil pretendido *
                </label>
                <select
                  id="req-role"
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value as RequestedRole)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                >
                  {REQUEST_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="req-municipality"
                  className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                >
                  Município / Zona *
                </label>
                <select
                  id="req-municipality"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                >
                  {HUAMBO_MUNICIPALITIES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="req-fleet"
                  className="block text-xs font-semibold text-[#0A192F] mb-1.5"
                >
                  Viaturas / Meta mensal
                </label>
                <input
                  id="req-fleet"
                  type="number"
                  min={0}
                  max={500}
                  value={fleetSize}
                  onChange={(e) => setFleetSize(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="req-motivation"
                className="block text-xs font-semibold text-[#0A192F] mb-1.5"
              >
                Experiência e descrição da operação *
              </label>
              <textarea
                id="req-motivation"
                required
                rows={4}
                maxLength={UPA_CONSTRAINTS.motivation.max}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Descreva a sua frota, rede de contactos com motoristas no Huambo ou função administrativa..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {user ? (
                  <span>A enviar como {formatUserIdentifier(user.email)}</span>
                ) : (
                  <span>
                    Pode{' '}
                    <Link to="/login" className="font-semibold text-[#008F4B] hover:underline">
                      entrar com e-mail/telefone
                    </Link>{' '}
                    ou autenticar com Google ao enviar.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || authLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                {submitting || authLoading
                  ? 'A enviar solicitação...'
                  : user
                    ? 'Enviar Solicitação de Credenciais'
                    : 'Autenticar com Google e Enviar'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Protocol Tracker & Verification Requirements */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0A192F] mb-4">
              <FileCheck className="w-4 h-4 text-[#00A859]" />
              <span>Estado das suas Solicitações</span>
            </div>

            {!user ? (
              <div className="text-xs text-slate-600 leading-relaxed space-y-3">
                <p>
                  Inicie sessão com e-mail, telefone ou Google para visualizar o histórico e os
                  códigos emitidos para as suas solicitações de credenciais.
                </p>
                <Link
                  to="/login"
                  className="inline-block font-semibold text-[#008F4B] hover:underline underline-offset-4"
                >
                  Ir para a página de login
                </Link>
              </div>
            ) : myRequests.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                Ainda não submeteu nenhuma solicitação com a conta{' '}
                <span className="font-mono">{formatUserIdentifier(user.email)}</span>.
              </p>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {myRequests.map((req) => (
                  <div key={req.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#0A192F]">
                        {ROLE_LABELS[req.requestedRole]}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          req.status === 'aprovado'
                            ? 'text-[#008F4B]'
                            : req.status === 'rejeitado'
                              ? 'text-red-600'
                              : 'text-amber-700'
                        }`}
                      >
                        {req.status === 'aprovado' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : req.status === 'rejeitado' ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {REQUEST_STATUS_LABELS[req.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {req.municipality} · Protocolo{' '}
                      <span className="font-mono">{req.id.slice(0, 10)}</span>
                    </p>
                    {req.issuedCredentialCode && (
                      <p className="text-xs font-mono font-semibold text-[#0A192F] bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
                        Credencial emitida: {req.issuedCredentialCode}
                      </p>
                    )}
                    {req.reviewNotes && (
                      <p className="text-xs text-slate-600 bg-[#F8FAFC] rounded-md p-2.5 border border-[#E2E8F0]">
                        {req.reviewNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0A192F] text-white rounded-2xl p-6 space-y-3">
            <p className="text-xs font-mono text-emerald-400">Atendimento Presencial</p>
            <h2 className="text-base font-bold">Sede Nacional UPA — Huambo</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Para ativação de frotas e validação presencial de motoristas indicados, dirija-se à
              Rua Rainha Ginga, Cidade Alta, Huambo, ou contacte a nossa equipa pelo +244 923 000
              410.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
