import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { 
  Sparkles, 
  Terminal, 
  Cable, 
  Search, 
  Wrench, 
  BookOpen, 
  ArrowRight, 
  ChevronRight, 
  Trophy, 
  Award, 
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Timer,
  Zap,
  Flame,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft
} from "lucide-react";

interface TechSupportGameProps {
  uid: string;
  displayName: string;
  onGameEnd: (score: number, avgReactionMs: number, customPrefix?: string) => void;
  onExit: () => void;
}

interface StepMCQ {
  type: "mcq";
  q: string;
  correct: string;
  wrong: string[];
}

interface StepTerminal {
  type: "terminal";
  cmd: string;
  hint: string;
}

interface StepCable {
  type: "cable";
  target: string;
  ports: string[];
  label: string;
}

interface StepSearch {
  type: "search";
  answer: string;
  hint: string;
}

type Step = StepMCQ | StepTerminal | StepCable | StepSearch;

interface Scenario {
  title: string;
  desc: string;
  icon: string;
  steps: Step[];
}

const ALL_SCENARIOS: Scenario[] = [
  {
    title: "No Internet Connection",
    desc: "WiFi connected but no browser response. Other devices in the building operate fine.",
    icon: "🌐",
    steps: [
      { 
        type: "mcq", 
        q: "What is your very first logical diagnostic response step?", 
        correct: "Run ipconfig /release & /renew to request a fresh address lease", 
        wrong: ["Immediately format the primary SATA storage disk", "Buy a higher-gain dual-band routing beacon", "Replace the laptop with a newer specifications chassis"] 
      },
      { 
        type: "terminal", 
        cmd: "ping 192.168.1.1", 
        hint: "Ping the local default gateway to verify LAN physical switch response link" 
      },
      { 
        type: "mcq", 
        q: "Gateway ping routing completely time-out. Next logical localized physical step?", 
        correct: "Verify the physical patch ethernet cord or click the physical wireless adapter toggle", 
        wrong: ["Perform a low level quick-format on the local drive", "Boot into system UEFI flash utility to update BIOS", "Scrub system registry entries using third-party utility cleaning suites"] 
      },
      { 
        type: "terminal", 
        cmd: "ipconfig /flushdns", 
        hint: "Clear cached old domains using the local DNS resolver flush parameters" 
      }
    ]
  },
  {
    title: "USB Printer Offline",
    desc: "Industrial high-yield workstation USB printer displays Offline status on Windows spooler registers.",
    icon: "🖨️",
    steps: [
      { 
        type: "mcq", 
        q: "What element requires an active physical check first?", 
        correct: "Inspect the physical connection status of the USB-B server communication link", 
        wrong: ["Order direct factory printer unit replacements", "Wipe the system using high-level diagnostic drive utilities", "Install modern hyper-threaded desktop graphics render libraries"] 
      },
      { 
        type: "cable", 
        target: "USB Port", 
        ports: ["USB Port", "Ethernet Port", "HDMI Port"], 
        label: "Secure USB communication link to appropriate physical socket match" 
      },
      { 
        type: "mcq", 
        q: "Cable resides perfectly inside correct socket port but continues registering offline. Best process repair command?", 
        correct: "Initiate restart sequence on the Windows Print Spooler background software service", 
        wrong: ["Exchange the central compute motherboard processing socket assembly", "Procure extra high-resolution screen display monitors", "Initiate a deep malware antivirus volume filesystem catalog scan"] 
      },
      { 
        type: "search", 
        answer: "HP LaserJet Pro M404", 
        hint: "Query precise hardware identifier 'HP LaserJet Pro M404' to load dedicated manufacturing drivers" 
      }
    ]
  },
  {
    title: "Severe Machine Congestion",
    desc: "Workstation experiences immense loading delays. Initial operations stack freeze easily on execution rails.",
    icon: "⚙️",
    steps: [
      { 
        type: "mcq", 
        q: "Which built-in software allows live mapping of resource allocation?", 
        correct: "Launch Task Manager metrics interface via terminal command parameters", 
        wrong: ["Re-install the primary operating system architecture on the spot", "Solder memory chips on top of slot rails", "Inject clean high-pressure atmospheric air to sweep system cavities"] 
      },
      { 
        type: "terminal", 
        cmd: "sfc /scannow", 
        hint: "Initiate System File Checker parameters to audit core system files for data corruption" 
      },
      { 
        type: "mcq", 
        q: "Real-time task tracking discovers 100% active storage throughput constraints. Safest speed restoration fix?", 
        correct: "Disable unnecessary high-priority initial load startup applications", 
        wrong: ["Replace active workstation power conversion transformers", "Immediately purchase liquid-cooled processing arrays", "Change display interface wallpapers to custom high contrast hues"] 
      }
    ]
  },
  {
    title: "Direct System Panic (BSOD)",
    desc: "Machine produces random memory blue-screens with 'MEMORY_MANAGEMENT' system indicators.",
    icon: "🔬",
    steps: [
      { 
        type: "mcq", 
        q: "What is your immediate diagnostics action prior to system hardware dismantle?", 
        correct: "Record the hexadecimal error code to isolate the specific sector trace triggers", 
        wrong: ["Disregard system codes entirely and boot the load system loop again", "Run verification scripts inside the software configuration files", "Procure dedicated custom graphics chips for standard office machines"] 
      },
      { 
        type: "terminal", 
        cmd: "mdsched.exe", 
        hint: "Trigger the Windows Memory Diagnostics execution module console to test cache modules" 
      },
      { 
        type: "mcq", 
        q: "Diagnostics identifies deep memory cluster failures. Actionable physical resolution stage?", 
        correct: "Unlatch, clean, and securely reseat memory slots into appropriate channel pins", 
        wrong: ["Apply patch updates to dynamic audio rendering systems", "Clear temporary user download folders in client directories", "Command system disks to execute a deep magnetic cylinder defragmentation run"] 
      }
    ]
  }
];

export default function TechSupportGame({ uid, displayName, onGameEnd, onExit }: TechSupportGameProps) {
  const { theme } = useTheme();
  const [screen, setScreen] = useState<"welcome" | "reviewer" | "playing" | "gameover">("welcome");
  const [activeScenarios, setActiveScenarios] = useState<Scenario[]>([]);
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState<number>(0);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  
  // Scoring & Stats
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(20);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalTimeMs, setTotalTimeMs] = useState<number>(0);
  const [stepsAnswered, setStepsAnswered] = useState<number>(0);

  // Interaction State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; msg: string; pointsAwarded?: number } | null>(null);
  const [historyLines, setHistoryLines] = useState<string[]>([]);
  const [cmdInputValue, setCmdInputValue] = useState<string>("");
  const [searchInputVal, setSearchInputVal] = useState<string>("");
  const [shuffledMcqOptions, setShuffledMcqOptions] = useState<string[]>([]);
  const [dragOverPortName, setDragOverPortName] = useState<string | null>(null);

  const termInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Total steps across current active sequence
  const totalLabSteps = activeScenarios.reduce((sum, s) => sum + s.steps.length, 0);

  // Progress indexes helper
  const getCurrentGlobalStepIndex = () => {
    let completed = 0;
    for (let i = 0; i < currentScenarioIdx; i++) {
      completed += activeScenarios[i].steps.length;
    }
    return completed + currentStepIdx;
  };

  const currentScenario = activeScenarios[currentScenarioIdx];
  const currentStep = currentScenario?.steps[currentStepIdx];

  // Quick helper to shuffle options
  const initializeMcq = (step: StepMCQ) => {
    const opts = [step.correct, ...step.wrong];
    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    setShuffledMcqOptions(shuffled);
  };

  // Start continuous 3-ticket sequence run
  const handleStartGame = () => {
    const selected = [...ALL_SCENARIOS].sort(() => Math.random() - 0.5).slice(0, 3);
    setActiveScenarios(selected);
    setCurrentScenarioIdx(0);
    setCurrentStepIdx(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setTotalTimeMs(0);
    setStepsAnswered(0);
    setFeedback(null);
    setIsProcessing(false);
    setHistoryLines([]);
    setCmdInputValue("");
    setSearchInputVal("");
    setTimeRemaining(20);
    setScreen("playing");

    const firstStep = selected[0].steps[0];
    if (firstStep.type === "mcq") {
      initializeMcq(firstStep);
    }
  };

  // Setup loop ticking time limit down when game active and no answers loaded yet
  useEffect(() => {
    if (screen !== "playing" || isProcessing || feedback !== null) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, isProcessing, feedback]);

  const triggerTimeout = () => {
    setIsProcessing(true);
    setStreak(0);
    setStepsAnswered((prev) => prev + 1);
    setTotalTimeMs((prev) => prev + 20000);

    let displayAnswer = "";
    if (currentStep) {
      if (currentStep.type === "mcq") displayAnswer = currentStep.correct;
      else if (currentStep.type === "terminal") displayAnswer = currentStep.cmd;
      else if (currentStep.type === "cable") displayAnswer = currentStep.target;
      else if (currentStep.type === "search") displayAnswer = currentStep.answer;
    }

    setFeedback({
      isCorrect: false,
      msg: `TIME ELAPSED: Protocol diagnostic deadline hit! Expected response: "${displayAnswer}"`
    });
  };

  const handleAnswerSubmit = (isCorrect: boolean, displayCorrectAnswer: string, basePoints = 100) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const timeSpent = 20 - timeRemaining;
    setTotalTimeMs((prev) => prev + (timeSpent * 1000));
    setStepsAnswered((prev) => prev + 1);

    let pointsEarned = 0;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      const speedBonus = Math.round(timeRemaining * 12);
      const streakMultiplier = 1 + (newStreak * 0.2); // +20% per streak
      pointsEarned = Math.round((basePoints + speedBonus) * streakMultiplier);
      setScore((prev) => prev + pointsEarned);

      setFeedback({
        isCorrect: true,
        msg: `SYSTEM RESOLVED: Step procedure validation clear!`,
        pointsAwarded: pointsEarned
      });
    } else {
      setStreak(0);
      setFeedback({
        isCorrect: false,
        msg: `INCORRECT PROCEDURE: Required solution: "${displayCorrectAnswer}"`
      });
    }
  };

  const handleNextStep = () => {
    const activeTicket = activeScenarios[currentScenarioIdx];
    let nextStep = currentStepIdx + 1;
    let nextScenario = currentScenarioIdx;

    if (nextStep >= activeTicket.steps.length) {
      nextScenario++;
      nextStep = 0;
    }

    if (nextScenario >= activeScenarios.length) {
      // Completed last ticket scenario step
      setScreen("gameover");
      return;
    }

    setCurrentScenarioIdx(nextScenario);
    setCurrentStepIdx(nextStep);
    setFeedback(null);
    setIsProcessing(false);
    setCmdInputValue("");
    setSearchInputVal("");
    setHistoryLines([]);
    setTimeRemaining(20);

    const nextStepObj = activeScenarios[nextScenario].steps[nextStep];
    if (nextStepObj && nextStepObj.type === "mcq") {
      initializeMcq(nextStepObj);
    }
  };

  const handleFinishAndSave = () => {
    const avgReactionTimeMs = stepsAnswered > 0 ? Math.round(totalTimeMs / stepsAnswered) : 1800;
    const cappedScore = Math.min(16000, score);
    onGameEnd(cappedScore, avgReactionTimeMs, "🔧 SUPPORT:");
  };

  // Cable Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", "cable");
  };

  const handleDrop = (e: React.DragEvent, portName: string, targetPort: string) => {
    e.preventDefault();
    setDragOverPortName(null);
    const isCorrect = portName === targetPort;
    handleAnswerSubmit(isCorrect, targetPort, 150);
  };

  return (
    <div id="tech-support-lab-root" className={`w-full flex flex-col h-full min-h-[500px] border rounded-xl relative overflow-hidden font-sans transition-all duration-300 lab-light-panel text-ink`}>
      
      <AnimatePresence mode="wait">
        
        {/* WELCOME INTRO SCREEN */}
        {screen === "welcome" && (
          <motion.div
            key="support-welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-6 max-w-2xl mx-auto py-12"
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Wrench className="w-8 h-8 text-stone-950" />
            </div>

            <div className="space-y-2">
              <span className={`text-[10px] font-mono font-medium tracking-widest uppercase border px-3 py-1 rounded-full transition-colors ${
                "bg-success-subtle"
              }`}>
                MODULE 06 ACTIVE • INCIDENT TRAINER
              </span>
              <h1 className={`text-3xl font-medium tracking-tight mt-1 transition-colors text-ink`}>
                Tech Support Incident Lab
              </h1>
              <p className={`text-xs leading-relaxed max-w-md mx-auto transition-colors text-muted`}>
                Step directly into active physical & software server-room failures. Flush DNS, match complex connectivity sockets, search factory model registers, and maintain ticket resolution streaks under a ticking clock.
              </p>
            </div>

            <div className="flex flex-col gap-4 pt-4 w-full justify-center items-center">
              <div className="flex flex-row gap-4 w-full justify-center">
                <button
                  id="btn-support-start"
                  onClick={handleStartGame}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-stone-950 font-mono text-xs font-medium uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/45 min-h-[44px]"
                >
                  <Wrench className="w-4 h-4 text-stone-950" />
                  Start Diagnostic Run
                </button>
                
                <button
                  id="btn-support-tutorial"
                  onClick={() => setScreen("reviewer")}
                  className={`px-6 py-3 rounded-xl border transition-all font-mono text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                    "bg-surface border-border text-muted hover:bg-surface-raised hover:text-signal"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Field Manual Review
                </button>
              </div>
              <button
                onClick={onExit}
                className={`px-6 py-3 rounded-xl border transition-all font-mono text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                  "bg-surface border-border text-muted"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Exit Lab
              </button>
            </div>
          </motion.div>
        )}

        {/* FIELD MANUAL REVIEWER */}
        {screen === "reviewer" && (
          <motion.div
            key="support-manual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 p-6 space-y-6 max-w-3xl mx-auto w-full py-8"
          >
            <div className={`flex justify-between items-center border-b pb-4 border-border`}>
              <div className="flex items-center gap-2">
                <BookOpen className={`w-5 h-5 text-signal`} />
                <h2 className={`text-lg font-medium text-ink`}>📚 System Troubleshooting Guide</h2>
              </div>
              <button
                id="btn-reviewer-back"
                onClick={() => setScreen("welcome")}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  "bg-surface border-border text-ink"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 border rounded-xl space-y-2.5 bg-surface border-border`}>
                <div className={`flex items-center gap-1.5 text-xs font-medium font-mono text-success`}>
                  <Terminal className="w-3.5 h-3.5" /> CLI STANDARD CODES
                </div>
                <ul className={`space-y-2 text-[11px] font-mono text-muted`}>
                  <li><code className={`font-semibold px-1 py-0.5 rounded bg-surface-raised`}>ping 192.168.1.1</code> - Verifies low-level switch connectivity</li>
                  <li><code className={`font-semibold px-1 py-0.5 rounded bg-surface-raised`}>ipconfig /flushdns</code> - Purges obsolete internet routing caches</li>
                  <li><code className={`font-semibold px-1 py-0.5 rounded bg-surface-raised`}>sfc /scannow</code> - Inspects and registers operating system files</li>
                  <li><code className={`font-semibold px-1 py-0.5 rounded bg-surface-raised`}>mdsched.exe</code> - Schedules RAM sector diagnostics</li>
                </ul>
              </div>

              <div className={`p-4 border rounded-xl space-y-2.5 bg-surface border-border`}>
                <div className={`flex items-center gap-1.5 text-xs font-medium font-mono `}>
                  <Cable className="w-3.5 h-3.5" /> CONNECTOR MAPPINGS
                </div>
                <ul className={`space-y-2 text-[11px] text-muted`}>
                  <li><strong className={`text-ink font-medium`}>USB-B Ports:</strong> Feeds external print spoolers and local mainframe peripherals.</li>
                  <li><strong className={`text-ink font-medium`}>RJ45 Ports:</strong> Employs copper twisted-pair ethernet links to routers/switches.</li>
                  <li><strong className={`text-ink font-medium`}>HDMI Ports:</strong> Standard audio-visual output transmission pin arrays.</li>
                </ul>
              </div>

              <div className={`p-4 border rounded-xl space-y-2 col-span-1 md:col-span-2 bg-surface border-border`}>
                <div className={`text-xs font-medium font-mono text-success`}>
                  🔧 ACTIVE INCIDENT PHASES (THE IT BLUEPRINT)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono">
                  {[
                    { step: "01", name: "Isolate", desc: "Read server reports" },
                    { step: "02", name: "Theory", desc: "Verify cable pins" },
                    { step: "03", name: "Execute", desc: "Run ping tools" },
                    { step: "04", name: "Secure", desc: "Solder/lock plugs" },
                    { step: "05", name: "Release", desc: "Save validation logs" }
                  ].map((item, id) => (
                    <div key={id} className={`p-2.5 border rounded-lg text-center space-y-1 ${
                      "bg-surface-raised border-border"
                    }`}>
                      <span className="block text-[10px] font-mono font-medium text-stone-500">{item.step}</span>
                      <h4 className={`text-[11px] font-medium text-ink`}>{item.name}</h4>
                      <p className="text-[9px] text-stone-500 leading-snug">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIVE LAB PLAYING LOOP */}
        {screen === "playing" && currentScenario && currentStep && (
          <motion.div
            key="support-playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full w-full"
          >
            {/* Top Scorebar Header */}
            <div className={`p-4 border flex flex-wrap gap-4 items-center justify-between transition-colors bg-surface border-border`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={onExit}
                  className={`px-2.5 py-1 text-[9.5px] font-mono font-medium uppercase rounded-md transition-colors cursor-pointer border ${
                    "bg-surface border-border text-muted"
                  }`}
                >
                  Exit
                </button>
                <span className={`px-2.5 py-1 text-[9.5px] font-mono font-medium uppercase rounded-md border transition-colors ${
                  "border-border text-signal"
                }`}>
                  🔧 Tech Support Lab
                </span>
                <span className={`text-[11px] font-mono font-medium text-signal`}>
                  Step {getCurrentGlobalStepIndex() + 1} of {totalLabSteps}
                </span>
              </div>

              {/* Realtime multiplier/stats row */}
              <div className="flex items-center gap-3 font-mono">
                {streak > 1 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex items-center gap-1 border px-2 py-0.5 rounded-md text-[10px] font-medium ${
                      "bg-warning-subtle border-warning text-warning"
                    }`}
                  >
                    <Flame className={`w-3 h-3 fill-amber-600`} />
                    <span>STREAK: {streak}</span>
                    <span className="italic opacity-70">[{ (1 + streak * 0.15).toFixed(2) }x multiplier]</span>
                  </motion.div>
                )}

                <div className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-md ${
                  "bg-surface border-border"
                }`}>
                  <Zap className={`w-3.5 h-3.5 fill-cyan-500 text-success`} />
                  <span className={`text-sm font-black `}>{score}</span>
                  <span className={`text-[10px] text-signal`}>XP</span>
                </div>
              </div>
            </div>

            {/* Global Progress Bar */}
            <div className="w-full h-1 bg-stone-950">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${(getCurrentGlobalStepIndex() / totalLabSteps) * 100}%` }}
              />
            </div>

            {/* Ticket Information Section */}
            <div className="p-6 space-y-6 flex-1 max-w-3xl mx-auto w-full">
              
              <div className={`p-4 border rounded-xl relative overflow-hidden transition-colors bg-surface border-border`}>
                <div className="absolute top-0 right-0 p-4 text-4xl opacity-15 select-none">{currentScenario.icon}</div>
                <div className="space-y-1">
                  <div className={`text-[9.5px] font-mono font-medium tracking-widest uppercase transition-colors text-warning`}>
                    ACTIVE INCIDENT TICKET #{currentScenarioIdx + 1} • {currentStep.type.toUpperCase()} PHASE
                  </div>
                  <h3 className={`text-sm font-medium transition-colors text-signal`}>{currentScenario.title}</h3>
                  <p className={`text-xs leading-relaxed font-sans transition-colors text-muted`}>{currentScenario.desc}</p>
                </div>
              </div>

              {/* Dynamic Step Content Renderer */}
              <div className="space-y-5 flex-1">
                
                {/* 1. MCQ COMPONENT */}
                {currentStep.type === "mcq" && (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 text-xs font-medium font-mono pb-1 border-b ${
                      "border-border"
                    }`}>
                      <HelpCircle className={`w-4 h-4 text-success`} /> STEP QUESTION FIELD:
                    </div>
                    <p className={`text-sm font-semibold leading-relaxed text-ink`}>
                      {currentStep.q}
                    </p>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {shuffledMcqOptions.map((opt, i) => {
                        const isCorrectOpt = opt === currentStep.correct;
                        const hasSelected = feedback !== null;
                        
                        let optStyle = "cursor-pointer bg-surface border-border text-ink hover:bg-surface-raised";
                        if (hasSelected) {
                          if (isCorrectOpt) {
                            optStyle = "font-medium cursor-not-allowed bg-success-subtle border-success text-success";
                          } else {
                            optStyle = "cursor-not-allowed bg-surface-raised border-border text-muted";
                          }
                        }

                        return (
                          <button
                            key={i}
                            disabled={hasSelected}
                            onClick={() => handleAnswerSubmit(isCorrectOpt, currentStep.correct, 100)}
                            className={`p-4 border text-left text-xs font-semibold rounded-xl transition-all duration-150 flex items-center justify-between ${optStyle}`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="font-mono text-[10px] text-stone-500 font-medium">{String.fromCharCode(65 + i)}.</span>
                              <span>{opt}</span>
                            </span>
                            {hasSelected && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. TERMINAL SHELL INSTRUCTIONS */}
                {currentStep.type === "terminal" && (
                  <div className="space-y-4">
                    <div className={`flex items-center gap-2 text-xs font-medium font-mono pb-1 border-b ${
                      "border-border"
                    }`}>
                      <Terminal className="w-4 h-4 text-emerald-400" /> CLI DIAGNOSTIC TERMINAL:
                    </div>

            <div className={`p-4 border rounded-xl font-mono text-[11px] leading-relaxed space-y-1.5 shadow-xl min-h-[170px] cursor-text transition-all duration-150 ${
                        feedback !== null ? ("border-border") : ("border-border")
                      } bg-surface`}
                      onClick={() => {
                        if (feedback === null) termInputRef.current?.focus();
                      }}
                    >
                      <div className={"font-semibold text-muted"}>Microsoft IT-Sandbox Utility Console [Build 10.0.22]</div>
                      <div className={"text-muted"}>Submit the parameters and parameters necessary to analyze ports and gateways.</div>
                      <div className="text-stone-500">&nbsp;</div>

                      {historyLines.map((line, idx) => (
                        <div key={idx} className={"text-success"}>
                          <span className={"text-success"}>C:\Users\SysAdmin&gt;</span> {line}
                        </div>
                      ))}

                      {feedback === null && (
                        <div className="flex items-center gap-1.5">
                          <span className={"shrink-0 text-success"}>C:\Users\SysAdmin&gt;</span>
                          <input
                            ref={termInputRef}
                            type="text"
                            value={cmdInputValue}
                            disabled={isProcessing || feedback !== null}
                            onChange={(e) => setCmdInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const typed = cmdInputValue.trim();
                                if (!typed) return;
                                
                                setHistoryLines(prev => [...prev, typed]);
                                const isCorrect = typed.toLowerCase() === currentStep.cmd.toLowerCase();
                                handleAnswerSubmit(isCorrect, currentStep.cmd, 150);
                              }
                            }}
                            placeholder="Type command parameters..."
                            className={`bg-transparent border-none outline-none flex-1 font-mono text-[11px] h-6 p-0 focus:ring-0 w-full font-medium`}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    {feedback === null && (
                      <div className="text-[10px] text-stone-500 font-mono flex items-center justify-between px-1">
                        <span>💡 Hint: {currentStep.hint}</span>
                        <span className="text-emerald-500/80 font-medium">Press [ENTER] to execute</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CABLE INSTRUCTION FOR COMPONENT */}
                {currentStep.type === "cable" && (
                  <div className="space-y-4">
                    <div className={`flex items-center gap-2 text-xs font-medium font-mono pb-1 border-b ${
                      "border-border"
                    }`}>
                      <Cable className="w-4 h-4 text-emerald-400" /> HARNESS INTEGRITY DOCKING:
                    </div>

                    <p className={`text-xs font-semibold text-center tracking-wide text-muted`}>
                      {currentStep.label}
                    </p>

                    <div className={`border p-6 rounded-xl flex flex-col items-center justify-center min-h-[200px] gap-8 relative overflow-hidden transition-colors bg-surface border-border`}>
                      
                      {/* Target Port Blocks */}
                      <div className="flex justify-around items-center w-full gap-4 max-w-md">
                        {currentStep.ports.map((portName, idx) => {
                          const isTargetCorrect = portName === currentStep.target;
                          const isDraggedOver = dragOverPortName === portName;
                          const hasSelected = feedback !== null;
                          
                          let portCardStyle = "bg-surface-raised border-border text-muted";
                          if (isDraggedOver) {
                            portCardStyle = "bg-amber-500/10 border-amber-500 text-amber-600 scale-105";
                          } else if (hasSelected) {
                            if (isTargetCorrect) {
                              portCardStyle = "bg-success-subtle border-success text-success";
                            } else {
                              portCardStyle = "opacity-50 bg-surface";
                            }
                          }

                          return (
                            <div
                              key={idx}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (!hasSelected) setDragOverPortName(portName);
                              }}
                              onDragLeave={() => setDragOverPortName(null)}
                              onDrop={(e) => handleDrop(e, portName, currentStep.target)}
                              className={`w-28 h-20 rounded-xl border-2 flex flex-col justify-center items-center font-mono text-[10px] transition-all duration-150 ${portCardStyle}`}
                            >
                              <div className="text-lg">🔌</div>
                              <span className="font-medium">{portName}</span>
                              {!hasSelected && <span className={`text-[7.5px] mt-0.5 text-muted`}>Drop zone</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Draggable block */}
                      {feedback === null && (
                        <motion.div
                          draggable
                          onDragStart={handleDragStart as any}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-xs font-medium font-mono uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing shadow-lg shadow-amber-500/10 border border-amber-400/20"
                        >
                          <Cable className="w-3.5 h-3.5 text-stone-950" />
                          <span>Harness Pinout Connector Block</span>
                        </motion.div>
                      )}

                      {feedback !== null && (
                        <div className="text-[10px] text-stone-500 font-mono uppercase tracking-widest animate-pulse">
                          CABLE VERIFICATION STAGE LOCKED
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* 4. SEARCH MODEL / REGISTER LOOKUP */}
                {currentStep.type === "search" && (
                  <div className="space-y-4">
                    <div className={`flex items-center gap-2 text-xs font-medium font-mono pb-1 border-b ${
                      "border-border"
                    }`}>
                      <Search className="w-4 h-4 text-cyan-400" /> MANUFACTURING SPECIFICATIONS DATABASE:
                    </div>

                    <div className={`p-6 rounded-xl flex flex-col items-center justify-center space-y-4 border transition-colors bg-surface border-border`}>
                      <p className={`text-xs font-medium text-center uppercase tracking-wide font-mono transition-colors text-signal`}>
                        Query system module catalog registries:
                      </p>

                      <div className={`flex gap-2 w-full max-w-md border rounded-full p-1.5 shadow-lg transition-colors bg-surface border-border`}>
                        <span className="pl-3 flex items-center justify-center text-stone-500 text-sm">🔍</span>
                        <input
                          ref={searchInputRef}
                          type="text"
                          disabled={feedback !== null}
                          value={searchInputVal}
                          onChange={(e) => setSearchInputVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const query = searchInputVal.trim();
                              const isCorrect = query.toLowerCase() === currentStep.answer.toLowerCase();
                              handleAnswerSubmit(isCorrect, currentStep.answer, 150);
                            }
                          }}
                          placeholder="Type model manufacturer ID (e.g. HP LaserJet...)"
                          className={`flex-1 bg-transparent border-none outline-none text-xs font-mono py-1 px-2 focus:ring-0 text-signal`}
                        />
                        <button
                          disabled={feedback !== null}
                          onClick={() => {
                            const query = searchInputVal.trim();
                            const isCorrect = query.toLowerCase() === currentStep.answer.toLowerCase();
                            handleAnswerSubmit(isCorrect, currentStep.answer, 150);
                          }}
                          className={`px-5 py-1.5 rounded-full text-xs font-medium font-mono uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer ${
                            "text-ink"
                          }`}
                        >
                          Send Query
                        </button>
                      </div>
                    </div>

                    {feedback === null && (
                      <div className="text-[10px] text-stone-500 font-mono flex items-center justify-between px-1">
                        <span>💡 Hint: {currentStep.hint}</span>
                        <span className="text-cyan-500/80 font-medium">Requires exact identifier matching</span>
                      </div>
                    )}
                  </div>
                )}

                {/* COUNTDOWN TIMER / INTERACTION EXPLAINS BAR */}
                <div className="pt-2">
                  <AnimatePresence mode="wait">
                    {feedback === null ? (
                      <motion.div
                        key="timer-counter"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`p-4 rounded-xl flex items-center justify-between tracking-wider font-mono text-xs border transition-colors ${
                          "bg-surface border-border"
                        }`}
                      >
                        <div className={`flex items-center gap-1.5 text-signal`}>
                          <Timer className={`w-4 h-4 animate-spin text-warning`} />
                          <span>DIAGNOSTIC TIME COUNTER:</span>
                        </div>
                        <span className={`text-sm font-black ${timeRemaining < 7 ? "text-red-500 animate-pulse" : ("text-warning")}`}>
                          {timeRemaining} SECONDS APART
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="feedback-banner"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border p-4 rounded-xl space-y-3 transition-colors bg-surface border-border`}
                      >
                        <div className="flex items-center gap-2 text-xs font-medium font-mono">
                          {feedback.isCorrect ? (
                            <div className="text-emerald-500 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4" /> INCIDENT SECTOR RESOLVED! (+{feedback.pointsAwarded} XP)
                            </div>
                          ) : (
                            <div className="text-red-500 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" /> REPAIR DISRUPTED! (Streak Broken)
                            </div>
                          )}
                        </div>

                        <p className={`text-xs leading-relaxed font-sans text-muted`}>
                          {feedback.msg}
                        </p>

                        <div className={`pt-2 flex justify-end border-t `}>
                          <button
                            onClick={handleNextStep}
                            className={`px-4 py-2 rounded-lg font-medium font-mono text-xs tracking-wider uppercase flex items-center gap-1 transition cursor-pointer min-h-[38px] ${
                              "text-ink"
                            }`}
                          >
                            {getCurrentGlobalStepIndex() >= totalLabSteps - 1 ? "View Assessment Card" : "Diagnose Next Incident Step"}
                            <ChevronRight className="w-3.5 h-3.5 text-current" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

            {/* Bottom Footer Indicators */}
            <div className={`p-4 border-t flex justify-between items-center text-[10px] font-mono transition-colors ${
              "bg-surface border-border text-muted"
            }`}>
              <div className="flex items-center gap-1">
                <Sparkles className={`w-3.5 h-3.5 mr-0.5 text-warning`} />
                <span>Keep ticket success streak count high to multiply final XP.</span>
              </div>
            </div>

          </motion.div>
        )}

        {/* RESULTS SCORE CARD SCREEN */}
        {screen === "gameover" && (
          <motion.div
            key="support-gameover"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex-1 flex items-center justify-center p-6 ${
              "bg-surface-raised"
            }`}
          >
            <div className={`w-full max-w-md border rounded-xl p-6 relative overflow-hidden space-y-6 text-center shadow-xl font-sans transition-colors ${
              "bg-surface border-border"
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                "border bg-success-subtle"
              }`}>
                <Award className="w-6 h-6 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h3 className={`text-xl font-medium tracking-wider font-mono uppercase ${
                  "text-signal"
                }`}>SUPPORT DIALS COMPLETE</h3>
                <p className={`text-[11px] max-w-xs mx-auto ${
                  ""
                }`}>
                  IT Incident Center has analyzed your field protocol execution rates and speed.
                </p>
              </div>

              {/* Assessment Metrics */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className={`p-3 rounded-xl border space-y-1 transition-colors ${
                  "bg-surface-raised border-border"
                }`}>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Diagnostics</span>
                  <span className={`text-lg font-medium `}>
                    {totalLabSteps > 0 ? Math.round((correctCount / totalLabSteps) * 100) : 0}%
                  </span>
                  <span className={`text-[9px] block font-sans text-muted`}>({correctCount} of {totalLabSteps} steps)</span>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 transition-colors ${
                  "bg-surface-raised border-border"
                }`}>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Peak Streak</span>
                  <span className="text-lg font-medium text-amber-500">{maxStreak}</span>
                  <span className={`text-[9px] block font-sans text-muted`}>Multiplying Rating</span>
                </div>

                <div className={`p-3 rounded-xl border col-span-2 space-y-1 transition-colors ${
                  "bg-surface-raised border-border"
                }`}>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Total Earned XP</span>
                  <div className={`text-2xl font-black tracking-tight `}>{score} XP</div>
                  <span className="text-[9.5px] text-amber-500 font-medium block mt-1">
                    {score >= 2500 ? "👑 MASTER INCIDENT ENGINEER" : score >= 1500 ? "⚙️ NETWORK EXPERT" : score >= 800 ? "🔧 FIELD DISPATCHER" : "🔩 TRAINEE"}
                  </span>
                </div>
              </div>

              {/* Action Buttons list */}
              <div className="pt-2 flex flex-col gap-2 font-mono">
                <div className="flex gap-3">
                  <button
                    onClick={onExit}
                    className={`flex-1 px-4 py-3 rounded-xl text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] border transition-colors ${
                      "bg-surface border-border text-muted"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Lobby
                  </button>

                  <button
                    onClick={handleStartGame}
                    className={`flex-1 px-4 py-3 rounded-xl text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] border transition-colors ${
                      "bg-surface border-border text-muted"
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Re-audit
                  </button>
                </div>

                <button
                  onClick={handleFinishAndSave}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-stone-950 transition rounded-xl text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <Award className="w-4 h-4 text-stone-950" />
                  Save Grade & exit
                </button>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
