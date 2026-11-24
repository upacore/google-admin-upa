const PHONE_AUTH_DOMAIN = 'tel.upa.ao';

export function isPhoneAuthEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${PHONE_AUTH_DOMAIN}`);
}

export function extractPhoneDigitsFromAuthEmail(email: string): string {
  const local = email.split('@')[0] || '';
  return local.replace(/\D/g, '');
}

export function formatPhoneForDisplay(digits: string): string {
  if (digits.startsWith('244') && digits.length === 12) {
    return `+244 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
  }
  return `+${digits}`;
}

export function formatUserIdentifier(email: string | null | undefined): string {
  if (!email) return '';
  if (isPhoneAuthEmail(email)) {
    return formatPhoneForDisplay(extractPhoneDigitsFromAuthEmail(email));
  }
  return email;
}

export interface ParsedAuthIdentifier {
  kind: 'email' | 'phone';
  authEmail: string;
  displayLabel: string;
  phoneE164?: string;
}

export function parseAuthIdentifier(rawInput: string): ParsedAuthIdentifier | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 160) return null;
    return {
      kind: 'email',
      authEmail: email,
      displayLabel: email,
    };
  }

  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.length === 9 && digits.startsWith('9')) {
    digits = `244${digits}`;
  }
  if (digits.length < 8 || digits.length > 15) {
    return null;
  }

  return {
    kind: 'phone',
    authEmail: `${digits}@${PHONE_AUTH_DOMAIN}`,
    displayLabel: formatPhoneForDisplay(digits),
    phoneE164: `+${digits}`,
  };
}
