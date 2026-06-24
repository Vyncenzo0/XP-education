import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let app: FirebaseApp | undefined;
let auth: Auth | any;
let db: Firestore | any;
let isInitialized = false;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  // Initialize Firebase Authentication
  auth = getAuth(app);
  // Use the specific database ID from config as recommended by skill
  db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "(default)");
  isInitialized = true;
} catch (err) {
  console.error("Firebase initialization failed:", err);
  // Provide dummy objects to prevent module loading crashes
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => { cb(null); return () => {}; },
    signInWithEmailAndPassword: () => Promise.reject("Firebase not initialized"),
    createUserWithEmailAndPassword: () => Promise.reject("Firebase not initialized"),
    signOut: () => Promise.resolve(),
  } as any;
  db = {
    type: "dummy"
  } as any;
}

export { auth, db, isInitialized };
export default app;
