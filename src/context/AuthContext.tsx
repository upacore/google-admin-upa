import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  AdminAccount,
  BOOTSTRAP_ADMIN_EMAIL,
  CredentialRequest,
  PartnerAffiliate,
} from '../types/upa';
import { isPhoneAuthEmail, parseAuthIdentifier } from '../utils/authHelpers';

interface RegisterCredentialsInput {
  fullName: string;
  identifier: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminProfile: AdminAccount | null;
  partnerProfile: PartnerAffiliate | null;
  myRequests: CredentialRequest[];
  authLoading: boolean;
  authError: string | null;
  authNotice: string | null;
  clearAuthMessages: () => void;
  signInWithGoogle: () => Promise<User | null>;
  signInWithCredentials: (identifier: string, password: string) => Promise<User | null>;
  registerWithCredentials: (input: RegisterCredentialsInput) => Promise<User | null>;
  sendPasswordReset: (identifier: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  refreshUserSession: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'A janela de autenticação Google foi fechada antes de concluir o login.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de login. Permita pop-ups para continuar.';
    case 'auth/operation-not-allowed':
      return 'O método E-mail/Senha ainda não foi ativado na Consola Firebase deste projeto. Ative o provedor "E-mail/senha" em Authentication > Sign-in method.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail/telefone ou senha incorretos. Verifique os dados e tente novamente.';
    case 'auth/email-already-in-use':
      return 'Já existe uma conta registada com este e-mail ou número de telefone.';
    case 'auth/weak-password':
      return 'A senha é demasiado fraca. Utilize pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'O formato do e-mail ou número de telefone informado é inválido.';
    case 'auth/too-many-requests':
      return 'Demasiadas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
    case 'auth/user-disabled':
      return 'Esta conta foi desativada pela administração.';
    default:
      return 'Não foi possível concluir a autenticação. Tente novamente.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminAccount | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerAffiliate | null>(null);
  const [myRequests, setMyRequests] = useState<CredentialRequest[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const loadUserContext = async (firebaseUser: User | null) => {
    setUser(firebaseUser);

    if (!firebaseUser) {
      setIsAdmin(false);
      setAdminProfile(null);
      setPartnerProfile(null);
      setMyRequests([]);
      setAuthReady(true);
      return;
    }

    const isBootstrap =
      Boolean(firebaseUser.emailVerified) &&
      firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    try {
      const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
      if (adminSnap.exists() && firebaseUser.emailVerified) {
        const data = adminSnap.data() as Omit<AdminAccount, 'id'>;
        setAdminProfile({ id: adminSnap.id, ...data });
        setIsAdmin(true);
      } else if (isBootstrap) {
        setAdminProfile({
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || BOOTSTRAP_ADMIN_EMAIL,
          fullName: firebaseUser.displayName || 'Administrador UPA',
          role: 'super_admin',
          city: 'Huambo · Sede Nacional',
          addedBy: firebaseUser.uid,
        });
        setIsAdmin(true);
      } else {
        setAdminProfile(null);
        setIsAdmin(false);
      }
    } catch (err) {
      if (isBootstrap) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setAdminProfile(null);
      }
      console.error('Erro ao verificar perfil admin:', err);
    }

    setAuthReady(true);
  };

  useEffect(() => {
    let unsubPartner: (() => void) | undefined;
    let unsubRequests: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubPartner) unsubPartner();
      if (unsubRequests) unsubRequests();

      await loadUserContext(firebaseUser);

      if (!firebaseUser) return;

      const partnerQ =
        firebaseUser.emailVerified && firebaseUser.email
          ? query(
              collection(db, 'partners'),
              where('email', '==', firebaseUser.email.toLowerCase())
            )
          : query(collection(db, 'partners'), where('uid', '==', firebaseUser.uid));

      unsubPartner = onSnapshot(
        partnerQ,
        (snap) => {
          if (!snap.empty) {
            const first = snap.docs[0];
            setPartnerProfile({
              id: first.id,
              ...(first.data() as Omit<PartnerAffiliate, 'id'>),
            });
          } else {
            setPartnerProfile(null);
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'partners');
        }
      );

      const reqQ = query(
        collection(db, 'credential_requests'),
        where('applicantUid', '==', firebaseUser.uid)
      );
      unsubRequests = onSnapshot(
        reqQ,
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CredentialRequest, 'id'>),
          }));
          list.sort((a, b) => {
            const ta = a.createdAt?.toMillis() ?? 0;
            const tb = b.createdAt?.toMillis() ?? 0;
            return tb - ta;
          });
          setMyRequests(list);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'credential_requests');
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubPartner) unsubPartner();
      if (unsubRequests) unsubRequests();
    };
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithCredentials = async (
    identifier: string,
    password: string
  ): Promise<User | null> => {
    setAuthError(null);
    setAuthNotice(null);

    const parsed = parseAuthIdentifier(identifier);
    if (!parsed) {
      setAuthError('Informe um e-mail válido ou número de telefone angolano (ex.: +244 923 000 410).');
      return null;
    }
    if (password.length < 6) {
      setAuthError('A senha deve ter pelo menos 6 caracteres.');
      return null;
    }

    setAuthLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, parsed.authEmail, password);
      return result.user;
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  const registerWithCredentials = async ({
    fullName,
    identifier,
    password,
  }: RegisterCredentialsInput): Promise<User | null> => {
    setAuthError(null);
    setAuthNotice(null);

    const trimmedName = fullName.trim();
    if (trimmedName.length < 3 || trimmedName.length > 100) {
      setAuthError('O nome completo deve ter entre 3 e 100 caracteres.');
      return null;
    }

    const parsed = parseAuthIdentifier(identifier);
    if (!parsed) {
      setAuthError('Informe um e-mail válido ou número de telefone (ex.: +244 923 000 410).');
      return null;
    }

    if (password.length < 6) {
      setAuthError('A senha deve ter pelo menos 6 caracteres.');
      return null;
    }

    setAuthLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, parsed.authEmail, password);
      await updateProfile(result.user, { displayName: trimmedName });
      if (parsed.kind === 'email') {
        try {
          await sendEmailVerification(result.user);
          setAuthNotice(
            `Conta criada! Enviámos um link de verificação para ${parsed.displayLabel}.`
          );
        } catch {
          setAuthNotice('Conta criada com sucesso.');
        }
      } else {
        setAuthNotice(`Conta criada com o número ${parsed.displayLabel}.`);
      }
      await loadUserContext(result.user);
      return result.user;
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  const sendPasswordReset = async (identifier: string): Promise<boolean> => {
    setAuthError(null);
    setAuthNotice(null);
    const parsed = parseAuthIdentifier(identifier);
    if (!parsed) {
      setAuthError('Informe o seu e-mail para recuperar a senha.');
      return false;
    }
    if (parsed.kind === 'phone') {
      setAuthError(
        'A recuperação automática por link funciona apenas para contas com e-mail. Para contas criadas só com telefone, contacte o suporte UPA no Huambo (+244 923 000 410).'
      );
      return false;
    }

    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, parsed.authEmail);
      setAuthNotice(
        `Se existir uma conta associada a ${parsed.displayLabel}, receberá um e-mail de redefinição de senha.`
      );
      return true;
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const resendVerificationEmail = async (): Promise<boolean> => {
    if (!auth.currentUser || isPhoneAuthEmail(auth.currentUser.email)) return false;
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setAuthNotice(`E-mail de verificação reenviado para ${auth.currentUser.email}.`);
      return true;
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const refreshUserSession = async (): Promise<void> => {
    if (!auth.currentUser) return;
    setAuthLoading(true);
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      await loadUserContext(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        setAuthNotice('E-mail verificado com sucesso.');
      } else {
        setAuthNotice('O e-mail ainda consta como não verificado. Clique no link enviado para a sua caixa de entrada.');
      }
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const signOutUser = async (): Promise<void> => {
    setAuthError(null);
    setAuthNotice(null);
    await signOut(auth);
  };

  const clearAuthMessages = () => {
    setAuthError(null);
    setAuthNotice(null);
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  }
  return ctx;
}
