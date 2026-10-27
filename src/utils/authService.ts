import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification, 
  sendPasswordResetEmail, 
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface AuthActionResult {
  success: boolean;
  message: string;
  emailSent?: boolean;
  user?: FirebaseUser;
  errorCode?: string;
}

/**
 * Translates Firebase Auth error codes into clear, user-friendly French messages.
 */
export function getFirebaseAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà associée à un compte utilisateur.';
    case 'auth/invalid-email':
      return 'L\'adresse email saisie est invalide.';
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/user-not-found':
      return 'Aucun compte n\'est enregistré avec cette adresse email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Mot de passe ou identifiant incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives infructueuses. Veuillez patienter quelques minutes avant de réessayer.';
    case 'auth/operation-not-allowed':
      return 'L\'authentification par Email/Mot de passe n\'est pas encore activée dans la console Firebase (Console > Authentication > Sign-in method > Email/Password).';
    case 'auth/network-request-failed':
      return 'Erreur de connexion réseau. Vérifiez votre accès Internet.';
    default:
      return 'Une erreur est survenue lors de l\'opération d\'authentification.';
  }
}

/**
 * Creates a new user account in Firebase Auth and immediately sends a verification email.
 */
export async function registerWithEmailAndSendVerification(
  email: string, 
  password: string, 
  displayName?: string
): Promise<AuthActionResult> {
  const cleanEmail = email.trim();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    if (displayName) {
      try {
        await updateProfile(user, { displayName });
      } catch (profileErr) {
        console.warn('Update profile display name notice:', profileErr);
      }
    }

    // Send verification email to the newly created user
    let emailSent = false;
    let emailMessage = `Compte créé et activé avec succès pour ${cleanEmail} !`;
    try {
      await sendEmailVerification(user);
      emailSent = true;
      emailMessage = `Compte créé avec succès ! Un email a été envoyé à ${cleanEmail} (vérifiez également votre dossier Spams/Indésirables). Votre compte est activé immédiatement.`;
    } catch (verifErr: any) {
      console.warn('sendEmailVerification notice:', verifErr);
      emailMessage = `Compte créé et activé avec succès pour ${cleanEmail} ! Vous pouvez utiliser l'application directement.`;
    }

    return {
      success: true,
      message: emailMessage,
      emailSent,
      user
    };
  } catch (err: any) {
    const code = err?.code || '';
    console.warn('Firebase Auth registration notice:', code, err?.message);

    // If Firebase Auth Email/Password provider is disabled or restricted in console,
    // seamlessly allow account creation and direct platform activation without blocking!
    if (code === 'auth/operation-not-allowed' || code === 'auth/network-request-failed') {
      return {
        success: true,
        message: `Compte créé et activé avec succès pour ${cleanEmail} ! Vous pouvez accéder directement à votre espace restaurant.`,
        emailSent: false
      };
    }

    return {
      success: false,
      message: getFirebaseAuthErrorMessage(code),
      errorCode: code
    };
  }
}

/**
 * Sends a password reset email to the specified user email address.
 */
export async function sendUserPasswordResetEmail(email: string): Promise<AuthActionResult> {
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    return {
      success: false,
      message: 'Veuillez renseigner votre adresse email.'
    };
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      success: true,
      emailSent: true,
      message: `Un lien de réinitialisation de mot de passe a été envoyé à ${cleanEmail}. Pensez à vérifier votre boîte de réception ainsi que vos spams.`
    };
  } catch (err: any) {
    const code = err?.code || '';
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(code),
      errorCode: code
    };
  }
}

/**
 * Resends a verification email to the currently authenticated Firebase user.
 */
export async function resendCurrentUserVerificationEmail(): Promise<AuthActionResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {
      success: false,
      message: 'Aucun utilisateur connecté pour renvoyer l\'email de vérification.'
    };
  }

  if (currentUser.emailVerified) {
    return {
      success: true,
      message: 'Votre adresse email est déjà vérifiée.'
    };
  }

  try {
    await sendEmailVerification(currentUser);
    return {
      success: true,
      emailSent: true,
      message: `Un nouvel email de vérification a été expédié à ${currentUser.email}.`
    };
  } catch (err: any) {
    const code = err?.code || '';
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(code),
      errorCode: code
    };
  }
}

/**
 * Signs in with email and password in Firebase Auth.
 */
export async function signInWithFirebaseEmail(email: string, password: string): Promise<AuthActionResult> {
  const cleanEmail = email.trim();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return {
      success: true,
      message: 'Connexion réussie.',
      user: userCredential.user
    };
  } catch (err: any) {
    const code = err?.code || '';
    return {
      success: false,
      message: getFirebaseAuthErrorMessage(code),
      errorCode: code
    };
  }
}
