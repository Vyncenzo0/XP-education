import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { Cpu, Grid, HardDrive, Zap, Info, ShieldAlert, Sparkles, AlertCircle, TrendingUp, Check, Award, RefreshCw } from "lucide-react";

interface PcBuilderGameProps {
  uid: string;
  displayName: string;
  onGameEnd: (score: number, avgReactionMs: number) => void;
  onExit: () => void;
  themeColor: string;
}

interface Scenario {
  title: string;
  description: string;
  budget: number;
  focus: string;
  icon: string;
}

interface ComponentOption {
  id: string;
  name: string;
  price: number;
  perf: number;
  specs: string;
  socket?: string;
  wattage?: number;
  powerOutput?: number; // For PSUs
}

const SCENARIOS: Scenario[] = [
  {
    title: "Casual Office Desktop",
    description: "Build a budget-friendly workstation for handling spreadsheet analytics and student office suites.",
    budget: 600,
    focus: "Budget Control & Efficiency",
    icon: "office"
  },
  {
    title: "Trainee Competitive E-Sports Rig",
    description: "Assemble a speed-centric machine optimized for stable frame rates at 1080p high refresh rates.",
    budget: 1200,
    focus: "Balanced GPU Power",
    icon: "gaming"
  },
  {
    title: "AI & rendering Workstation",
    description: "Construct a professional workstation capable of compiling intensive transformer models and CUDA renders.",
    budget: 2400,
    focus: "Dense Multi-threaded Computing",
    icon: "ai"
  }
];

// Part choices across assembly stages
const PARTS_DATABASE: Record<string, ComponentOption[]> = {
  cpu: [
    { id: "cpu-intel-12100f", name: "Intel Core i3-12100F", price: 90, perf: 40, specs: "4 Cores, Socket LGA1700, 58W TDP", socket: "LGA1700", wattage: 58 },
    { id: "cpu-amd-5600", name: "AMD Ryzen 5 5600X", price: 130, perf: 50, specs: "6 Cores, Socket AM4, 65W TDP", socket: "AM4", wattage: 65 },
    { id: "cpu-intel-13400", name: "Intel Core i5-13400", price: 190, perf: 65, specs: "10 Cores, Socket LGA1700, 65W TDP", socket: "LGA1700", wattage: 65 },
    { id: "cpu-amd-7800", name: "AMD Ryzen 7 7800X3D", price: 370, perf: 92, specs: "8 Cores, Socket AM5, 120W TDP", socket: "AM5", wattage: 120 },
    { id: "cpu-intel-13900", name: "Intel Core i9-13950HX", price: 540, perf: 98, specs: "24 Cores, Socket LGA1700, 125W TDP", socket: "LGA1700", wattage: 125 },
    { id: "cpu-amd-7950x", name: "AMD Ryzen 9 7950X", price: 699, perf: 100, specs: "16 Cores, Socket AM5, 170W TDP", socket: "AM5", wattage: 170 }
  ],
  motherboard: [
    { id: "mobo-asus-h610m", name: "ASUS PRIME H610M-K D4", price: 80, perf: 35, specs: "Socket LGA1700, DDR4 Support", socket: "LGA1700" },
    { id: "mobo-asrock-b550", name: "ASRock B550 PRO4", price: 95, perf: 45, specs: "Socket AM4, DDR4 Support", socket: "AM4" },
    { id: "mobo-gigabyte-b760", name: "Gigabyte B760M DS3H", price: 115, perf: 55, specs: "Socket LGA1700, DDR5 Support", socket: "LGA1700" },
    { id: "mobo-msi-b650", name: "MSI MAG B650 Tomahawk", price: 210, perf: 85, specs: "Socket AM5, DDR5 Support", socket: "AM5" },
    { id: "mobo-asus-rog-z790", name: "ASUS ROG STRIX Z790-F", price: 340, perf: 95, specs: "Socket LGA1700, Heavy Thermal Heatsinks", socket: "LGA1700" },
    { id: "mobo-msi-x670e", name: "MSI MEG X670E GODLIKE", price: 1199, perf: 100, specs: "Socket AM5, Extreme Overclocking", socket: "AM5" }
  ],
  gpu: [
    { id: "gpu-integrated", name: "Integrated APU Graphics", price: 0, perf: 12, specs: "Uses shared System Memory, 0W extra TDP", wattage: 0 },
    { id: "gpu-rtx-3050", name: "NVIDIA GeForce RTX 3050", price: 170, perf: 35, specs: "8GB VRAM, 130W TDP", wattage: 130 },
    { id: "gpu-rx-6600", name: "AMD Radeon RX 6600", price: 210, perf: 48, specs: "8GB VRAM, 132W TDP", wattage: 132 },
    { id: "gpu-rx-7800", name: "AMD Radeon RX 7800 XT", price: 490, perf: 88, specs: "16GB VRAM, 263W TDP", wattage: 263 },
    { id: "gpu-rtx-4070", name: "NVIDIA GeForce RTX 4070 Ti Super", price: 790, perf: 120, specs: "16GB VRAM, CUDA Cores, 285W TDP", wattage: 285 },
    { id: "gpu-rx-7900-xtx", name: "AMD Radeon RX 7900 XTX", price: 999, perf: 180, specs: "24GB VRAM, 355W TDP", wattage: 355 },
    { id: "gpu-rtx-4090", name: "NVIDIA GeForce RTX 4090", price: 1650, perf: 220, specs: "24GB VRAM, Extreme CUDA, 450W TDP", wattage: 450 }
  ],
  ram: [
    { id: "ram-ddr4-8", name: "8GB DDR4 3200MHz Single Box", price: 25, perf: 25, specs: "Single-channel setup, high latency" },
    { id: "ram-ddr4-16", name: "16GB DDR4 3600MHz Dual Kit", price: 55, perf: 50, specs: "Dual-channel optimized" },
    { id: "ram-ddr5-32", name: "32GB DDR5 6000MHz CL30", price: 120, perf: 85, specs: "Ultra-low timing DDR5" },
    { id: "ram-ddr5-64", name: "64GB DDR5 6400MHz Extreme Kit", price: 220, perf: 98, specs: "Designed for content creators and virtualization" },
    { id: "ram-ddr5-128", name: "128GB DDR5 5600MHz Workstation Kit", price: 450, perf: 110, specs: "Massive capacity for rendering workloads" }
  ],
  storage: [
    { id: "storage-hdd-2tb", name: "Seagate BarraCuda 2TB HDD", price: 45, perf: 15, specs: "Mechanical 5400RPM, slow load times" },
    { id: "storage-ssd-500", name: "Crucial MX500 500GB SATA SSD", price: 40, perf: 50, specs: "Standard 2.5 inch SATA, 560MB/s speeds" },
    { id: "storage-nvme-1tb", name: "Saber PCIe Gen3 NVMe 1TB", price: 70, perf: 75, specs: "M.2 SSD form factor, 3500MB/s speeds" },
    { id: "storage-nvme-2tb", name: "Samsung 990 Pro 2TB PCIe Gen4", price: 160, perf: 98, specs: "Premium high-density NVMe, 7450MB/s speeds" },
    { id: "storage-nvme-4tb", name: "Crucial T700 4TB PCIe Gen5 NVMe", price: 450, perf: 120, specs: "Ultra-fast PCIe Gen5, 12,400MB/s speeds" }
  ],
  psu: [
    { id: "psu-500", name: "EVGA 500W 80+ Bronze PSU", price: 45, perf: 40, specs: "500W Continuous Output capacity", powerOutput: 500 },
    { id: "psu-750", name: "Corsair RM750e 750W Gold Rated", price: 100, perf: 80, specs: "Modular, 750W 80+ Gold efficiency", powerOutput: 750 },
    { id: "psu-850", name: "Seasonic Focus GX-850 850W Gold", price: 140, perf: 88, specs: "Modular, 850W 80+ Gold efficiency", powerOutput: 850 },
    { id: "psu-1000", name: "ROG Loki 1000W Premium PSU", price: 190, perf: 98, specs: "Surgical power delivery, PCIe Gen5 native, 1000W output", powerOutput: 1000 },
    { id: "psu-1200", name: "Be Quiet! Dark Power Pro 12 1200W", price: 400, perf: 105, specs: "80+ Titanium certification, high performance", powerOutput: 1200 }
  ]
};

const STAGES = ["cpu", "motherboard", "gpu", "ram", "storage", "psu"];
const STAGE_NAMES: Record<string, string> = {
  cpu: "Central Processing Unit (CPU)",
  motherboard: "Motherboard (PCB)",
  gpu: "Graphics Card (GPU)",
  ram: "System RAM Memory",
  storage: "Hard Disk / NVMe Drive",
  psu: "Power Supply Unit (PSU)"
};

export default function PcBuilderGame({ uid, displayName, onGameEnd, onExit, themeColor }: PcBuilderGameProps) {
  const { theme } = useTheme();
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [selections, setSelections] = useState<Record<string, ComponentOption | null>>({
    cpu: null,
    motherboard: null,
    gpu: null,
    ram: null,
    storage: null,
    psu: null
  });

  // Lab flow states
  const [booting, setBooting] = useState<boolean>(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [showScoreScreen, setShowScoreScreen] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  // Stats for the final summary card
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalPowerRequired, setTotalPowerRequired] = useState<number>(0);
  const [compatibilityOk, setCompatibilityOk] = useState<boolean>(true);
  const [budgetExceeded, setBudgetExceeded] = useState<boolean>(false);
  const [issuesFound, setIssuesFound] = useState<string[]>([]);

  useEffect(() => {
    setGameStartTime(Date.now());
  }, []);

  // Compute stats based on current selections
  useEffect(() => {
    let cost = 0;
    let power = 0;
    let issues: string[] = [];

    // Sum costs
    STAGES.forEach((stage) => {
      const part = selections[stage];
      if (part) cost += part.price;
    });

    // CPU socket comparison with Mobo socket
    if (selections.cpu && selections.motherboard) {
      if (selections.cpu.socket !== selections.motherboard.socket) {
        issues.push(`Socket mismatch: CPU uses ${selections.cpu.socket} but motherboard requires ${selections.motherboard.socket}.`);
      }
    }

    // Power budget calculation (CPU TDP + GPU TDP + 50W motherboard overhead)
    let powerRequired = 50;
    if (selections.cpu?.wattage) powerRequired += selections.cpu.wattage;
    if (selections.gpu?.wattage) powerRequired += selections.gpu.wattage;
    
    setTotalPowerRequired(powerRequired);

    // PSU check
    if (selections.psu && selections.psu.powerOutput) {
      if (selections.psu.powerOutput < powerRequired) {
        issues.push(`Insufficient power! Estimated draw is ${powerRequired}W, but Power Supply only delivers ${selections.psu.powerOutput}W.`);
      }
    }

    // Scenario budget checks
    if (selectedScenarioIndex !== null) {
      const scenario = SCENARIOS[selectedScenarioIndex];
      if (cost > scenario.budget) {
        setBudgetExceeded(true);
      } else {
        setBudgetExceeded(false);
      }
    }

    setTotalCost(cost);
    setIssuesFound(issues);
    setCompatibilityOk(issues.length === 0);
  }, [selections, selectedScenarioIndex]);

  const selectScenario = (idx: number) => {
    setSelectedScenarioIndex(idx);
    setCurrentStageIndex(0);
    setSelections({
      cpu: null,
      motherboard: null,
      gpu: null,
      ram: null,
      storage: null,
      psu: null
    });
  };

  const handlePartSelect = (part: ComponentOption) => {
    const stage = STAGES[currentStageIndex];
    setSelections((prev) => ({
      ...prev,
      [stage]: part
    }));
  };

  const nextStage = () => {
    if (currentStageIndex < STAGES.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
    }
  };

  const prevStage = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex((prev) => prev - 1);
    }
  };

  // Run the POST / Boot Diagnostic Sequence lab!
  const runDiagnosticsAndBoot = () => {
    setBooting(true);
    setBootLogs([]);
    const logs = [
      "⚡ Initializing IT-MASTERY BIOS v2.0A...",
      "🔬 Running internal PC Diagnostics & Compatibility checks...",
      `🔌 Checking power budget. Required: ${totalPowerRequired}W / Offered: ${selections.psu?.powerOutput || 0}W`,
      `📦 Inspecting CPU socket: ${selections.cpu?.socket} <-> Intel/AMD slot map...`,
      `🎛️ Confirming Motherboard alignment: ${selections.motherboard?.name}...`,
      `💾 Checking high-frequency RAM standards...`,
      "💿 Indexing Storage boot partitions...",
      "🎮 Loading graphics framework rendering device..."
    ];

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < logs.length) {
        setBootLogs((prev) => [...prev, logs[currentLogIdx]]);
        currentLogIdx++;
      } else {
        clearInterval(interval);
        
        // Push outcome logs
        setTimeout(() => {
          if (!compatibilityOk) {
            setBootLogs((prev) => [
              ...prev,
              "❌ BIOS CRITICAL: POST Boot failure detected!",
              ...issuesFound.map((issue) => `⚠️ DIAGNOSTIC: ${issue}`)
            ]);
          } else if (budgetExceeded) {
            setBootLogs((prev) => [
              ...prev,
              "❌ FINANCIAL REJECT: Build went over strict budget limitations!",
              "🔥 Client refused delivery."
            ]);
          } else {
            setBootLogs((prev) => [
              ...prev,
              "🎉 BIOS POST: Success! Motherboard status green. Liquid cooling online.",
              "🚀 Machine safely booted. Running Prime95 performance test logs..."
            ]);
          }

          // Complete diagnostic phase & view scores
          setTimeout(() => {
            calculateAndSubmitScores();
          }, 1800);
        }, 600);
      }
    }, 450);
  };

  const calculateAndSubmitScores = () => {
    if (selectedScenarioIndex === null) return;
    const scenario = SCENARIOS[selectedScenarioIndex];

    let perfSum = 0;
    STAGES.forEach((stage) => {
      const part = selections[stage];
      if (part) perfSum += part.perf;
    });

    let ratingScore = 0;
    if (compatibilityOk && !budgetExceeded) {
      // Base performance multiplier points
      const basePoints = perfSum * 30;

      // Budget friendliness bonus
      const savings = scenario.budget - totalCost;
      const savingsBonus = Math.round((savings / scenario.budget) * 2000);

      // Core alignment bonus: check if focus is reached
      let focusBonus = 800; // default initial alignment bonus
      if (scenario.icon === "ai" && selections.gpu && selections.gpu.perf >= 120) {
        focusBonus += 1200; // Big workstation bonus for fast GPUs with tensor capabilities
      }
      if (scenario.icon === "gaming" && selections.ram && selections.ram.perf >= 85) {
        focusBonus += 800; // Dual channel gaming bonus
      }

      ratingScore = basePoints + savingsBonus + focusBonus;
    } else {
      // Heavy deductions for failed/incompatible rigs
      ratingScore = Math.max(100, perfSum * 5 - (issuesFound.length * 400) - (budgetExceeded ? 1000 : 0));
    }

    setFinalScore(ratingScore);
    setBooting(false);
    setShowScoreScreen(true);
  };

  const handleFinishScoreSubmission = () => {
    // Return average "reaction" time as simulated completion duration for logs (seconds -> ms)
    const timeTakenMs = Date.now() - gameStartTime;
    onGameEnd(finalScore, Math.round(timeTakenMs / 100)); // standard reactions index
  };

  // Render Category Select Screen
  if (selectedScenarioIndex === null) {
    return (
      <div id="builder-home-container" 
        className={`p-6 flex flex-col h-full border rounded-xl relative overflow-hidden transition-all duration-300 bg-surface border-border text-ink`}
      >
        {/* Modern Vector Motherboard Diagram Background Layer instead of pixelated JPG */}
        <div className={`absolute inset-0 z-0 opacity-[0.08] pointer-events-none select-none text-signal`}>
          <svg viewBox="0 0 800 500" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="100" y="20" width="600" height="460" rx="16" />
            <rect x="250" y="80" width="160" height="160" rx="8" />
            {/* Grid of sockets */}
            <path d="M260,90 H400 M260,110 H400 M260,130 H400 M260,150 H400 M260,170 H400 M260,190 H400 M260,210 H400 M260,230 H400" />
            <path d="M270,80 V240 M290,80 V240 M310,80 V240 M330,80 V240 M350,80 V240 M370,80 V240 M390,80 V240" />
            <g transform="translate(460, 80)">
              <rect x="0" y="0" width="10" height="180" rx="1" />
              <rect x="20" y="0" width="10" height="180" rx="1" />
              <rect x="40" y="0" width="10" height="180" rx="1" />
              <rect x="60" y="0" width="10" height="180" rx="1" />
            </g>
            <rect x="150" y="300" width="380" height="24" rx="2" />
            <rect x="150" y="360" width="380" height="18" rx="2" />
            <circle cx="200" cy="220" r="30" />
            <path d="M420,160 H450 M410,240 V300 H300" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Cpu className={`w-5 h-5 text-signal`} />
            <h3 className="text-[13px] font-mono font-semibold tracking-[0.04em] uppercase text-signal">
              PC ASSEMBLY LABORATORY
            </h3>
          </div>
          <button
            onClick={onExit}
            className="text-[11px] uppercase font-mono font-normal tracking-wider py-[6px] px-[14px] rounded-[3px] border-[1.5px] transition cursor-pointer bg-transparent border-border text-muted hover:border-danger hover:text-danger"
          >
            Exit
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h4 className="text-[16px] font-mono font-medium tracking-normal text-signal uppercase">Choose Your Assembly Contract</h4>
            <p className="text-[15px] font-sans font-normal leading-[1.6] text-muted">
              Assemble a functional PC workstation satisfying client conditions. Keep components socket compatible and within budget lines to earn max rating scores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-left">
            {SCENARIOS.map((sc, scIdx) => {
              const isSelected = selectedScenarioIndex === scIdx;
              return (
                <div
                  key={scIdx}
                  id={`scenario-contract-${scIdx}`}
                  onClick={() => selectScenario(scIdx)}
                  className={`p-5 rounded-lg border transition duration-300 flex flex-col justify-between cursor-pointer group border-l-[3px] ${
                    isSelected
                      ? "border-l-signal bg-signal-subtle border-border"
                      : "border-l-transparent bg-surface border-border hover:border-l-signal hover:bg-signal-subtle"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm border transition-colors bg-surface-raised border-border text-signal group-hover:bg-signal-subtle group-hover:text-signal">
                      {sc.icon === "office" ? "📎" : sc.icon === "gaming" ? "👾" : "🧠"}
                    </div>
                    <h5 className="font-sans font-semibold text-[15px] transition-colors text-signal">
                      {sc.title}
                    </h5>
                    <p className="text-[12px] font-sans font-normal italic leading-[1.5] text-muted">
                      {sc.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t flex items-center justify-between border-border">
                    <div className="text-[11px] font-mono font-normal uppercase tracking-[0.06em] text-muted">Budget Cap</div>
                    <div className="font-mono font-medium text-[13px] text-ink">
                      ${sc.budget}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const scenario = SCENARIOS[selectedScenarioIndex];
  const activeStage = STAGES[currentStageIndex];
  const activePartOptions = PARTS_DATABASE[activeStage] || [];
  const currentSelection = selections[activeStage];

  return (
    <div id="pc-builder-active" className={`flex flex-col h-full border rounded-xl relative overflow-hidden transition-all duration-300 bg-surface border-border text-ink`}>
      
      {/* Lab Screen Overlay Diagnostic / Boot POST */}
      <AnimatePresence>
        {booting && (
          <motion.div
            id="boot-diagnostics-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-950 z-50 flex flex-col justify-between p-6 font-mono text-xs text-sky-400 leading-relaxed select-none"
          >
            <div className="space-y-2 max-w-2xl">
              <div className="flex justify-between items-center border-b border-sky-900/50 pb-3 mb-4 text-sky-500">
                <span>IT-MASTERY DIAGNOSTIC BOOT TERMINAL V2.20</span>
                <span className="animate-pulse">● LIVE PROBE</span>
              </div>
              
              <div className="space-y-1.5 font-mono">
                {bootLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log && typeof log === "string" && (log.startsWith("❌") || log.startsWith("⚠️"))
                        ? "text-red-400 font-semibold"
                        : log && typeof log === "string" && log.startsWith("🎉")
                        ? "text-emerald-400 font-semibold"
                        : "text-sky-300"
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-sky-600 border-t border-sky-900/50 pt-3 mt-4">
              <span>Checking complete motherboard layout</span>
              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Performing POST test
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* State Screen: Final Score Card */}
      <AnimatePresence>
        {showScoreScreen && (
          <motion.div
            id="pcbuilder-score-overlay"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-md bg-surface`}
          >
            <div className={`border rounded-xl p-6 w-full max-w-md text-center space-y-6 relative overflow-hidden shadow-2xl bg-surface border-border text-ink`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none" />

              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-success-subtle border-success text-signal`}>
                <Award className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h4 className={`text-xl md:text-2xl font-medium tracking-tight text-signal`}>BUILD EVALUATION RESULT</h4>
                <p className={`text-xs max-w-xs mx-auto text-muted`}>
                  IT-MASTERY diagnostic system has thoroughly assessed your PC specifications.
                </p>
              </div>

              {/* Status block depending on compatibility */}
              {compatibilityOk && !budgetExceeded ? (
                <div className={`py-2.5 px-4 rounded-xl font-mono text-[11px] inline-flex items-center gap-1.5 border bg-success-subtle border-success text-success`}>
                  <Check className={`w-4 h-4 `} /> RIG WORKING & WITHIN BUDGET CODE
                </div>
              ) : (
                <div className={`py-2.5 px-4 rounded-xl font-mono text-[11px] inline-flex items-center gap-1.5 flex-col text-left border bg-danger-subtle border-danger`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldAlert className={`w-4 h-4 text-danger`} /> RIG MALFUNCTION OR OVER BUDGET LIMIT
                  </div>
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[10px] text-red-300 font-sans">
                    {budgetExceeded && <li>Build exceeded the strict ${scenario.budget} scenario budget limit.</li>}
                    {issuesFound.map((is, i) => <li key={i}>{is}</li>)}
                  </ul>
                </div>
              )}

              {/* Score card detail */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <div className={`rounded-xl p-3 border bg-surface-raised border-border`}>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold font-mono">Build Score</span>
                  <span className={`font-mono text-2xl font-medium text-warning`}>{finalScore.toLocaleString()}</span>
                </div>
                <div className={`rounded-xl p-3 border bg-surface-raised border-border`}>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold font-mono">Component Cost</span>
                  <span className={`font-mono text-2xl font-semibold `}>${totalCost}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-sumbit-score-pcbuilder"
                  onClick={handleFinishScoreSubmission}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-stone-900 font-display font-medium text-sm rounded-xl transition duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/20"
                >
                  Post Score to Leaderboard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 bg-signal-subtle border-border`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full `} />
          <span className={`text-xs font-mono font-medium font-black text-signal`}>
            Contract: {scenario.title}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => {
               if (selectedScenarioIndex === 0) {
                 // Casual Office Optimization
                 setSelections({
                   cpu: PARTS_DATABASE.cpu.find(p => p.id === 'cpu-amd-5600') || null,
                   motherboard: PARTS_DATABASE.motherboard.find(p => p.id === 'mobo-asrock-b550') || null,
                   gpu: PARTS_DATABASE.gpu.find(p => p.id === 'gpu-integrated') || null,
                   ram: PARTS_DATABASE.ram.find(p => p.id === 'ram-ddr4-16') || null,
                   storage: PARTS_DATABASE.storage.find(p => p.id === 'storage-nvme-1tb') || null,
                   psu: PARTS_DATABASE.psu.find(p => p.id === 'psu-500') || null
                 });
               } else if (selectedScenarioIndex === 1) {
                 // E-Sports Rig Optimization
                 setSelections({
                   cpu: PARTS_DATABASE.cpu.find(p => p.id === 'cpu-intel-13400') || null,
                   motherboard: PARTS_DATABASE.motherboard.find(p => p.id === 'mobo-gigabyte-b760') || null,
                   gpu: PARTS_DATABASE.gpu.find(p => p.id === 'gpu-rx-7800') || null,
                   ram: PARTS_DATABASE.ram.find(p => p.id === 'ram-ddr4-16') || null,
                   storage: PARTS_DATABASE.storage.find(p => p.id === 'storage-nvme-1tb') || null,
                   psu: PARTS_DATABASE.psu.find(p => p.id === 'psu-750') || null
                 });
               } else if (selectedScenarioIndex === 2) {
                 // AI Workstation Optimization (Hits 20,000+)
                 setSelections({
                   cpu: PARTS_DATABASE.cpu.find(p => p.id === 'cpu-intel-13900') || null,
                   motherboard: PARTS_DATABASE.motherboard.find(p => p.id === 'mobo-asus-rog-z790') || null,
                   gpu: PARTS_DATABASE.gpu.find(p => p.id === 'gpu-rtx-4070') || null,
                   ram: PARTS_DATABASE.ram.find(p => p.id === 'ram-ddr5-32') || null,
                   storage: PARTS_DATABASE.storage.find(p => p.id === 'storage-nvme-2tb') || null,
                   psu: PARTS_DATABASE.psu.find(p => p.id === 'psu-1000') || null
                 });
               }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-signal/10 hover:bg-signal/20 text-signal border border-signal/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Optimize
          </button>
          <div className={"text-muted"}>
            Budget Target: <span className={"font-medium text-success"}>${scenario.budget}</span>
          </div>
          <div className={`h-4 w-px bg-surface-raised`} />
          <div className={"text-muted"}>
            Current Cost:{" "}
            <span className={budgetExceeded ? ("font-medium text-danger") : ("font-medium text-success")}>
              ${totalCost}
            </span>
          </div>
          <div className={`h-4 w-px hidden sm:block bg-surface-raised`} />
          <button
            onClick={onExit}
            className={`text-[9px] uppercase font-mono font-medium tracking-wider px-2.5 py-1 rounded border transition cursor-pointer bg-surface border-border text-signal hover:bg-surface-raised hover:bg-signal-subtle`}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Assembly Progress Trail */}
      <div className="border-b flex font-mono text-[10px] overflow-x-auto whitespace-nowrap bg-surface-raised border-border select-none">
        {STAGES.map((st, sIdx) => {
          const isDone = selections[st] !== null;
          const isCurrent = currentStageIndex === sIdx;
          const numLabel = `0${sIdx + 1}.`;
          
          let stateClasses = "";
          if (isCurrent) {
            // Active: background → surface white, top-edge indicator, text → signal blue
            stateClasses = "bg-surface text-signal border-t-2 border-t-signal border-b-transparent font-semibold";
          } else if (isDone) {
            // Complete: background → muted gray, text → muted
            stateClasses = "bg-shell/40 text-muted border-b-border opacity-70";
          } else {
            // Incomplete: background → surface-raised, text → muted
            stateClasses = "bg-surface-raised text-muted/60 border-b-border";
          }

          return (
            <div
              key={st}
              className={`flex-grow min-w-[90px] py-2.5 px-3 border-r text-center tracking-wider uppercase transition-colors border-border ${stateClasses}`}
            >
              <span className="opacity-60 mr-1">{numLabel}</span>{st}
            </div>
          );
        })}
      </div>

      {/* Build Platform Workstation */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
        
        {/* Left Side: Option Selection Cards, Calculations & Stepper Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className={`text-[10px] uppercase font-mono tracking-wider block font-medium text-signal`}>Stage {currentStageIndex + 1} of 6</span>
              <h4 className={`text-sm font-medium text-ink`}>
                Select your {STAGE_NAMES[activeStage]}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePartOptions.map((option) => {
                const isPickedVal = currentSelection?.id === option.id;
                return (
                   <div
                    key={option.id}
                    id={`part-option-${option.id}`}
                    onClick={() => handlePartSelect(option)}
                    className={`p-3.5 rounded-md border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isPickedVal
                        ? "bg-signal-subtle border-signal text-signal"
                        : "bg-surface border-border hover:border-signal text-body"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-1.5">
                        <span className={`font-semibold text-xs leading-tight ${
                          isPickedVal ? "text-signal" : "text-ink"
                        }`}>
                          {option.name}
                        </span>
                        {isPickedVal && (
                          <span className="w-4 h-4 rounded-full bg-signal text-white flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-sans font-normal italic leading-[1.5] text-muted">
                        {option.specs}
                      </p>
                    </div>

                    <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs border-border`}>
                      <span className="font-mono font-medium text-success">
                        +{option.perf} Perf
                      </span>
                      <span className="font-mono text-ink font-medium leading-none">
                        ${option.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workbench diagnostic readings - placed directly beneath option cards */}
          <div className={`p-3.5 border rounded-xl space-y-3 bg-surface border-border`}>
            <span className={`text-[8px] font-mono uppercase tracking-widest block font-medium text-signal`}>Live Sensor Calculations</span>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
              <div className={`flex justify-between border-b pb-1.5 col-span-2 sm:col-span-1 `}>
                <span className={`text-[9px] uppercase `}>Power Load Demand</span>
                <span className={`font-medium text-ink`}>
                  {totalPowerRequired} Watts
                </span>
              </div>
              <div className={`flex justify-between border-b pb-1.5 col-span-2 sm:col-span-1 `}>
                <span className={`text-[9px] uppercase `}>Socket Architecture</span>
                <span className="text-sky-500 font-medium">
                  {selections.cpu?.socket ? `${selections.cpu.socket}` : "(Requires CPU)"}
                </span>
              </div>
            </div>

            {/* Issues array warning log */}
            {issuesFound.length > 0 && (
              <div className="p-2.5 rounded-lg bg-yellow-950/20 border border-yellow-950/40 text-[10px] text-yellow-500 flex items-start gap-2 max-h-[80px] overflow-y-auto">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-yellow-500 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-medium">Compatibility Alerts:</span>
                  <ul className="list-disc pl-3">
                    {issuesFound.map((issue, issueIdx) => (
                      <li key={issueIdx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Navigation Actions - directly follow the live diagnostic calculations */}
          <div className={`flex justify-between items-center pt-4 border-t border-border`}>
            <button
              onClick={() => setSelectedScenarioIndex(null)}
              className={`px-3 py-2 text-[10px] font-mono font-medium uppercase rounded-lg border transition cursor-pointer bg-danger-subtle border-danger text-danger`}
            >
              Abort Contract
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={prevStage}
                disabled={currentStageIndex === 0}
                className={`px-4 py-2 text-xs font-mono font-medium uppercase rounded-[3px] border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-surface border-border text-muted hover:bg-surface-raised`}
              >
                ← Back
              </button>

              {currentStageIndex < STAGES.length - 1 ? (
                <button
                  onClick={nextStage}
                  disabled={!currentSelection}
                  className={`px-5 py-2 text-xs font-mono font-medium uppercase rounded-[3px] transition cursor-pointer disabled:opacity-40 relative overflow-hidden bg-signal text-white hover:bg-signal-hover`}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  id="btn-diagnostics-verify-boot"
                  onClick={runDiagnosticsAndBoot}
                  disabled={Object.values(selections).some((v) => v === null)}
                  className="px-6 py-2 text-xs font-mono font-medium uppercase rounded-[3px] bg-signal text-white transition cursor-pointer disabled:opacity-40 shadow"
                >
                  Verify & Boot PC →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Current rig manifest (sticky breakdown receipt) */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`border p-4 rounded-xl space-y-3 bg-surface border-border`}>
            <div className={`flex items-center gap-1.5 border-b pb-2.5 `}>
              <Info className={`w-4 h-4 text-signal`} />
              <h5 className={`text-[10px] uppercase font-mono tracking-widest font-medium font-black text-signal`}>
                Spec Summary / Workbench
              </h5>
            </div>

            {/* Selected items display list */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {STAGES.map((stage) => {
                const checkedItem = selections[stage];
                return (
                  <div
                    key={stage}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs gap-3 bg-surface-raised border-border`}
                  >
                    <div>
                      <span className={`block text-[8px] font-mono uppercase tracking-wider `}>{stage}</span>
                      <span className={`font-medium font-sans block text-[11px] truncate max-w-[170px] text-muted`}>
                        {checkedItem ? checkedItem.name : "Unassigned category..."}
                      </span>
                    </div>

                    <div className="text-right font-mono min-w-[50px]">
                      {checkedItem ? (
                        <div className="space-y-0.5">
                          <span className={`block font-semibold `}>${checkedItem.price}</span>
                          <span className={`block text-[9px] font-medium text-success`}>+{checkedItem.perf}p</span>
                        </div>
                      ) : (
                        <span className={`text-[10px] italic text-muted`}>Required</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
