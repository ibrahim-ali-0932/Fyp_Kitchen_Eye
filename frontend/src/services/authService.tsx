import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase"; // use initialized app

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // Check if email is verified
  if (!user.emailVerified) {
    throw new Error(
      "Email is not verified. Please verify your email before logging in."
    );
  }

  // Get the ID token
  const idToken = await user.getIdToken();

  return { idToken, user };
};

export const signup = async (email: string, password: string) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(user);
  await signOut(auth);
  return { needsVerification: true };
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};
