import { ActiveLab } from "../types";
import GameConsole from "./GameConsole";
import Leaderboard from "./Leaderboard";
import UserProfileStats from "./UserProfileStats";
import PresenceList from "./PresenceList";
import { LogOut, Target, Settings, Award, Users, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import { maskStudentId } from "../utils/maskStudentId";

interface DashboardProps {
  user: { uid: string; displayName: string | null; studentId?: string; gmail?: string };
  isGameActive: boolean;
  activeLab: ActiveLab;
  setActiveLab: (lab: ActiveLab) => void;
  handleGameStart: () => void;
  handleGameEnd: () => void;
  setPageView: (view: "dashboard" | "lobby" | "leaderboard" | "profile" | "options") => void;
  pageView: "dashboard" | "lobby" | "leaderboard" | "profile" | "options";
  setShowLogoutConfirm: (show: boolean) => void;
  onShowFeedback: () => void;
  refreshTrigger: number;
}

export default function Dashboard({ 
  user, 
  isGameActive, 
  activeLab, 
  setActiveLab, 
  handleGameStart, 
  handleGameEnd,
  setPageView,
  pageView,
  setShowLogoutConfirm,
  onShowFeedback,
  refreshTrigger
}: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const [showSetupPrompt, setShowSetupPrompt] = useState<boolean>(true);

  const cleanDisplayName = (name: any) => {
    if (!name || name === "null" || String(name).trim() === "null") return "";
    return String(name).trim();
  };

  const displayGreeting = (user.displayName && user.displayName !== "null") 
    ? user.displayName 
    : (user.studentId && user.studentId !== "null" ? maskStudentId(user.studentId) : "Gamer");

  return (
    <motion.div
        id="dashboard-root"
        key="dashboard-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`space-y-6 w-full text-muted`}
    >
        {/* Header navbar area */}
        <div id="dashboard-navbar" className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-b p-4 rounded-xl relative overflow-hidden transition-colors duration-300 bg-surface border-border`}>
        <div className="flex items-center gap-3 relative">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 bg-signal`}>
            <Target className={`w-6 h-6 text-white`} />
            </div>
            <div>
            <h1 className="text-xl font-display font-medium tracking-tight text-ink flex items-center gap-1">
                IT-MASTERY
            </h1>
            <p className="text-xs text-muted mt-0.5 max-w-sm sm:max-w-md font-sans">
                Web-Based Interactive Gamification Platform for Enhancing Student Engagement in Foundational IT Concepts
            </p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className={`text-xs font-sans font-medium text-muted`}>
            Welcome, <span className={`text-signal font-medium`}>{displayGreeting}</span>
            </div>
                <div className="flex flex-wrap gap-1.5 items-center justify-center font-sans">
            <button onClick={() => setPageView("dashboard")} className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${pageView === "dashboard" ? ("text-ink") : ("bg-surface-raised text-ink hover:bg-surface-raised")}`}>Dashboard</button>
            <button onClick={() => setPageView("lobby")} className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${pageView === "lobby" ? ("text-ink") : ("bg-surface-raised text-ink hover:bg-surface-raised")}`}>Specialist Lobby</button>
            <button onClick={() => setPageView("leaderboard")} className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${pageView === "leaderboard" ? ("text-ink") : ("bg-surface-raised text-ink hover:bg-surface-raised")}`}>Academy Rankings</button>
            <button onClick={() => setPageView("profile")} className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${pageView === "profile" ? ("text-ink") : ("bg-surface-raised text-ink hover:bg-surface-raised")}`}>Service Dossier</button>
            <button onClick={() => setPageView("options")} className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${pageView === "options" ? ("text-ink") : ("bg-surface-raised text-ink hover:bg-surface-raised")}`}>System Configuration</button>
            <div className={`w-px h-4 bg-border mx-1 hidden sm:block`}></div>
            <button
                onClick={() => setShowLogoutConfirm(true)}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 border rounded-md text-sm font-medium transition duration-200 cursor-pointer bg-surface border-border text-muted hover:bg-surface-raised hover:bg-signal-subtle`}
                title="Log Out"
            >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
            </button>
            </div>
        </div>
        </div>

        {/* First Login Setup Display Name Prompt */}
        <AnimatePresence>
          {!user.displayName && showSetupPrompt && pageView === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-signal bg-signal-subtle rounded-[4px] text-ink"
            >
              <div className="space-y-1 font-sans text-left">
                <span className="text-[13px] font-mono font-semibold uppercase tracking-[0.04em] text-signal block">IDENTITY SETUP REQUESTED</span>
                <p className="text-sm text-body">
                  You haven't configured a custom display name yet. Students are greeted by their verified Student ID (<span className="font-mono text-xs font-semibold">{user.studentId}</span>) on boards.
                </p>
              </div>
              <div className="flex gap-2.5 items-center w-full sm:w-auto shrink-0 font-mono">
                <button
                  onClick={() => setPageView("options")}
                  className="px-4 py-2 bg-signal hover:bg-signal-hover text-white text-xs font-medium rounded-[3px] transition uppercase cursor-pointer"
                >
                  Set Display Name
                </button>
                <button
                  onClick={() => setShowSetupPrompt(false)}
                  className="px-3 py-2 border border-border text-muted hover:text-ink font-medium text-xs rounded-[3px] bg-surface transition uppercase cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        {pageView === "dashboard" ? (
            <div className="flex flex-col gap-6">
                <div className="w-full">
                <GameConsole
                    uid={user.uid}
                    displayName={user.displayName || user.studentId || "Gamer"}
                    onGameStart={handleGameStart}
                    onGameEnd={handleGameEnd}
                    activeLab={activeLab}
                    onSetActiveLab={setActiveLab}
                    onShowFeedback={onShowFeedback}
                />
                </div>
            </div>
         ) : pageView === "lobby" ? (
            <div className={`border p-5 rounded-xl transition-all duration-300 bg-surface border-border`}>
                <PresenceList currentUserId={user.uid} studentId={user.studentId} />
            </div>
        ) : pageView === "leaderboard" ? (
            <div className={`border p-5 rounded-xl transition-all duration-300 bg-surface border-border`}>
                <Leaderboard currentUserId={user.uid} key={`leadeboard-${refreshTrigger}`} />
            </div>
        ) : pageView === "profile" ? (
            <div className={`border p-5 rounded-xl transition-all duration-300 bg-surface border-border`}>
                <UserProfileStats
                key={`profile-${refreshTrigger}`}
                uid={user.uid}
                displayName={user.displayName || user.studentId || "Gamer"}
                activeLab={activeLab}
                />
            </div>
        ) : (
            <div className={`border p-6 rounded-xl transition-all duration-300 bg-surface border-border`}>
                <h2 className={`text-xl font-display font-medium text-ink flex items-center gap-2`}>
                    <Settings className={`w-5 h-5 text-signal`} />
                    System Configuration
                </h2>
                <button 
                  onClick={toggleTheme}
                  className={`mt-4 flex items-center font-sans gap-2 px-4 py-2 rounded-md border text-sm font-medium transition bg-surface border-border text-muted hover:bg-surface-raised hover:bg-signal-subtle`}
                >
                  {theme === 'light' ? <Moon className="w-4 h-4 text-stone-700" /> : <Sun className="w-4 h-4 text-stone-400" />}
                  <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
                </button>
            </div>
        )}
    </motion.div>
  );
}
