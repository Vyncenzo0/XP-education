import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Wifi, Terminal, Activity, Zap, Shield, Search, RefreshCw, Send, Loader2 } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, isInitialized } from "../lib/firebase";
import { useTheme } from "../context/ThemeContext";
import { getCampusName } from "../lib/campus";
import { maskStudentId } from "../utils/maskStudentId";

interface PresenceListProps {
  currentUserId: string;
  studentId?: string;
}

interface SimulatedUser {
  uid: string;
  name: string;
  avatar: string;
  status: "idle" | "playing" | "gameover";
  activeApp: string;
  currentScore: number;
  studentId?: string;
}

const SIMULATED_DIRECTORY: SimulatedUser[] = [];

export default function PresenceList({ currentUserId, studentId }: PresenceListProps) {
  const { theme } = useTheme();
  const [activeUsers, setActiveUsers] = useState<SimulatedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized) {
      setActiveUsers(SIMULATED_DIRECTORY);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "active_players"), orderBy("lastActive", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: SimulatedUser[] = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const name = (data.displayName && data.displayName !== "null") ? String(data.displayName).trim() : "";
          return {
            uid: doc.id,
            name: name,
            avatar: data.avatar || "👨‍💻",
            status: data.status || "idle",
            activeApp: data.activeLab || "In Lobby",
            currentScore: data.score || 0,
            studentId: data.studentId || ""
          } as SimulatedUser;
        })
        .filter(u => {
          const lowerName = u.name.toLowerCase();
          return u.name && 
                 lowerName !== "null" && 
                 lowerName !== "unknown specialist" && 
                 lowerName !== "anonymous" &&
                 lowerName !== "undefined";
        });
      setActiveUsers(users.length > 0 ? users : SIMULATED_DIRECTORY);
      setLoading(false);
    }, (err) => {
      console.warn("Presence snapshot error:", err);
      setActiveUsers(SIMULATED_DIRECTORY);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = activeUsers.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.activeApp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="full-lobby-page" className="max-w-5xl mx-auto space-y-6">
      {/* Lobby Header */}
      <div id="lobby-header" className={`p-6 rounded-xl border bg-surface border-border text-ink`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner bg-surface border-border text-signal`}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight font-display uppercase tracking-wider">IT-MASTERY Active Specialists</h2>
              <p className={`text-xs font-medium text-muted`}>Real-time engagement across interactive hardware & networking labs</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-stone-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specialists..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 ${
                  "focus:border-blue-500 focus:ring-blue-500 bg-surface-raised border-border text-ink"
                }`}
              />
            </div>
            <button 
              onClick={() => {
                // Snapshot will handle updates, but we can manually force a slight "refresh" UI state if we wanted
              }}
              className={`px-4 py-2 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition duration-200 cursor-pointer shadow-sm ${
                "bg-surface-raised border-border text-muted"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5 px-1">
          <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          ACTIVE SPECIALISTS {loading && <Loader2 className="w-3 h-3 animate-spin inline ml-2" />}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
          {/* Active User Card (Self) */}
          <motion.div
            id="node-myself-card"
            className={`p-5 rounded-xl border text-left flex items-center justify-between relative overflow-hidden transition-all duration-300 shadow-lg ${
              "bg-surface border-border text-ink"
            }`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-bl-full `} />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border bg-surface-raised border-border`}>
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black tracking-tight leading-none uppercase">You</h4>
                  <span className="text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase font-mono border bg-success-subtle border-success">ONLINE</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 uppercase font-mono font-medium tracking-wide">
                  {studentId || "N/A"} · {getCampusName(studentId)}
                </p>
                <div className={`mt-2 text-[10px] font-mono font-medium text-signal`}>
                  STATUS: <span className="underline underline-offset-2 uppercase">In Lobby</span>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:block relative z-10">
              <div className={`w-2 h-2 rounded-full shadow-lg animate-pulse bg-success-subtle`} />
            </div>
          </motion.div>

          {/* Roster list participants */}
          <AnimatePresence>
            {filteredUsers.map((usr) => (
              <motion.div
                key={usr.uid}
                id={`roster-card-${usr.uid}`}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-5 rounded-xl border text-left flex items-center justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  usr.uid === currentUserId ? "border-signal bg-signal-subtle" : "bg-surface border-border text-ink hover:border-signal"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface text-ink text-2xl flex items-center justify-center shadow-inner border border-border">
                    {usr.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black tracking-tight leading-none">{usr.name} {usr.uid === currentUserId && "(You)"}</h4>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        usr.status === "playing" ? "bg-amber-400 animate-pulse" : 
                        usr.status === "gameover" ? "bg-emerald-400" : "bg-stone-400"
                      }`} />
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1 uppercase font-mono font-medium tracking-wide select-none pointer-events-none">
                      {maskStudentId(usr.studentId || "")} · {getCampusName(usr.studentId)}
                    </p>
                    
                    <div className="mt-2 space-y-1">
                      <div className="text-[10px] font-mono text-stone-500 flex items-center gap-1.5">
                        <span className="font-black uppercase opacity-40">Status:</span>
                        <span className={
                          usr.status === "playing" ? "text-amber-500 font-medium" : 
                          usr.status === "gameover" ? "text-emerald-500 font-medium" : "text-stone-400"
                        }>
                          {usr.status === "playing" ? "Training" : usr.status === "gameover" ? "Complete" : "In Lobby"}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 flex items-center gap-1.5">
                        <span className="font-black uppercase opacity-40">Lab:</span>
                        <span className={"text-ink"} title={usr.activeApp}>{usr.activeApp}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-[9px] font-black text-stone-500 uppercase tracking-tighter opacity-50">Score</div>
                  <div className="text-sm font-mono font-black text-cyan-500 leading-none">{usr.currentScore || "---"}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
