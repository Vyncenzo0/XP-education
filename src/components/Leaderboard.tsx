import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Zap, ShieldAlert, Cpu, Layers, Keyboard, RotateCcw, Cable, Binary, Wrench, Network } from "lucide-react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { auth, db, isInitialized } from "../lib/firebase";
import { LeaderboardEntry } from "../types";
import { useTheme } from "../context/ThemeContext";
import { safeStorage } from "../lib/storage";
import { maskStudentId } from "../utils/maskStudentId";

interface LeaderboardProps {
  currentUserId: string;
  key?: any;
}

const DEFAULT_SCORES: LeaderboardEntry[] = [];

type GameFilter = "pc" | "rj45" | "type" | "patch" | "partsid" | "support" | "ping";

export default function Leaderboard({ currentUserId }: LeaderboardProps) {
  const { theme } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<GameFilter>("pc");
  const [typeDifficulty, setTypeDifficulty] = useState<"all" | "Easy" | "Med">("all");
  const [typeDuration, setTypeDuration] = useState<"all" | "30" | "60">("all");
  const [pingDifficulty, setPingDifficulty] = useState<"all" | "Beginner" | "Intermediate" | "Advanced" | "Campaign">("all");

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      if (!isInitialized) {
        // Fallback to local storage or defaults immediately
        const stored = safeStorage.getItem("xp_education_scores");
        let currentScores = [...DEFAULT_SCORES];
        if (stored) {
          try {
            currentScores = JSON.parse(stored);
          } catch (e) {}
        }
        currentScores.sort((a, b) => b.score - a.score);
        setLeaderboard(currentScores);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        const scores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderboardEntry));
        
        if (scores.length > 0) {
          setLeaderboard(scores);
        } else {
          // Fallback to local storage or defaults if Firestore is empty
          const stored = safeStorage.getItem("xp_education_scores");
          let currentScores = [...DEFAULT_SCORES];
          if (stored) {
            try {
              currentScores = JSON.parse(stored);
            } catch (err) {}
          }
          currentScores.sort((a, b) => b.score - a.score);
          setLeaderboard(currentScores);
        }
      } catch (err) {
        console.error("Failed to fetch official rankings:", err);
        // Fallback
        const stored = safeStorage.getItem("xp_education_scores");
        let currentScores = [...DEFAULT_SCORES];
        if (stored) {
          try {
            currentScores = JSON.parse(stored);
          } catch (e) {}
        }
        currentScores.sort((a, b) => b.score - a.score);
        setLeaderboard(currentScores);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();

    const handleUpdate = () => {
      fetchScores();
    };

    window.addEventListener("storage_scores_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("storage_scores_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleResetLeaderboard = () => {
    if (window.confirm("Are you sure you want to reset the ICCT Leaderboards to defaults? All custom simulated scores will be cleared.")) {
      safeStorage.removeItem("xp_education_scores");
      
      // also clear individual user highscores so they can post fresh records starting now
      safeStorage.clearMatching((key) => key.startsWith("xp_education_profile_") || key.startsWith("xp_score_"));
      
      const resetScores = [...DEFAULT_SCORES];
      safeStorage.setItem("xp_education_scores", JSON.stringify(resetScores));
      setLeaderboard(resetScores);
      
      // Dispatch events to keep adjacent views/tabs aligned
      window.dispatchEvent(new Event("storage_scores_updated"));
      window.dispatchEvent(new Event("presence_update"));
    }
  };

  // Helper to strip prefixes for tab list rendering when already isolated by game
  const cleanDisplayName = (name: any) => {
    if (!name || name === "null" || String(name).trim() === "null") return "Unknown Specialist";
    
    let strName = String(name);
    strName = strName
      .replace(/^Senior Specialist\s+/, "")
      .replace(/^Specialist\s+/, "")
      .replace(/^⌨️ TYPE.*:\s*/, "")
      .replace(/^🛠️ PC:\s*/, "")
      .replace(/^🔌 RJ45:\s*/, "")
      .replace(/^🔌 PATCH:\s*/, "")
      .replace(/^🔍 SPEC-ID:\s*/, "")
      .replace(/^🔧 SUPPORT:\s*/, "")
      .replace(/^🔌 PING-[A-Z]+:\s*/, "")
      .replace(/^🔌 PING:\s*/, "")
      .trim();

    if (!strName || strName.toLowerCase() === "null") {
      return "Unknown Specialist";
    }

    return strName;
  };

  // Filter leaderboard based on active tab and deduplicate by player name
  const filteredLeaderboard = (() => {
    // 1. Filter raw entries by category and exclude AI, AI Active players, or simulated bots (sim-, acad-)
    const matched = leaderboard.filter((entry) => {
      const rawName = entry.displayName ? String(entry.displayName).trim() : "";
      const displayNameLower = rawName.toLowerCase();
      
      // Clean name for better filtering
      const cleanedName = cleanDisplayName(rawName);
      const cleanedLower = cleanedName.toLowerCase();

      // Filter out 'Unknown Specialist', 'Anonymous' or null/empty names
      if (!cleanedName || 
          cleanedLower === "null" || 
          cleanedLower === "unknown specialist" || 
          cleanedLower === "anonymous specialist" ||
          cleanedLower === "anonymous" ||
          cleanedLower === "undefined") {
        return false;
      }
      
      const hasAiWords = /(\b|^)ai(\b|$)/i.test(rawName);
      const hasAiActive = displayNameLower.includes("ai active") || displayNameLower.includes("active ai");
      const isSimBot = entry.uid?.startsWith("sim-") || entry.id?.startsWith("sim-") || entry.uid?.startsWith("acad-");
      
      if (hasAiWords || hasAiActive || isSimBot) return false;

      if (activeTab === "pc") return displayNameLower.includes("pc");
      if (activeTab === "rj45") return displayNameLower.includes("rj45");
      if (activeTab === "type") {
        if (!displayNameLower.includes("type")) return false;
        if (typeDifficulty !== "all" && !rawName.includes(typeDifficulty)) return false;
        if (typeDuration !== "all" && !rawName.includes(`${typeDuration}s`)) return false;
        return true;
      }
      if (activeTab === "patch") return displayNameLower.includes("patch");
      if (activeTab === "partsid") return displayNameLower.includes("spec-id");
      if (activeTab === "support") return displayNameLower.includes("support");
      if (activeTab === "ping") {
        if (!displayNameLower.includes("ping")) return false;
        if (pingDifficulty === "Beginner" && !displayNameLower.includes("ping-beg")) return false;
        if (pingDifficulty === "Intermediate" && !displayNameLower.includes("ping-int")) return false;
        if (pingDifficulty === "Advanced" && !displayNameLower.includes("ping-adv")) return false;
        if (pingDifficulty === "Campaign" && !displayNameLower.includes("ping-all")) return false;
        return true;
      }
      return true;
    });

    // 2. Deduplicate: since we are sorted descending, keeping the first match preserves only the highest score.
    const seenNames = new Set<string>();
    const deduplicated: LeaderboardEntry[] = [];

    for (const entry of matched) {
      // isolated by game tab deduplication logic
      const nameKey = cleanDisplayName(entry.displayName)
        .trim()
        .toLowerCase();

      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        deduplicated.push(entry);
      }
    }

    return deduplicated.slice(0, 15);
  })();

  // Render rank badge or medal
  const renderRank = (index: number) => {
    switch (index) {
      case 0:
        return <span className="text-xl">🥇</span>;
      case 1:
        return <span className="text-xl">🥈</span>;
      case 2:
        return <span className="text-xl">🥉</span>;
      default:
        return <span className="font-mono text-stone-500 text-xs font-medium w-6 text-center">#{index + 1}</span>;
    }
  };

  return (
    <div id="leaderboard-card" className={`flex flex-col h-[460px] overflow-hidden shadow-xl rounded-xl border transition-all duration-300 bg-surface border-border`}>
      {/* Header bar controls */}
      <div id="leaderboard-header" className={`p-4 border-b flex items-center justify-between gap-2.5 transition-colors duration-300 bg-surface border-border`}>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-500" />
          <h2 className={`font-display font-black text-sm uppercase tracking-tight text-signal`}>IT-MASTERY Rankings</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetLeaderboard}
            title="Reset Leaderboard back to defaults"
            className={`flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded cursor-pointer transition-colors duration-150 uppercase border bg-surface border-border text-muted hover:text-signal hover:border-signal`}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Reset
          </button>
          <div className={`text-[10px] font-mono font-black tracking-widest uppercase hidden [@media(min-width:320px)]:block text-signal`}>
            ACADEMY RANKS
          </div>
        </div>
      </div>

      {/* Game Tabs Selector */}
      <div className={`px-4 py-2 border-b flex items-center justify-start gap-1.5 overflow-x-auto scrollbar-none select-none transition-colors duration-300 bg-surface-raised border-border`}>
        <button
          onClick={() => setActiveTab("pc")}
          className={`px-2.5 py-1 text-[10px] font-mono font-medium uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === "pc"
              ? "border bg-signal-subtle border-border text-signal"
              : "text-ink"
          }`}
        >
          <Cpu className="w-3 h-3" />
          PC Build
        </button>
        <button
          onClick={() => setActiveTab("rj45")}
          className={`px-2.5 py-1 text-[10px] font-mono font-medium uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === "rj45"
              ? "border bg-signal-subtle border-border text-signal"
              : "text-ink"
          }`}
        >
          <Layers className="w-3 h-3" />
          RJ45 Wiring
        </button>
        <button
          onClick={() => setActiveTab("type")}
          className={`px-2.5 py-1 text-[10px] font-mono font-medium uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === "type"
              ? "border bg-signal-subtle border-border text-signal"
              : "text-ink"
          }`}
        >
          <Keyboard className="w-3 h-3" />
          Typing
        </button>
        <button
          onClick={() => setActiveTab("patch")}
          className={`px-2.5 py-1 text-[10px] font-mono font-medium uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === "patch"
              ? "border bg-signal-subtle border-border text-signal"
              : "text-ink"
          }`}
        >
          <Cable className="w-3 h-3" />
          Patch Panel
        </button>
        <button
          onClick={() => setActiveTab("partsid")}
          className={`px-2.5 py-1 text-[10px] font-mono font-medium uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === "partsid"
              ? "border bg-signal-subtle border-border text-signal"
              : "text-ink"
          }`}
        >
          <Binary className="w-3 h-3" />
          PC Parts ID
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`px-2.5 py-1 text-[10px] font-mono font-medium uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === "support"
              ? "border bg-signal-subtle border-border text-signal"
              : "text-ink"
          }`}
        >
          <Wrench className="w-3 h-3" />
          Tech Support
        </button>
        <button
          onClick={() => setActiveTab("ping")}
          className={`px-2.5 py-1 text-[10px] font-mono font-medium uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === "ping"
              ? "border bg-signal-subtle border-border text-signal"
              : "text-ink"
          }`}
        >
          <Network className="w-3 h-3" />
          Cisco Ping
        </button>
      </div>

      {/* Typing Sub-filters */}
      {activeTab === "type" && (
        <div className={`px-4 py-1.5 border-b flex items-center justify-start gap-3 select-none bg-surface-raised border-border`}>
          <div className="flex items-center gap-1.5">
             <span className="text-[9px] font-mono text-stone-500 uppercase">Mode:</span>
             <select
               value={typeDifficulty}
               onChange={(e) => setTypeDifficulty(e.target.value as "all" | "Easy" | "Med")}
               className={`border text-[9px] font-mono px-1 py-0.5 rounded outline-none cursor-pointer bg-surface border-border text-ink`}
             >
               <option value="all">All</option>
               <option value="Easy">Easy</option>
               <option value="Med">Medium</option>
             </select>
          </div>
          <div className="flex items-center gap-1.5">
             <span className="text-[9px] font-mono text-stone-500 uppercase">Time:</span>
             <select
               value={typeDuration}
               onChange={(e) => setTypeDuration(e.target.value as "all" | "30" | "60")}
               className={`border text-[9px] font-mono px-1 py-0.5 rounded outline-none cursor-pointer bg-surface border-border text-ink`}
             >
               <option value="all">All</option>
               <option value="30">30s</option>
               <option value="60">60s</option>
             </select>
          </div>
        </div>
      )}

      {/* Cisco Ping Sub-filters */}
      {activeTab === "ping" && (
        <div className={`px-4 py-1.5 border-b flex items-center justify-start gap-3 select-none bg-surface-raised border-border`}>
          <div className="flex items-center gap-1.5">
             <span className="text-[9px] font-mono text-stone-500 uppercase">Cisco Lab Difficulty:</span>
             <select
               value={pingDifficulty}
               onChange={(e) => setPingDifficulty(e.target.value as any)}
               className={`border text-[9px] font-mono px-2 py-0.5 rounded outline-none cursor-pointer bg-surface border-border text-ink`}
             >
               <option value="all">All Difficulties</option>
               <option value="Beginner">Beginner (Mismatch)</option>
               <option value="Intermediate">Intermediate (Gateways)</option>
               <option value="Advanced">Advanced (Subnets)</option>
               <option value="Campaign">Full Campaign (All 3 sequential)</option>
             </select>
          </div>
        </div>
      )}

      {/* Ranks list container */}
      <div id="leaderboard-list-scroll" className={`flex-1 overflow-y-auto p-4 space-y-1.5 min-h-0 bg-surface-raised`}>
        {loading ? (
          <div className="flex justify-center items-center h-full text-xs text-stone-500 gap-1.5 animate-pulse">
            <Zap className="w-4 h-4 animate-spin text-cyan-400" /> Loading official rankings...
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center text-stone-500 p-4">
            <ShieldAlert className="w-8 h-8 text-stone-700 mb-2" />
            <p className="text-xs font-semibold text-stone-400">No records found!</p>
            <p className="text-[10px] text-stone-600 mt-0.5">Be the first to complete this lab & logs.</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {filteredLeaderboard.map((entry, index) => {
                const isCurrentUser = entry.uid === currentUserId;
                const cleanName = cleanDisplayName(entry.displayName);
                const isTypeScore = entry.displayName.includes("TYPE");
                const isPcBuilder = entry.displayName.includes("PC");
                const isRj45 = entry.displayName.includes("RJ45");
                const isPatch = entry.displayName.includes("PATCH");
                const isPartsId = entry.displayName.includes("SPEC-ID");
                const isSupport = entry.displayName.includes("SUPPORT");

                // Check if cleanName matches a Student ID format so we can mask it
                const isStudentIdFormat = /^(CA|TA|AN|SU|SM|BI|CO)\d{9}$/i.test(cleanName);
                const finalDisplayedName = isStudentIdFormat ? maskStudentId(cleanName) : cleanName;

                return (
                  <motion.div
                    id={`leaderboard-row-${entry.id}`}
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.3) }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isCurrentUser
                        ? "border-border text-signal hover:border-signal"
                        : "bg-surface border-border text-ink hover:border-signal"
                    }`}
                  >
                    {/* User identifier rank */}
                    <div className="flex items-center gap-3">
                       <div className="w-6 flex justify-center">
                        {renderRank(index)}
                      </div>
                      <div className="truncate max-w-[140px] sm:max-w-[185px]">
                        <span className={`text-xs font-display font-semibold block truncate ${
                          isCurrentUser
                            ? "font-medium text-signal"
                            : "text-ink"
                        } ${isStudentIdFormat ? "select-none pointer-events-none" : ""}`}>
                          {finalDisplayedName}
                        </span>
                      </div>
                    </div>

                    {/* Score value */}
                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className="font-mono text-xs font-medium text-amber-500 drop-shadow-sm select-all">
                        {entry.score.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-stone-500 font-mono">
                        {isTypeScore ? "wpm" : "pts"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom informational summary */}
      <div id="leaderboard-footer" className={`p-2.5 border-t flex justify-between items-center text-[9px] transition-colors duration-300 bg-surface-raised border-border text-muted`}>
        <span>Filtered scores</span>
        <span>Showing top {filteredLeaderboard.length} entries</span>
      </div>
    </div>
  );
}
