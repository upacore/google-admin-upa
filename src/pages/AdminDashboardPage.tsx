import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  Car,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit3,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ADMIN_ROLES,
  AdminAccount,
  AdminRole,
  BOOTSTRAP_ADMIN_EMAIL,
  CredentialRequest,
  DRIVER_STATUSES,
  DRIVER_STATUS_LABELS,
  Driver,
  DriverStatus,
  HUAMBO_MUNICIPALITIES,
  PARTNER_STATUSES,
  PARTNER_STATUS_LABELS,
  PARTNER_TYPES,
  PartnerAffiliate,
  PartnerStatus,
  PartnerType,
  REQUEST_STATUS_LABELS,
  ROLE_LABELS,
  SERVICE_CATEGORIES,
  ServiceCategory,
  UPA_CONSTRAINTS,
} from '../types/upa';
import { formatUserIdentifier } from '../utils/authHelpers';

type AdminTab = 'overview' | 'drivers' | 'requests' | 'partners' | 'admins';

interface DriverFormState {
  fullName: string;
  phone: string;
  email: string;
  biNumber: string;
  licenseNumber: string;
  serviceCategory: ServiceCategory;
  vehicleMakeModel: string;
  vehiclePlate: string;
  vehicleYear: string;
  municipality: string;
  status: DriverStatus;
  partnerCode: string;
  documentsVerified: boolean;
  notes: string;
}

const EMPTY_DRIVER_FORM: DriverFormState = {
  fullName: '',
  phone: '+244 ',
  email: '',
  biNumber: '',
  licenseNumber: '',
  serviceCategory: 'UPA Ride',
  vehicleMakeModel: '',
  vehiclePlate: '',
  vehicleYear: '2022',
  municipality: HUAMBO_MUNICIPALITIES[0],
  status: 'pendente',
  partnerCode: '',
  documentsVerified: false,
  notes: '',
};

interface PartnerFormState {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  partnerType: PartnerType;
  referralCode: string;
  municipality: string;
  commissionTier: string;
  status: PartnerStatus;
}

const EMPTY_PARTNER_FORM: PartnerFormState = {
  fullName: '',
  email: '',
  phone: '+244 ',
  companyName: '',
  partnerType: 'afiliado_comercial',
  referralCode: '',
  municipality: HUAMBO_MUNICIPALITIES[0],
  commissionTier: '3.5% + 15.000 Kz/ativação',
  status: 'ativo',
};

function generateCredentialCode(prefix = 'UPA-HUA'): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export function AdminDashboardPage() {
  const { user, authReady, isAdmin, adminProfile, signOutUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [requests, setRequests] = useState<CredentialRequest[]>([]);
  const [partners, setPartners] = useState<PartnerAffiliate[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Filters
  const [driverSearch, setDriverSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'todos' | DriverStatus>('todos');
  const [driverCategoryFilter, setDriverCategoryFilter] = useState<'todas' | ServiceCategory>('todas');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'todas' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');

  // Driver Modal
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverForm, setDriverForm] = useState<DriverFormState>(EMPTY_DRIVER_FORM);
  const [driverFormError, setDriverFormError] = useState<string | null>(null);
  const [savingDriver, setSavingDriver] = useState(false);

  // Partner Modal
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerAffiliate | null>(null);
  const [partnerForm, setPartnerForm] = useState<PartnerFormState>(EMPTY_PARTNER_FORM);
  const [partnerFormError, setPartnerFormError] = useState<string | null>(null);
  const [savingPartner, setSavingPartner] = useState(false);

  // Request Review Modal
  const [reviewingReq, setReviewingReq] = useState<CredentialRequest | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [processingReview, setProcessingReview] = useState(false);

  // Delete Confirmations
  const [deleteDriverTarget, setDeleteDriverTarget] = useState<Driver | null>(null);
  const [deletePartnerTarget, setDeletePartnerTarget] = useState<PartnerAffiliate | null>(null);
  const [deleteAdminTarget, setDeleteAdminTarget] = useState<AdminAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authReady || !user || !isAdmin) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    let loadedFlags = { d: false, r: false, p: false, a: false };
    const markLoaded = (key: keyof typeof loadedFlags) => {
      loadedFlags = { ...loadedFlags, [key]: true };
      if (loadedFlags.d && loadedFlags.r && loadedFlags.p && loadedFlags.a) {
        setDataLoading(false);
      }
    };

    const unsubDrivers = onSnapshot(
      collection(db, 'drivers'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Driver, 'id'>) }));
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setDrivers(list);
        markLoaded('d');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'drivers')
    );

    const unsubRequests = onSnapshot(
      collection(db, 'credential_requests'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CredentialRequest, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setRequests(list);
        markLoaded('r');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'credential_requests')
    );

    const unsubPartners = onSnapshot(
      collection(db, 'partners'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PartnerAffiliate, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setPartners(list);
        markLoaded('p');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'partners')
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AdminAccount, 'id'>),
        }));
        setAdmins(list);
        markLoaded('a');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'admins')
    );

    return () => {
      unsubDrivers();
      unsubRequests();
      unsubPartners();
      unsubAdmins();
    };
  }, [authReady, user, isAdmin]);

  const filteredDrivers = useMemo(() => {
    const q = driverSearch.trim().toLowerCase();
    return drivers.filter((d) => {
      if (driverStatusFilter !== 'todos' && d.status !== driverStatusFilter) return false;
      if (driverCategoryFilter !== 'todas' && d.serviceCategory !== driverCategoryFilter)
        return false;
      if (!q) return true;
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.biNumber.toLowerCase().includes(q) ||
        d.vehiclePlate.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.partnerCode.toLowerCase().includes(q)
      );
    });
  }, [drivers, driverSearch, driverStatusFilter, driverCategoryFilter]);

  const filteredRequests = useMemo(() => {
    if (requestStatusFilter === 'todas') return requests;
    return requests.filter((r) => r.status === requestStatusFilter);
  }, [requests, requestStatusFilter]);

  const stats = useMemo(() => {
    const activeDrivers = drivers.filter((d) => d.status === 'ativo').length;
    const verifiedDocs = drivers.filter((d) => d.documentsVerified).length;
    const pendingRequests = requests.filter(
      (r) => r.status === 'pendente' || r.status === 'em_analise'
    ).length;
    const activePartners = partners.filter((p) => p.status === 'ativo').length;
    return {
      totalDrivers: drivers.length,
      activeDrivers,
      verifiedDocs,
      pendingRequests,
      activePartners,
    };
  }, [drivers, requests, partners]);

  const openAddDriverModal = () => {
    setEditingDriver(null);
    setDriverForm(EMPTY_DRIVER_FORM);
    setDriverFormError(null);
    setDriverModalOpen(true);
  };

  const openEditDriverModal = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverForm({
      fullName: driver.fullName,
      phone: driver.phone,
      email: driver.email,
      biNumber: driver.biNumber,
      licenseNumber: driver.licenseNumber,
      serviceCategory: driver.serviceCategory,
      vehicleMakeModel: driver.vehicleMakeModel,
      vehiclePlate: driver.vehiclePlate,
      vehicleYear: String(driver.vehicleYear),
      municipality: driver.municipality,
      status: driver.status,
      partnerCode: driver.partnerCode,
      documentsVerified: driver.documentsVerified,
      notes: driver.notes,
    });
    setDriverFormError(null);
    setDriverModalOpen(true);
  };

  const validateDriverForm = (): string | null => {
    const name = driverForm.fullName.trim();
    if (name.length < UPA_CONSTRAINTS.fullName.min || name.length > UPA_CONSTRAINTS.fullName.max) {
      return 'O nome do motorista deve ter entre 3 e 100 caracteres.';
    }
    const phone = driverForm.phone.trim();
    if (
      phone.length < UPA_CONSTRAINTS.phone.min ||
      phone.length > UPA_CONSTRAINTS.phone.max ||
      !UPA_CONSTRAINTS.phone.pattern.test(phone)
    ) {
      return 'Número de telemóvel inválido (ex.: +244 923 000 410).';
    }
    const bi = driverForm.biNumber.trim();
    if (
      bi.length < UPA_CONSTRAINTS.biNumber.min ||
      bi.length > UPA_CONSTRAINTS.biNumber.max ||
      !UPA_CONSTRAINTS.biNumber.pattern.test(bi)
    ) {
      return 'Número de BI inválido (5 a 30 caracteres alfanuméricos ou hífen).';
    }
    const license = driverForm.licenseNumber.trim();
    if (
      license.length < UPA_CONSTRAINTS.licenseNumber.min ||
      license.length > UPA_CONSTRAINTS.licenseNumber.max
    ) {
      return 'Número da Carta de Condução deve ter entre 3 e 40 caracteres.';
    }
    const makeModel = driverForm.vehicleMakeModel.trim();
    if (
      makeModel.length < UPA_CONSTRAINTS.vehicleMakeModel.min ||
      makeModel.length > UPA_CONSTRAINTS.vehicleMakeModel.max
    ) {
      return 'Indique a marca e modelo da viatura.';
    }
    const plate = driverForm.vehiclePlate.trim();
    if (
      plate.length < UPA_CONSTRAINTS.vehiclePlate.min ||
      plate.length > UPA_CONSTRAINTS.vehiclePlate.max
    ) {
      return 'Indique a matrícula da viatura (3 a 20 caracteres).';
    }
    const year = Number.parseInt(driverForm.vehicleYear, 10);
    if (
      Number.isNaN(year) ||
      year < UPA_CONSTRAINTS.vehicleYear.min ||
      year > UPA_CONSTRAINTS.vehicleYear.max
    ) {
      return 'O ano da viatura deve situar-se entre 2000 e 2030.';
    }
    return null;
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setDriverFormError(null);
    const errMsg = validateDriverForm();
    if (errMsg) {
      setDriverFormError(errMsg);
      return;
    }

    setSavingDriver(true);
    try {
      const payload = {
        fullName: driverForm.fullName.trim().slice(0, UPA_CONSTRAINTS.fullName.max),
        phone: driverForm.phone.trim().slice(0, UPA_CONSTRAINTS.phone.max),
        email: driverForm.email.trim().toLowerCase().slice(0, UPA_CONSTRAINTS.email.max),
        biNumber: driverForm.biNumber.trim().toUpperCase().slice(0, UPA_CONSTRAINTS.biNumber.max),
        licenseNumber: driverForm.licenseNumber
          .trim()
          .toUpperCase()
          .slice(0, UPA_CONSTRAINTS.licenseNumber.max),
        serviceCategory: driverForm.serviceCategory,
        vehicleMakeModel: driverForm.vehicleMakeModel
          .trim()
          .slice(0, UPA_CONSTRAINTS.vehicleMakeModel.max),
        vehiclePlate: driverForm.vehiclePlate
          .trim()
          .toUpperCase()
          .slice(0, UPA_CONSTRAINTS.vehiclePlate.max),
        vehicleYear: Number.parseInt(driverForm.vehicleYear, 10),
        municipality: driverForm.municipality.trim().slice(0, UPA_CONSTRAINTS.municipality.max),
        status: driverForm.status,
        partnerCode: driverForm.partnerCode
          .trim()
          .toUpperCase()
          .slice(0, UPA_CONSTRAINTS.partnerCode.max),
        documentsVerified: driverForm.documentsVerified,
        notes: driverForm.notes.trim().slice(0, UPA_CONSTRAINTS.notes.max),
        updatedAt: serverTimestamp(),
      };

      if (editingDriver) {
        await updateDoc(doc(db, 'drivers', editingDriver.id), payload);
      } else {
        await addDoc(collection(db, 'drivers'), {
          ...payload,
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      setDriverModalOpen(false);
    } catch (err) {
      handleFirestoreError(
        err,
        editingDriver ? OperationType.UPDATE : OperationType.CREATE,
        'drivers'
      );
    } finally {
      setSavingDriver(false);
    }
  };

  const quickUpdateDriverStatus = async (driver: Driver, nextStatus: DriverStatus) => {
    try {
      await updateDoc(doc(db, 'drivers', driver.id), {
        status: nextStatus,
        documentsVerified: nextStatus === 'ativo' ? true : driver.documentsVerified,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `drivers/${driver.id}`);
    }
  };

  const handleConfirmDeleteDriver = async () => {
    if (!deleteDriverTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'drivers', deleteDriverTarget.id));
      setDeleteDriverTarget(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `drivers/${deleteDriverTarget.id}`);
    } finally {
      setDeleting(false);
    }
  };

  const openReviewModal = (req: CredentialRequest) => {
    setReviewingReq(req);
    setReviewNotesInput(req.reviewNotes || '');
    const prefix =
      req.requestedRole === 'parceiro_frota'
        ? 'UPA-FLT'
        : req.requestedRole === 'gestor_ponto'
          ? 'UPA-PNT'
          : req.requestedRole === 'admin_operacoes'
            ? 'UPA-ADM'
            : 'UPA-AF';
    setCustomCodeInput(req.issuedCredentialCode || generateCredentialCode(prefix));
  };

  const handleApproveRequest = async () => {
    if (!reviewingReq || !user) return;
    setProcessingReview(true);
    try {
      const code = customCodeInput
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\-]/g, '')
        .slice(0, 32);
      const finalCode = code.length >= 4 ? code : generateCredentialCode('UPA-HUA');
      const notes = reviewNotesInput.trim().slice(0, UPA_CONSTRAINTS.reviewNotes.max);

      const batch = writeBatch(db);
      const reqRef = doc(db, 'credential_requests', reviewingReq.id);
      batch.update(reqRef, {
        status: 'aprovado',
        issuedCredentialCode: finalCode,
        reviewNotes: notes,
        reviewedByUid: user.uid,
        updatedAt: serverTimestamp(),
      });

      if (reviewingReq.requestedRole === 'admin_operacoes') {
        const adminRef = doc(db, 'admins', reviewingReq.applicantUid);
        const existingAdmin = await getDoc(adminRef);
        if (existingAdmin.exists()) {
          batch.update(adminRef, {
            fullName: reviewingReq.fullName.slice(0, 100),
            role: 'operacoes',
            city: reviewingReq.municipality.slice(0, 80),
          });
        } else {
          batch.set(adminRef, {
            uid: reviewingReq.applicantUid,
            email: reviewingReq.applicantEmail.toLowerCase(),
            fullName: reviewingReq.fullName.slice(0, 100),
            role: 'operacoes',
            city: reviewingReq.municipality.slice(0, 80),
            addedBy: user.uid,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        const partnerRef = doc(db, 'partners', reviewingReq.applicantUid);
        const commissionTier =
          reviewingReq.requestedRole === 'afiliado_comercial'
            ? '3.5% + 15.000 Kz/ativação'
            : reviewingReq.requestedRole === 'parceiro_frota'
              ? 'Gestão de Frota UPA'
              : 'Ponto de Apoio Certificado';

        const existingPartner = await getDoc(partnerRef);
        if (existingPartner.exists()) {
          batch.update(partnerRef, {
            uid: reviewingReq.applicantUid,
            fullName: reviewingReq.fullName.slice(0, 100),
            email: reviewingReq.applicantEmail.toLowerCase(),
            phone: reviewingReq.phone,
            companyName: reviewingReq.companyName,
            partnerType: reviewingReq.requestedRole,
            referralCode: finalCode,
            municipality: reviewingReq.municipality,
            commissionTier,
            status: 'ativo',
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(partnerRef, {
            uid: reviewingReq.applicantUid,
            fullName: reviewingReq.fullName.slice(0, 100),
            email: reviewingReq.applicantEmail.toLowerCase(),
            phone: reviewingReq.phone,
            companyName: reviewingReq.companyName,
            partnerType: reviewingReq.requestedRole,
            referralCode: finalCode,
            municipality: reviewingReq.municipality,
            commissionTier,
            status: 'ativo',
            referredDriversCount: 0,
            createdByUid: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
      setReviewingReq(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `credential_requests/${reviewingReq.id}`);
    } finally {
      setProcessingReview(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!reviewingReq || !user) return;
    setProcessingReview(true);
    try {
      await updateDoc(doc(db, 'credential_requests', reviewingReq.id), {
        status: 'rejeitado',
        reviewNotes:
          reviewNotesInput.trim().slice(0, UPA_CONSTRAINTS.reviewNotes.max) ||
          'Solicitação não aprovada pela equipa operacional.',
        reviewedByUid: user.uid,
        updatedAt: serverTimestamp(),
      });
      setReviewingReq(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `credential_requests/${reviewingReq.id}`);
    } finally {
      setProcessingReview(false);
    }
  };

  const openAddPartnerModal = () => {
    setEditingPartner(null);
    setPartnerForm({
      ...EMPTY_PARTNER_FORM,
      referralCode: generateCredentialCode('UPA-HUA'),
    });
    setPartnerFormError(null);
    setPartnerModalOpen(true);
  };

  const openEditPartnerModal = (partner: PartnerAffiliate) => {
    setEditingPartner(partner);
    setPartnerForm({
      fullName: partner.fullName,
      email: partner.email,
      phone: partner.phone,
      companyName: partner.companyName,
      partnerType: partner.partnerType,
      referralCode: partner.referralCode,
      municipality: partner.municipality,
      commissionTier: partner.commissionTier,
      status: partner.status,
    });
    setPartnerFormError(null);
    setPartnerModalOpen(true);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPartnerFormError(null);

    const name = partnerForm.fullName.trim();
    const email = partnerForm.email.trim().toLowerCase();
    const phone = partnerForm.phone.trim();
    const code = partnerForm.referralCode.trim().toUpperCase();

    if (name.length < 3 || name.length > 100) {
      setPartnerFormError('O nome deve ter entre 3 e 100 caracteres.');
      return;
    }
    if (email.length < 5 || !email.includes('@')) {
      setPartnerFormError('Informe um e-mail válido.');
      return;
    }
    if (!UPA_CONSTRAINTS.phone.pattern.test(phone)) {
      setPartnerFormError('Informe um telefone válido.');
      return;
    }
    if (!UPA_CONSTRAINTS.referralCode.pattern.test(code) || code.length < 4) {
      setPartnerFormError('Código deve conter apenas letras maiúsculas, números ou hífen (mín. 4).');
      return;
    }

    setSavingPartner(true);
    try {
      const payload = {
        uid: editingPartner?.uid || '',
        fullName: name.slice(0, 100),
        email: email.slice(0, 160),
        phone: phone.slice(0, 30),
        companyName: partnerForm.companyName.trim().slice(0, 100),
        partnerType: partnerForm.partnerType,
        referralCode: code.slice(0, 32),
        municipality: partnerForm.municipality.trim().slice(0, 80),
        commissionTier: partnerForm.commissionTier.trim().slice(0, 40) || 'Padrão UPA',
        status: partnerForm.status,
        referredDriversCount: editingPartner?.referredDriversCount ?? 0,
        updatedAt: serverTimestamp(),
      };

      if (editingPartner) {
        await updateDoc(doc(db, 'partners', editingPartner.id), payload);
      } else {
        await addDoc(collection(db, 'partners'), {
          ...payload,
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      setPartnerModalOpen(false);
    } catch (err) {
      handleFirestoreError(
        err,
        editingPartner ? OperationType.UPDATE : OperationType.CREATE,
        'partners'
      );
    } finally {
      setSavingPartner(false);
    }
  };

  const handleConfirmDeletePartner = async () => {
    if (!deletePartnerTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'partners', deletePartnerTarget.id));
      setDeletePartnerTarget(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `partners/${deletePartnerTarget.id}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateAdminRole = async (admin: AdminAccount, role: AdminRole) => {
    try {
      await updateDoc(doc(db, 'admins', admin.id), { role });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `admins/${admin.id}`);
    }
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!deleteAdminTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'admins', deleteAdminTarget.id));
      setDeleteAdminTarget(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${deleteAdminTarget.id}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00A859] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">A carregar consola administrativa...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0A192F] text-white flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#0A192F] mb-2">
            Área Reservada a Administradores UPA
          </h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {user
              ? `A conta ${user.email} não possui privilégios de administração. Solicite credenciais ou volte ao início.`
              : 'Inicie sessão com uma conta de administrador autorizada para aceder à gestão de motoristas e credenciais.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors"
            >
              Ir para Login
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 text-sm font-semibold text-[#0A192F] border border-[#E2E8F0] hover:bg-slate-50 rounded-lg transition-colors"
            >
              Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabTitles: Record<AdminTab, string> = {
    overview: 'Visão Geral',
    drivers: 'Motoristas & Viaturas',
    requests: 'Solicitações de Credenciais',
    partners: 'Afiliados & Parceiros',
    admins: 'Equipa Administrativa',
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0A192F]">
      {/* Left Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#0A192F] text-white border-r border-[#112240]">
        <div className="h-16 px-6 flex items-center border-b border-white/10">
          <Link to="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#00A859]" />
            <span>UPA Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#00A859] text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Visão Geral</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drivers')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-[#00A859] text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Car className="w-4 h-4 shrink-0" />
              <span>Motoristas</span>
            </span>
            <span className="text-xs font-mono tabular-nums opacity-80">{drivers.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#00A859] text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>Credenciais</span>
            </span>
            <span className="text-xs font-mono tabular-nums opacity-80">
              {stats.pendingRequests}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('partners')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'partners'
                ? 'bg-[#00A859] text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4 shrink-0" />
              <span>Afiliados & Parceiros</span>
            </span>
            <span className="text-xs font-mono tabular-nums opacity-80">{partners.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'admins'
                ? 'bg-[#00A859] text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Equipa Admin</span>
            </span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-white truncate">
              {adminProfile?.fullName || user.displayName}
            </p>
            <p className="text-slate-400 font-mono truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-slate-200 border border-white/15 rounded-lg hover:bg-white/5 transition-colors"
            >
              Site Início
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOutUser();
                navigate('/login');
              }}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-200 border border-white/15 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-400 hidden sm:inline">UPA Administração</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <h1 className="font-bold text-[#0A192F] truncate">{tabTitles[activeTab]}</h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab === 'partners' ? (
              <button
                type="button"
                onClick={openAddPartnerModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Novo Parceiro
              </button>
            ) : (
              <button
                type="button"
                onClick={openAddDriverModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Adicionar Motorista
              </button>
            )}
          </div>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden bg-white border-b border-[#E2E8F0] px-4 py-2 flex items-center gap-1 overflow-x-auto">
          {(
            [
              ['overview', 'Visão Geral'],
              ['drivers', 'Motoristas'],
              ['requests', 'Credenciais'],
              ['partners', 'Parceiros'],
              ['admins', 'Admin'],
            ] as [AdminTab, string][]
          ).map(([tabKey, label]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tabKey
                  ? 'bg-[#0A192F] text-white'
                  : 'text-slate-600 hover:text-[#0A192F]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Workspace Viewport */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <p className="text-xs text-slate-500">Motoristas registados</p>
                  <p className="text-2xl font-bold text-[#0A192F] font-mono tabular-nums mt-1">
                    {stats.totalDrivers}
                  </p>
                  <p className="text-xs text-[#008F4B] mt-1 tabular-nums">
                    {stats.activeDrivers} ativos na rede
                  </p>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <p className="text-xs text-slate-500">Documentação verificada</p>
                  <p className="text-2xl font-bold text-[#0A192F] font-mono tabular-nums mt-1">
                    {stats.verifiedDocs}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">BI e Carta validados</p>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <p className="text-xs text-slate-500">Credenciais pendentes</p>
                  <p className="text-2xl font-bold text-[#0A192F] font-mono tabular-nums mt-1">
                    {stats.pendingRequests}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">A aguardar decisão</p>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <p className="text-xs text-slate-500">Afiliados & Parceiros ativos</p>
                  <p className="text-2xl font-bold text-[#0A192F] font-mono tabular-nums mt-1">
                    {stats.activePartners}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Huambo & expansão</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Requests Queue */}
                <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#0A192F]">
                      Solicitações Pendentes
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('requests')}
                      className="text-xs font-semibold text-[#008F4B] hover:underline cursor-pointer"
                    >
                      Ver todas
                    </button>
                  </div>

                  {dataLoading ? (
                    <div className="space-y-3">
                      <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                      <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                  ) : requests.filter((r) => r.status === 'pendente').length === 0 ? (
                    <p className="text-xs text-slate-500 py-6">
                      Sem solicitações de credenciais pendentes de análise.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E2E8F0]">
                      {requests
                        .filter((r) => r.status === 'pendente')
                        .slice(0, 5)
                        .map((req) => (
                          <div
                            key={req.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0A192F] truncate">
                                {req.fullName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {ROLE_LABELS[req.requestedRole]} · {req.municipality}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openReviewModal(req)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-[#0A192F] hover:bg-[#112240] rounded-md cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Analisar
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Recent Drivers */}
                <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#0A192F]">
                      Últimos Motoristas Adicionados
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('drivers')}
                      className="text-xs font-semibold text-[#008F4B] hover:underline cursor-pointer"
                    >
                      Gerir frota
                    </button>
                  </div>

                  {dataLoading ? (
                    <div className="space-y-3">
                      <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                      <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                  ) : drivers.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-600 mb-3">
                        Nenhum motorista registado na base de dados.
                      </p>
                      <button
                        type="button"
                        onClick={openAddDriverModal}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg cursor-pointer"
                      >
                        Registar Primeiro Motorista
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-slate-500">
                            <th className="py-2.5 pr-4 font-medium">Motorista</th>
                            <th className="py-2.5 pr-4 font-medium">Categoria</th>
                            <th className="py-2.5 pr-4 font-medium">Matrícula</th>
                            <th className="py-2.5 font-medium text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {drivers.slice(0, 5).map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50/80">
                              <td className="py-3 pr-4">
                                <p className="font-semibold text-[#0A192F]">{d.fullName}</p>
                                <p className="text-slate-500 font-mono tabular-nums">{d.phone}</p>
                              </td>
                              <td className="py-3 pr-4 text-slate-700">{d.serviceCategory}</td>
                              <td className="py-3 pr-4 font-mono text-slate-700 tabular-nums">
                                {d.vehiclePlate}
                              </td>
                              <td className="py-3 text-right font-semibold">
                                <span
                                  className={
                                    d.status === 'ativo'
                                      ? 'text-[#008F4B]'
                                      : d.status === 'suspenso'
                                        ? 'text-red-600'
                                        : 'text-amber-700'
                                  }
                                >
                                  {DRIVER_STATUS_LABELS[d.status]}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB: DRIVERS */}
          {activeTab === 'drivers' && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    placeholder="Pesquisar por nome, BI, matrícula, telefone ou código..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    {(['todos', ...DRIVER_STATUSES] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setDriverStatusFilter(st)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          driverStatusFilter === st
                            ? 'bg-[#0A192F] text-white'
                            : 'text-slate-600 hover:text-[#0A192F]'
                        }`}
                      >
                        {st === 'todos' ? 'Todos' : DRIVER_STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>

                  <select
                    value={driverCategoryFilter}
                    onChange={(e) =>
                      setDriverCategoryFilter(e.target.value as 'todas' | ServiceCategory)
                    }
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                  >
                    <option value="todas">Todas categorias</option>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredDrivers.length === 0 ? (
                <div className="py-12 text-center border-t border-[#E2E8F0]">
                  <p className="text-sm text-slate-600 mb-3">
                    {drivers.length === 0
                      ? 'Ainda não existem motoristas registados.'
                      : 'Nenhum motorista corresponde aos filtros aplicados.'}
                  </p>
                  {drivers.length === 0 && (
                    <button
                      type="button"
                      onClick={openAddDriverModal}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg cursor-pointer"
                    >
                      Adicionar Primeiro Motorista
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto border-t border-[#E2E8F0]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-slate-500">
                        <th className="py-3 pr-4 font-medium">Motorista & Contacto</th>
                        <th className="py-3 pr-4 font-medium">BI / Carta</th>
                        <th className="py-3 pr-4 font-medium">Viatura & Categoria</th>
                        <th className="py-3 pr-4 font-medium">Município</th>
                        <th className="py-3 pr-4 font-medium">Estado</th>
                        <th className="py-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {filteredDrivers.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 pr-4">
                            <p className="text-sm font-semibold text-[#0A192F]">{d.fullName}</p>
                            <p className="font-mono text-slate-600 tabular-nums">{d.phone}</p>
                            {d.partnerCode && (
                              <p className="font-mono text-[11px] text-[#008F4B] mt-0.5">
                                Ref: {d.partnerCode}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 font-mono tabular-nums">
                            <p className="text-slate-800">BI: {d.biNumber}</p>
                            <p className="text-slate-500">Carta: {d.licenseNumber}</p>
                          </td>
                          <td className="py-3.5 pr-4">
                            <p className="font-medium text-[#0A192F]">
                              {d.vehicleMakeModel} ({d.vehicleYear})
                            </p>
                            <p className="text-slate-500">
                              <span className="font-mono tabular-nums">{d.vehiclePlate}</span> ·{' '}
                              {d.serviceCategory}
                            </p>
                          </td>
                          <td className="py-3.5 pr-4 text-slate-700">{d.municipality}</td>
                          <td className="py-3.5 pr-4">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                d.status === 'ativo'
                                  ? 'text-[#008F4B]'
                                  : d.status === 'suspenso'
                                    ? 'text-red-600'
                                    : 'text-amber-700'
                              }`}
                            >
                              {d.status === 'ativo' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : d.status === 'suspenso' ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {DRIVER_STATUS_LABELS[d.status]}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {d.documentsVerified ? 'Docs verificados' : 'Docs por conferir'}
                            </p>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {d.status !== 'ativo' && (
                                <button
                                  type="button"
                                  onClick={() => void quickUpdateDriverStatus(d, 'ativo')}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-[#008F4B] border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer whitespace-nowrap"
                                >
                                  Ativar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditDriverModal(d)}
                                aria-label={`Editar ${d.fullName}`}
                                className="p-1.5 text-slate-600 hover:text-[#0A192F] border border-[#E2E8F0] rounded-md cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteDriverTarget(d)}
                                aria-label={`Remover ${d.fullName}`}
                                className="p-1.5 text-red-600 hover:bg-red-50 border border-[#E2E8F0] rounded-md cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: CREDENTIAL REQUESTS */}
          {activeTab === 'requests' && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#0A192F]">
                    Fila de Solicitações de Credenciais
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aprovar uma solicitação cria automaticamente o perfil de parceiro ou operador
                    e emite o código de acesso.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  {(['pendente', 'aprovado', 'rejeitado', 'todas'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRequestStatusFilter(st)}
                      className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                        requestStatusFilter === st
                          ? 'bg-[#0A192F] text-white'
                          : 'text-slate-600 hover:text-[#0A192F]'
                      }`}
                    >
                      {st === 'todas' ? 'Todas' : REQUEST_STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="py-12 text-center border-t border-[#E2E8F0]">
                  <p className="text-sm text-slate-500">
                    Nenhuma solicitação encontrada para este filtro.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0]">
                  {filteredRequests.map((req) => (
                    <div
                      key={req.id}
                      className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-sm font-bold text-[#0A192F]">{req.fullName}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-medium text-[#008F4B]">
                            {ROLE_LABELS[req.requestedRole]}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span
                            className={`font-semibold ${
                              req.status === 'aprovado'
                                ? 'text-[#008F4B]'
                                : req.status === 'rejeitado'
                                  ? 'text-red-600'
                                  : 'text-amber-700'
                            }`}
                          >
                            {REQUEST_STATUS_LABELS[req.status]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-mono">
                          {formatUserIdentifier(req.applicantEmail)} · {req.phone} · BI/NIF:{' '}
                          {req.documentId}
                        </p>
                        <p className="text-xs text-slate-600">
                          {req.municipality}
                          {req.companyName ? ` · Empresa: ${req.companyName}` : ''} · Meta/Frota:{' '}
                          <span className="font-mono tabular-nums">{req.fleetSize}</span>
                        </p>
                        <p className="text-xs text-slate-700 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                          {req.motivation}
                        </p>
                        {req.issuedCredentialCode && (
                          <p className="text-xs font-mono font-semibold text-[#008F4B]">
                            Código emitido: {req.issuedCredentialCode}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openReviewModal(req)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#0A192F] hover:bg-[#112240] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {req.status === 'pendente' ? 'Analisar & Decidir' : 'Rever Decisão'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PARTNERS & AFFILIATES */}
          {activeTab === 'partners' && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#0A192F]">
                    Rede de Afiliados e Parceiros de Frota
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Códigos de indicação ativos para associação direta no registo de motoristas.
                  </p>
                </div>
              </div>

              {partners.length === 0 ? (
                <div className="py-12 text-center border-t border-[#E2E8F0]">
                  <p className="text-sm text-slate-600 mb-3">
                    Ainda não existem parceiros ou afiliados ativos.
                  </p>
                  <button
                    type="button"
                    onClick={openAddPartnerModal}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg cursor-pointer"
                  >
                    Adicionar Parceiro / Afiliado
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border-t border-[#E2E8F0]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-slate-500">
                        <th className="py-3 pr-4 font-medium">Parceiro / Afiliado</th>
                        <th className="py-3 pr-4 font-medium">Tipo & Zona</th>
                        <th className="py-3 pr-4 font-medium">Código</th>
                        <th className="py-3 pr-4 font-medium">Motoristas Ligados</th>
                        <th className="py-3 pr-4 font-medium">Estado</th>
                        <th className="py-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {partners.map((p) => {
                        const linkedCount = drivers.filter(
                          (d) => d.partnerCode && d.partnerCode === p.referralCode
                        ).length;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 pr-4">
                              <p className="text-sm font-semibold text-[#0A192F]">{p.fullName}</p>
                              <p className="text-slate-500 font-mono">
                                {p.email} · {p.phone}
                              </p>
                              {p.companyName && (
                                <p className="text-slate-600">{p.companyName}</p>
                              )}
                            </td>
                            <td className="py-3.5 pr-4">
                              <p className="font-medium text-[#0A192F]">
                                {ROLE_LABELS[p.partnerType]}
                              </p>
                              <p className="text-slate-500">
                                {p.municipality} · {p.commissionTier}
                              </p>
                            </td>
                            <td className="py-3.5 pr-4 font-mono font-bold text-[#008F4B]">
                              {p.referralCode}
                            </td>
                            <td className="py-3.5 pr-4 font-mono tabular-nums text-slate-800">
                              {linkedCount}
                            </td>
                            <td className="py-3.5 pr-4 font-semibold">
                              <span
                                className={
                                  p.status === 'ativo'
                                    ? 'text-[#008F4B]'
                                    : p.status === 'suspenso'
                                      ? 'text-red-600'
                                      : 'text-amber-700'
                                }
                              >
                                {PARTNER_STATUS_LABELS[p.status]}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditPartnerModal(p)}
                                  aria-label={`Editar ${p.fullName}`}
                                  className="p-1.5 text-slate-600 hover:text-[#0A192F] border border-[#E2E8F0] rounded-md cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletePartnerTarget(p)}
                                  aria-label={`Remover ${p.fullName}`}
                                  className="p-1.5 text-red-600 hover:bg-red-50 border border-[#E2E8F0] rounded-md cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: ADMINS */}
          {activeTab === 'admins' && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-[#0A192F]">
                  Equipa Administrativa Autorizada
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Novos operadores podem solicitar credenciais em{' '}
                  <Link to="/solicitar-credenciais?perfil=admin_operacoes" className="text-[#008F4B] underline">
                    /solicitar-credenciais
                  </Link>{' '}
                  para aprovação imediata nesta consola.
                </p>
              </div>

              <div className="border-t border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#0A192F]">
                      Administrador Principal (Sede UPA)
                    </p>
                    <p className="text-xs font-mono text-slate-600">{BOOTSTRAP_ADMIN_EMAIL}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#008F4B]">
                    Super Administrador · Permanente
                  </span>
                </div>

                {admins.map((adm) => (
                  <div
                    key={adm.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0A192F]">{adm.fullName}</p>
                      <p className="text-xs font-mono text-slate-600">
                        {adm.email} · {adm.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={adm.role}
                        onChange={(e) =>
                          void handleUpdateAdminRole(adm, e.target.value as AdminRole)
                        }
                        className="px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg"
                      >
                        {ADMIN_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r === 'super_admin'
                              ? 'Super Admin'
                              : r === 'operacoes'
                                ? 'Operações'
                                : 'Suporte'}
                          </option>
                        ))}
                      </select>
                      {adm.id !== user.uid && (
                        <button
                          type="button"
                          onClick={() => setDeleteAdminTarget(adm)}
                          className="p-1.5 text-red-600 hover:bg-red-50 border border-[#E2E8F0] rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD / EDIT DRIVER */}
      {driverModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/55 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 sm:p-8 my-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0A192F]">
                  {editingDriver ? 'Editar Motorista' : 'Adicionar Novo Motorista'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registo completo de condutor e viatura na rede UPA Mobilidade Angola.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDriverModalOpen(false)}
                className="p-2 text-slate-500 hover:text-[#0A192F] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {driverFormError && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {driverFormError}
              </div>
            )}

            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={UPA_CONSTRAINTS.fullName.max}
                    value={driverForm.fullName}
                    onChange={(e) =>
                      setDriverForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    placeholder="Ex.: João Baptista Chicomo"
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Telemóvel *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={UPA_CONSTRAINTS.phone.max}
                    value={driverForm.phone}
                    onChange={(e) =>
                      setDriverForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Bilhete de Identidade *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={UPA_CONSTRAINTS.biNumber.max}
                    value={driverForm.biNumber}
                    onChange={(e) =>
                      setDriverForm((prev) => ({ ...prev, biNumber: e.target.value }))
                    }
                    placeholder="004519823HO041"
                    className="w-full px-3 py-2 text-sm font-mono border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Carta de Condução *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={UPA_CONSTRAINTS.licenseNumber.max}
                    value={driverForm.licenseNumber}
                    onChange={(e) =>
                      setDriverForm((prev) => ({ ...prev, licenseNumber: e.target.value }))
                    }
                    placeholder="HB-992014"
                    className="w-full px-3 py-2 text-sm font-mono border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    maxLength={UPA_CONSTRAINTS.email.max}
                    value={driverForm.email}
                    onChange={(e) =>
                      setDriverForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Categoria UPA *
                  </label>
                  <select
                    value={driverForm.serviceCategory}
                    onChange={(e) =>
                      setDriverForm((prev) => ({
                        ...prev,
                        serviceCategory: e.target.value as ServiceCategory,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Marca e Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={UPA_CONSTRAINTS.vehicleMakeModel.max}
                    value={driverForm.vehicleMakeModel}
                    onChange={(e) =>
                      setDriverForm((prev) => ({ ...prev, vehicleMakeModel: e.target.value }))
                    }
                    placeholder="Hyundai i10 / Suzuki Dzire"
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                      Matrícula *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={UPA_CONSTRAINTS.vehiclePlate.max}
                      value={driverForm.vehiclePlate}
                      onChange={(e) =>
                        setDriverForm((prev) => ({ ...prev, vehiclePlate: e.target.value }))
                      }
                      placeholder="LD-44-12-HB"
                      className="w-full px-2.5 py-2 text-sm font-mono border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                      Ano *
                    </label>
                    <input
                      type="number"
                      min={2000}
                      max={2030}
                      required
                      value={driverForm.vehicleYear}
                      onChange={(e) =>
                        setDriverForm((prev) => ({ ...prev, vehicleYear: e.target.value }))
                      }
                      className="w-full px-2.5 py-2 text-sm font-mono border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Município / Zona *
                  </label>
                  <select
                    value={driverForm.municipality}
                    onChange={(e) =>
                      setDriverForm((prev) => ({ ...prev, municipality: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white"
                  >
                    {HUAMBO_MUNICIPALITIES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Estado *
                  </label>
                  <select
                    value={driverForm.status}
                    onChange={(e) =>
                      setDriverForm((prev) => ({
                        ...prev,
                        status: e.target.value as DriverStatus,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white"
                  >
                    {DRIVER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {DRIVER_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Código Parceiro / Afiliado
                  </label>
                  <input
                    type="text"
                    maxLength={UPA_CONSTRAINTS.partnerCode.max}
                    value={driverForm.partnerCode}
                    onChange={(e) =>
                      setDriverForm((prev) => ({ ...prev, partnerCode: e.target.value }))
                    }
                    placeholder="UPA-HUA-0001"
                    className="w-full px-3 py-2 text-sm font-mono border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  id="driver-docs-verified"
                  type="checkbox"
                  checked={driverForm.documentsVerified}
                  onChange={(e) =>
                    setDriverForm((prev) => ({ ...prev, documentsVerified: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#00A859]"
                />
                <label htmlFor="driver-docs-verified" className="text-xs font-medium text-[#0A192F]">
                  Documentação presencial conferida na sede (BI, Carta, Livrete e Seguro)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                  Notas internas
                </label>
                <textarea
                  rows={2}
                  maxLength={UPA_CONSTRAINTS.notes.max}
                  value={driverForm.notes}
                  onChange={(e) =>
                    setDriverForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#00A859]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setDriverModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-[#E2E8F0] rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDriver}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg cursor-pointer disabled:opacity-60"
                >
                  {savingDriver
                    ? 'A guardar...'
                    : editingDriver
                      ? 'Guardar Alterações'
                      : 'Registar Motorista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PARTNER */}
      {partnerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/55 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full p-6 sm:p-8 my-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-[#0A192F]">
                {editingPartner ? 'Editar Parceiro / Afiliado' : 'Novo Parceiro / Afiliado'}
              </h2>
              <button
                type="button"
                onClick={() => setPartnerModalOpen(false)}
                className="p-2 text-slate-500 hover:text-[#0A192F] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {partnerFormError && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {partnerFormError}
              </div>
            )}

            <form onSubmit={handleSavePartner} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerForm.fullName}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    E-mail Google *
                  </label>
                  <input
                    type="email"
                    required
                    value={partnerForm.email}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Telemóvel *
                  </label>
                  <input
                    type="tel"
                    required
                    value={partnerForm.phone}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-[#E2E8F0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Empresa / Frota
                  </label>
                  <input
                    type="text"
                    value={partnerForm.companyName}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Programa *
                  </label>
                  <select
                    value={partnerForm.partnerType}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        partnerType: e.target.value as PartnerType,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white"
                  >
                    {PARTNER_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {ROLE_LABELS[pt]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Código de Indicação *
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerForm.referralCode}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        referralCode: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-[#E2E8F0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Estado *
                  </label>
                  <select
                    value={partnerForm.status}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        status: e.target.value as PartnerStatus,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white"
                  >
                    {PARTNER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {PARTNER_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Município *
                  </label>
                  <select
                    value={partnerForm.municipality}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({ ...prev, municipality: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white"
                  >
                    {HUAMBO_MUNICIPALITIES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                    Regime de Comissão *
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerForm.commissionTier}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({ ...prev, commissionTier: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setPartnerModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-[#E2E8F0] rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPartner}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg cursor-pointer disabled:opacity-60"
                >
                  {savingPartner ? 'A guardar...' : 'Guardar Parceiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW CREDENTIAL REQUEST */}
      {reviewingReq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0A192F]">
                Análise de Credencial UPA
              </h2>
              <button
                type="button"
                onClick={() => setReviewingReq(null)}
                className="p-1.5 text-slate-500 hover:text-[#0A192F] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-1.5 text-xs">
              <p className="text-sm font-bold text-[#0A192F]">{reviewingReq.fullName}</p>
              <p className="font-mono text-slate-600">
                {formatUserIdentifier(reviewingReq.applicantEmail)}
              </p>
              <p className="text-slate-700">
                Perfil pedido:{' '}
                <span className="font-semibold text-[#008F4B]">
                  {ROLE_LABELS[reviewingReq.requestedRole]}
                </span>
              </p>
              <p className="text-slate-600">
                BI/NIF: <span className="font-mono">{reviewingReq.documentId}</span> ·{' '}
                {reviewingReq.municipality}
              </p>
              <p className="text-slate-700 pt-1">{reviewingReq.motivation}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                Código de Credencial a Emitir
              </label>
              <input
                type="text"
                maxLength={32}
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm font-mono border border-[#E2E8F0] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0A192F] mb-1">
                Observações para o candidato
              </label>
              <textarea
                rows={3}
                maxLength={UPA_CONSTRAINTS.reviewNotes.max}
                value={reviewNotesInput}
                onChange={(e) => setReviewNotesInput(e.target.value)}
                placeholder="Ex.: Credencial aprovada. Compareça na sede da Rua Rainha Ginga para levantamento do kit."
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                disabled={processingReview}
                onClick={() => void handleRejectRequest()}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer disabled:opacity-60"
              >
                Rejeitar
              </button>
              <button
                type="button"
                disabled={processingReview}
                onClick={() => void handleApproveRequest()}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#00A859] hover:bg-[#008F4B] rounded-lg cursor-pointer disabled:opacity-60"
              >
                {processingReview ? 'A processar...' : 'Aprovar & Emitir Credencial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOGS */}
      <ConfirmDialog
        open={Boolean(deleteDriverTarget)}
        title="Remover motorista"
        description={`Tem a certeza que pretende remover ${deleteDriverTarget?.fullName || ''} da base de dados da UPA?`}
        confirmLabel="Remover Motorista"
        destructive
        loading={deleting}
        onConfirm={() => void handleConfirmDeleteDriver()}
        onCancel={() => setDeleteDriverTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deletePartnerTarget)}
        title="Remover parceiro ou afiliado"
        description={`Pretende remover ${deletePartnerTarget?.fullName || ''} (${deletePartnerTarget?.referralCode || ''})?`}
        confirmLabel="Remover Parceiro"
        destructive
        loading={deleting}
        onConfirm={() => void handleConfirmDeletePartner()}
        onCancel={() => setDeletePartnerTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteAdminTarget)}
        title="Revogar acesso administrativo"
        description={`Pretende remover as permissões administrativas de ${deleteAdminTarget?.email || ''}?`}
        confirmLabel="Revogar Acesso"
        destructive
        loading={deleting}
        onConfirm={() => void handleConfirmDeleteAdmin()}
        onCancel={() => setDeleteAdminTarget(null)}
      />
    </div>
  );
}
