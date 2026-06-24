import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Layers, ChevronRight, Sparkles, Trophy, Database, Award, Info, Keyboard, Cable, Binary, Wrench, Network, Lock, Check, User, MessageSquare, GraduationCap } from "lucide-react";
import { LeaderboardEntry, ActiveLab } from "../types";
import { doc, setDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { updatePresenceStatus } from "../lib/presence";
import { auth, db, isInitialized } from "../lib/firebase";
import { awardBadges, OperationType, handleFirestoreError } from "../lib/badgeService";
import { useTheme } from "../context/ThemeContext";
import { safeStorage } from "../lib/storage";

const LAB_HELP_CONTENT: Record<ActiveLab, { title: string; body: string }> = {
  idle: { title: "Select a Lab", body: "Please select a lab from the dashboard to begin your training." },
  pcbuilder: { title: "PC Builder", body: "Select the correct compatible parts and assemble the computer workstation within the time limit." },
  rj45: { title: "RJ45 Wiring", body: "Arrange the twisted pair wires in the correct T568B sequence, then apply the crimper to ensure connection." },
  typing: { title: "Typing Test", body: "Type the presented text sequences as fast and as accurately as possible to improve your WPM." },
  patch: { title: "Patch Panel", body: "Understand and match cabling from the server rack to the patch panel nodes to ensure network connectivity." },
  partsid: { title: "Parts Identity", body: "Identify computer components from images and match them, including specs, in this timed quiz." },
  techsupport: { title: "Tech Support", body: "Utilize CLI commands and troubleshooting diagnostics to identify and resolve simulated system errors." },
  pingtest: { title: "Ping Test", body: "Configure the correct IP address and subnet mask, then perform a ping test to verify connectivity to the target device." },
};
import PcBuilderGame from "./PcBuilderGame";
import Rj45WiringGame from "./Rj45WiringGame";
import TypingTestGame from "./TypingTestGame";
import PatchPanelGame from "./PatchPanelGame";
import PcPartsIdGame from "./PcPartsIdGame";
import TechSupportGame from "./TechSupportGame";
import CiscoPingChallengeGame from "./CiscoPingChallengeGame";

interface GameConsoleProps {
  uid: string;
  displayName: string;
  onGameStart: () => void;
  onGameEnd: () => void;
  activeLab: ActiveLab;
  onSetActiveLab: (lab: ActiveLab) => void;
  onShowFeedback: () => void;
}

export default function GameConsole({
  uid,
  displayName,
  onGameStart,
  onGameEnd,
  activeLab,
  onSetActiveLab,
  onShowFeedback
}: GameConsoleProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedLabForSubLobby, setSelectedLabForSubLobby] = useState<ActiveLab | "none">("none");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const FeedbackButton = () => (
    <button
      onClick={onShowFeedback}
      title="Capstone Feedback"
      className="fixed bottom-6 right-6 p-4 bg-signal text-white rounded-full shadow-2xl hover:bg-signal-hover hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center border border-white/20"
    >
      <MessageSquare size={24} />
    </button>
  );

  const HelpModal = ({ lab }: { lab: ActiveLab }) => {
    return (
      <AnimatePresence>
        {isHelpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => setIsHelpOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`p-6 rounded-xl w-full max-w-sm bg-surface border-border text-ink`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-medium mb-4">{LAB_HELP_CONTENT[lab].title}</h2>
              <p className="mb-6">{LAB_HELP_CONTENT[lab].body}</p>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const GameWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      {children}
      <FeedbackButton />
      <HelpModal lab={activeLab !== "idle" ? activeLab : (selectedLabForSubLobby !== "none" ? selectedLabForSubLobby : "idle")} />
    </div>
  );

  // Data Sanitation: Reset legacy point-based typing scores that now appear as impossible WPM
  React.useEffect(() => {
    const scores = safeStorage.getItem("xp_education_scores");
    if (scores) {
      try {
        let allScores = JSON.parse(scores);
        let changed = false;
        const sanitizedScores = allScores.map((s: any) => {
          const isTyping = s.displayName && s.displayName.includes("TYPE");
          const isLegacyPoints = s.score > 500; // 500+ WPM is impossible, likely legacy points
          const isTargetUser = s.uid === "NJvZjBvaiEXhuTvPYIxi9BZVI713";
          
          if (isTyping && (isLegacyPoints || isTargetUser)) {
            if (s.score !== 0) {
              changed = true;
              return { ...s, score: 0 };
            }
          }
          return s;
        });
        
        if (changed) {
          safeStorage.setItem("xp_education_scores", JSON.stringify(sanitizedScores));
          window.dispatchEvent(new Event("storage_scores_updated"));
        }
      } catch (e) {
        console.error("Score sanitation failed:", e);
      }
    }

    // Also specifically reset the high score field in the profile for the target user if detected
    if (uid === "NJvZjBvaiEXhuTvPYIxi9BZVI713") {
      const profileKey = `xp_education_profile_${uid}`;
      const profile = safeStorage.getItem(profileKey);
      if (profile) {
        try {
          const p = JSON.parse(profile);
          // If the highscore is specifically in the legacy range reported (4800-5000ish)
          if (p.highScore > 0 && p.highScore < 10000) {
            p.highScore = 0;
            safeStorage.setItem(profileKey, JSON.stringify(p));
            console.log("Reset target user profile highscore.");
          }
        } catch (e) {}
      }
    }
  }, [uid]);

  const getSubLobbyPersonalBest = (lab: ActiveLab) => {
    const storedScores = safeStorage.getItem("xp_education_scores");
    if (!storedScores) return 0;
    try {
      const allScores = JSON.parse(storedScores);
      const userScores = allScores.filter((e: any) => {
        if (e.uid !== uid) return false;
        if (lab === "pcbuilder") return e.displayName.startsWith("🛠️ PC:");
        if (lab === "rj45") return e.displayName.startsWith("🔌 RJ45:");
        if (lab === "patch") return e.displayName.startsWith("🔌 PATCH:");
        if (lab === "partsid") return e.displayName.startsWith("🔍 SPEC-ID:");
        if (lab === "techsupport") return e.displayName.startsWith("🔧 SUPPORT:");
        if (lab === "pingtest") return e.displayName.startsWith("🔌 PING");
        if (lab === "typing") return e.displayName.startsWith("⌨️ TYPE");
        return false;
      });
      if (userScores.length === 0) return 0;
      return Math.max(...userScores.map((e: any) => e.score));
    } catch (e) {
      console.error(e);
      return 0;
    }
  };

  const getSubLobbyAchievements = (lab: ActiveLab, pb: number) => {
    const scoresStr = safeStorage.getItem("xp_education_scores");
    let userScores: any[] = [];
    try {
      const allScores = scoresStr ? JSON.parse(scoresStr) : [];
      const currentUid = uid || "anonymous";
      userScores = allScores.filter((s: any) => s.uid === currentUid && s.gameType === lab);
    } catch (e) {}

    const achievementsMap: Record<ActiveLab, { title: string; desc: string; thresh: number; difficulty?: string }[]> = {
      idle: [],
      pcbuilder: [
        { title: "Junior Spec Builder", desc: "Successfully design any hardware rig specification inside the laboratory.", thresh: 1500 },
        { title: "Budget Strategist", desc: "Keep rig builds optimized under strict financial budget boundaries.", thresh: 5000 },
        { title: "Silicon Architect", desc: "Reach 10,000+ points with high performance graphics and gaming builds.", thresh: 10000 },
        { title: "Precision Integrator", desc: "Score 15,000+ points matching workstation requirements with dual-channel RAM.", thresh: 15000 },
        { title: "Ultimate Overclocker", desc: "Flawless custom rig assembly with elite power margins and max savings.", thresh: 20000 }
      ],
      rj45: [
        { title: "Twisted Core Trainee", desc: "Arrange core copper twisted wire strings left-to-right.", thresh: 1000 },
        { title: "Verified Crimper", desc: "Crimp a standard physical ethernet line with accurate pins.", thresh: 3000 },
        { title: "Gigabit Cabler", desc: "Complete sequence wire lines under fast diagnostic time limits.", thresh: 6000 },
        { title: "Wiring Sergeant", desc: "Secure a highly precise cable crimp exceeding 9,000 points.", thresh: 9000 },
        { title: "Optic-Fiber Paragon", desc: "Flawless high-speed assembly with record sub-15s crimp duration.", thresh: 12000 }
      ],
      typing: [
        { title: "Console Novice", desc: "Complete any terminal typing test on device code lines.", thresh: 10 },
        { title: "Standard Operator", desc: "Reach 30 WPM on Easy mode. Verifying basic typing literacy.", thresh: 30, difficulty: "Easy" },
        { title: "Intermed. Scripter", desc: "Reach 45 WPM on Med mode. Competent documentation speed.", thresh: 45, difficulty: "Med" },
        { title: "Advanced Compiler", desc: "Reach 60 WPM on Hard mode. Transcribing complex structures.", thresh: 60, difficulty: "Hard" },
        { title: "Elite Syntax God", desc: "Reach 70 WPM on Elite mode. Human-machine link established.", thresh: 70, difficulty: "Elite" },
        { title: "Master Technician", desc: "Shatter the professional 75 WPM barrier on any difficulty.", thresh: 75 }
      ],
      patch: [
        { title: "Patching Apprentice", desc: "Connect copper physical path cords to live server rack switches.", thresh: 3000 },
        { title: "Trunk Controller", desc: "Design complex logical trunks mapping multiple client VLAN nodes.", thresh: 7500 },
        { title: "Cabinet Maestro", desc: "Maintain low port conflict layouts in the server cabinet.", thresh: 12000 },
        { title: "Rack Administrator", desc: "Exceed 18,000 points using optimized cabling paths.", thresh: 18000 },
        { title: "Server Frame Overlord", desc: "Perfect high-speed patch execution with zero route loops.", thresh: 21500 }
      ],
      partsid: [
        { title: "Spec Explorer", desc: "Identify key components on visual engineering schematics.", thresh: 1000 },
        { title: "PCB Circuit Inspector", desc: "Isolate motherboard electrolytic capacitors under strict timers.", thresh: 2200 },
        { title: "Socket Analyst", desc: "Spot the specific motherboard sockets and layout channels correctly.", thresh: 3500 },
        { title: "Layout Cartographer", desc: "Reach 4,800+ points on advanced hardware identification modules.", thresh: 4800 },
        { title: "Flawless Spec Analyst", desc: "Perfect 6,000 points by answering every difficult module correctly.", thresh: 6000 }
      ],
      techsupport: [
        { title: "Dispatch Trainee", desc: "Resolve basic client hardware and firmware driver tickets.", thresh: 1500 },
        { title: "SLA Specialist", desc: "Keep ticket response durations low with high precision.", thresh: 4500 },
        { title: "Incident Responder", desc: "Excel at complex server repairs on a high correct answered streak.", thresh: 9000 },
        { title: "Systems Expert", desc: "Achieve 12,000+ points solving advanced hardware incidents.", thresh: 12000 },
        { title: "Support Deity", desc: "Reach 15,000 points by resolving high-priority server incidents.", thresh: 15000 }
      ],
      pingtest: [
        { title: "Gateway Voyager", desc: "Navigate standard CLI gateway commands on live router terminals.", thresh: 1500 },
        { title: "IP Address Medic", desc: "Resolve network address conflicts and assign live interfaces.", thresh: 4000 },
        { title: "Static Route Engineer", desc: "Build network routes and establish multiple active ping channels.", thresh: 8000 },
        { title: "Network Specialist", desc: "Submit optimized packet setups under strict diagnostic limits.", thresh: 12500 },
        { title: "Network Nexus Master", desc: "Reach 15,000 points by establishing high-integrity routing loops.", thresh: 15000 }
      ]
    };

    const list = achievementsMap[lab] || [];
    return list.map(ach => {
      let unlocked = pb >= ach.thresh;
      if (ach.difficulty && lab === "typing") {
        unlocked = userScores.some(s => s.displayName?.includes(ach.difficulty!) && s.score >= ach.thresh);
      }
      return { ...ach, unlocked };
    });
  };

  const LAB_DETAILS: Partial<Record<ActiveLab, { title: string; desc: string; icon: React.ReactNode; color: string }>> = {
    pcbuilder: { title: "01. PC Build Specifier", desc: "Choose compatible motherboard sockets (LGA1700, AM4, AM5), monitor TDP power loads, and build high performance PCs within price limits.", icon: <Cpu />, color: "cyan" },
    rj45: { title: "02. RJ45 Wiring Master", desc: "Sequence individual Cat6 copper twisted wires left-to-right matching T568A or T568B network configurations. Crimp and test!", icon: <Layers />, color: "amber" },
    typing: { title: "03. Terminal Typing Speed", desc: "Test your keyboard layout pacing and accuracy against common programming nodes and hardware terminologies. Highly satisfying!", icon: <Keyboard />, color: "emerald" },
    patch: { title: "04. Patch Panel Commander", desc: "Manage core switch port links and map VLAN targets on datacenter rack frames using flexible, sagging physical path cords.", icon: <Cable />, color: "indigo" },
    partsid: { title: "05. PC Parts Identification", desc: "Train your high-precision hardware inspection capacity. Zoom into complex mother connectors, paths, and slot keyways.", icon: <Binary />, color: "orange" },
    techsupport: { title: "06. Tech Support Lab", desc: "Solve real-world incident tickets: operate server lines, diagnose memory faults, swap physical adapters, and download correct drivers.", icon: <Wrench />, color: "rose" },
    pingtest: { title: "07. Cisco Ping Diagnostic", desc: "Configure LAN devices, resolve address conflicts, and type real Cisco IOS commands on remote routers to establish successful ping routes.", icon: <Network />, color: "sky" },
  };

  const LAB_THEMES: Record<string, {
    bg: string; border: string; hoverBorder: string; hoverBg: string; shadow: string;
    iconBg: string; iconBorder: string; iconText: string; gradient: string;
    buttonBg: string; buttonHover: string;
    textHover: string;
  }> = {
    cyan: {
      bg: "bg-cyan-50/50 dark:bg-cyan-950/20",
      border: "border-cyan-200/50 dark:border-cyan-900/40",
      hoverBorder: "hover:border-cyan-400 dark:hover:border-cyan-700",
      hoverBg: "hover:bg-cyan-100/30 dark:hover:bg-cyan-950/30",
      shadow: "hover:shadow-cyan-500/10",
      iconBg: "bg-cyan-100/80 dark:bg-cyan-900/40",
      iconBorder: "border-cyan-200 dark:border-cyan-800/60",
      iconText: "text-cyan-600 dark:text-cyan-400",
      gradient: "",
      buttonBg: "bg-cyan-600 dark:bg-cyan-500", buttonHover: "hover:bg-cyan-700 dark:hover:bg-cyan-400",
      textHover: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
    },
    amber: {
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
      border: "border-amber-200/50 dark:border-amber-900/40",
      hoverBorder: "hover:border-amber-400 dark:hover:border-amber-700",
      hoverBg: "hover:bg-amber-100/30 dark:hover:bg-amber-950/30",
      shadow: "hover:shadow-amber-500/10",
      iconBg: "bg-amber-100/80 dark:bg-amber-900/40",
      iconBorder: "border-amber-200 dark:border-amber-800/60",
      iconText: "text-amber-600 dark:text-amber-400",
      gradient: "",
      buttonBg: "bg-amber-600 dark:bg-amber-500", buttonHover: "hover:bg-amber-700 dark:hover:bg-amber-400",
      textHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400"
    },
    emerald: {
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      border: "border-emerald-200/50 dark:border-emerald-900/40",
      hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-700",
      hoverBg: "hover:bg-emerald-100/30 dark:hover:bg-emerald-950/30",
      shadow: "hover:shadow-emerald-500/10",
      iconBg: "bg-emerald-100/80 dark:bg-emerald-900/40",
      iconBorder: "border-emerald-200 dark:border-emerald-800/60",
      iconText: "text-emerald-600 dark:text-emerald-400",
      gradient: "",
      buttonBg: "bg-emerald-600 dark:bg-emerald-500", buttonHover: "hover:bg-emerald-700 dark:hover:bg-emerald-400",
      textHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
    },
    indigo: {
      bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
      border: "border-indigo-200/50 dark:border-indigo-900/40",
      hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-700",
      hoverBg: "hover:bg-indigo-100/30 dark:hover:bg-indigo-950/30",
      shadow: "hover:shadow-indigo-500/10",
      iconBg: "bg-indigo-100/80 dark:bg-indigo-900/40",
      iconBorder: "border-indigo-200 dark:border-indigo-800/60",
      iconText: "text-indigo-600 dark:text-indigo-400",
      gradient: "",
      buttonBg: "bg-indigo-600 dark:bg-indigo-500", buttonHover: "hover:bg-indigo-700 dark:hover:bg-indigo-400",
      textHover: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
    },
    orange: {
      bg: "bg-orange-50/50 dark:bg-orange-950/20",
      border: "border-orange-200/50 dark:border-orange-900/40",
      hoverBorder: "hover:border-orange-400 dark:hover:border-orange-700",
      hoverBg: "hover:bg-orange-100/30 dark:hover:bg-orange-950/30",
      shadow: "hover:shadow-orange-500/10",
      iconBg: "bg-orange-100/80 dark:bg-orange-900/40",
      iconBorder: "border-orange-200 dark:border-orange-800/60",
      iconText: "text-orange-600 dark:text-orange-400",
      gradient: "",
      buttonBg: "bg-orange-600 dark:bg-orange-500", buttonHover: "hover:bg-orange-700 dark:hover:bg-orange-400",
      textHover: "group-hover:text-orange-600 dark:group-hover:text-orange-400"
    },
    rose: {
      bg: "bg-rose-50/50 dark:bg-rose-950/20",
      border: "border-rose-200/50 dark:border-rose-900/40",
      hoverBorder: "hover:border-rose-400 dark:hover:border-rose-700",
      hoverBg: "hover:bg-rose-100/30 dark:hover:bg-rose-950/30",
      shadow: "hover:shadow-rose-500/10",
      iconBg: "bg-rose-100/80 dark:bg-rose-900/40",
      iconBorder: "border-rose-200 dark:border-rose-800/60",
      iconText: "text-rose-600 dark:text-rose-400",
      gradient: "",
      buttonBg: "bg-rose-600 dark:bg-rose-500", buttonHover: "hover:bg-rose-700 dark:hover:bg-rose-400",
      textHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400"
    },
    sky: {
      bg: "bg-sky-50/50 dark:bg-sky-950/20",
      border: "border-sky-200/50 dark:border-sky-900/40",
      hoverBorder: "hover:border-sky-400 dark:hover:border-sky-700",
      hoverBg: "hover:bg-sky-100/30 dark:hover:bg-sky-950/30",
      shadow: "hover:shadow-sky-550/15",
      iconBg: "bg-sky-100/80 dark:bg-sky-900/40",
      iconBorder: "border-sky-200 dark:border-sky-850/60",
      iconText: "text-sky-600 dark:text-sky-400",
      gradient: "",
      buttonBg: "bg-sky-600 dark:bg-sky-500", buttonHover: "hover:bg-sky-700 dark:hover:bg-sky-400",
      textHover: "group-hover:text-sky-600 dark:group-hover:text-sky-400"
    },
  };

  // True Vector Blueprints / Diagrams specific to each lab's topic
  const renderLabSchematicComponent = (lab: ActiveLab) => {
    switch (lab) {
      case "pcbuilder":
        return (
          <svg viewBox="0 0 400 250" className="absolute right-0 bottom-0 w-[80%] h-full opacity-[0.14] pointer-events-none select-none text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="100" y="20" width="280" height="210" rx="8" className="stroke-cyan-500/40" strokeWidth="2" />
            <rect x="160" y="50" width="60" height="60" rx="4" className="stroke-cyan-400/80" strokeWidth="2" />
            <path d="M165,55 H215 M165,60 H215 M165,65 H215 M165,70 H215 M165,75 H215 M165,80 H215 M165,85 H215 M165,90 H215 M165,95 H215 M165,100 H215 M165,105 H215" className="stroke-cyan-500/20" />
            <path d="M165,55 V105 M170,55 V105 M175,55 V105 M180,55 V105 M185,55 V105 M190,55 V105 M195,55 V105 M200,55 V105 M205,55 V105 M210,55 V105 M215,55 V105" className="stroke-cyan-500/20" />
            <text x="162" y="42" className="font-mono text-[8px] fill-cyan-400 font-medium stroke-none">LGA 1700 SOCKET</text>
            <g transform="translate(245, 45)">
              <rect x="0" y="0" width="4" height="80" rx="0.5" className="stroke-cyan-400" />
              <rect x="8" y="0" width="4" height="80" rx="0.5" className="stroke-cyan-500/50" />
              <rect x="16" y="0" width="4" height="80" rx="0.5" className="stroke-cyan-400" />
              <rect x="24" y="0" width="4" height="80" rx="0.5" className="stroke-cyan-500/50" />
              <text x="-15" y="-10" className="font-mono text-[8px] fill-cyan-400 font-medium stroke-none">DDR5 DIMM</text>
            </g>
            <rect x="110" y="145" width="160" height="10" rx="1" className="stroke-cyan-400/80" />
            <text x="110" y="140" className="font-mono text-[7px] fill-cyan-400/60 stroke-none">PCIe 5.0 x16 SLOT</text>
            <rect x="110" y="175" width="160" height="8" rx="1" className="stroke-cyan-500/30" />
            <rect x="290" y="150" width="45" height="45" rx="4" className="stroke-cyan-400" />
            <path d="M295,155 V190 M300,155 V190 M305,155 V190 M310,155 V190 M315,155 V190 M320,155 V190 M325,155 V190" className="stroke-cyan-400/40" />
            <circle cx="130" cy="115" r="14" className="stroke-cyan-500/60" />
            <path d="M122,115 H138 M130,107 V123" className="stroke-cyan-500/30" />
            <path d="M220,80 H240" className="stroke-cyan-400" />
            <path d="M190,110 V140 H140" className="stroke-cyan-400" />
          </svg>
        );
      case "rj45":
        return (
          <svg viewBox="0 0 400 250" className="absolute right-0 bottom-0 w-[80%] h-full opacity-[0.14] pointer-events-none select-none text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M120,40 H280 V180 H240 V220 H160 V180 H120 Z" className="stroke-amber-500" strokeWidth="2" />
            <rect x="175" y="200" width="50" height="20" rx="2" className="stroke-amber-600/40" />
            <path d="M200,90 L200,160 L185,170" className="stroke-amber-400" strokeWidth="2" />
            <g transform="translate(136, 50)">
              {[
                { id: 1, bg: "stroke-orange-400" },
                { id: 2, bg: "stroke-orange-500" },
                { id: 3, bg: "stroke-emerald-400" },
                { id: 4, bg: "stroke-blue-500" },
                { id: 5, bg: "stroke-blue-400" },
                { id: 6, bg: "stroke-emerald-500" },
                { id: 7, bg: "stroke-amber-700" },
                { id: 8, bg: "stroke-amber-800" }
              ].map((pin, index) => (
                <g key={pin.id} transform={`translate(${index * 16}, 0)`}>
                  <line x1="0" y1="0" x2="0" y2="40" className={`${pin.bg}`} strokeWidth="3" strokeLinecap="round" />
                  <rect x="-4" y="0" width="8" height="10" rx="1" className="stroke-amber-400" fill="#f59e0b" fillOpacity="0.8" />
                  <text x="-2.5" y="55" className="font-mono text-[7px] fill-amber-300 stroke-none font-medium">{pin.id}</text>
                </g>
              ))}
            </g>
            <text x="110" y="140" className="font-mono text-[8px] fill-amber-350 font-medium stroke-none">T568B CAT6 CONNECTOR SPEC</text>
            <path d="M136,150 H264" className="stroke-amber-500/20" strokeDasharray="3,3" />
          </svg>
        );
      case "typing":
        return (
          <svg viewBox="0 0 400 250" className="absolute right-0 bottom-0 w-[80%] h-full opacity-[0.14] pointer-events-none select-none text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="120" y="30" width="250" height="180" rx="6" className="stroke-emerald-500/40" strokeWidth="2" fill="#022c22" fillOpacity="0.05" />
            <path d="M120,54 H370" className="stroke-emerald-800/80" />
            <circle cx="136" cy="42" r="4" fill="#ef4444" />
            <circle cx="148" cy="42" r="4" fill="#eab308" />
            <circle cx="160" cy="42" r="4" fill="#22c55e" />
            <text x="180" y="45" className="font-mono text-[8px] fill-emerald-400 font-medium stroke-none">TERMINAL CONSOLE SPEEDTEST</text>
            <g transform="translate(140, 80)">
              <text x="0" y="0" className="font-mono text-[9px] fill-slate-350 stroke-none">
                <tspan className="fill-emerald-450 font-medium">import</tspan> &#123; link, speed &#125; <tspan className="fill-emerald-450 font-medium">from</tspan> "net";
              </text>
              <text x="0" y="18" className="font-mono text-[9px] fill-slate-350 stroke-none">
                <tspan className="fill-emerald-450 font-medium">const</tspan> query = (ip: <tspan className="fill-cyan-400">string</tspan>) =&gt; &#123;
              </text>
              <text x="15" y="36" className="font-mono text-[9px] fill-slate-350 stroke-none">
                <tspan className="fill-emerald-450 font-medium">return</tspan> system.diagnose(ip);
              </text>
              <text x="0" y="54" className="font-mono text-[9px] fill-slate-350 stroke-none">
                &#125;;
              </text>
              <rect x="30" y="66" width="6" height="10" className="fill-emerald-400 animate-pulse stroke-none" />
            </g>
            <g transform="translate(260, 150)" className="text-emerald-500 opacity-80">
              <path d="M0,45 L40,30 L60,15 L80,25 L100,5" strokeWidth="2" strokeLinecap="round" />
              <path d="M0,45 L40,30 L60,15 L80,25 L100,5 L100,50 L0,50 Z" className="fill-emerald-950/25 stroke-none" />
              <line x1="0" y1="50" x2="100" y2="50" strokeWidth="1" />
              <text x="50" y="45" className="font-mono text-[8px] fill-emerald-450 stroke-none font-medium">140 WPM</text>
            </g>
          </svg>
        );
      case "patch":
        return (
          <svg viewBox="0 0 400 250" className="absolute right-0 bottom-0 w-[80%] h-full opacity-[0.14] pointer-events-none select-none text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="80" y="20" width="300" height="210" rx="4" className="stroke-indigo-500/30" strokeWidth="2" />
            <g transform="translate(90, 40)">
              <rect x="0" y="0" width="280" height="36" rx="2" className="stroke-indigo-400" fill="#030712" />
              <text x="8" y="-6" className="font-mono text-[7px] fill-indigo-405 font-medium stroke-none">PATCH PANEL A (SERVERS)</text>
              {[0,1,2,3,4,5,6,7,8,9,10,11].map((p) => (
                <g key={p} transform={`translate(${10 + p * 22}, 10)`}>
                  <rect x="0" y="0" width="14" height="14" rx="2" className="stroke-indigo-500/80" />
                  <circle cx="7" cy="-3" r="1.5" className="fill-emerald-500 stroke-none" />
                  <text x="3" y="10" className="font-mono text-[6px] fill-indigo-300 stroke-none font-medium">{p+1}</text>
                </g>
              ))}
            </g>
            <g transform="translate(90, 150)">
              <rect x="0" y="0" width="280" height="36" rx="2" className="stroke-indigo-500/60" fill="#030712" />
              <text x="8" y="-6" className="font-mono text-[7px] fill-indigo-405/80 font-medium stroke-none">CORE SWITCH B (VLAN TRUNK)</text>
              {[0,1,2,3,4,5,6,7,8,9,10,11].map((p) => (
                <g key={p} transform={`translate(${10 + p * 22}, 10)`}>
                  <rect x="0" y="0" width="14" height="14" rx="2" className="stroke-indigo-500/40" />
                  <circle cx="7" cy="-3" r="1.5" className="fill-indigo-500 stroke-none" />
                  <text x="3" y="10" className="font-mono text-[6px] fill-indigo-300 stroke-none font-medium">{p+13}</text>
                </g>
              ))}
            </g>
            <path d="M127,64 C127,100 237,120 237,174" className="stroke-indigo-455" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M215,64 C215,110 149,110 149,174" className="stroke-emerald-400" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M303,64 C303,120 325,120 325,174" className="stroke-cyan-400" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case "partsid":
        return (
          <svg viewBox="0 0 400 250" className="absolute right-0 bottom-0 w-[80%] h-full opacity-[0.14] pointer-events-none select-none text-orange-500" fill="none" stroke="currentColor" strokeWidth="1.5">
            <g transform="translate(160, 50)">
              <rect x="0" y="0" width="120" height="120" rx="8" className="stroke-orange-500" strokeWidth="2" />
              <rect x="25" y="25" width="70" height="70" rx="4" className="stroke-orange-400" strokeWidth="1.5" />
              <line x1="0" y1="30" x2="25" y2="30" />
              <line x1="0" y1="60" x2="25" y2="60" />
              <line x1="0" y1="90" x2="25" y2="90" />
              <line x1="95" y1="30" x2="120" y2="30" />
              <line x1="95" y1="60" x2="120" y2="60" />
              <line x1="95" y1="90" x2="120" y2="90" />
              <line x1="30" y1="0" x2="30" y2="25" />
              <line x1="60" y1="0" x2="60" y2="25" />
              <line x1="90" y1="0" x2="90" y2="25" />
              <line x1="30" y1="95" x2="30" y2="120" />
              <line x1="60" y1="95" x2="60" y2="120" />
              <line x1="90" y1="95" x2="90" y2="120" />
              <text x="32" y="63" className="font-mono text-[9px] fill-orange-400 font-medium stroke-none">B760 CHIPSET</text>
            </g>
            <circle cx="100" cy="140" r="34" className="stroke-orange-500/60" strokeDasharray="3,3" />
            <path d="M100,106 V174 M66,140 H134" className="stroke-orange-500/20" />
            <circle cx="100" cy="140" r="28" className="stroke-orange-400" />
            <rect x="90" y="125" width="20" height="30" rx="2" className="stroke-orange-400" fill="#78350f" fillOpacity="0.1" />
            <line x1="90" y1="133" x2="110" y2="133" strokeWidth="2.5" />
            <text x="94" y="145" className="font-mono text-[6px] fill-orange-450 font-medium stroke-none">100uF VDC</text>
          </svg>
        );
      case "techsupport":
        return (
          <svg viewBox="0 0 400 250" className="absolute right-0 bottom-0 w-[80%] h-full opacity-[0.14] pointer-events-none select-none text-rose-500" fill="none" stroke="currentColor" strokeWidth="1.5">
            <g transform="translate(180, 20)">
              <rect x="0" y="0" width="185" height="200" rx="6" className="stroke-rose-500/40" />
              <g transform="translate(10, 15)">
                <rect x="0" y="0" width="165" height="30" rx="3" className="stroke-rose-450" />
                <circle cx="15" cy="15" r="3" fill="#22c55e" />
                <text x="25" y="18" className="font-mono text-[7px] fill-rose-350 stroke-none">SRV_NODE_01 (ONLINE)</text>
                <line x1="110" y1="15" x2="140" y2="15" className="stroke-emerald-500" strokeWidth="2" />
              </g>
              <g transform="translate(10, 55)">
                <rect x="0" y="0" width="165" height="30" rx="3" className="stroke-rose-500" strokeWidth="2" />
                <circle cx="15" cy="15" r="3" fill="#ef4444" className="animate-pulse" />
                <text x="25" y="18" className="font-mono text-[7px] fill-rose-500 font-medium stroke-none">SRV_NODE_02 (RAM_FAIL)</text>
              </g>
              <g transform="translate(10, 95)">
                <rect x="0" y="0" width="165" height="30" rx="3" className="stroke-rose-450" />
                <circle cx="15" cy="15" r="3" fill="#22c55e" />
                <text x="25" y="18" className="font-mono text-[7px] fill-rose-350 stroke-none">SRV_NODE_03 (ONLINE)</text>
                <line x1="110" y1="15" x2="135" y2="15" className="stroke-emerald-500" strokeWidth="2" />
              </g>
            </g>
            <g transform="translate(20, 130)">
              <rect x="0" y="0" width="135" height="80" rx="4" className="stroke-rose-500" fill="#020617" />
              <text x="8" y="15" className="font-mono text-[7px] fill-rose-450 font-medium stroke-none">CORE MEM DUMP: 0x01B4</text>
              <text x="8" y="30" className="font-mono text-[6px] fill-rose-350 stroke-none">0000: FF 2A CD E4 10 9B BB</text>
              <text x="8" y="42" className="font-mono text-[6px] fill-rose-500 font-medium stroke-none">0008: AA BB CC - MEM_FAULT</text>
              <text x="8" y="54" className="font-mono text-[6px] fill-rose-350 stroke-none">0010: 90 AA EF CB 12 FF BA</text>
            </g>
          </svg>
        );
      case "pingtest":
        return (
          <svg viewBox="0 0 400 250" className="absolute right-0 bottom-0 w-[80%] h-full opacity-[0.16] pointer-events-none select-none text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Real Cisco bridge waves design background */}
            <g transform="translate(260, 20)" className="text-sky-500 opacity-60" strokeWidth="3" strokeLinecap="round">
              <line x1="0" y1="35" x2="0" y2="5" />
              <line x1="10" y1="35" x2="10" y2="10" />
              <line x1="20" y1="35" x2="20" y2="15" />
              <line x1="30" y1="35" x2="30" y2="20" />
              <line x1="40" y1="35" x2="40" y2="15" />
              <line x1="50" y1="35" x2="50" y2="10" />
              <line x1="60" y1="35" x2="60" y2="5" />
            </g>
            {/* Cisco-style Network Topology */}
            <g transform="translate(90, 120)">
              <circle cx="0" cy="0" r="22" className="stroke-sky-500" fill="currentColor" fillOpacity="0.05" />
              <path d="M-12,0 L12,0 M12,0 L8,-3 M12,0 L8,3 M-12,0 L-8,-3 M-12,0 L-8,3" strokeWidth="1.8" />
              <path d="M0,-12 L0,12 M0,12 L-3,8 M0,12 L3,8 M0,-12 L-3,-8 M0,-12 L3,-8" strokeWidth="1.8" />
              <text x="-25" y="-30" className="font-mono text-[8px] fill-sky-450 font-medium stroke-none">Router01</text>
            </g>
            <g transform="translate(290, 160)">
              <circle cx="0" cy="0" r="22" className="stroke-sky-500" fill="currentColor" fillOpacity="0.05" />
              <path d="M-12,0 L12,0 M12,0 L8,-3 M12,0 L8,3 M-12,0 L-8,-3 M-12,0 L-8,3" strokeWidth="1.8" />
              <path d="M0,-12 L0,12 M0,12 L-3,8 M0,12 L3,8 M0,-12 L-3,-8 M0,-12 L3,-8" strokeWidth="1.8" />
              <text x="-25" y="-30" className="font-mono text-[8px] fill-sky-455 font-medium stroke-none">Router02</text>
            </g>
            <path d="M112,120 Q190,100 268,160" strokeDasharray="5,5" strokeWidth="2.5" className="stroke-sky-500/80" />
            <text x="175" y="110" className="font-mono text-[8px] fill-sky-400/80 stroke-none">Serial0/1/0</text>
            <g transform="translate(15, 30)">
              <rect x="0" y="0" width="160" height="60" rx="4" fill="#020617" stroke="#1e293b" />
              <text x="8" y="15" className="font-mono text-[7px] fill-emerald-400 stroke-none">RouterA# ping 10.1.1.2</text>
              <text x="8" y="27" className="font-mono text-[7px] fill-slate-350 stroke-none">Type escape sequence to abort.</text>
              <text x="8" y="39" className="font-mono text-[7px] fill-slate-350 stroke-none">Sending 5, 100-byte ICMP Echos...</text>
              <text x="8" y="51" className="font-mono text-[7px] fill-emerald-400 stroke-none">!!!!! [Success rate is 100%]</text>
            </g>
          </svg>
        );
      default:
        return null;
    }
  };

  const getGradientOverlayForColor = (color: string) => {
    switch (color) {
      case "cyan":
        return "via-cyan-50/20";
      case "amber":
        return "via-amber-50/20";
      case "emerald":
        return "via-emerald-50/20";
      case "indigo":
        return "via-indigo-50/20";
      case "orange":
        return "via-orange-50/20";
      case "rose":
        return "via-rose-50/20";
      case "sky":
        return "via-sky-50/20";
      default:
        return "";
    }
  };

  // Common function to finalize a game and save scores to standard schema
  const handleGameCompleted = async (score: number, avgReaction: number, customPrefix?: string) => {
    setLoading(true);
    try {
      // 1. Log entry in Leaderboard "scores" local storage
      const storedScores = safeStorage.getItem("xp_education_scores");
      let allScores: LeaderboardEntry[] = [];
      if (storedScores) {
        try {
          allScores = JSON.parse(storedScores);
        } catch (err) {
          console.error("Failed to parse scores:", err);
        }
      }

      const labelPrefix = customPrefix || (
        activeLab === "pcbuilder" ? "🛠️ PC:" : 
        activeLab === "rj45" ? "🔌 RJ45:" : 
        activeLab === "patch" ? "🔌 PATCH:" : 
        activeLab === "partsid" ? "🔍 SPEC-ID:" : 
        activeLab === "techsupport" ? "🔧 SUPPORT:" : 
        activeLab === "pingtest" ? "🔌 PING:" : 
        "⌨️ TYPE:"
      );
      const existingIndex = allScores.findIndex(
        (entry) => entry.uid === uid && entry.displayName.startsWith(labelPrefix)
      );

      if (existingIndex !== -1) {
        const existingEntry = allScores[existingIndex];
        if (score > existingEntry.score) {
          allScores[existingIndex] = {
            ...existingEntry,
            score: score,
            reactionTimeAvg: avgReaction,
            timestamp: new Date().toISOString() as any
          };
          safeStorage.setItem("xp_education_scores", JSON.stringify(allScores));

          // Sync to Firestore
          if (isInitialized) {
            try {
              const scoreRef = doc(db, "scores", existingEntry.id);
              await setDoc(scoreRef, {
                score: score,
                reactionTimeAvg: avgReaction,
                timestamp: new Date().toISOString()
              }, { merge: true });
            } catch (e) {
              handleFirestoreError(e, OperationType.UPDATE, `scores/${existingEntry.id}`);
            }
          }
        } else {
          console.log(`New score (${score}) is not higher than existing record (${existingEntry.score}) - discarding score change.`);
        }
      } else {
      const finalName = (displayName && displayName !== "null") ? displayName : "Unknown Specialist";
      const newId = Date.now().toString();
      const newScoreEntry: LeaderboardEntry = {
        id: newId,
        uid,
        displayName: `${labelPrefix} ${finalName}`,
        score,
        reactionTimeAvg: avgReaction,
        timestamp: new Date().toISOString() as any
      };
      allScores.push(newScoreEntry);
      safeStorage.setItem("xp_education_scores", JSON.stringify(allScores));

      // Sync to Firestore
      if (isInitialized) {
        try {
          await setDoc(doc(db, "scores", newId), {
            id: newId,
            uid,
            displayName: `${labelPrefix} ${finalName}`,
            score,
            reactionTimeAvg: avgReaction,
            timestamp: new Date().toISOString()
          });
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, `scores/${newId}`);
          }
        }
      }

      // 2. Read and Update permanent Player Account Document in localStorage & Firestore
      const localProfileKey = `xp_education_profile_${uid}`;
      const storedProfile = safeStorage.getItem(localProfileKey);
      let prevHighScore = 0;
      let prevGamesPlayed = 0;
      let prevAvgTime = 0;
      let profileCreatedAt = new Date().toISOString();

      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);
          prevHighScore = parsed.highScore || 0;
          prevGamesPlayed = parsed.gamesPlayed || 0;
          prevAvgTime = parsed.avgReactionTime || 0;
          profileCreatedAt = parsed.createdAt || profileCreatedAt;
        } catch (err) {
          console.error("Failed to parse student profile:", err);
        }
      }

      const pointsForRank = activeLab === "typing" ? score * 150 : score;
      const newHighScore = Math.max(prevHighScore, pointsForRank);
      const newGamesPlayed = prevGamesPlayed + 1;
      
      // Re-calculate running average reaction / duration index
      let newAvgTime = avgReaction;
      if (prevAvgTime > 0 && avgReaction > 0) {
        newAvgTime = Math.round(((prevAvgTime * prevGamesPlayed) + avgReaction) / newGamesPlayed);
      } else if (prevAvgTime > 0) {
        newAvgTime = prevAvgTime;
      }

      // Figure out if the score is "perfect" based on the lab max constraints
      let isPerfect = false;
      if (activeLab === "pcbuilder" && score >= 20000) isPerfect = true;
      else if (activeLab === "rj45" && score >= 12000) isPerfect = true;
      else if (activeLab === "typing" && score >= 70) isPerfect = true; // 70 WPM is elite benchmark
      else if (activeLab === "patch" && score >= 21500) isPerfect = true;
      else if (activeLab === "partsid" && score >= 6000) isPerfect = true;
      else if (activeLab === "techsupport" && score >= 17200) isPerfect = true;
      else if (activeLab === "pingtest" && score >= 16500) isPerfect = true;

      // Award badges and save to Firestore as requested
      let finalBadges: string[] = [];
      try {
        finalBadges = await awardBadges(uid, displayName, score, avgReaction, activeLab, isPerfect);
      } catch (badgeErr) {
        console.error("Error invoking badge service:", badgeErr);
      }

      const updatedProfile = {
        uid,
        displayName,
        email: auth.currentUser?.email || null,
        highScore: newHighScore,
        gamesPlayed: newGamesPlayed,
        avgReactionTime: newAvgTime,
        createdAt: profileCreatedAt,
        badges: finalBadges
      };

      safeStorage.setItem(localProfileKey, JSON.stringify(updatedProfile));

      // 3. Keep stats locally alongside Firestore badge triggers
      // Update real-time presence scores
      await updatePresenceStatus(uid, "gameover", score);

      window.dispatchEvent(new Event("storage_scores_updated"));

    } catch (err) {
      console.error("Error saving game results locally:", err);
    } finally {
      setLoading(false);
      onSetActiveLab("idle");
      // Let dashboard refresh scores & profiles
      onGameEnd();
    }
  };

  const handleStartLab = async (lab: ActiveLab) => {
    onSetActiveLab(lab);
    onGameStart();
    await updatePresenceStatus(uid, "playing", 0);
  };

  const handleExitToLabLobby = async () => {
    const labToRestore = activeLab;
    onSetActiveLab("idle");
    setSelectedLabForSubLobby(labToRestore);
    onGameEnd();
    await updatePresenceStatus(uid, "idle", 0);
  };

  const handleExitToMainLobby = async () => {
    onSetActiveLab("idle");
    onGameEnd();
    await updatePresenceStatus(uid, "idle", 0);
  };

  // Helper to get personal high score for a specific lab
  const getPersonalHighScore = (lab: ActiveLab) => {
    const storedScores = safeStorage.getItem("xp_education_scores");
    if (!storedScores) return 0;
    try {
      const allScores: LeaderboardEntry[] = JSON.parse(storedScores);
      const userScores = allScores.filter(e => {
        if (e.uid !== uid) return false;
        if (lab === "pcbuilder") return e.displayName.startsWith("🛠️ PC:");
        if (lab === "rj45") return e.displayName.startsWith("🔌 RJ45:");
        if (lab === "patch") return e.displayName.startsWith("🔌 PATCH:");
        if (lab === "partsid") return e.displayName.startsWith("🔍 SPEC-ID:");
        if (lab === "techsupport") return e.displayName.startsWith("🔧 SUPPORT:");
        if (lab === "pingtest") return e.displayName.startsWith("🔌 PING");
        if (lab === "typing") return e.displayName.startsWith("⌨️ TYPE");
        return false;
      });
      if (userScores.length === 0) return 0;
      return Math.max(...userScores.map(e => e.score));
    } catch (e) {
      return 0;
    }
  };

  const renderGameContent = () => {
    switch (activeLab) {
      case "pcbuilder":
        return (
          <PcBuilderGame
            uid={uid}
            displayName={displayName}
            onGameEnd={handleGameCompleted}
            onExit={handleExitToLabLobby}
            themeColor={LAB_DETAILS.pcbuilder!.color}
          />
        );
      case "rj45":
        return (
          <Rj45WiringGame
            uid={uid}
            displayName={displayName}
            onGameEnd={handleGameCompleted}
            onExit={handleExitToLabLobby}
          />
        );
      case "typing":
        return (
          <TypingTestGame
            uid={uid}
            displayName={displayName}
            onGameEnd={handleGameCompleted}
            onExit={handleExitToLabLobby}
          />
        );
      case "patch":
        return (
          <PatchPanelGame
            uid={uid}
            displayName={displayName}
            onGameEnd={handleGameCompleted}
            onExit={handleExitToLabLobby}
            themeColor={LAB_DETAILS.patch?.color || "indigo"}
          />
        );
      case "partsid":
        return (
          <PcPartsIdGame
            uid={uid}
            displayName={displayName}
            onGameEnd={handleGameCompleted}
            onExit={handleExitToLabLobby}
          />
        );
      case "techsupport":
        return (
          <TechSupportGame
            uid={uid}
            displayName={displayName}
            onGameEnd={handleGameCompleted}
            onExit={handleExitToLabLobby}
          />
        );
      case "pingtest":
        return (
          <CiscoPingChallengeGame
            uid={uid}
            displayName={displayName}
            onGameEnd={handleGameCompleted}
            onExit={handleExitToLabLobby}
          />
        );
      default:
        // Default lobby view
        return (
          <div id="game-arena-wrapper" className={`flex flex-col h-full min-h-[500px] border rounded-xl relative overflow-hidden transition-all duration-300 bg-surface-raised border-border text-ink`}>
            
            {/* Menu Header Status Bar */}
            <div id="game-status-header" className={`p-4 border-b flex items-center justify-between gap-4 transition-colors duration-300 relative z-20 backdrop-blur-md bg-surface border-border`}>
              <div className="flex items-center gap-2">
                <GraduationCap className={`w-5 h-5 text-signal`} />
                <span className={`font-sans font-semibold text-xs font-medium text-signal`}>IT-MASTERY Labs</span>
              </div>

              <div className={`flex items-center gap-1 border px-2.5 py-1 rounded-lg transition-colors duration-300 bg-surface border-border`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className={`font-mono text-[10px] font-medium text-signal`}>7 MODULES ACTIVE</span>
              </div>
            </div>

            {/* Main Selection Area */}
            {selectedLabForSubLobby === "none" ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                id="labs-selector-interface" 
                className="flex-1 flex flex-col justify-center items-center p-6 md:p-8 space-y-8"
              >
                <div className="text-center max-w-lg space-y-2">
                  <motion.h2 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl md:text-3xl font-medium text-indigo-700 dark:text-signal font-display"
                  >
                    Interactive IT Labs
                  </motion.h2>
                  <p className={`text-xs leading-relaxed font-sans text-muted`}>
                    Select a specialized laboratory to begin your certification training.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
                  {(Object.keys(LAB_DETAILS) as ActiveLab[]).map((lab, i) => (
                    <motion.div
                      key={lab}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      id={`btn-select-lab-${lab}`}
                      onClick={() => setSelectedLabForSubLobby(lab)}
                      className={`p-5 rounded-xl ${LAB_THEMES[LAB_DETAILS[lab].color].bg} border ${LAB_THEMES[LAB_DETAILS[lab].color].border} ${LAB_THEMES[LAB_DETAILS[lab].color].hoverBorder} group cursor-pointer transition-all duration-300 flex flex-col justify-between ${LAB_THEMES[LAB_DETAILS[lab].color].hoverBg} shadow-md ${LAB_THEMES[LAB_DETAILS[lab].color].shadow} relative overflow-hidden h-[150px]`}
                    >
                      {/* Real-time high-fidelity vector schematic matching physical module theme */}
                      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
                        {renderLabSchematicComponent(lab)}
                      </div>
                      
                      {/* Custom theme gradient mask */}
                      <div 
                        className={`absolute inset-0 bg-gradient-to-br ${getGradientOverlayForColor(LAB_DETAILS[lab].color)} opacity-[0.93] transition-all duration-300`}
                      />

                      <div className="relative z-10 flex flex-col justify-between h-full w-full">
                        <div className={`w-10 h-10 rounded-xl ${LAB_THEMES[LAB_DETAILS[lab].color].iconBg} border ${LAB_THEMES[LAB_DETAILS[lab].color].iconBorder} flex items-center justify-center ${LAB_THEMES[LAB_DETAILS[lab].color].iconText} group-hover:scale-110 transition-transform`}>
                          {LAB_DETAILS[lab].icon}
                        </div>
                        <h3 className={`font-medium text-sm mt-auto transition-colors text-ink ${LAB_THEMES[LAB_DETAILS[lab].color].textHover}`}>
                          {LAB_DETAILS[lab].title.split(". ")[1]}
                        </h3>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  id="labs-player-ui-page" 
                  className={`relative flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden transition-all duration-300 bg-transparent`}
                >
                  {/* Real-time high-fidelity vector schematic matching physical module theme */}
                  <div className="absolute inset-0">
                    {renderLabSchematicComponent(selectedLabForSubLobby as ActiveLab)}
                  </div>
                  
                  {/* Custom theme gradient mask */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${getGradientOverlayForColor(LAB_DETAILS[selectedLabForSubLobby as ActiveLab]?.color || "indigo")} opacity-[0.93]`}
                  />

                  <div className={`relative z-10 p-5 md:p-6 rounded-xl border flex flex-col gap-5 backdrop-blur-sm w-full max-w-4xl transition-all duration-300 ${
                    "lab-light-panel text-ink"
                  }`}>
                    
                    {/* Elegant Header with Back Action */}
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-medium tracking-widest uppercase ${
                          "border bg-signal-subtle border-border text-signal"
                        }`}>
                          Trainee Terminal v2.1
                        </span>
                        <span className={`text-[10px] font-mono hidden sm:inline text-muted`}>
                          // SESSION_ID: IT-{uid.substring(0, 6).toUpperCase()}
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedLabForSubLobby("none")} 
                        className={`text-xs flex items-center gap-1 transition-colors cursor-pointer font-medium ${
                          "text-muted hover:text-signal"
                        }`}
                      >
                        <ChevronRight className={`w-4 h-4 rotate-180 text-signal`} /> Back to Laboratories
                      </button>
                    </div>

                    {/* Split Grid for Player UI Page */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Left Column: Stats and Achievements */}
                      {(() => {
                        const pb = getSubLobbyPersonalBest(selectedLabForSubLobby as ActiveLab);
                        const achievements = getSubLobbyAchievements(selectedLabForSubLobby as ActiveLab, pb);
                        const isTypingLab = (selectedLabForSubLobby as ActiveLab) === "typing";
                        const playerRank = (isTypingLab ? pb >= 100 : pb >= 3000) ? { label: "Elite Specialist", style: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" }
                                         : (isTypingLab ? pb >= 60 : pb >= 1500) ? { label: "Certified Operator", style: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" }
                                         : pb > 0 ? { label: "Junior Practitioner", style: "text-amber-500 bg-amber-500/10 border-amber-500/20" }
                                         : { label: "Candidate Trainee", style: "text-stone-400 bg-stone-400/10 border-stone-400/20" };

                        return (
                          <div className={`md:col-span-4 p-4 rounded-xl border flex flex-col justify-between gap-5 transition-all duration-300 relative overflow-hidden ${
                            "bg-surface border-border"
                          }`}>
                            <div className="space-y-4 w-full">
                              {/* Identity block */}
                              <div className="flex items-center gap-3 text-left">
                                <div className={`w-11 h-11 rounded-full border flex items-center justify-center relative flex-shrink-0 ${
                                  "bg-surface border-border"
                                }`}>
                                  <span className={`text-sm font-black font-mono tracking-tighter text-signal`}>
                                    {displayName?.charAt(0).toUpperCase() || "P"}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <h3 className={`font-medium text-xs tracking-tight truncate text-signal`}>
                                    {displayName || "Trainee"}
                                  </h3>
                                  <span className={`inline-block text-[9px] font-medium font-mono px-1.5 py-0.5 rounded border uppercase mt-1 tracking-wider ${playerRank.style}`}>
                                    {playerRank.label}
                                  </span>
                                </div>
                              </div>

                              {/* Personal Best Stat Box */}
                              <div className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                                "bg-surface border-border"
                              }`}>
                                <div className="flex items-center gap-2 text-left">
                                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                                  <div>
                                    <span className={`block text-[9px] font-mono uppercase font-medium tracking-wider text-muted`}>
                                      Personal Best
                                    </span>
                                    <span className={`text-base font-black font-mono tracking-tight text-signal`}>
                                      {pb.toLocaleString()} <span className="text-[10px] font-medium opacity-60">{(selectedLabForSubLobby as ActiveLab) === 'typing' ? 'WPM' : 'pts'}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Achievements Checklist Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-medium font-mono tracking-widest uppercase text-signal`}>
                                    LAB ACHIEVEMENTS
                                  </span>
                                  <span className={`text-[9px] font-mono text-muted`}>
                                    {achievements.filter((a: any) => a.unlocked).length}/{achievements.length} UNLOCKED
                                  </span>
                                </div>
                                
                                <div className="space-y-1.5">
                                  {achievements.map((ach: any) => {
                                    const isUnlocked = ach.unlocked;
                                    return (
                                      <div 
                                        key={ach.title} 
                                        className={`p-2 rounded-lg border flex items-start gap-2 transition-all ${
                                          isUnlocked 
                                            ? "bg-success-subtle border-success text-success"
                                            : "bg-surface-raised border-border text-muted"
                                        }`}
                                      >
                                        <div className="mt-0.5">
                                          {isUnlocked ? (
                                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/30">
                                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                          ) : (
                                            <div className="w-3.5 h-3.5 rounded-full bg-surface-raised flex items-center justify-center text-muted border border-border">
                                              <Lock className="w-2.5 h-2.5" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                          <div className="flex justify-between items-baseline">
                                            <span className="text-[10.5px] font-medium font-sans tracking-tight truncate leading-none">
                                              {ach.title}
                                            </span>
                                            <span className="text-[8.5px] font-mono opacity-80 shrink-0 select-none">
                                              {ach.thresh} pts
                                            </span>
                                          </div>
                                          <p className="text-[8.5px] opacity-75 mt-0.5 leading-tight font-sans">
                                            {ach.desc}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Right Column: Lab Info, Objectives and Launcher */}
                      <div className="md:col-span-8 flex flex-col justify-between gap-5">
                        <div className="space-y-4">
                          <div className="flex gap-3 items-center">
                            <div className={`text-3xl p-3 rounded-xl flex-shrink-0 ${LAB_THEMES[LAB_DETAILS[selectedLabForSubLobby as ActiveLab].color].iconBg} ${LAB_THEMES[LAB_DETAILS[selectedLabForSubLobby as ActiveLab].color].iconText}`}>
                              {LAB_DETAILS[selectedLabForSubLobby as ActiveLab].icon}
                            </div>
                            <div>
                              <h2 className={`text-xl md:text-2xl font-medium tracking-tight font-display text-signal`}>
                                {LAB_DETAILS[selectedLabForSubLobby as ActiveLab].title}
                              </h2>
                            </div>
                          </div>
                          <p className={`leading-relaxed text-xs font-sans text-muted`}>
                            {LAB_DETAILS[selectedLabForSubLobby as ActiveLab].desc}
                          </p>
                        </div>

                        {/* Huge launch button */}
                        <button 
                          onClick={() => { handleStartLab(selectedLabForSubLobby); setSelectedLabForSubLobby("none"); }}
                          className={`py-3.5 px-6 text-sm text-white rounded-xl font-medium transition-transform hover:scale-[1.01] active:scale-98 cursor-pointer shadow-lg w-full flex items-center justify-center gap-2 ${
                            LAB_DETAILS[selectedLabForSubLobby]
                              ? `${LAB_THEMES[LAB_DETAILS[selectedLabForSubLobby].color]?.buttonBg || "bg-signal"} ${LAB_THEMES[LAB_DETAILS[selectedLabForSubLobby].color]?.buttonHover || "hover:bg-signal-hover"}`
                              : "bg-signal hover:bg-signal-hover"
                          }`}
                        >
                          <GraduationCap className="w-4 h-4" /> LAUNCH LAB WORKBENCH
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
            )}
           </div>
        );
    }
  };

  return (
    <div className="relative">
      {renderGameContent()}
      <FeedbackButton />
      <HelpModal lab={activeLab !== "idle" ? activeLab : (selectedLabForSubLobby !== "none" ? selectedLabForSubLobby : "idle")} />
    </div>
  );
}
