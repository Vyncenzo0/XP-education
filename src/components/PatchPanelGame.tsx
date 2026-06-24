import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { 
  Award, 
  Zap, 
  HelpCircle, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Cable, 
  Check, 
  Undo,
  Network,
  Cpu,
  Tv,
  ArrowRight
} from "lucide-react";

interface PatchPanelGameProps {
  uid: string;
  displayName: string;
  onGameEnd: (score: number, avgReactionMs: number) => void;
  onExit: () => void;
  themeColor: string;
}

interface SwitchPort {
  id: number;
  label: string;
  vlan: number;
  type: "SFP+" | "GbE" | "PoE" | "FE";
  speed: string;
  desc: string;
}

interface PatchPanelPort {
  id: string; // "A" - "H"
  label: string;
  requiredVlan: number;
  requiredType: "SFP+" | "GbE" | "PoE" | "FE";
  desc: string;
}

interface PatchConnection {
  id: string; // switchId-patchId
  switchPortId: number;
  patchPortId: string;
  colorName: string;
  hexCode: string;
}

interface CableSpec {
  name: string;
  color: string;
  hex: string;
  type: string;
}

const DEFAULT_SWITCH_PORTS: SwitchPort[] = [
  { id: 1, label: "Port 1", vlan: 10, type: "SFP+", speed: "10 Gbps", desc: "Dual SFP+ Primary Storage Fiber Loop" },
  { id: 2, label: "Port 2", vlan: 20, type: "GbE", speed: "1 Gbps", desc: "Core Access Database Storage LAN" },
  { id: 3, label: "Port 3", vlan: 30, type: "GbE", speed: "1 Gbps", desc: "High Speed Dev Sandboxing VLAN" },
  { id: 4, label: "Port 4", vlan: 40, type: "PoE", speed: "100 Mbps", desc: "PoE Power Line for VoIP Terminal" },
  { id: 5, label: "Port 5", vlan: 50, type: "PoE", speed: "1 Gbps", desc: "High-Power PoE+ for Main Wi-Fi AP" },
  { id: 6, label: "Port 6", vlan: 60, type: "FE", speed: "100 Mbps", desc: "CCTV Isolated Fast-Ethernet Port" },
  { id: 7, label: "Port 7", vlan: 70, type: "GbE", speed: "1 Gbps", desc: "Corporate Office Finance Node" },
  { id: 8, label: "Port 8", vlan: 80, type: "GbE", speed: "1 Gbps", desc: "Standard Office Admin workstation" }
];

const DEFAULT_PATCH_PORTS: PatchPanelPort[] = [
  { id: "A", label: "Router Uplink", requiredVlan: 10, requiredType: "SFP+", desc: "Primary internet and fiber core carrier backbone" },
  { id: "B", label: "Database Node", requiredVlan: 20, requiredType: "GbE", desc: "MySQL and Redis storage infrastructure server rack" },
  { id: "C", label: "Dev Sandbox", requiredVlan: 30, requiredType: "GbE", desc: "Isolated environment for compiler evaluation" },
  { id: "D", label: "VoIP Desk Phone", requiredVlan: 40, requiredType: "PoE", desc: "Workspace telephony terminal (needs PoE injection)" },
  { id: "E", label: "Corporate WiFi", requiredVlan: 50, requiredType: "PoE", desc: "Dual band high density aerial wifi transmitter" },
  { id: "F", label: "CCTV Surveillance", requiredVlan: 60, requiredType: "FE", desc: "Outdoor physical security and dome camera feed" },
  { id: "G", label: "Finance Workspace", requiredVlan: 70, requiredType: "GbE", desc: "Client terminal in accounting (isolated finance domain)" },
  { id: "H", label: "Admin Operations", requiredVlan: 80, requiredType: "GbE", desc: "Operations desk trunk line connection node" }
];

const COLOR_CABLES: CableSpec[] = [
  { name: "Fiber Optic (Aqua)", color: "Aqua", hex: "#06b6d4", type: "SFP+" },
  { name: "LAN Copper (Blue)", color: "Blue", hex: "#3b82f6", type: "GbE" },
  { name: "Shielded Cat6 (Red)", color: "Red", hex: "#ef4444", type: "PoE" },
  { name: "Premium Coil (Purple)", color: "Purple", hex: "#a855f7", type: "GbE" },
  { name: "Cat5e Patch (Yellow)", color: "Yellow", hex: "#eab308", type: "FE" },
  { name: "Flexible Wire (Green)", color: "Green", hex: "#10b981", type: "GbE" },
  { name: "Standard Patch (Orange)", color: "Orange", hex: "#f97316", type: "PoE" }
];

// Helper utility to randomize VLANs, types, and port alignments for security each instance
const generateRandomPorts = () => {
  // 8 distinct random VLAN numbers between 10 and 950 (multiples of 10)
  const availableVlans: number[] = [];
  while (availableVlans.length < 8) {
    const v = Math.floor(Math.random() * 95 + 1) * 10;
    if (!availableVlans.includes(v)) {
      availableVlans.push(v);
    }
  }
  
  // Types pool exactly matching the 8 ports
  const typesPool: ("SFP+" | "GbE" | "PoE" | "FE")[] = ["SFP+", "GbE", "GbE", "PoE", "PoE", "FE", "GbE", "GbE"];
  // Shuffle the types pool so properties are completely dynamic
  const shuffledTypes = [...typesPool].sort(() => 0.5 - Math.random());

  // Create pairing profiles
  const profiles = Array.from({ length: 8 }).map((_, idx) => {
    const vlan = availableVlans[idx];
    const type = shuffledTypes[idx];
    let speed = "1 Gbps";
    let desc = "Standard Office Connection";
    if (type === "SFP+") {
      speed = "10 Gbps";
      desc = "High-Speed Fiber Backbone Loop";
    } else if (type === "PoE") {
      speed = "1 Gbps";
      desc = "Power-over-Ethernet terminal node";
    } else if (type === "FE") {
      speed = "100 Mbps";
      desc = "Legacy Fast-Ethernet Segment";
    } else {
      speed = "1 Gbps";
      desc = "Gigabit Ethernet storage segment";
    }
    return { vlan, type, speed, desc };
  });

  // Create 8 Switch Ports
  const generatedSwitchPorts: SwitchPort[] = Array.from({ length: 8 }).map((_, idx) => {
    const profile = profiles[idx];
    return {
      id: idx + 1,
      label: `Switch P${idx + 1}`,
      vlan: profile.vlan,
      type: profile.type,
      speed: profile.speed,
      desc: profile.desc
    };
  });

  // Create 8 Patch Ports (letters A to H)
  // Scramble the profiles configuration so they map in a completely scrambled order!
  const scrambledProfiles = [...profiles].sort(() => 0.5 - Math.random());
  
  const generatedPatchPorts: PatchPanelPort[] = Array.from({ length: 8 }).map((_, idx) => {
    const profile = scrambledProfiles[idx];
    const idLetter = String.fromCharCode(65 + idx); // "A" - "H"
    
    // Choose dynamic descriptive label
    let label = "Network Host";
    if (profile.type === "SFP+") {
      label = "Fiber Optical Uplink";
    } else if (profile.type === "PoE") {
      label = idx % 2 === 0 ? "IP Camera Node" : "VoIP Desk Phone";
    } else if (profile.type === "FE") {
      label = "CCTV Security Segment";
    } else {
      const standardLabels = ["Data Server Hub", "Admin Terminal Area", "Dev Sandbox Node", "Finance Vault Client"];
      label = standardLabels[idx % standardLabels.length];
    }

    return {
      id: idLetter,
      label: label,
      requiredVlan: profile.vlan,
      requiredType: profile.type,
      desc: `Connect to Switch Port supporting VLAN ${profile.vlan} (${profile.type})`
    };
  });

  return { generatedSwitchPorts, generatedPatchPorts };
};

export default function PatchPanelGame({ uid, displayName, onGameEnd, onExit, themeColor }: PatchPanelGameProps) {
  const { theme } = useTheme();
  const cabinetRef = useRef<HTMLDivElement>(null);

  const [connections, setConnections] = useState<PatchConnection[]>([]);
  const [selectedCable, setSelectedCable] = useState<CableSpec>(COLOR_CABLES[1]); // Default to Blue
  const [selectedSwitchPort, setSelectedSwitchPort] = useState<number | null>(null);
  const [selectedPatchPort, setSelectedPatchPort] = useState<string | null>(null);

  // Dynamic random rack slots states
  const [switchPorts, setSwitchPorts] = useState<SwitchPort[]>(DEFAULT_SWITCH_PORTS);
  const [patchPorts, setPatchPorts] = useState<PatchPanelPort[]>(DEFAULT_PATCH_PORTS);

  // Challenge goals selection based on difficulty
  const [targetObjectives, setTargetObjectives] = useState<PatchPanelPort[]>([]);
  
  // Game timings
  const [startTime, setStartTime] = useState<number>(0);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [testing, setTesting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState<boolean>(false);

  // Stats
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  const [finalScore, setFinalScore] = useState<number>(0);

  // Load target objectives on game start
  useEffect(() => {
    initNewGame();
  }, []);

  // Seconds ticking
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (!isDone && !testing) {
      t = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isDone, testing]);

  const initNewGame = () => {
    // Generate randomized ports on each instance
    const { generatedSwitchPorts, generatedPatchPorts } = generateRandomPorts();
    setSwitchPorts(generatedSwitchPorts);
    setPatchPorts(generatedPatchPorts);

    // Determine how many links to make based on difficulty
    let count = 8;

    // Grab first count-ports from general patch panel keys
    // shuffle a little to make it feel fresh
    const pool = [...generatedPatchPorts];
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const matchedObjectives = shuffled.slice(0, count);
    
    // Sort matchedObjectives so that they line up alphabetically in the quest card
    matchedObjectives.sort((a,b) => a.id.localeCompare(b.id));

    setTargetObjectives(matchedObjectives);
    setConnections([]);
    setSelectedSwitchPort(null);
    setSelectedPatchPort(null);
    setSecondsElapsed(0);
    setTesting(false);
    setIsDone(false);
    setMistakesCount(0);
    setFinalScore(0);
    setStartTime(Date.now());
    setLogs(["💡 SERVER RACK OFFLINE (Matrix randomized). Match switch ports with target patch ports using matching VLAN numbers."]);
  };

  // Click handler for switch ports
  const handleSelectSwitchPort = (portId: number) => {
    if (isDone || testing) return;
    
    // If we click the same switch port, deselect it
    if (selectedSwitchPort === portId) {
      setSelectedSwitchPort(null);
      return;
    }

    // Check if this physical switch port has already been patched
    const existing = connections.find(c => c.switchPortId === portId);
    if (existing) {
      // Disconnect it
      setConnections(connections.filter(c => c.switchPortId !== portId));
      addLog(`🔌 Disconnected line from Switch Port ${portId}`);
      setSelectedSwitchPort(null);
      return;
    }

    setSelectedSwitchPort(portId);
    
    // If patch port was selected, perform coupling
    if (selectedPatchPort) {
      couplePorts(portId, selectedPatchPort);
    }
  };

  // Click handler for patch panel ports
  const handleSelectPatchPort = (portId: string) => {
    if (isDone || testing) return;

    // If same patch port, deselect
    if (selectedPatchPort === portId) {
      setSelectedPatchPort(null);
      return;
    }

    // Check if this patch panel has already been patched
    const existing = connections.find(c => c.patchPortId === portId);
    if (existing) {
      // Disconnect it
      setConnections(connections.filter(c => c.patchPortId !== portId));
      addLog(`🔌 Disconnected line from Patch Panel ${portId}`);
      setSelectedPatchPort(null);
      return;
    }

    setSelectedPatchPort(portId);

    // If switch port was selected, perform coupling
    if (selectedSwitchPort !== null) {
      couplePorts(selectedSwitchPort, portId);
    }
  };

  // Core coupler to store the connections
  const couplePorts = (switchId: number, patchId: string) => {
    // Safety check: remove any connection that currently claims either of these ports to prevent double cabling
    const updated = connections.filter(
      (c) => c.switchPortId !== switchId && c.patchPortId !== patchId
    );

    const newConnection: PatchConnection = {
      id: `${switchId}-${patchId}`,
      switchPortId: switchId,
      patchPortId: patchId,
      colorName: selectedCable.name,
      hexCode: selectedCable.hex
    };

    setConnections([...updated, newConnection]);
    
    // Log physical event
    const sPort = switchPorts.find(p => p.id === switchId);
    const pPort = patchPorts.find(p => p.id === patchId);
    addLog(`🔗 Linked Switch SFP+/RJ45 ${sPort?.label} with Patch Port ${pPort?.id} (${pPort?.label}) using ${selectedCable.color} Cable.`);

    // Reset temporary highlight keys
    setSelectedSwitchPort(null);
    setSelectedPatchPort(null);
  };

  const addLog = (text: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString().split(" ")[0]}] ${text}`]);
  };

  // Helper coordinate getters relative to single parent canvas
  // Switch: Row 1, 8 ports styled in a horizontal container.
  // Patch Panel: Row 2, 8 ports styled in a horizontal container.
  // By mapping SwitchPort 1-8 to horizontal % and PatchPort A-H to horizontal %, we draw perfect dynamic paths!
  const getPortXPercent = (index0to7: number) => {
    // 8 ports nicely centered. Horizontal percentages:
    return 6.25 + (index0to7 * 12.5); // centered inside 12.5% slots
  };

  // Fire trace & verify routing configurations
  const handleTestBackbone = () => {
    if (connections.length === 0) {
      addLog("⚠️ Connection Failure. No patch cords installed!");
      return;
    }

    setTesting(true);
    addLog("⚡ [DIAGNOSTIC INITIALIZED] Running SFP+ and RJ45 laser continuity sequence.");
    
    let step = 0;
    const testLogs = [
      "🔍 Accessing Managed Core Switch...",
      "📶 Resolving physical electrical resistance over multi-pair Cat6...",
    ];

    // Tick diagnostic outputs dynamically
    const logInterval = setInterval(() => {
      if (step < testLogs.length) {
        addLog(testLogs[step]);
        step++;
      } else {
        clearInterval(logInterval);
        verifyAllConnections();
      }
    }, 450);
  };

  const verifyAllConnections = () => {
    let correctCount = 0;
    let errorsFound = 0;
    const finalLogs: string[] = [];

    // Verify each required objective
    targetObjectives.forEach((objective) => {
      // Find what switch port is attached to this patch container
      const link = connections.find(c => c.patchPortId === objective.id);
      
      if (!link) {
        errorsFound++;
        finalLogs.push(`❌ LINK DOWN: Patch Terminal ${objective.id} (${objective.label}) is completely static - No connection detected!`);
        return;
      }

      // Read switch details of connected port
      const swPort = switchPorts.find(p => p.id === link.switchPortId);
      
      if (!swPort) {
        errorsFound++;
        return;
      }

      // Check VLAN matching parameters
      const vlanMatch = swPort.vlan === objective.requiredVlan;
      const typeMatch = swPort.type === objective.requiredType;
      const usedCable = COLOR_CABLES.find(c => c.name === link.colorName);
      const cableMatch = usedCable?.type === objective.requiredType || usedCable?.type === objective.requiredType.replace('+', '');

      if (vlanMatch && typeMatch && cableMatch) {
        correctCount++;
        finalLogs.push(`✅ ACCESS LINK OK: ${swPort.label} is communicating with Port ${objective.id} (${objective.label}). Speed: ${swPort.speed}. Link carrier status 100% stable.`);
      } else {
        errorsFound++;
        if (!vlanMatch) {
          finalLogs.push(`⚠️ VLAN ID MISMATCH on Port ${objective.id}: Expected VLAN ${objective.requiredVlan} but found VLAN ${swPort.vlan} (Switch ${swPort.label}). packet leak blocked!`);
        } else if (!typeMatch) {
          finalLogs.push(`⚠️ CONNECTOR MISMATCH on Port ${objective.id}: Expected physical ${objective.requiredType} but source was configured as standard ${swPort.type}.`);
        } else if (!cableMatch) {
          finalLogs.push(`⚠️ CABLE SPEC MISMATCH on Port ${objective.id}: The chosen Patch Cord (${usedCable?.color}) does not support the required ${objective.requiredType} transmission standards.`);
        }
      }
    });

    // Check if user has extra unrequired cords plugged in that cause broadcast storms (isolated on hard mode)
    const extraCables = connections.length - targetObjectives.length;
    if (extraCables > 0) {
      finalLogs.push(`⚠️ BROADCAST STORM WARNING: Detected ${extraCables} additional redundant patch cables connected without active port objectives.`);
    }

    // append to visible logs
    finalLogs.forEach(lg => addLog(lg));

    setMistakesCount(prev => prev + errorsFound);

    // If completely correct, award user stats
    const allMatchesDone = (correctCount === targetObjectives.length && errorsFound === 0);

    if (allMatchesDone) {
      addLog("🎉 [COMMUNICATION OK] Server Rack initialized successfully! All terminal loops green.");
      
      // Calculate scores
      const difficultyMultiplier = 1.8;
      const basePoints = targetObjectives.length * 1450;
      
      // Speed multiplier
      const timeTargetSeconds = 150;
      const speedBonus = Math.max(0, (timeTargetSeconds - secondsElapsed) * 45);
      
      // Mistakes deduction
      const mistakeDeduction = mistakesCount * 500;
      const calculatedScore = Math.max(1200, Math.round((basePoints + speedBonus) * difficultyMultiplier - mistakeDeduction));

      setFinalScore(calculatedScore);
      setIsDone(true);
      setTesting(false);
    } else {
      addLog("❌ [DIAGNOSTIC ERROR] Continuity checks failed. Review network wiring matrix coordinates and retry.");
      setTesting(false);
    }
  };

  // Complete game button handler
  const handleFinalizeGame = () => {
    // reaction time or pacing ratio computed from duration
    onGameEnd(finalScore, Math.round(secondsElapsed * 1000));
  };

  return (
    <div className={`flex flex-col h-full border rounded-xl relative overflow-hidden min-h-[460px] font-sans transition-all duration-300 lab-light-panel text-ink`}>
      
      {/* Lab Result Dialog overlay */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            id="patch-result-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-stone-950/40 overflow-y-auto`}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`border rounded-xl p-6 w-full max-w-md text-center space-y-6 shadow-2xl relative bg-surface border-border text-ink my-auto transition-colors`}
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-500/10 rounded-br-full pointer-events-none" />

              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center border bg-signal-subtle border-signal/20`}>
                <ShieldCheck className="w-6 h-6 animate-pulse text-signal" />
              </div>

              <div className="space-y-1.5">
                <h4 className={`text-xl font-medium font-display uppercase tracking-widest text-signal`}>
                  Server Rack Initialized!
                </h4>
                <p className={`text-xs text-muted max-w-xs mx-auto`}>
                  Congratulations! All communication lines and physical ports have been certified stable according to the network map matrix.
                </p>
              </div>

              {/* Score indicators */}
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className={`rounded-xl p-3 border bg-surface-raised border-border`}>
                  <span className="text-[10px] text-muted uppercase block font-semibold font-mono">Panel Score</span>
                  <span className={`font-mono text-xl font-medium text-warning`}>{finalScore.toLocaleString()} XP</span>
                </div>
                <div className={`rounded-xl p-3 border bg-surface-raised border-border`}>
                  <span className="text-[10px] text-muted uppercase block font-semibold font-mono">Spent Time</span>
                  <span className="font-mono text-xl font-medium text-cyan-500">{secondsElapsed}s</span>
                </div>
              </div>

              {/* Mistakes info */}
              <div className={`text-left p-3 border rounded-xl text-[10px] bg-surface-raised border-border text-muted`}>
                <span className="font-medium text-muted uppercase tracking-widest block text-[9px] mb-1 opacity-70">Cabling Diagnosis:</span>
                <p className={`font-mono leading-normal `}>
                  - Physical connectors matched: <span className="text-emerald-500 font-medium">100% Correct</span><br />
                  - Total connection errors logged: <span className={mistakesCount > 0 ? "text-amber-500 font-medium" : "text-emerald-500 font-medium"}>{mistakesCount} mistakes</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  id="btn-patch-restart"
                  onClick={() => {
                    // Reset game states
                    setIsDone(false);
                    setTesting(false);
                    setSecondsElapsed(0);
                    setConnections([]);
                    setLogs([]);
                    setMistakesCount(0);
                  }}
                  className={`flex-1 py-3 rounded-xl border transition text-xs font-mono font-medium uppercase cursor-pointer bg-surface-raised border-border hover:bg-surface text-ink active:scale-95`}
                >
                  Reset / Retry
                </button>
                <button
                  id="btn-patch-submit"
                  onClick={handleFinalizeGame}
                  className={`flex-[2] py-3 rounded-xl transition text-xs font-mono font-medium uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-lg text-white bg-signal hover:opacity-90 active:scale-95`}
                >
                  <Award className="w-4 h-4" />
                  Submit Score
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Lab Header */}
      <div className={`px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 bg-signal-subtle border-border`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border bg-signal-subtle border-border text-signal`}>
            <Cable className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 id="patch-title" className={`font-display font-medium text-[12px] md:text-[13px] uppercase tracking-wider flex items-center gap-1.5 leading-none text-signal`}>
              Patch Panel Commander <span className={`text-[8.5px] font-mono font-medium px-1.5 py-0.5 rounded-full border bg-signal-subtle`}>MODULE 04</span>
            </h2>
            <p className={`text-[9.5px] md:text-[10.5px] mt-0.5 text-muted`}>Secure high density patch conduits using correct VLAN nodes matching logical scopes</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Menu specific things can go here if needed */ }
          <button
            onClick={onExit}
            className={`text-[9px] uppercase font-mono font-medium tracking-wider px-2 py-1 rounded border transition cursor-pointer ml-2 bg-surface border-border text-signal hover:bg-surface-raised hover:bg-signal-subtle`}
          >
            Exit
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
        
        {/* Left Side: Cabling Sandbox Rack (Grid 8) */}
        <div className={`lg:col-span-6 p-2.5 md:p-3.5 flex flex-col justify-between space-y-1 min-h-0 border-r leading-normal transition-colors duration-300 ${
          "border-border"
        }`}>
          
 
        {/* Interactive Server Rack Cabinet (SVG Drawing Area) */}
          <div ref={cabinetRef} className={`border-[3px] rounded-xl relative p-2 md:p-2.5 flex flex-col items-stretch select-none h-auto justify-center gap-1 shadow-inner transition-colors duration-300 ${
            "bg-surface-raised border-border"
          }`}>
            <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
              "via-stone-50/40"
            }`} />
            
            {/* Cable Toolkit Selector */}
            <div className={`p-2.5 rounded-xl border z-50 transition-colors duration-300 ${
              "bg-surface border-border"
            }`}>
              <div className={`text-[9.5px] font-mono font-medium uppercase tracking-wider mb-1 flex items-center gap-1 ${
                "font-black text-signal"
               }`}>
                <Layers className="w-3 h-3" />
                1. SELECT ACTIVE PATCH CORD COLOR & SPEC
              </div>
              
              <div className="flex flex-wrap gap-1">
                {COLOR_CABLES.map((cb) => {
                  const isSelected = selectedCable.name === cb.name;
                  return (
                    <button
                      key={cb.name}
                      onClick={() => setSelectedCable(cb)}
                      className={`flex items-center gap-1 py-0.5 px-2 rounded border text-[8.5px] font-medium font-mono cursor-pointer transition-all ${
                        isSelected 
                          ? "font-medium bg-signal-subtle border-border text-signal"
                          : "bg-surface-raised border-border text-muted"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-stone-950" style={{ backgroundColor: cb.hex }} />
                      {cb.color} ({cb.type})
                      {isSelected && <Check className="w-2.5 h-2.5 text-emerald-400 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ambient Cooling Fan Ventilation Visual background */}
            <div className="absolute left-0 right-0 top-[35%] bottom-[35%] flex flex-col justify-around pointer-events-none opacity-5 px-4 space-y-1.5">
              <div className="h-3 border-y border-stone-200" />
              <div className="h-3 border-y border-stone-200" />
              <div className="h-3 border-y border-stone-200" />
            </div>

            {/* HEADER LABELS */}
            <div className="z-10 flex justify-between items-center text-[8.5px] font-mono text-stone-500 px-1 select-none">
              <span>SWITCH 1U MANAGED FIBER/COPPER MATRIX</span>
              <span>MAC: 00:1A:C2:7B:A2:99</span>
            </div>

            {/* SWITCH PANEL ROW (Top) */}
            <div className={`z-10 rounded-lg border p-1 shadow-lg relative w-full max-w-[520px] mx-auto animate-fadeIn col-span-8 transition-colors duration-300 ${
              "bg-surface border-border"
            }`}>
              <div className="absolute left-1.5 top-1.5 w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
              
              <div className="grid grid-cols-8 gap-0.5 relative">
                {switchPorts.map((port) => {
                  const isSelected = selectedSwitchPort === port.id;
                  const isCabled = connections.some(c => c.switchPortId === port.id);
                  const connectionInfo = connections.find(c => c.switchPortId === port.id);
                  const isFiber = port.type === "SFP+";
                  
                  return (
                    <div 
                      key={port.id} 
                      className={`flex flex-col items-center justify-between p-1.5 rounded border transition-all ${
                        isSelected 
                          ? "ring-2 ring-indigo-100 bg-signal-subtle"
                          : "bg-surface-raised border-border"
                      }`}
                    >
                      {/* Port Label */}
                      <span className={`text-[8.5px] font-mono font-medium mb-1 ${
                        "text-muted"
                      }`}>
                        P{port.id}
                      </span>

                      {/* Ports RJ45 / Optical Graphic Button */}
                      <button
                        onClick={() => handleSelectSwitchPort(port.id)}
                        className={`w-9 h-9 rounded cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden focus:outline-none ${
                          isSelected 
                            ? `ring-2 ring-indigo-400 ring-offset-1 ring-offset-white` 
                            : ""
                        }`}
                        title={`${port.desc} (${port.speed})`}
                      >
                        {isFiber ? (
                          /* SFP+ Fiber optical transceiver port design */
                          <div className={`w-full h-full rounded border flex flex-col items-center justify-between p-1 select-none relative shadow-md transition-all ${
                            isSelected 
                              ? "border-indigo-400 bg-indigo-950/80" 
                              : isCabled 
                                ? "bg-success-subtle border-success"
                                : "bg-surface-raised border-border"
                          }`}>
                            <div className="w-full h-[3px] bg-stone-400 rounded-t-sm" />
                            {/* Optical receivers */}
                            <div className="flex gap-[3px] justify-center w-full my-0.5">
                              <div className={`w-2.5 h-3 rounded-sm flex items-center justify-center border ${
                                "bg-surface border-border"
                              }`}>
                                <div className={`w-1 h-1 rounded-full ${isCabled ? "bg-red-500 animate-pulse shadow-[0_0_2px_#ef4444]" : "bg-black"}`} />
                              </div>
                              <div className={`w-2.5 h-3 rounded-sm flex items-center justify-center border ${
                                "bg-surface border-border"
                              }`}>
                                <div className={`w-1 h-1 rounded-full ${isCabled ? "bg-red-500 animate-pulse shadow-[0_0_2px_#ef4444]" : "bg-black"}`} />
                              </div>
                            </div>
                            
                            {/* Cable color marker / drag handle at bottom of port */}
                            {!isCabled ? (
                              <div
                                className="absolute bottom-0.5 inset-x-1.5 h-1.5 rounded-sm transition bg-indigo-500/80 z-30 flex items-center justify-center border border-white/25"
                                style={{ backgroundColor: selectedCable.hex }}
                                title="Drag wire to Patch"
                              >
                                <div className="w-1.5 h-[1.5px] bg-white opacity-80" />
                              </div>
                            ) : (
                              <div className="w-full h-1" style={{ backgroundColor: connectionInfo?.hexCode }} />
                            )}
                          </div>
                        ) : (
                          /* Dense RJ45 Ethernet port */
                          <div className={`w-full h-full rounded border flex flex-col justify-end p-0.5 select-none relative shadow-md transition-all ${
                            isSelected 
                              ? "border-indigo-400 bg-indigo-950/80" 
                              : isCabled 
                                ? "bg-success-subtle border-success"
                                : "bg-surface-raised border-border"
                          }`}>
                            {/* 2 physical Status LEDs */}
                            <div className="absolute top-0.5 left-0.5 right-0.5 flex justify-between pointer-events-none scale-[0.75]">
                              <span className={`w-1 h-1 rounded-full ${isCabled ? "bg-emerald-500 animate-pulse" : ""}`} />
                              <span className={`w-1 h-1 rounded-full ${isCabled ? "bg-amber-400 animate-pulse" : ""}`} />
                            </div>

                            {/* 8 miniature gold pins */}
                            <div className="flex gap-[0.5px] justify-between px-[3px] absolute top-2 left-0 right-0 opacity-85">
                              {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="w-[1.2px] h-1.5 bg-amber-500/90" />
                              ))}
                            </div>

                            {/* Bottom clip tab cutout shape */}
                            <div className={`w-3.5 h-1.5 border-t absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex items-center justify-center ${
                              "bg-surface border-border"
                            }`}>
                              <div className={`w-2 h-0.5 rounded-t-sm bg-surface-raised`} />
                            </div>

                            {/* Cable color marker / drag handle inside port */}
                            {!isCabled ? (
                              <div
                                className="absolute bottom-1 left-2 right-2 h-2 rounded-sm transition bg-indigo-500/80 z-30 flex items-center justify-center border border-white/20 shadow"
                                style={{ backgroundColor: selectedCable.hex }}
                                title="Drag wire to Patch"
                              >
                                <div className="w-2 h-0.5 bg-white/60 rounded-full" />
                              </div>
                            ) : (
                              <div className="absolute top-2 w-3.5 h-1.5 rounded-sm mx-auto left-1/2 transform -translate-x-1/2" style={{ backgroundColor: connectionInfo?.hexCode }} />
                            )}
                          </div>
                        )}
                      </button>

                      {/* Port Details */}
                      <span className="text-[8.5px] font-mono text-cyan-550 font-medium block mt-1 leading-none">
                        v{port.vlan}
                      </span>
                      <span className="text-[8px] font-mono text-stone-500 font-medium block mt-0.5 leading-none">
                        {port.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INTER-RACK PHYSICAL CABLE CONDUIT HOUSING OVERLAY (Middle gap spacer with status light) */}
            <div className="relative h-2 z-10 w-full max-w-[520px] mx-auto flex items-center justify-between px-3">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_#10b981]" />
              <div className="h-[1px] bg-stone-800/40 flex-1 mx-2" />
              <div className="h-[1px] bg-stone-800/40 flex-1 mx-2" />
              <span className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_4px_#06b6d4]" />
            </div>

            {/* PATCH PANEL ROW (Bottom) */}
            <div className={`z-10 rounded-lg border p-1 shadow-lg relative w-full max-w-[520px] mx-auto transition-colors duration-300 ${
              "bg-surface border-border"
            }`}>
              <div className="grid grid-cols-8 gap-0.5 relative">
                {patchPorts.map((port) => {
                  const isSelected = selectedPatchPort === port.id;
                  const isCabled = connections.some(c => c.patchPortId === port.id);
                  const isRequiredInQuest = targetObjectives.some(obj => obj.id === port.id);
                  const connectionInfo = connections.find(c => c.patchPortId === port.id);
                  const isFiber = port.requiredType === "SFP+";

                  return (
                    <div 
                      key={port.id} 
                      data-patch-port-id={port.id}
                      className={`flex flex-col items-center justify-between p-1.5 rounded border transition-all duration-300 ${
                        isSelected 
                          ? "ring-2 ring-indigo-100 bg-signal-subtle"
                          : isRequiredInQuest 
                            ? "font-medium bg-signal-subtle"
                            : "bg-surface-raised border-border"
                      }`}
                    >
                      {/* Port Label */}
                      <span className={`text-[8.5px] font-mono text-center font-black mb-1 leading-none ${
                        isRequiredInQuest 
                          ? "text-indigo-500 animate-pulse" 
                          : "text-muted"
                      }`}>
                        Port {port.id}
                      </span>

                      {/* Ports physical coupler housing */}
                      <button
                        onClick={() => handleSelectPatchPort(port.id)}
                        data-patch-port-id={port.id}
                        className={`w-9 h-9 rounded cursor-pointer transition-colors flex flex-col items-center justify-center relative focus:outline-none ${
                          isSelected 
                            ? `ring-2 ring-indigo-400 ring-offset-1 ring-offset-white` 
                            : ""
                        }`}
                        title={port.desc}
                      >
                        {isFiber ? (
                          /* SFP+ Fiber patch transceiver slot */
                          <div className={`w-full h-full rounded border flex flex-col items-center justify-between p-1 select-none relative shadow-md transition-all ${
                            isSelected 
                              ? "border-indigo-400 bg-indigo-950/80" 
                              : isRequiredInQuest 
                                ? "animate-pulse bg-signal-subtle" 
                                : isCabled 
                                  ? "bg-success-subtle border-success"
                                  : "bg-surface-raised border-border hover:bg-surface-raised hover:border-signal"
                          }`}>
                            <div className="w-full h-[3px] bg-stone-400 rounded-t-sm" />
                            <div className="flex gap-[3px] justify-center w-full my-0.5">
                              <div className={`w-2.5 h-3 rounded-sm flex items-center justify-center border ${
                                "bg-surface border-border"
                              }`} />
                              <div className={`w-2.5 h-3 rounded-sm flex items-center justify-center border ${
                                "bg-surface border-border"
                              }`} />
                            </div>
                            <div className="w-full h-1" style={{ backgroundColor: isCabled ? connectionInfo?.hexCode : "#27272a" }} />
                          </div>
                        ) : (
                          /* Dense RJ45 Ethernet patch slot */
                          <div className={`w-full h-full rounded border flex flex-col justify-end p-0.5 select-none relative shadow-md transition-all ${
                            isSelected 
                              ? "border-indigo-400 bg-indigo-950/80" 
                              : isRequiredInQuest 
                                ? "animate-pulse font-medium bg-signal-subtle"
                                : isCabled 
                                  ? "bg-success-subtle border-success"
                                  : "bg-surface-raised border-border hover:bg-surface-raised"
                          }`}>
                            {/* Gold contacts inside slot */}
                            <div className="flex gap-[0.5px] justify-between px-[3.5px] absolute top-1.5 left-0 right-0 opacity-60">
                              {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="w-[1.2px] h-1.5 bg-amber-500" />
                              ))}
                            </div>

                            {/* Bottom clip tab cutout shape */}
                            <div className={`w-3.5 h-1.5 border-t absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex items-center justify-center ${
                              "bg-surface border-border"
                            }`}>
                              <div className={`w-2 h-0.5 rounded-t-sm bg-surface-raised`} />
                            </div>

                            {/* Center connection color tab */}
                            {isCabled && (
                              <div className="absolute top-1.5 w-3.5 h-1.5 rounded-sm mx-auto left-1/2 transform -translate-x-1/2" style={{ backgroundColor: connectionInfo?.hexCode }} />
                            )}
                          </div>
                        )}
                      </button>

                      {/* Physical Label block underneath for datacenter cataloging */}
                      <span className={`text-[8.5px] font-mono font-medium block mt-1 leading-none ${
                        isRequiredInQuest 
                          ? "text-indigo-500 font-medium" 
                          : "text-muted"
                      }`}>
                        v{port.requiredVlan}
                      </span>
                      <span className="text-[8px] font-mono text-stone-500 font-semibold block mt-0.5 leading-none">
                        {port.requiredType}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM BRACE */}
            <div className="z-10 mt-1 flex justify-between items-center text-[10px] md:text-xs font-mono text-stone-500 px-1 select-none leading-none">
              <span>RACK SECTIONS: #14 TO #16</span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                DURABLE COPPER TRUNKS GigaLine
              </span>
            </div>

            {/* Interactive controls */}
            <div className={`flex flex-wrap items-center justify-between gap-1.5 p-1.5 rounded-lg mt-1.5 z-50 transition-colors duration-300 ${
              "border bg-surface border-border"
            }`}>
              <div className="flex gap-1">
                <button
                   onClick={initNewGame}
                   className={`flex items-center gap-1 px-2.5 py-1 text-[9.5px] cursor-pointer font-medium transition-all rounded-md ${
                    "border bg-surface-raised border-border text-ink"
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Board
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <div className={`font-mono text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                  "bg-surface-raised border-border text-muted"
                }`}>
                  <Zap className="w-3 h-3 text-amber-500" />
                  TIME: <span className={`font-medium text-signal`}>{secondsElapsed}s</span>
                </div>
                {!isDone ? (
                  <button
                    onClick={handleTestBackbone}
                    disabled={testing}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-[9.5px] cursor-pointer shadow-md shadow-indigo-950/40 border border-indigo-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {testing ? "Analyzing..." : "Punch-In / Test Link"}
                  </button>
                ) : (
                  <button
                    onClick={handleFinalizeGame}
                    className="flex items-center gap-2.5 py-1 rounded bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-[9.5px] cursor-pointer shadow-md shadow-emerald-950/45 border border-emerald-500 hover:scale-[1.02] duration-150 transition-all uppercase"
                  >
                    Submit <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* FULL CABINET WIRES AND DRAGS ELEVATED SVG OVERLAY */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible" style={{ pointerEvents: "none" }}>
              {/* Connected physical patch cords */}
              {connections.map((c) => {
                const switchIndex = switchPorts.findIndex(p => p.id === c.switchPortId);
                const patchIndex = patchPorts.findIndex(p => p.id === c.patchPortId);

                if (switchIndex === -1 || patchIndex === -1) return null;

                const sourceX = getPortXPercent(switchIndex);
                const targetX = getPortXPercent(patchIndex);

                const y1 = 17;
                const y2 = 83;

                const pathD = `M ${sourceX}%,${y1}% C ${sourceX}%,55% ${targetX}%,45% ${targetX}%,${y2}%`;

                return (
                  <g key={`${c.switchPortId}-${c.patchPortId}`}>
                    {/* Shadow strand for natural physical visual depth */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="black"
                      strokeWidth="5"
                      strokeLinecap="round"
                      opacity="0.35"
                    />
                    {/* Glossy colored outer cable jacket */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={c.hexCode}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Glowing core fiber glass light pipe effect */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="white"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeDasharray="6,15"
                      opacity="0.8"
                    />
                  </g>
                );
              })}

              {/* Dotted target guide strands removed */}


            </svg>

          </div>


        </div>

        {/* Right Side: Quest Book, Instructions & Live Diagnostics console log (Grid 4) */}
        <div className={`lg:col-span-6 p-2.5 md:p-3 flex flex-col justify-between overflow-y-auto max-h-[70vh] space-y-2.5 min-h-0 border-t lg:border-t-0 bg-surface-raised border-border`}>
          
          {/* Active Objectives Quest Block */}
          <div className="space-y-1 flex flex-col min-h-0">
            <div className={`text-[9.5px] font-mono font-medium uppercase tracking-widest flex items-center gap-1 border-b pb-1 border-border text-signal`}>
              <Award className="w-3 h-3" />
              REQUIRED PATCHING SCHEMAS ({targetObjectives.length})
            </div>

            <div className="space-y-1 pr-1 flex-1 min-h-0 overflow-y-auto max-h-[30vh]">
              {targetObjectives.map((objective) => {
                const link = connections.find(c => c.patchPortId === objective.id);
                const swPort = link ? switchPorts.find(p => p.id === link.switchPortId) : null;
                const usedCable = link ? COLOR_CABLES.find(c => c.name === link.colorName) : null;
                const isCorrect = link && swPort?.vlan === objective.requiredVlan && swPort?.type === objective.requiredType && (usedCable?.type === objective.requiredType || usedCable?.type === objective.requiredType.replace('+', ''));

                return (
                  <div 
                    key={objective.id}
                    className={`p-1.5 px-2 rounded-md border flex items-center justify-between gap-1.5 transition-all ${
                      isCorrect 
                        ? "font-medium bg-success-subtle border-success text-success"
                        : link 
                          ? "bg-warning-subtle border-warning text-warning"
                          : "bg-surface border-border"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="shrink-0">
                        {isCorrect ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : link ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <div className={`w-4 .5 h-4.5 rounded border flex items-center justify-center text-[8.5px] font-mono font-black select-none bg-surface-raised`}>
                            {objective.id}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <span className={`block text-[9px] font-semibold truncate text-ink`}>
                          Port {objective.id}
                          {link && (
                            <span className={`font-medium font-mono ml-1 px-1 py-0.2 rounded text-[8px] inline-flex items-center border bg-success-subtle border-success`}>
                              P{link.switchPortId}
                            </span>
                          )}
                          <span className={`font-normal ml-1 text-muted`}>: {objective.label}</span>
                        </span>
                        <span className="block text-[8px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">
                          VLAN {objective.requiredVlan} • {objective.requiredType}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {link ? (
                        <span className={`text-[8.5px] font-mono px-1 py-0.5 rounded border bg-surface-raised border-border text-muted`}>
                          Sw P{link.switchPortId}
                        </span>
                      ) : (
                        <span className={`text-[8.5px] font-mono px-1 py-0.5 rounded border animate-pulse font-medium bg-signal-subtle`}>
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Event Logging Console Output */}
          <div className={`rounded-lg overflow-hidden p-2 space-y-1 shadow-md flex flex-col flex-grow min-h-[90px] transition-colors duration-300 border ${
            "bg-surface-raised border-border"
          }`}>
            <div className={`flex justify-between items-center text-[9px] md:text-[9.5px] font-mono border-b pb-0.5 select-none ${
              "border-border text-muted"
            }`}>
              <span className="uppercase tracking-widest flex items-center gap-1">
                <Tv className={`w-3 h-3 text-muted`} />
                Live Log Continuity Console
              </span>
              <span className="text-[8px] select-none text-stone-500">v4.0.98-PRO</span>
            </div>

            <div className="flex-1 font-mono text-[8.5px] md:text-[9px] space-y-1 scrollbar-thin scrollbar-thumb-stone-900 min-h-0 pr-1 select-text overflow-y-auto">
              {logs.map((log, i) => {
                let colorClass = "text-muted";
                if (log.includes("✅")) colorClass = "font-semibold text-success";
                if (log.includes("❌")) colorClass = "font-medium text-danger";
                if (log.includes("⚠️")) colorClass = "font-semibold text-warning";
                if (log.includes("🔗")) colorClass = "font-semibold";
                if (log.includes("🎉")) colorClass = "font-medium md:text-[9.5px] leading-relaxed text-success";

                return (
                  <div key={i} className={`leading-tight ${colorClass}`}>
                    {log}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>

            {isDone && (
              <div className={`border rounded p-1 mt-0.5 animate-bounce ${
                "bg-success-subtle"
              }`}>
                <div className={`text-[8px] font-mono uppercase tracking-widest font-medium flex items-center gap-1 ${
                  "text-success"
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  STATION COMPLETE
                </div>
                <div className={`text-xs font-display font-black leading-none ${
                  "text-success"
                }`}>
                  SCORE: {finalScore} XP
                </div>
              </div>
            )}
          </div>

          {/* Interactive hints reference map */}
          <div className={`p-2 rounded border leading-tight ${
            "bg-surface border-border"
          }`}>
            <div className={`text-[9px] font-mono font-medium uppercase tracking-wider mb-0.5 ${
              "text-signal"
            }`}>
              Quick Reference Chart
            </div>
            <p className={`text-[8px] md:text-[8.5px] font-sans text-muted`}>
              Match Switch ports to slots expecting matching VLAN parameters. Double Check standard compatibility!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
