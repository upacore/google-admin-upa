import { Timestamp } from 'firebase/firestore';

export const BOOTSTRAP_ADMIN_EMAIL = 'upacloud.config@gmail.com';

export const UPA_CONSTRAINTS = {
  fullName: { min: 3, max: 100 },
  email: { min: 5, max: 160 },
  phone: { min: 6, max: 30, pattern: /^\+?[0-9\s\-()]{6,25}$/ },
  biNumber: { min: 5, max: 30, pattern: /^[a-zA-Z0-9\-]+$/ },
  licenseNumber: { min: 3, max: 40 },
  vehicleMakeModel: { min: 2, max: 80 },
  vehiclePlate: { min: 3, max: 20 },
  vehicleYear: { min: 2000, max: 2030 },
  municipality: { min: 2, max: 80 },
  partnerCode: { max: 32 },
  referralCode: { min: 4, max: 32, pattern: /^[A-Z0-9\-]+$/ },
  notes: { max: 500 },
  motivation: { min: 10, max: 600 },
  reviewNotes: { max: 400 },
  companyName: { max: 100 },
  documentId: { min: 5, max: 30 },
  fleetSize: { min: 0, max: 500 },
} as const;

export const SERVICE_CATEGORIES = [
  'UPA Ride',
  'UPA Delivery',
  'UPA Moto',
  'UPA Driver',
  'UPA Van',
  'UPA Business',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const DRIVER_STATUSES = ['ativo', 'pendente', 'em_verificacao', 'suspenso'] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const REQUEST_ROLES = [
  'parceiro_frota',
  'afiliado_comercial',
  'gestor_ponto',
  'admin_operacoes',
] as const;
export type RequestedRole = (typeof REQUEST_ROLES)[number];

export const REQUEST_STATUSES = ['pendente', 'em_analise', 'aprovado', 'rejeitado'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PARTNER_TYPES = ['parceiro_frota', 'afiliado_comercial', 'gestor_ponto'] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_STATUSES = ['ativo', 'pendente', 'suspenso'] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const ADMIN_ROLES = ['super_admin', 'operacoes', 'suporte'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const HUAMBO_MUNICIPALITIES = [
  'Huambo · Cidade Alta',
  'Huambo · Benfica',
  'Huambo · Bairro Académico',
  'Caála',
  'Bailundo',
  'Ecunha',
  'Londuimbali',
  'Longonjo',
  'Tchikala-Tcholohanga',
  'Luanda (Expansão)',
  'Benguela (Expansão)',
] as const;

export const ROLE_LABELS: Record<RequestedRole, string> = {
  parceiro_frota: 'Parceiro de Frota',
  afiliado_comercial: 'Afiliado Comercial',
  gestor_ponto: 'Gestor de Ponto UPA',
  admin_operacoes: 'Administrador Operacional',
};

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  em_verificacao: 'Em Verificação',
  suspenso: 'Suspenso',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  suspenso: 'Suspenso',
};

export interface AdminAccount {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  role: AdminRole;
  city: string;
  addedBy: string;
  createdAt?: Timestamp | null;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  biNumber: string;
  licenseNumber: string;
  serviceCategory: ServiceCategory;
  vehicleMakeModel: string;
  vehiclePlate: string;
  vehicleYear: number;
  municipality: string;
  status: DriverStatus;
  partnerCode: string;
  documentsVerified: boolean;
  notes: string;
  createdByUid: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CredentialRequest {
  id: string;
  applicantUid: string;
  applicantEmail: string;
  fullName: string;
  phone: string;
  documentId: string;
  companyName: string;
  requestedRole: RequestedRole;
  municipality: string;
  fleetSize: number;
  motivation: string;
  status: RequestStatus;
  issuedCredentialCode: string;
  reviewNotes: string;
  reviewedByUid: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface PartnerAffiliate {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  partnerType: PartnerType;
  referralCode: string;
  municipality: string;
  commissionTier: string;
  status: PartnerStatus;
  referredDriversCount: number;
  createdByUid: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}
