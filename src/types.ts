export type ActiveLab = "idle" | "pcbuilder" | "rj45" | "typing" | "patch" | "partsid" | "techsupport" | "pingtest";

export type GameStatus = "idle" | "playing" | "gameover";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  highScore: number;
  gamesPlayed: number;
  avgReactionTime: number;
  createdAt: any; // Firestore Timestamp or Date
  badges?: string[];
  studentId?: string;
}

export interface LeaderboardEntry {
  id: string;
  uid: string;
  displayName: string;
  score: number;
  reactionTimeAvg: number;
  timestamp: any; // Firestore Timestamp
}

export interface ActivePlayer {
  uid: string;
  displayName: string;
  status: "idle" | "playing" | "gameover";
  score: number;
  lastActive: any; // Firestore Timestamp
}

export interface GameTile {
  id: number;
  label: string;
}
