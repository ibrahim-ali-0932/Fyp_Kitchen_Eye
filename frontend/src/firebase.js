import { getAuth } from "firebase/auth";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZxmhMGMWQspOJ-5mvb9XzcUXUrJwyifU",
  authDomain: "kitchen-eye-f607f.firebaseapp.com",
  projectId: "kitchen-eye-f607f",
  storageBucket: "kitchen-eye-f607f.firebasestorage.app",
  messagingSenderId: "680623555246",
  appId: "1:680623555246:web:83a97dc62470853c72e33f",
  measurementId: "G-VKN355F72C",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }
}

// Initialize Auth (always available)
export const auth = getAuth(app);
