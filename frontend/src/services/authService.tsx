import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

export const loginUser = async (email: string, password: string) => {
  await signOut(auth);
  localStorage.removeItem("token");
  localStorage.removeItem("token_uid");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("user_email");

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const { user } = userCredential;

  if (!user.emailVerified) {
    throw new Error(
      "Email is not verified. Please verify your email before logging in.",
    );
  }

  const idToken = await user.getIdToken();
  localStorage.setItem("token", idToken);
  localStorage.setItem("token_uid", user.uid);
  localStorage.setItem("user_email", user.email || email);

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
