import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Zap, Timer, BarChart, Trophy, CheckCircle2, Moon, Sun, Activity, X } from "lucide-react";
import { UserProfile, LeaderboardEntry, ActiveLab } from "../types";
import { useTheme } from "../context/ThemeContext";
import { getCampusName } from "../lib/campus";
import { auth, db, isInitialized } from "../lib/firebase";
import { AVAILABLE_BADGES, fetchUserBadges, fetchUserUniqueSVGBadges, UniqueSVGBadge } from "../lib/badgeService";
import { RANK_THRESHOLDS } from "../constants/achievements";
import { safeStorage } from "../lib/storage";

interface UserProfileStatsProps {
  uid: string;
  displayName: string;
  studentId?: string;
  activeLab: ActiveLab;
  key?: any;
}

export default function UserProfileStats({ uid, displayName, studentId, activeLab }: UserProfileStatsProps) {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uniqueSVGBadges, setUniqueSVGBadges] = useState<UniqueSVGBadge[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to get personal high scores for ALL labs
  const getAllLabPersonalBests = () => {
    const storedScores = safeStorage.getItem("xp_education_scores");
    const labMappings: Record<string, string> = {
      "⌨️ TYPE": "Typing",
      "🛠️ PC": "PC Builder",
      "🔌 RJ45": "RJ45 Wiring",
      "🔌 PATCH": "Patch Panel",
      "🔍 SPEC-ID": "PC Parts ID",
      "🔧 SUPPORT": "Tech Support",
      "🔌 PING": "Cisco Ping Test"
    };

    const results: Record<string, number> = {};
    Object.values(labMappings).forEach(name => results[name] = 0);

    if (storedScores) {
      try {
        const allScores: LeaderboardEntry[] = JSON.parse(storedScores);
        const userScores = allScores.filter(e => e.uid === uid);
        
        userScores.forEach(entry => {
          const name = entry.displayName ? String(entry.displayName) : "";
          Object.entries(labMappings).forEach(([prefix, namePrefix]) => {
            if (name.includes(prefix)) {
              results[namePrefix] = Math.max(results[namePrefix], entry.score);
            }
          });
        });
      } catch(e) {
        console.error("Failed to parse scores:", e);
      }
    }
    return results;
  };

  const allLabBests = getAllLabPersonalBests();

  // Helper to get personal high score for ALL labs and identify the lab
  const getPersonalBestInfo = () => {
    const storedScores = safeStorage.getItem("xp_education_scores");
    if (!storedScores) return { score: profile?.highScore || 0, labName: "General" };

    try {
      const allScores: LeaderboardEntry[] = JSON.parse(storedScores);
      // Filter for user
      const userScores = allScores.filter(e => e.uid === uid);
      if (userScores.length === 0) return { score: profile?.highScore || 0, labName: "General" };
      
      const bestScore = userScores.reduce((max, entry) => entry.score > max.score ? entry : max, userScores[0]);
      
      let labName = "General";
      const bestName = bestScore.displayName ? String(bestScore.displayName) : "";
      if (bestName.includes("⌨️ TYPE")) labName = "Typing";
      else if (bestName.includes("🛠️ PC")) labName = "PC Builder";
      else if (bestName.includes("🔌 RJ45")) labName = "RJ45 Wiring";
      else if (bestName.includes("🔌 PATCH")) labName = "Patch Panel";
      else if (bestName.includes("🔍 SPEC-ID")) labName = "PC Parts ID";
      else if (bestName.includes("🔧 SUPPORT")) labName = "Tech Support";
      else if (bestName.includes("🔌 PING")) labName = "Cisco Ping Test";
      
      return { score: bestScore.score, labName: labName };
    } catch(e) {
      return { score: profile?.highScore || 0, labName: "General" };
    }
  };

  // Helper to get personal high score for a specific lab
  const getLabPersonalHighScore = () => {
    if (activeLab === "idle") return profile?.highScore || 0;
    
    const storedScores = safeStorage.getItem("xp_education_scores");
    if (!storedScores) return 0;
    try {
      const allScores: LeaderboardEntry[] = JSON.parse(storedScores);
      const userScores = allScores.filter(e => {
        if (e.uid !== uid) return false;
        const name = e.displayName ? String(e.displayName) : "";
        if (activeLab === "pcbuilder") return name.startsWith("🛠️ PC:");
        if (activeLab === "rj45") return name.startsWith("🔌 RJ45:");
        if (activeLab === "patch") return name.startsWith("🔌 PATCH:");
        if (activeLab === "partsid") return name.startsWith("🔍 SPEC-ID:");
        if (activeLab === "techsupport") return name.startsWith("🔧 SUPPORT:");
        if (activeLab === "pingtest") return name.startsWith("🔌 PING");
        if (activeLab === "typing") return name.startsWith("⌨️ TYPE");
        return false;
      });
      if (userScores.length === 0) return 0;
      return Math.max(...userScores.map(e => e.score));
    } catch (e) {
      return 0;
    }
  };

  const labHighScore = getLabPersonalHighScore();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const localProfileKey = `xp_education_profile_${uid}`;
    const loadProfile = () => {
      const stored = safeStorage.getItem(localProfileKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setProfile({
            uid,
            displayName: parsed.displayName || displayName,
            studentId: parsed.studentId || studentId,
            email: parsed.email || null,
            highScore: parsed.highScore || 0,
            gamesPlayed: parsed.gamesPlayed || 0,
            avgReactionTime: parsed.avgReactionTime || 0,
            createdAt: parsed.createdAt || new Date().toISOString(),
            badges: parsed.badges || []
          });
        } catch (err) {
          console.error("Failed to parse local profile:", err);
        }
      } else {
        const initialProfile = {
          uid,
          displayName,
          studentId,
          email: null,
          highScore: 0,
          gamesPlayed: 0,
          avgReactionTime: 0,
          createdAt: new Date().toISOString(),
          badges: []
        };
        safeStorage.setItem(localProfileKey, JSON.stringify(initialProfile));
        setProfile(initialProfile);
      }
    };

    loadProfile();
    setLoading(false);

    // Fetch from Firestore dynamically to get most up-to-date persistent badges
    const loadFirestoreBadges = async () => {
      if (!isInitialized) return;
      try {
        const [badges, svgBadges] = await Promise.all([
          fetchUserBadges(uid),
          fetchUserUniqueSVGBadges(uid)
        ]);
        if (svgBadges && svgBadges.length > 0) {
          setUniqueSVGBadges(svgBadges);
        }
        if (badges && badges.length > 0) {
          setProfile(prev => {
            if (!prev) return prev;
            const updated = { ...prev, badges };
            safeStorage.setItem(localProfileKey, JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.warn("Could not load dynamic badges from Firestore:", err);
      }
    };
    loadFirestoreBadges();

    // Listen for custom trigger to reload when game scores change/badges get awarded
    const handleRefresh = () => {
      loadProfile();
      loadFirestoreBadges();
    };
    window.addEventListener("storage_scores_updated", handleRefresh);

    return () => {
      window.removeEventListener("storage_scores_updated", handleRefresh);
    };
  }, [uid, displayName, studentId]);

  // Get reactive rank name based on high score achievements
  const getRankNameAndBadge = (highScore: number) => {
    if (highScore >= RANK_THRESHOLDS.MASTER) return { title: "Master Systems Architect 🧠", style: "from-purple-500 to-indigo-505 border-indigo-400" };
    if (highScore >= RANK_THRESHOLDS.SENIOR) return { title: "Senior Systems Engineer 🏆", style: "from-amber-500 to-rose-505 border-rose-450" };
    if (highScore >= RANK_THRESHOLDS.NETWORK_SPECIALIST) return { title: "Network Specialist ⚡", style: "from-sky-505 to-blue-505 border-sky-400" };
    if (highScore >= RANK_THRESHOLDS.CERTIFIED) return { title: "Certified Technician 🎯", style: "from-emerald-500 to-teal-505 border-emerald-450" };
    return { title: "Junior IT Associate 🐣", style: "from-stone-500 to-slate-550 border-stone-700" };
  };

  const badgeProps = getRankNameAndBadge(profile?.highScore || 0);

  // Motivational gaming footer quote
  const motivationalQuote = () => {
    if (activeLab === "idle") {
      return profile?.highScore && profile.highScore > RANK_THRESHOLDS.NETWORK_SPECIALIST
        ? "“Consistently strong diagnostics across all labs. Ready for advanced assignments.”"
        : "“Consistent training build muscle memory. Select a specialized lab below to begin!”";
    }
    const labNames: Record<ActiveLab, string> = {
      idle: "",
      pcbuilder: "Hardware Architecture",
      rj45: "Network Cabling",
      patch: "Server Maintenance",
      partsid: "Inspection Diagnostics",
      techsupport: "Technical Support",
      typing: "Terminal Precision",
      pingtest: "Cisco Routing & Ping Diagnostics"
    };
    return `“Currently exploring ${labNames[activeLab] || "Diagnostics"} Exercises. Keep practicing!”`;
  };

  return (
    <div id="user-profile-section" className={`relative overflow-hidden flex flex-col justify-between h-full min-h-[300px] rounded-xl p-6 transition-all duration-300 border bg-surface border-border text-ink`}>
      {/* Background radial accent flare */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none opacity-20" />

      {/* Profile basic identifier details */}
      <div className="space-y-5">
        <div className={`flex items-center justify-between gap-2.5 p-2 rounded-lg border transition-colors duration-300 bg-surface border-border`}>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-500" />
            <h2 className={`font-sans font-black text-sm uppercase tracking-tight text-signal`}>IT-MASTERY Dossier</h2>
          </div>
        </div>

        {/* Identity row & Gametag */}
        {(() => {
          const email = profile?.email || auth.currentUser?.email || "";
          const resolvedStudentId = studentId || profile?.studentId || (email.includes("@") && email.split("@")[0].length === 13
            ? email.split("@")[0].toUpperCase()
            : "");
          return (
            <div id="profile-card-details" className="flex flex-col gap-4 p-4 rounded-xl shadow-lg border transition-all duration-300 bg-surface border-border text-ink">
              <div className="flex items-start justify-between w-full">
                <div>
                  <span className="text-[10px] text-stone-500 font-mono font-medium uppercase tracking-widest">GAMERTAG / DISPLAY NAME</span>
                  <h3 className="text-sm font-mono font-medium mt-0.5 truncate max-w-[170px] sm:max-w-xs text-ink">
                    {(displayName && displayName !== "null") ? displayName : "Identity Unconfirmed"}
                  </h3>
                  <span className="inline-flex mt-1 bg-gradient-to-tr px-2 py-0.5 rounded text-[9px] font-mono font-medium uppercase tracking-wider text-stone-900 border" style={{ backgroundImage: `linear-gradient(to top right, ${badgeProps.style.split(' ')[1]}, ${badgeProps.style.split(' ')[3] || badgeProps.style.split(' ')[1]})` }}>
                    {badgeProps.title}
                  </span>
                </div>

                <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm border transition duration-300 bg-surface border-border text-signal">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="border-t border-border/80 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div id="profile-student-id-row">
                  <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-muted block">STUDENT ID</span>
                  <span className="text-sm font-mono text-ink mt-0.5 block">{(resolvedStudentId && resolvedStudentId !== "null") ? resolvedStudentId : "N/A"}</span>
                </div>
                <div id="profile-campus-row">
                  <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-muted block">CAMPUS</span>
                  <span className="text-sm font-sans text-ink mt-0.5 block">{getCampusName(resolvedStudentId)}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Unlocked Badges Section */}
        <div id="student-unlocked-badges-block" className="space-y-2">
          <div className="flex justify-between items-center text-left">
            <span className={`text-[10px] font-medium uppercase tracking-wider flex items-center gap-1.5 text-signal`}>
              <Award className="w-3.5 h-3.5 text-amber-500" />
              UNLOCKED BADGES ({(profile?.badges?.length || 0) + uniqueSVGBadges.length})
            </span>
            {(((profile?.badges?.length || 0) + uniqueSVGBadges.length) > 0) && (
              <button
                onClick={() => setShowGallery(true)}
                className={`text-[9px] font-medium uppercase tracking-wider px-2 py-1 rounded transition-colors bg-surface-raised text-ink hover:text-ink`}
              >
                View Gallery
              </button>
            )}
          </div>

          {(!profile?.badges || profile.badges.length === 0) && uniqueSVGBadges.length === 0 ? (
            <div className={`p-3 rounded-xl border border-dashed text-center text-xs text-stone-500 font-medium bg-surface-raised border-border`}>
              No badges unlocked yet. Complete a workbench exercise below to earn achievements!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[148px] overflow-y-auto pr-1">
              {uniqueSVGBadges.map((badge) => (
                 <motion.div
                   key={"svg_" + badge.labId}
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className={`flex items-center gap-2 p-2 rounded-xl border text-left cursor-default shadow-sm relative overflow-hidden group transition ${
                     "bg-signal-subtle text-ink"
                   }`}
                   title={`Perfect score achieved in ${badge.labId}`}
                 >
                   <div className="w-8 h-8 shrink-0 flex items-center justify-center filter drop-shadow-md" dangerouslySetInnerHTML={{ __html: badge.svgIcon }} />
                   <div className="min-w-0 flex-1">
                     <p className={`text-[9px] font-black truncate uppercase tracking-widest leading-none `}>{badge.badgeName}</p>
                     <p className={`text-[8px] mt-0.5 leading-tight text-signal`}>
                       Flawless Victory
                     </p>
                   </div>
                 </motion.div>
              ))}
              
              {profile?.badges?.map((badgeId) => {
                const badgeInfo = AVAILABLE_BADGES.find(b => b.id === badgeId);
                if (!badgeInfo) return null;
                
                // Dynamically resolve target icons from imported components
                const IconComponent = badgeInfo.icon === "Zap" ? Zap : 
                                      badgeInfo.icon === "Moon" ? Moon : 
                                      badgeInfo.icon === "Sun" ? Sun : 
                                      badgeInfo.icon === "Trophy" ? Trophy : 
                                      badgeInfo.icon === "Activity" ? Activity : Award;

                return (
                  <motion.div
                    key={badgeId}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left cursor-default shadow-sm relative overflow-hidden group transition ${
                      "bg-surface border-border text-ink"
                    }`}
                    title={badgeInfo.desc}
                  >
                    {/* Visual corner flag */}
                    <div className={`absolute top-0 right-0 w-2 h-2 rounded-bl bg-gradient-to-br ${badgeInfo.color}`} />
                    
                    <div className={`p-1.5 rounded-lg shrink-0 bg-gradient-to-tr ${badgeInfo.color} flex items-center justify-center`}>
                      <IconComponent className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[9.5px] font-black truncate uppercase tracking-wide leading-none text-ink`}>{badgeInfo.name}</p>
                      <p className="text-[8px] text-stone-500 mt-0.5 leading-tight line-clamp-1 group-hover:line-clamp-none transition-all duration-350">
                        {badgeInfo.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Personal stats log */}
        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-10 bg-stone-100 rounded-lg animate-pulse" />
            <div className="h-10 bg-stone-100 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeLab === "idle" ? (
              Object.entries(allLabBests).map(([labName, score]) => (
                <div key={labName} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all bg-surface-raised border-border`}>
                  <span className={`text-xs font-medium flex items-center gap-2 text-muted`}>
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    {labName}
                  </span>
                  <span className="font-mono text-xs font-medium text-indigo-500">
                    {score.toLocaleString()} <span className="text-[9px] text-stone-500 font-normal">{labName === "Typing" ? "WPM" : "pts"}</span>
                  </span>
                </div>
              ))
            ) : (
              <div className={`flex items-center justify-between p-2.5 rounded-lg border bg-surface-raised border-border`}>
                    <div className="flex flex-col">
                        <span className={`text-xs font-medium flex items-center gap-2 text-muted`}>
                        <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                        Lab Personal Best
                        </span>
                    </div>
                    <span className="font-mono text-xs font-medium text-indigo-500">
                        {labHighScore.toLocaleString()} <span className="text-[9px] text-stone-500 font-normal">{activeLab === "typing" ? "WPM" : "pts"}</span>
                    </span>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Motivational gaming footer quote */}
      <div className={`pt-4 border-t text-[10px] text-stone-500 italic text-center border-border`}>
        {motivationalQuote()}
      </div>

      <AnimatePresence>
        {showGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGallery(false)}
              className={`absolute inset-0 backdrop-blur-sm bg-surface`}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className={`relative w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-xl shadow-2xl border bg-surface border-border`}
            >
              <div className={`p-4 border-b flex justify-between items-center bg-surface-raised border-border`}>
                <div className="flex items-center gap-2 text-indigo-500">
                  <Trophy className="w-5 h-5 flex-shrink-0" />
                  <h2 className={`font-display font-medium text-lg leading-none mt-0.5 text-ink`}>
                    Achievement Gallery
                  </h2>
                </div>
                <button
                  onClick={() => setShowGallery(false)}
                  className={`p-1.5 rounded-lg transition-colors bg-surface-raised text-ink hover:bg-surface-raised hover:text-ink`}
                >
                  <X className="w-5 h-5 flex-shrink-0" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto w-full">
                {uniqueSVGBadges.length > 0 && (
                   <div className="mb-8">
                     <h3 className={`text-xs font-medium uppercase tracking-wider mb-4 text-signal`}>Perfect Score Badges ({uniqueSVGBadges.length})</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                       {uniqueSVGBadges.map((badge) => (
                         <div key={"modal_svg_" + badge.labId} className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center group transition-all hover:-translate-y-1 bg-signal-subtle`} title={`Achieved a perfect score in: ${badge.labId}`}>
                           <div className="w-16 h-16 mb-3 drop-shadow-md transition-transform group-hover:scale-110" dangerouslySetInnerHTML={{ __html: badge.svgIcon }} />
                           <h4 className={`text-sm font-black uppercase tracking-widest leading-none `}>{badge.badgeName}</h4>
                           <p className={`text-xs mt-1.5 font-medium `}>Flawless Victory</p>
                           <p className={`text-[10px] mt-2 text-muted`}>Lab: {badge.labId}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                )}
                
                {profile?.badges && profile.badges.length > 0 && (
                   <div>
                     <h3 className={`text-xs font-medium uppercase tracking-wider mb-4 text-muted`}>Standard Achievements ({profile.badges.length})</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 tab:grid-cols-3 gap-3">
                       {profile.badges.map((badgeId) => {
                         const badgeInfo = AVAILABLE_BADGES.find(b => b.id === badgeId);
                         if (!badgeInfo) return null;
                         const IconComponent = badgeInfo.icon === "Zap" ? Zap : 
                                               badgeInfo.icon === "Moon" ? Moon : 
                                               badgeInfo.icon === "Sun" ? Sun : 
                                               badgeInfo.icon === "Trophy" ? Trophy : 
                                               badgeInfo.icon === "Activity" ? Activity : Award;

                         return (
                           <div key={"modal_" + badgeId} className={`flex items-start gap-3 p-3 rounded-xl border transition-all bg-surface border-border`} title={badgeInfo.desc}>
                             <div className={`p-2 rounded-lg shrink-0 bg-gradient-to-tr ${badgeInfo.color} flex items-center justify-center`}>
                               <IconComponent className="w-5 h-5 shrink-0" />
                             </div>
                             <div>
                               <h4 className={`text-xs font-black uppercase tracking-wider leading-tight text-ink`}>{badgeInfo.name}</h4>
                               <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">{badgeInfo.desc}</p>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
