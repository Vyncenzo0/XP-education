import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isInitialized } from "./firebase";

/**
 * Registers a player as active in the database
 */
export async function registerPresence(uid: string, displayName: string, studentId?: string) {
  if (!isInitialized) return;
  try {
    const presenceRef = doc(db, "active_players", uid);
    await setDoc(presenceRef, {
      uid,
      displayName,
      studentId: studentId || "",
      status: "idle",
      score: 0,
      activeLab: "Lobby",
      lastActive: serverTimestamp()
    }, { merge: true });
    
    window.dispatchEvent(new CustomEvent("presence_update", {
      detail: { uid, status: "idle", score: 0 }
    }));
  } catch (error) {
    console.error("Error registering presence:", error);
  }
}

/**
 * Updates a player's active status and current score in real-time
 */
export async function updatePresenceStatus(
  uid: string,
  status: "idle" | "playing" | "gameover",
  score: number = 0,
  activeLab: string = "Lobby"
) {
  if (!isInitialized) return;
  try {
    const presenceRef = doc(db, "active_players", uid);
    await setDoc(presenceRef, {
      status,
      score,
      activeLab,
      lastActive: serverTimestamp()
    }, { merge: true });

    window.dispatchEvent(new CustomEvent("presence_update", {
      detail: { uid, status, score }
    }));
  } catch (error) {
    console.error("Error updating presence status:", error);
  }
}

/**
 * Updates only the lastActive timestamp to keep presence alive
 */
export async function heartbeat(uid: string) {
  if (!isInitialized) return;
  try {
    const presenceRef = doc(db, "active_players", uid);
    await setDoc(presenceRef, {
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    // Heartbeat failures are non-critical
  }
}

/**
 * Cleanly removes a player from the active player listing
 */
export async function removePresence(uid: string) {
  if (!isInitialized) return;
  try {
    const presenceRef = doc(db, "active_players", uid);
    await deleteDoc(presenceRef);
  } catch (error) {
    console.error("Error removing presence:", error);
  }
}


