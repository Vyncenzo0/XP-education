import { useState, useEffect } from "react";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, Loader2, AlertCircle } from "lucide-react";
import { auth, db } from "../lib/firebase";

// Specific OperationTypes for Firestore Error Reporting (mandatory as per firebase-integration skill)
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  throw new Error(JSON.stringify(errInfo));
}

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: (updatedData: { displayName: string; campus: string; studentId: string }) => void;
  onLater: () => void;
  userId: string;
}

const CAMPUSES = [
  { name: "Cainta", prefix: "CA" },
  { name: "Taytay", prefix: "TA" },
  { name: "Antipolo", prefix: "AN" },
  { name: "Sumulong", prefix: "SU" },
  { name: "San Mateo", prefix: "SM" },
  { name: "Binangonan", prefix: "BI" },
  { name: "Cogeo", prefix: "CO" }
];

export default function ProfileCompletionModal({ isOpen, onClose, onLater, userId }: ProfileCompletionModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [campus, setCampus] = useState("");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-set first campus prefix on load to make it look active, or keep it empty
  const selectedCampusObj = CAMPUSES.find((c) => c.name === campus);
  const campusPrefix = selectedCampusObj ? selectedCampusObj.prefix : "";

  // Block ESC key from dismissing the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    const nameTrimmed = displayName.trim();
    if (!nameTrimmed) {
      setError("Display Name is required.");
      return;
    }
    if (nameTrimmed.length < 2 || nameTrimmed.length > 50) {
      setError("Display Name must be between 2 and 50 characters.");
      return;
    }
    if (!campus) {
      setError("Please select a campus.");
      return;
    }
    if (!campusPrefix) {
      setError("Selected campus is invalid.");
      return;
    }

    const numberClean = studentIdNumber.trim();
    if (!numberClean) {
      setError("Student ID number is required.");
      return;
    }
    if (numberClean.length !== 9) {
      setError("Student ID number must be exactly 9 digits.");
      return;
    }
    if (!/^\d{9}$/.test(numberClean)) {
      setError("Student ID number must contain only digits.");
      return;
    }

    const newStudentId = (campusPrefix + numberClean).toUpperCase();

    setLoading(true);

    const userDocPath = `users/${userId}`;
    try {
      // DUPLICATE PREVENTION: Secure Firestore Transaction for user and student ID claims
      await runTransaction(db, async (transaction) => {
        const studentIdDocRef = doc(db, "studentIds", newStudentId);
        const studentIdSnap = await transaction.get(studentIdDocRef);

        if (studentIdSnap.exists()) {
          const claimData = studentIdSnap.data();
          if (claimData && claimData.uid !== userId) {
            throw new Error("This Student ID is already registered by another student. Please double check.");
          }
        }

        const userDocRef = doc(db, "users", userId);
        const userSnap = await transaction.get(userDocRef);

        if (!userSnap.exists()) {
          throw new Error("User profile document not found. Try logging in again.");
        }

        // Set the unique student ID ownership
        transaction.set(studentIdDocRef, { uid: userId });

        // Update the user profile
        transaction.update(userDocRef, {
          displayName: nameTrimmed,
          campus: campus,
          studentId: newStudentId,
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
        });
      });

      // Update local storage configuration
      const localKey = `xp_education_profile_${userId}`;
      try {
        const stored = localStorage.getItem(localKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.studentId = newStudentId;
          parsed.displayName = nameTrimmed;
          localStorage.setItem(localKey, JSON.stringify(parsed));
        }
      } catch (err) {
        console.warn("Could not sync local storage:", err);
      }

      onClose({ displayName: nameTrimmed, campus, studentId: newStudentId });
    } catch (err: any) {
      console.error("Profile completion failed:", err);
      let userFriendlyMessage = "Connection failed. Please check your network and try again.";
      if (err instanceof Error) {
        userFriendlyMessage = err.message;
      }
      setError(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="profile-completion-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md"
      >
        <motion.div
          id="profile-completion-card"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-md bg-[#1a1f36] border border-[#374151] rounded-xl shadow-2xl overflow-hidden p-6 text-white"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-full mb-3 text-blue-500">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-1">
              Complete Your Profile
            </h2>
            <p className="text-xs text-slate-400">
              Enter your name, campus, and student ID to unlock laboratory simulations and rank on leaderboards.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* DISPLAY NAME */}
            <div>
              <label 
                htmlFor="display-name-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                DISPLAY NAME
              </label>
              <input
                id="display-name-input"
                type="text"
                placeholder="e.g., Juan Dela Cruz"
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 font-sans"
              />
            </div>

            {/* CAMPUS */}
            <div>
              <label 
                htmlFor="campus-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                CAMPUS
              </label>
              <select
                id="campus-select"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 cursor-pointer font-sans"
              >
                <option value="" className="text-slate-500">Select Campus</option>
                {CAMPUSES.map((c) => (
                  <option key={c.name} value={c.name} className="bg-[#1a1f36] text-white">
                    {c.name} ({c.prefix})
                  </option>
                ))}
              </select>
            </div>

            {/* STUDENT ID */}
            <div>
              <label 
                htmlFor="student-id-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                STUDENT ID
              </label>
              <div className="relative flex items-center bg-[#111827] border border-[#374151] rounded-lg overflow-hidden">
                {/* Prefix block - responds to campus */}
                <span className="bg-[#1a1f36] text-blue-400 font-mono text-sm px-3.5 py-2.5 font-bold uppercase select-none border-r border-[#374151] min-w-[55px] text-center">
                  {campusPrefix || "--"}
                </span>
                
                {/* ID number portion */}
                <input
                  id="student-id-input"
                  type="text"
                  maxLength={9}
                  placeholder="202300001"
                  value={studentIdNumber}
                  onChange={(e) => setStudentIdNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  disabled={loading}
                  className="w-full px-4 py-2.5 text-white placeholder-slate-500 text-sm font-mono focus:outline-none bg-[#111827] disabled:opacity-50"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-sans italic">
                Format: {campusPrefix || "CA"}202300001 (Select campus first)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                id="profile-error-banner"
                className="p-3 bg-[#7f1d1d]/40 border border-red-500/30 text-red-250 text-xs rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Buttons Group */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="complete-profile-later-btn"
                type="button"
                onClick={onLater}
                disabled={loading}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-transparent hover:bg-slate-800/40 border border-slate-700 text-slate-300 hover:text-white font-medium rounded-lg text-xs tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 uppercase text-center"
              >
                Update Later
              </button>
              <button
                id="complete-profile-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full sm:w-1/2 flex items-center justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg text-xs tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
