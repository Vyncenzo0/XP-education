import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAK8nZ81E9KOZSIAk_9BJKVvsZ98SL6-ns",
  authDomain: "it-mastery-c0662.firebaseapp.com",
  projectId: "it-mastery-c0662",
  storageBucket: "it-mastery-c0662.firebasestorage.app",
  messagingSenderId: "22298687004",
  appId: "1:22298687004:web:b021a0b020659b0d1791d9"
};

let app: FirebaseApp | undefined;
let auth: Auth | any;
let db: Firestore | any;
let isInitialized = false;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  // Initialize Firebase Authentication
  auth = getAuth(app);
  // Use the specific database ID from config if defined and not "(default)"
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  db = dbId && dbId !== "(default)" ? getFirestore(app, dbId) : getFirestore(app);
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
