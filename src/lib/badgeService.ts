import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db, isInitialized } from "./firebase";
import { safeStorage } from "./storage";

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
}

export interface UniqueSVGBadge {
  uid: string;
  labId: string;
  badgeName: string;
  svgIcon: string;
  earnedAt: string;
}

function generatePerfectBadgeSVG(labTitle: string): string {
  const safeId = labTitle.replace(/\s+/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <defs>
    <linearGradient id="grad-${safeId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
    <filter id="glow-${safeId}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <path d="M100 15 L175 45 L175 110 C175 155 140 180 100 190 C60 180 25 155 25 110 L25 45 Z" 
        fill="url(#grad-${safeId})" filter="url(#glow-${safeId})"/>
  <path d="M100 15 L175 45 L175 110 C175 155 140 180 100 190 C60 180 25 155 25 110 L25 45 Z" 
        fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>
  <circle cx="100" cy="70" r="25" fill="rgba(255,255,255,0.2)" />
  <path d="M85 70 L95 80 L120 55" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  <text x="100" y="125" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="white" tracking="widest" text-anchor="middle">PERFECT</text>
  <text x="100" y="145" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="rgba(255,255,255,0.9)" text-anchor="middle" opacity="0.9">${labTitle.toUpperCase()}</text>
</svg>`;
}

export async function grantUniqueSVGBadge(uid: string, activeLab: string) {
  if (!isInitialized) return null;
  try {
    const badgeId = `${uid}_${activeLab}`;
    const badgeRef = doc(db, "badges", badgeId);
    
    const badgeData: UniqueSVGBadge = {
      uid,
      labId: activeLab,
      badgeName: `${activeLab} Perfect Score`,
      svgIcon: generatePerfectBadgeSVG(activeLab),
      earnedAt: new Date().toISOString()
    };

    await setDoc(badgeRef, badgeData, { merge: true });
    return badgeData;
  } catch (err) {
    console.error("Error granting unique SVG badge:", err);
    return null;
  }
}

export async function fetchUserUniqueSVGBadges(uid: string): Promise<UniqueSVGBadge[]> {
  if (!isInitialized) return [];
  try {
    const q = query(collection(db, "badges"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UniqueSVGBadge);
  } catch (err) {
    console.error("Error fetching unique SVG badges:", err);
    return [];
  }
}

export const AVAILABLE_BADGES: Badge[] = [
  {
    id: "fastest_finger",
    name: "Fastest Finger",
    desc: "Complete a challenge with an average reaction time under 300ms.",
    icon: "Zap",
    color: "from-amber-400 via-orange-500 to-yellow-500 text-white"
  },
  {
    id: "night_owl",
    name: "Night Owl",
    desc: "Submit a laboratory score late at night (10 PM - 5 AM).",
    icon: "Moon",
    color: "from-indigo-600 via-purple-700 to-indigo-900 text-white"
  },
  {
    id: "early_bird",
    name: "Early Bird",
    desc: "Complete simulation exercises at dawn (5 AM - 9 AM).",
    icon: "Sun",
    color: "from-yellow-400 via-amber-400 to-orange-500 text-stone-900"
  },
  {
    id: "high_score_pro",
    name: "Cyber Alchemist",
    desc: "Earn 15,000+ points in any simulation lab course.",
    icon: "Trophy",
    color: "from-rose-500 via-red-600 to-pink-650 text-white"
  },
  {
    id: "sim_explorer",
    name: "Sysadmin Veteran",
    desc: "Perform 5 or more total simulation lab sessions.",
    icon: "Activity",
    color: "from-emerald-500 via-indigo-600/20 to-teal-650 text-white"
  },
  {
    id: "perfect_score",
    name: "Flawless Spec",
    desc: "Score a perfect 18,000+ points in any academy workbench.",
    icon: "Award",
    color: "from-purple-500 via-fuchsia-600 to-indigo-600 text-white"
  },
  {
    id: "perfect_lab_master",
    name: "Perfect Lab Master",
    desc: "Achieve a perfect score in any simulation lab.",
    icon: "CheckCircle2",
    color: "from-emerald-400 via-teal-500 to-green-600 text-white"
  }
];

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
}

/**
 * Validate connection on boot
 */
export async function testConnection() {
  if (!isInitialized) return false;
  try {
    const testDoc = doc(db, "meta", "connection_test");
    await getDoc(testDoc);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Calculate appropriate badges for an action and update Firestore
 */
export async function awardBadges(
  uid: string,
  displayName: string,
  score: number,
  avgReaction: number,
  activeLab: string,
  isPerfect?: boolean
): Promise<string[]> {
  const localProfileKey = `xp_education_profile_${uid}`;
  const storedProfile = safeStorage.getItem(localProfileKey);
  
  let gamesPlayed = 1;
  let currentBadges: string[] = [];
  
  if (storedProfile) {
    try {
      const parsed = JSON.parse(storedProfile);
      gamesPlayed = (parsed.gamesPlayed || 0) + 1;
      currentBadges = parsed.badges || [];
    } catch (e) {
      console.error(e);
    }
  }

  const newlyUnlocked: string[] = [...currentBadges];

  // 1. Fastest Finger: avgReaction < 300 ms and greater than 0
  if (avgReaction > 0 && avgReaction < 300 && !newlyUnlocked.includes("fastest_finger")) {
    newlyUnlocked.push("fastest_finger");
  }

  // 2. Night Owl: 10 PM - 5 AM
  const currentHour = new Date().getHours();
  if ((currentHour >= 22 || currentHour < 5) && !newlyUnlocked.includes("night_owl")) {
    newlyUnlocked.push("night_owl");
  }

  // 3. Early Bird: 5 AM - 9 AM
  if (currentHour >= 5 && currentHour < 9 && !newlyUnlocked.includes("early_bird")) {
    newlyUnlocked.push("early_bird");
  }

  // 4. Cyber Alchemist (15,000+ score)
  if (score >= 15000 && !newlyUnlocked.includes("high_score_pro")) {
    newlyUnlocked.push("high_score_pro");
  }

  // 5. Sysadmin Veteran (5+ games)
  if (gamesPlayed >= 5 && !newlyUnlocked.includes("sim_explorer")) {
    newlyUnlocked.push("sim_explorer");
  }

  // 6. Flawless Spec (18,000+ score)
  if (score >= 18000 && !newlyUnlocked.includes("perfect_score")) {
    newlyUnlocked.push("perfect_score");
  }

  // 7. Perfect Lab Master
  if (isPerfect) {
    if (!newlyUnlocked.includes("perfect_lab_master")) {
      newlyUnlocked.push("perfect_lab_master");
    }
    // Also grant the unique SVG badge
    await grantUniqueSVGBadge(uid, activeLab);
  }

  // Update Firestore
  if (isInitialized) {
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        uid,
        displayName,
        highScore: increment(0), // Placeholder if we wanted to only update if higher
        gamesPlayed: increment(1),
        avgReactionTime: avgReaction > 0 ? avgReaction : 0,
        badges: newlyUnlocked,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Error awarding badges in Firestore:", err);
    }
  }

  return newlyUnlocked;
}

/**
 * Fetch badges and stats directly from Firestore
 */
export async function fetchUserBadges(uid: string): Promise<string[]> {
  if (!isInitialized) return [];
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().badges || [];
    }
  } catch (err) {
    console.error("Error fetching user badges:", err);
  }
  return [];
}
