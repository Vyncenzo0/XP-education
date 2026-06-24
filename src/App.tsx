import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { doc, getDocs, setDoc, query, where, collection, runTransaction, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Gamepad2, Award, Users, Target, Volume2, Sparkles, LogOut, Settings, Sliders, Smartphone, Monitor, Tv, Tablet, Sun, Moon, LayoutDashboard, User, MessageSquare } from "lucide-react";
import { auth, db, isInitialized } from "./lib/firebase";
import { registerPresence, removePresence, updatePresenceStatus, heartbeat } from "./lib/presence";
import { useTheme } from "./context/ThemeContext";
import { getCampusName } from "./lib/campus";
import { safeStorage } from "./lib/storage";

// Import custom sub components
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import VerifyPendingScreen from "./components/VerifyPendingScreen";
import Dashboard from "./components/Dashboard";
import GameConsole from "./components/GameConsole";
import Leaderboard from "./components/Leaderboard";
import UserProfileStats from "./components/UserProfileStats";
import PresenceList from "./components/PresenceList";
import FeedbackForm from "./components/FeedbackForm";
import FeedbackAdminView from "./components/FeedbackAdminView";
import { ActiveLab } from "./types";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<{ uid: string; displayName: string | null; studentId?: string; gmail?: string; emailVerified?: boolean } | null>(null);
  const [currentView, setCurrentView] = useState<"landing" | "auth" | "verify-pending">("landing");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>("");
  const [pendingVerificationPassword, setPendingVerificationPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [activeLab, setActiveLab] = useState<ActiveLab>("idle");
  const [pageView, setPageView] = useState<"dashboard" | "lobby" | "leaderboard" | "profile" | "options" | "admin">("dashboard");
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [simulatedDevice, setSimulatedDevice] = useState<"fluid" | "desktop" | "retro" | "tablet" | "phone">("fluid");
  const [deviceScale, setDeviceScale] = useState<number>(1);
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const [manualScale, setManualScale] = useState<number>(1);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Custom addition for settings saving status
  const [settingsDisplayName, setSettingsDisplayName] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error" | "invalid" | null; message: string | null }>({ type: null, message: null });
  const [savingDisplayName, setSavingDisplayName] = useState<boolean>(false);

  // Student ID editor states
  const [settingsCampusPrefix, setSettingsCampusPrefix] = useState<string>("CA");
  const [settingsStudentIdNumber, setSettingsStudentIdNumber] = useState<string>("");
  const [studentIdSaveStatus, setStudentIdSaveStatus] = useState<{ type: "success" | "error" | "invalid" | null; message: string | null }>({ type: null, message: null });
  const [savingStudentId, setSavingStudentId] = useState<boolean>(false);

  const isRealMobile = windowSize.width < 768;
  const effectiveDevice = isRealMobile ? "fluid" : simulatedDevice;

  // Track settings matching user details
  useEffect(() => {
    if (user && user.displayName) {
      setSettingsDisplayName(user.displayName);
    } else {
      setSettingsDisplayName("");
    }
    if (user && user.studentId) {
      setSettingsCampusPrefix(user.studentId.substring(0, 2));
      setSettingsStudentIdNumber(user.studentId.substring(2));
    } else {
      setSettingsCampusPrefix("CA");
      setSettingsStudentIdNumber("");
    }
    setSaveStatus({ type: null, message: null });
    setStudentIdSaveStatus({ type: null, message: null });
  }, [user]);

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // One-time automatic factory reset/purge to ensure standard fresh start on load
  useEffect(() => {
    try {
      const isCleaned = safeStorage.getItem("it_mastery_first_time_fresh_start_v2");
      if (!isCleaned) {
        const purgeSession = async () => {
          try {
            await signOut(auth);
          } catch (e) {}
          try {
            safeStorage.clearMatching(() => true);
            sessionStorage.clear();
          } catch (e) {}
          
          // Check if we actually have persistent local storage
          const hasPersistentLocalStorage = ((): boolean => {
             try {
                const test = "__reload_test__";
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
             } catch (e) {
                return false;
             }
          })();

          safeStorage.setItem("it_mastery_first_time_fresh_start_v2", "true");
          
          if (hasPersistentLocalStorage) {
            window.location.reload();
          } else {
            console.warn("Storage restricted - skipping page reload to prevent refresh loops");
          }
        };
        purgeSession();
      }
    } catch (err) {
      console.warn("Could not check local storage", err);
    }
  }, []);

  const DEVICE_SIZES = {
    desktop: { w: 1024, h: 680, name: "16:9 Desktop Monitor" },
    retro: { w: 896, h: 620, name: "4:3 CRT Terminal" },
    tablet: { w: 768, h: 760, name: "3:4 Tablet Screen" },
    phone: { w: 375, h: 680, name: "9:19.5 Smartphone" },
  };

  // Compute dynamic scale factor based on simulated device size vs available window viewport sizes
  useEffect(() => {
    if (effectiveDevice === "fluid") {
      setDeviceScale(1);
      return;
    }

    if (!autoScale) {
      setDeviceScale(manualScale);
      return;
    }

    const { w: devWidth, h: devHeight } = DEVICE_SIZES[effectiveDevice] || { w: 1024, h: 680 };

    // Subtract padding and margin offsets (leaving 48px side margins on broad screen, 240px for chrome/header)
    const availableWidth = Math.min(windowSize.width - 48, 1280);
    const availableHeight = windowSize.height - 240;

    const scaleX = availableWidth / devWidth;
    const scaleY = availableHeight / devHeight;

    const fitScale = Math.min(scaleX, scaleY);
    // Snap/bound the auto-scale factor between 0.35 and 1.0 to prevent awkward proportions
    const finalScale = Math.max(0.35, Math.min(1.0, fitScale));
    setDeviceScale(finalScale);
  }, [effectiveDevice, windowSize, autoScale, manualScale]);

  // Authenticate monitor
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          const uid = firebaseUser.uid;
          const localKey = `xp_education_profile_${uid}`;
          const stored = safeStorage.getItem(localKey);
          let displayName = firebaseUser.displayName || "";
          let studentId = "";
          let gmail = firebaseUser.email || "";

          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              displayName = parsed.displayName || displayName || "";
              studentId = parsed.studentId || "";
              gmail = parsed.gmail || gmail;
            } catch (e) {}
          }

          if (!studentId && isInitialized) {
            try {
              const userDoc = await getDoc(doc(db, "users", uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                studentId = data.studentId || "";
                if (!displayName && data.displayName) displayName = data.displayName;
              }
            } catch (err) {
              console.warn("Firestore user fetch failed:", err);
            }
          }

          const displayNameToUse = (displayName && displayName !== "null") ? displayName : "";
          
          setUser({ 
            uid, 
            displayName: displayNameToUse, 
            studentId: studentId || "", 
            email: gmail || null,
            highScore: 0,
            gamesPlayed: 0,
            avgReactionTime: 0,
            createdAt: new Date().toISOString()
          } as any);

          const displayLabel = (displayNameToUse && displayNameToUse !== "null") ? displayNameToUse : (studentId || "Gamer Tag");
          await registerPresence(uid, displayLabel, studentId);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    } catch (err) {
      console.warn("Auth initialization failed. App is offline.", err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Presence heartbeat interval tracking
  useEffect(() => {
    if (!user || !isInitialized) return;

    // Refresh presence to keep online status active every 20 seconds
    const interval = setInterval(() => {
      heartbeat(user.uid);
    }, 20000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.uid]);

  const handleAuthSuccess = (uid: string, displayName: string) => {
    const localKey = `xp_education_profile_${uid}`;
    const stored = safeStorage.getItem(localKey);
    let studentId = "";
    let gmail = auth.currentUser?.email || "";
    let actualDisplayName = displayName;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        studentId = parsed.studentId || "";
        gmail = parsed.gmail || gmail;
        actualDisplayName = parsed.displayName || actualDisplayName || "";
      } catch (e) {}
    }

    setUser({ uid, displayName: actualDisplayName || null, studentId, gmail });
  };

  const handleLogout = async () => {
    if (user) {
      try {
        await removePresence(user.uid);
        await signOut(auth);
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
    setUser(null);
    setCurrentView("landing");
  };

  const handleSaveDisplayName = async (nameToSave: string) => {
    if (!user) return;
    setSavingDisplayName(true);
    setSaveStatus({ type: null, message: null });

    const trimmedName = nameToSave.trim();
    if (trimmedName !== "") {
      const regex = /^[a-zA-Z0-9 _\-]+$/;
      if (trimmedName.length < 2) {
        setSaveStatus({ type: "invalid", message: "Display name must be at least 2 characters." });
        setSavingDisplayName(false);
        return;
      }
      if (trimmedName.length > 24) {
        setSaveStatus({ type: "invalid", message: "Display name must be at most 24 characters." });
        setSavingDisplayName(false);
        return;
      }
      if (!regex.test(trimmedName)) {
        setSaveStatus({ type: "invalid", message: "Letters, numbers, spaces, _ and - only." });
        setSavingDisplayName(false);
        return;
      }

      // Check if taken in Firestore
      if (isInitialized) {
        try {
          const q = query(collection(db, "users"), where("displayName", "==", trimmedName));
          const querySnapshot = await getDocs(q);
          const isTakenByAnother = querySnapshot.docs.some(doc => doc.id !== user.uid);
          if (isTakenByAnother) {
            setSaveStatus({ type: "error", message: "That display name is already in use." });
            setSavingDisplayName(false);
            return;
          }
        } catch (firestoreErr) {
          console.warn("Firestore taken check bypassed/failed:", firestoreErr);
        }
      }
    }

    try {
      const displayNameToSave = trimmedName || null;
      
      // Update Firebase auth profile
      await updateProfile(auth.currentUser!, { displayName: displayNameToSave || "" });

      // Update Firestore user document
      if (isInitialized) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, {
            displayName: displayNameToSave,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("Firestore profile update failed:", e);
        }
      }

      // Update safeStorage item
      const localKey = `xp_education_profile_${user.uid}`;
      const stored = safeStorage.getItem(localKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.displayName = displayNameToSave;
          safeStorage.setItem(localKey, JSON.stringify(parsed));
        } catch (e) {}
      }

      // Update leaderboard entries with new display label
      const storedLeaderboard = safeStorage.getItem("xp_education_scores");
      if (storedLeaderboard) {
        try {
          const scoresList = JSON.parse(storedLeaderboard);
          const updatedScores = scoresList.map((entry: any) => {
            if (entry.uid === user.uid) {
              const match = entry.displayName.match(/^([^:]+:\s*)(.*)$/);
              if (match) {
                const prefix = match[1];
                return {
                  ...entry,
                  displayName: `${prefix}${displayNameToSave || user.studentId}`
                };
              }
            }
            return entry;
          });
          safeStorage.setItem("xp_education_scores", JSON.stringify(updatedScores));
        } catch (e) {
          console.error("Leaderboard scores rename failed:", e);
        }
      }

      // Update user state locally
      setUser(prev => prev ? { ...prev, displayName: displayNameToSave } : null);

      // Register new presence label
      const displayLabel = displayNameToSave || user.studentId || "Gamer Tag";
      await registerPresence(user.uid, displayLabel, user.studentId);

      // Dispatch event to keep profiles/adjacent components in sync
      window.dispatchEvent(new Event("storage_scores_updated"));

      setSaveStatus({ type: "success", message: "Display name updated." });
    } catch (saveErr) {
      console.error("Save display name process failed:", saveErr);
      setSaveStatus({ type: "error", message: "Failed to update display name." });
    } finally {
      setSavingDisplayName(false);
    }
  };

  const handleSaveStudentId = async (prefixPart: string, numberPart: string) => {
    if (!user) return;
    setSavingStudentId(true);
    setStudentIdSaveStatus({ type: null, message: null });

    const prefix = prefixPart || "CA";
    const cleanedNumber = numberPart.trim();
    const newStudentId = (prefix + cleanedNumber).toUpperCase();
    const currentStudentId = user.studentId || "";

    if (!cleanedNumber) {
      setStudentIdSaveStatus({ type: "invalid", message: "Student ID is required." });
      setSavingStudentId(false);
      return;
    }

    if (newStudentId.length !== 11) {
      setStudentIdSaveStatus({ type: "invalid", message: "Student ID must be exactly 11 characters." });
      setSavingStudentId(false);
      return;
    }

    const formatRegex = /^(CA|TA|AN|SU|SM|BI|CO)\d{9}$/;
    if (!formatRegex.test(newStudentId)) {
      setStudentIdSaveStatus({ type: "invalid", message: "Enter a valid Student ID. Format: CA202300001" });
      setSavingStudentId(false);
      return;
    }

    if (newStudentId === currentStudentId) {
      setStudentIdSaveStatus({ type: "invalid", message: "That is already your current Student ID." });
      setSavingStudentId(false);
      return;
    }

    try {
      // DUPLICATE PREVENTION: Use a Firestore transaction
      await runTransaction(db, async (transaction) => {
        const newIdDocRef = doc(db, "studentIds", newStudentId);
        const newIdDocSnap = await transaction.get(newIdDocRef);

        if (newIdDocSnap.exists()) {
          const claimData = newIdDocSnap.data();
          if (claimData && claimData.uid !== user.uid) {
            throw new Error("duplicate");
          }
        }

        // Release old ID claim
        if (currentStudentId) {
          const oldIdDocRef = doc(db, "studentIds", currentStudentId);
          transaction.delete(oldIdDocRef);
        }

        // Claim new ID
        transaction.set(newIdDocRef, { uid: user.uid });

        // Update user document
        const userDocRef = doc(db, "users", user.uid);
        transaction.update(userDocRef, {
          studentId: newStudentId,
          updatedAt: new Date().toISOString()
        });
      });

      // Update safeStorage item
      const localKey = `xp_education_profile_${user.uid}`;
      const stored = safeStorage.getItem(localKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.studentId = newStudentId;
          safeStorage.setItem(localKey, JSON.stringify(parsed));
        } catch (e) {}
      }

      // Update leaderboard entries fallback names
      const storedLeaderboard = safeStorage.getItem("xp_education_scores");
      if (storedLeaderboard) {
        try {
          const scoresList = JSON.parse(storedLeaderboard);
          const updatedScores = scoresList.map((entry: any) => {
            if (entry.uid === user.uid) {
              const match = entry.displayName.match(/^([^:]+:\s*)(.*)$/);
              if (match) {
                const pfx = match[1];
                const scoreName = match[2];
                if (/^(CA|TA|AN|SU|SM|BI|CO)\d{9}$/i.test(scoreName) || scoreName === currentStudentId) {
                  return {
                    ...entry,
                    displayName: `${pfx}${user.displayName || newStudentId}`
                  };
                }
              }
            }
            return entry;
          });
          safeStorage.setItem("xp_education_scores", JSON.stringify(updatedScores));
        } catch (e) {
          console.error("Leaderboard scores studentId update failed:", e);
        }
      }

      // Update user state locally
      setUser((prev) => (prev ? { ...prev, studentId: newStudentId } : null));

      // Re-register presence label
      const displayLabel = user.displayName || newStudentId;
      await registerPresence(user.uid, displayLabel, newStudentId);

      // Dispatch events to keep adjacent components in-sync
      window.dispatchEvent(new Event("storage_scores_updated"));
      window.dispatchEvent(new Event("presence_update"));

      setStudentIdSaveStatus({ type: "success", message: "Student ID updated." });
    } catch (err: any) {
      console.error("Student ID update failed:", err);
      if (err.message === "duplicate") {
        setStudentIdSaveStatus({
          type: "error",
          message: "That Student ID is already in use by another account."
        });
      } else {
        setStudentIdSaveStatus({
          type: "error",
          message: "Failed to update Student ID. Please try again."
        });
      }
    } finally {
      setSavingStudentId(false);
    }
  };

  // Triggered when a game round successfully ends. Refreshes local statistics.
  const handleGameEnd = () => {
    setRefreshTrigger((prev) => prev + 1);
    setIsGameActive(false);
  };

  const handleGameStart = () => {
    setIsGameActive(true);
  };

  const renderInteractiveWorkspace = () => {
    return (
      <AnimatePresence mode="wait">
        {!user ? (
          currentView === "verify-pending" ? (
            <motion.div
              id="verify-pending-wrapper"
              key="verify-pending-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <VerifyPendingScreen
                email={pendingVerificationEmail}
                tempPassword={pendingVerificationPassword}
                onBackToLogin={async () => {
                  try {
                    await signOut(auth);
                  } catch (e) {
                    console.warn("Signout during pending back-to-login failed:", e);
                  }
                  setPendingVerificationEmail("");
                  setPendingVerificationPassword("");
                  setCurrentView("auth");
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              id="auth-wrapper"
              key="auth-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <AuthModal
                onSuccess={handleAuthSuccess}
                onBackToHome={() => setCurrentView("landing")}
              />
            </motion.div>
          )
        ) : (
          <motion.div
            id="dashboard-root"
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`space-y-6 w-full text-ink`}
          >
            {/* Header navbar area */}
            <div id="dashboard-navbar" className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg relative overflow-hidden shadow-sm border backdrop-blur-md transition-colors duration-300 bg-surface border-border`}>
              <div className="flex items-center gap-3 relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md transform rotate-3 flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-[20px] font-mono font-semibold tracking-[-0.01em] flex items-center text-ink`}>
                    <span>IT-MASTERY</span>
                  </h1>
                  <p className={`text-[13px] mt-0.5 max-w-sm sm:max-w-md text-muted font-sans font-normal`}>
                    Web-Based Interactive Gamification Platform for Enhancing Student Engagement in Foundational IT Concepts
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className={`text-[13px] font-sans font-normal text-ink`}>
                  Welcome, <span className="font-semibold text-ink">{user.displayName}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center justify-center">
                  {/* Theme Switcher Toggle Button */}
                  <button
                    onClick={toggleTheme}
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 h-8 w-8 bg-transparent border-border text-muted hover:text-signal hover:border-signal cursor-pointer`}
                    title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                  >
                    {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </button>

                  <button 
                    onClick={() => setPageView("dashboard")} 
                    title="Dashboard"
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 h-8 w-8 cursor-pointer ${
                      pageView === "dashboard"
                        ? "bg-transparent text-signal border-signal"
                        : "bg-transparent border-border text-muted hover:text-signal hover:border-signal"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  </button>

                  <button 
                    onClick={() => setPageView("lobby")} 
                    title="Active Lobby"
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 h-8 w-8 cursor-pointer ${
                      pageView === "lobby"
                        ? "bg-transparent text-signal border-signal"
                        : "bg-transparent border-border text-muted hover:text-signal hover:border-signal"
                    }`}
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                  </button>

                  <button 
                    onClick={() => setPageView("leaderboard")} 
                    title="Leaderboard"
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 h-8 w-8 cursor-pointer ${
                      pageView === "leaderboard"
                        ? "bg-transparent text-signal border-signal"
                        : "bg-transparent border-border text-muted hover:text-signal hover:border-signal"
                    }`}
                  >
                    <Award className="w-4 h-4 flex-shrink-0" />
                  </button>

                  <button 
                    onClick={() => setPageView("profile")} 
                    title="Profile"
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 h-8 w-8 cursor-pointer ${
                      pageView === "profile"
                        ? "bg-transparent text-signal border-signal"
                        : "bg-transparent border-border text-muted hover:text-signal hover:border-signal"
                    }`}
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                  </button>

                  <button 
                    onClick={() => setPageView("options")} 
                    title="Options"
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 h-8 w-8 cursor-pointer ${
                      pageView === "options"
                        ? "bg-transparent text-signal border-signal"
                        : "bg-transparent border-border text-muted hover:text-signal hover:border-signal"
                    }`}
                  >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                  </button>

                  <button 
                    onClick={() => setShowFeedbackModal(true)} 
                    title="Capstone Feedback"
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 h-8 w-8 cursor-pointer bg-transparent border-border text-muted hover:text-signal hover:border-signal`}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  </button>

                  {user.gmail === 'jvbinas055@gmail.com' && (
                    <button 
                      onClick={() => setPageView("admin")} 
                      title="Admin Dashboard"
                      className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 h-8 w-8 cursor-pointer ${
                        pageView === "admin"
                          ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50"
                          : "bg-transparent border-border text-muted hover:text-indigo-400 hover:border-indigo-400/50"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                    </button>
                  )}

                  <div className={`w-px h-4 mx-1 hidden sm:block `}></div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    title="Log Out"
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 h-8 w-8 bg-transparent border-border text-muted hover:text-danger hover:border-danger cursor-pointer`}
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* Feedback Modal Overlay */}
            <AnimatePresence>
              {showFeedbackModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="w-full max-w-lg"
                  >
                    <FeedbackForm 
                      uid={user.uid} 
                      displayName={user.displayName || user.studentId || "Gamer"} 
                      onClose={() => setShowFeedbackModal(false)} 
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
              {showLogoutConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="bg-surface border border-border p-6 rounded-xl shadow-2xl w-full max-w-sm text-ink backdrop-blur-xl"
                  >
                    <h2 className="text-xl font-medium mb-2 font-display text-signal">Log Out</h2>
                    <p className="text-muted text-sm mb-6">Are you sure you want to sign out from IT-MASTERY?</p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="px-4 py-2 rounded-xl border border-border bg-surface-raised text-muted hover:text-ink transition-colors text-sm font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowLogoutConfirm(false);
                          handleLogout();
                        }}
                        className="px-4 py-2 rounded-xl bg-danger-subtle hover:bg-danger text-danger hover:text-white border border-danger/25 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Page Content */}
            {pageView === "dashboard" ? (
              <div className="flex flex-col gap-6">
                <div className="w-full">
                  <GameConsole
                    uid={user.uid}
                    displayName={user.displayName}
                    onGameStart={handleGameStart}
                    onGameEnd={handleGameEnd}
                    activeLab={activeLab}
                    onSetActiveLab={setActiveLab}
                    onShowFeedback={() => setShowFeedbackModal(true)}
                  />
                </div>
              </div>
            ) : pageView === "lobby" ? (
              <div className="p-5 rounded-xl border backdrop-blur-md transition-all duration-300 bg-surface border-border text-ink">
                 <PresenceList currentUserId={user.uid} studentId={user.studentId} />
              </div>
            ) : pageView === "leaderboard" ? (
              <div className={`p-5 rounded-xl border backdrop-blur-md transition-all duration-300 bg-surface border-border text-ink`}>
                 <Leaderboard currentUserId={user.uid} key={`leadeboard-${refreshTrigger}`} />
              </div>
            ) : pageView === "profile" ? (
              <div className={`p-5 rounded-xl border backdrop-blur-md transition-all duration-300 bg-surface border-border text-ink`}>
                   <UserProfileStats
                    key={`profile-${refreshTrigger}`}
                    uid={user.uid}
                    displayName={user.displayName || ""}
                    studentId={user.studentId}
                    activeLab={activeLab}
                  />
              </div>
            ) : pageView === "admin" ? (
              <div className="py-6">
                <FeedbackAdminView />
              </div>
            ) : (
              <div className="p-6 rounded-xl space-y-6 border backdrop-blur-md transition-all duration-300 bg-surface border-border text-ink">
                <div>
                  <h2 className="text-xl font-sans font-medium flex items-center gap-2 text-signal">
                    <Settings className="w-5 h-5 text-indigo-500" />
                    Preferences & Viewport Simulators
                  </h2>
                  <p className="text-xs mt-1 text-muted">
                    Control how the workspace renders and behaves on your display. Simulate different terminal form factors and layout constraints.
                  </p>
                </div>

                {/* ACCOUNT SECTION (EDITABLE & FULL-VALUE READ-ONLYS) */}
                <div id="settings-account-block" className="p-4 border border-border bg-surface-raised space-y-4 rounded-[4px]">
                  <h3 className="text-[13px] font-mono font-medium uppercase tracking-[0.04em] text-signal">ACCOUNT</h3>
                  
                  <div className="space-y-4 font-sans text-left">
                    {/* GMAIL */}
                    <div id="settings-gmail-row" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                      <div>
                        <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-muted block">GMAIL ADDRESS</span>
                        <span className="text-sm font-sans text-muted mt-0.5 block">{user?.gmail || auth.currentUser?.email || "N/A"}</span>
                      </div>
                      <span className="text-[10px] font-mono font-medium uppercase tracking-[0.06em] px-2 py-0.5 rounded border bg-surface border-border text-muted inline-flex items-center align-middle h-fit w-fit">
                        [ PRIVATE ]
                      </span>
                    </div>

                    {/* STUDENT ID */}
                    <div id="settings-student-id-row" className="space-y-2 border-b border-border pb-3">
                      <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-muted block">STUDENT ID</span>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 flex items-center border border-border bg-surface rounded-[3px] overflow-hidden">
                          {/* Campus Prefix List */}
                          <select
                            value={settingsCampusPrefix}
                            onChange={(e) => setSettingsCampusPrefix(e.target.value)}
                            className="bg-surface-raised border-r border-border text-ink font-mono px-2 py-2 text-[14px] outline-none font-semibold uppercase appearance-none text-center min-w-[50px] focus:bg-surface"
                          >
                            <option value="CA">CA</option>
                            <option value="TA">TA</option>
                            <option value="AN">AN</option>
                            <option value="SU">SU</option>
                            <option value="SM">SM</option>
                            <option value="BI">BI</option>
                            <option value="CO">CO</option>
                          </select>
                          {/* Editable Number portion */}
                          <input
                            type="text"
                            maxLength={9}
                            value={settingsStudentIdNumber}
                            onChange={(e) => {
                              setSettingsStudentIdNumber(e.target.value.replace(/[^0-9]/g, ""));
                            }}
                            placeholder="202300001"
                            style={{ userSelect: "text", pointerEvents: "auto" }}
                            className="flex-1 py-1.5 px-3 text-[14px] font-mono bg-surface text-ink outline-none border-none tracking-normal"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={savingStudentId}
                          onClick={() => handleSaveStudentId(settingsCampusPrefix, settingsStudentIdNumber)}
                          className="px-4 py-2 bg-signal hover:bg-signal-hover text-white font-mono font-medium text-xs rounded-[3px] transition duration-200 uppercase cursor-pointer disabled:opacity-50 h-[38px] sm:h-auto"
                        >
                          {savingStudentId ? "SAVING..." : "SAVE"}
                        </button>
                      </div>

                      {/* Helper texts & errors */}
                      <div className="space-y-1">
                        {studentIdSaveStatus.message && (
                          <div 
                            className="text-[12px] font-sans inline-block"
                            style={{ color: studentIdSaveStatus.type === "success" ? "var(--success)" : "var(--danger)" }}
                          >
                            {studentIdSaveStatus.message}
                          </div>
                        )}
                        <p className="text-[12px] font-sans italic text-muted leading-tight mt-1">
                          "Your Student ID is private and never shown to other players."
                        </p>
                      </div>
                    </div>

                    {/* CAMPUS */}
                    <div id="settings-campus-row" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                      <div>
                        <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-muted block">CAMPUS</span>
                        <span className="text-sm font-sans text-ink mt-0.5 block">{getCampusName(user?.studentId)}</span>
                      </div>
                      <span className="text-[10px] font-mono font-medium uppercase tracking-[0.06em] px-2 py-0.5 rounded border bg-surface border-border text-muted inline-flex items-center align-middle h-fit w-fit">
                        [ READ ONLY ]
                      </span>
                    </div>

                    {/* DISPLAY NAME */}
                    <div id="settings-display-name-row" className="space-y-2">
                      <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-muted block">DISPLAY NAME</span>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            maxLength={24}
                            value={settingsDisplayName}
                            onChange={(e) => {
                              setSettingsDisplayName(e.target.value);
                            }}
                            placeholder="Enter your display name"
                            className="w-full rounded-[3px] py-2 px-3 pr-16 text-sm font-sans border border-border bg-surface text-ink focus:outline-none focus:border-signal"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-muted">
                            {settingsDisplayName.length} / 24
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={savingDisplayName}
                          onClick={() => handleSaveDisplayName(settingsDisplayName)}
                          className="px-4 py-2 bg-signal hover:bg-signal-hover text-white font-mono font-medium text-xs rounded-[3px] transition duration-200 uppercase cursor-pointer disabled:opacity-50"
                        >
                          {savingDisplayName ? "SAVING..." : "SAVE"}
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-muted tracking-wide mt-1">
                        Shown on leaderboards and in-lab.
                      </p>

                      {/* SAVE DISPLAY NAME FEEDBACK FIELDS */}
                      {saveStatus.type === "success" && (
                        <p className="text-[12px] font-sans text-success font-medium mt-1">
                          {saveStatus.message}
                        </p>
                      )}
                      {(saveStatus.type === "error" || saveStatus.type === "invalid") && (
                        <p className="text-[12px] font-sans text-danger font-medium mt-1 font-sans">
                          {saveStatus.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mode Selector Toggle Section */}
                <div className={`p-4 rounded-xl border bg-surface-raised border-border`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xs font-mono font-medium tracking-widest uppercase text-signal`}>Visual Appearance Theme</h3>
                      <p className={`text-[11px] mt-0.5 text-muted`}>Select your preferred lighting style for learning exercises</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-medium border bg-signal-subtle border-border text-signal`}>
                      Active: {"Light Mode"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => theme === 'dark' && toggleTheme()}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                        theme === 'light'
                          ? "bg-signal-subtle border-signal text-signal font-medium"
                          : "bg-transparent border-border text-muted hover:border-border-strong hover:text-ink"
                      }`}
                    >
                      <Sun className="w-5 h-5 text-amber-500" />
                      <div className="text-left">
                        <div className="text-xs font-medium font-sans">Light Theme</div>
                        <div className="text-[10px] opacity-80 font-normal leading-tight">Crisp paper white style using royal primary blue colors</div>
                      </div>
                    </button>

                    <button
                      onClick={() => theme === 'light' && toggleTheme()}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                        theme === 'dark'
                          ? "bg-signal-subtle border-signal text-signal font-medium"
                          : "bg-transparent border-border text-muted hover:border-border-strong hover:text-ink"
                      }`}
                    >
                      <Moon className="w-5 h-5 text-sky-400" />
                      <div className="text-left">
                        <div className="text-xs font-medium font-sans">Dark Theme</div>
                        <div className="text-[10px] opacity-80 font-normal leading-tight">High-contrast slate black optimized for low light cabling labs</div>
                      </div>
                    </button>
                  </div>
                </div>

                {isRealMobile ? (
                  <div className={`border p-4 rounded-xl text-xs flex items-start gap-2.5 bg-warning-subtle border-warning text-warning`}>
                    <span className="text-base">⚠️</span>
                    <div>
                      <strong className={`block `}>Mobile Device Detected</strong>
                      The viewport simulator is disabled when viewing natively from a physical smartphone or compact tablet, running in full adaptive "fluid" layout for optimal touch usability. Visit this tab on a desktop browser to unlock simulated hardware device wrappers!
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Simulator Toggle Section */}
                    <div className={`border p-4 rounded-xl space-y-4 bg-surface-raised border-border`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-xs font-mono font-medium tracking-widest uppercase text-signal`}>Device Viewport Presets</h3>
                          <p className={`text-[11px] mt-0.5 text-muted`}>Select a target screen layout to practice on</p>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-medium border bg-signal-subtle border-border text-signal`}>
                          Active: {simulatedDevice}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {[
                          { id: "fluid", label: "Fluid Full", icon: <Monitor className="w-4 h-4 text-emerald-405" />, desc: "Default layout stretching across your entire window" },
                          { id: "desktop", label: "16:9 PC", icon: <Monitor className="w-4 h-4 text-cyan-405" />, desc: "Simulated 1024x680 personal computer monitor style" },
                          { id: "retro", label: "4:3 CRT", icon: <Tv className="w-4 h-4 text-purple-405" />, desc: "Classic classroom console with screen boundary box" },
                          { id: "tablet", label: "3:4 iPad", icon: <Tablet className="w-4 h-4 text-sky-405" />, desc: "High density simulated portable tablet layout" },
                          { id: "phone", label: "9:19.5 Mobile", icon: <Smartphone className="w-4 h-4 text-pink-405" />, desc: "Compact smartphone frame representing handheld console" }
                        ].map((dev) => (
                          <button
                            key={dev.id}
                            onClick={() => setSimulatedDevice(dev.id as any)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between gap-2.5 ${
                              simulatedDevice === dev.id
                                ? "font-medium bg-signal-subtle border-border text-signal"
                                : "bg-surface-raised border-border text-muted hover:text-signal hover:border-signal"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full font-sans">
                              <span className={`font-medium text-xs ${simulatedDevice === dev.id ? "text-signal" : "text-ink"}`}>{dev.label}</span>
                              {dev.icon}
                            </div>
                            <span className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">{dev.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scale Controls Section */}
                    {simulatedDevice !== "fluid" && (
                      <div className={`border p-4 rounded-xl space-y-4 bg-surface-raised border-border text-ink`}>
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-border`}>
                          <div>
                            <h3 className={`text-xs font-mono font-medium tracking-widest uppercase text-signal`}>Scale Adjustments</h3>
                            <p className="text-[11px] text-stone-500 mt-0.5">Scale simulated ratios up or down to fit your browser height</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            <button
                              onClick={() => setAutoScale(true)}
                              className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-medium transition-all cursor-pointer border ${
                                autoScale
                                  ? "font-medium bg-signal-subtle border-border text-signal"
                                  : "bg-surface-raised border-border text-muted hover:text-signal"
                              }`}
                            >
                              Auto-fit ({Math.round(deviceScale * 100)}%)
                            </button>
                            <button
                              onClick={() => {
                                setAutoScale(false);
                                setManualScale(Math.round(deviceScale * 20) / 20); // Snap nearest 5%
                              }}
                              className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-medium transition-all cursor-pointer border ${
                                !autoScale
                                  ? "font-medium bg-signal-subtle border-border text-signal"
                                  : "bg-surface-raised border-border text-muted hover:text-signal"
                              }`}
                            >
                              Manual Custom
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-5 justify-between py-1">
                          <div className="space-y-1 w-full md:w-3/5">
                            <span className="text-[10px] text-stone-500 font-mono block">Viewport Ratio Profile Info:</span>
                            <p className="text-xs leading-relaxed text-stone-500">
                              Currently simulating a <span className={`font-medium text-signal`}>
                                {simulatedDevice === "desktop" ? "16:9 PC Monitor" : 
                                 simulatedDevice === "retro" ? "4:3 CRT Terminal" : 
                                 simulatedDevice === "tablet" ? "3:4 iPad Screen" : 
                                 simulatedDevice === "phone" ? "9:19.5 Mobile Smartphone" : ""}
                              </span>.
                              {autoScale 
                                ? ` Since Auto-Fit is enabled, the virtual screen is automatically scaled down to ${Math.round(deviceScale * 100)}% of its native width/height to perfectly align inside your remaining viewport frame.`
                                : ` Zoom controls allow you to step the multiplier magnification level manually. The device box scale factor is set to ${Math.round(manualScale * 100)}%.`
                              }
                            </p>
                          </div>

                          {!autoScale && (
                            <div className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 w-full md:w-auto border bg-surface border-border`}>
                              <span className="text-[10px] font-mono text-stone-500 uppercase">Scale Factor Selection</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setManualScale(prev => Math.max(0.35, +(prev - 0.05).toFixed(2)))}
                                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer transition border font-sans bg-surface-raised border-border text-muted hover:text-signal`}
                                  title="Zoom Out"
                                >
                                  -
                                </button>
                                <span className={`font-mono text-base font-medium min-w-[64px] text-center px-3 py-1.5 border rounded-lg bg-surface-raised border-border text-signal`}>
                                  {Math.round(manualScale * 100)}%
                                </span>
                                <button
                                  onClick={() => setManualScale(prev => Math.min(1.2, +(prev + 0.05).toFixed(2)))}
                                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer transition border font-sans bg-surface-raised border-border text-muted hover:text-signal`}
                                  title="Zoom In"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Information guidelines */}
                <div className={`border-t pt-5 space-y-2 border-border`}>
                  <h3 className={`text-xs font-mono font-medium tracking-widest uppercase text-signal`}>About Simulator Viewports</h3>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                    By testing different physical layouts, you ensure the computer-assisted laboratory exercises and modular network switches render beautifully for students regardless of monitor hardware. Configured aspect overrides are applied globally across current active dashboard layers.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (loading) {
    return (
      <div id="loader-screen" className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white relative">
        <div className="absolute top-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative flex items-center justify-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-2 border-stone-800 border-t-cyan-400 rounded-full"
          />
          <Gamepad2 className="w-6 h-6 text-cyan-400 absolute" />
        </div>
        
        <h2 className="text-sm font-sans tracking-wide text-stone-400 uppercase font-medium animate-pulse">
          Loading IT-MASTERY...
        </h2>
      </div>
    );
  }

  if (!user && currentView === "landing") {
    return <LandingPage onEnterPortal={() => setCurrentView("auth")} />;
  }

  return (
    <div id="app-container" className={`min-h-screen bg-surface-raised text-ink font-sans selection:bg-cyan-500 selection:text-stone-900 overflow-y-auto p-3 md:p-6 lg:p-8 flex flex-col items-center justify-start gap-4 w-full`}>
      
      {/* Minimal active simulator indicator */}
      {user && effectiveDevice !== "fluid" && (
        <div id="simulated-device-indicator-banner" className="w-full max-w-7xl px-4 py-2.5 bg-stone-900/40 border border-stone-800/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-stone-300">
              Active Screen Setup: <strong className="text-cyan-400">{effectiveDevice === "desktop" ? "16:9 PC" : effectiveDevice === "retro" ? "4:3 CRT" : effectiveDevice === "tablet" ? "3:4 iPad" : "9:19.5 Mobile"}</strong> ({Math.round(deviceScale * 100)}% scale)
            </span>
          </div>
          <button 
            onClick={() => setPageView("options")} 
            className="text-cyan-400 font-medium hover:text-cyan-300 transition cursor-pointer text-[10px] uppercase font-mono tracking-wider bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded"
          >
            Configure Viewport in Options
          </button>
        </div>
      )}

      {/* Primary Workspace Stage Container */}
      {effectiveDevice === "fluid" ? (
        <div className="w-full max-w-7xl transition-all duration-300 relative space-y-6">
          {renderInteractiveWorkspace()}
        </div>
      ) : (() => {
        const { w: width, h: height, name } = DEVICE_SIZES[effectiveDevice] || { w: 1024, h: 680, name: "" };
        const isPhone = effectiveDevice === "phone";
        const isTablet = effectiveDevice === "tablet";
        const borderPaddingStyle = isPhone 
          ? "border-[8px] border-stone-800/95 rounded-[2rem]" 
          : isTablet 
            ? "border-[8px] border-stone-800 rounded-[2rem]" 
            : "border-4 border-stone-800 rounded-xl";

        return (
          <div 
            id="simulated-device-outer-wrapper"
            className="flex flex-col items-center justify-start w-full overflow-hidden transition-all duration-300 py-3"
          >
            {/* Aspect Ratio Meta Header Badge */}
            <div className="flex items-center gap-2 mb-2 font-mono text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              <span>{name} ({width}x{height}px)</span>
              <span className="text-stone-700">•</span>
              <span className="text-cyan-500/80">Scaling: {Math.round(deviceScale * 100)}%</span>
            </div>

            {/* Scaling Viewport Outer Box */}
            <div
              className={`bg-stone-950 shadow-2xl relative transition-all duration-300 flex items-start justify-start overflow-hidden ${borderPaddingStyle}`}
              style={{
                width: `${width * deviceScale}px`,
                height: `${height * deviceScale}px`,
              }}
            >
              {/* Inner Scaled Application Stage */}
              <div
                id="scaled-application-viewport"
                className="absolute top-0 left-0 overflow-y-auto overflow-x-hidden p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-stone-800/80 [&::-webkit-scrollbar-thumb]:rounded-md [&::-webkit-scrollbar-track]:bg-transparent"
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  transform: `scale(${deviceScale})`,
                  transformOrigin: "top left",
                }}
              >
                {renderInteractiveWorkspace()}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
