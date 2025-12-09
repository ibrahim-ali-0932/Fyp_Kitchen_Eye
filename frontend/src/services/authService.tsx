import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

export const loginUser = async (email: string, password: string) => {
  const auth = getAuth();

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
  const auth = getAuth();

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // Send email verification
  await sendEmailVerification(user);

  // Get the ID token
  const idToken = await user.getIdToken();

  return { idToken, user };
};
