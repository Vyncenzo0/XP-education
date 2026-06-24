import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { Award, Zap, HelpCircle, RefreshCw, Layers, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface Rj45WiringGameProps {
  uid: string;
  displayName: string;
  onGameEnd: (score: number, avgReactionMs: number) => void;
  onExit: () => void;
}

interface WireItem {
  id: string;
  colorName: string;
  hex: string;
  stripe?: string; // CSS background styling pattern
}

const WIRE_COLORS: WireItem[] = [
  { id: "wo", colorName: "White/Orange", hex: "#f97316", stripe: "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 10px, #f97316 10px, #f97316 20px)" },
  { id: "o", colorName: "Orange", hex: "#ea580c" },
  { id: "wg", colorName: "White/Green", hex: "#22c55e", stripe: "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 10px, #22c55e 10px, #22c55e 20px)" },
  { id: "bl", colorName: "Blue", hex: "#2563eb" },
  { id: "wbl", colorName: "White/Blue", hex: "#3b82f6", stripe: "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 10px, #3b82f6 10px, #3b82f6 20px)" },
  { id: "g", colorName: "Green", hex: "#16a34a" },
  { id: "wbr", colorName: "White/Brown", hex: "#78350f", stripe: "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 10px, #78350f 10px, #78350f 20px)" },
  { id: "br", colorName: "Brown", hex: "#451a03" }
];

// Correct ordering arrays
const T568A_STANDARDS = ["wg", "g", "wo", "bl", "wbl", "o", "wbr", "br"];
const T568B_STANDARDS = ["wo", "o", "wg", "bl", "wbl", "g", "wbr", "br"];

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function Rj45WiringGame({ uid, displayName, onGameEnd, onExit }: Rj45WiringGameProps) {
  const { theme } = useTheme();
  const [standard, setStandard] = useState<"T568A" | "T568B">("T568B");
  const [currentWiring, setCurrentWiring] = useState<(WireItem | null)[]>(Array(8).fill(null));
  
  // Game state
  const [startTime, setStartTime] = useState<number>(0);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [crimped, setCrimped] = useState<boolean>(false);

  // Result assessment state
  const [crimpedOk, setCrimpedOk] = useState<boolean>(false);
  const [errorPins, setErrorPins] = useState<boolean[]>(Array(8).fill(false));
  const [feedbackScore, setFeedbackScore] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Spool remaining options list
  const [spoolOptions, setSpoolOptions] = useState<WireItem[]>(() => shuffleArray(WIRE_COLORS));

  // Refs to guarantee absolute freshest sync values when submitting
  const lastScoreRef = useRef<number>(0);
  const gameDurationMsRef = useRef<number>(0);

  useEffect(() => {
    // Pick standard randomly at beginning
    const standards: ("T568A" | "T568B")[] = ["T568A", "T568B"];
    setStandard(standards[Math.floor(Math.random() * standards.length)]);
  }, []);

  // Timer loop
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (hasStarted && !crimped) {
      t = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(t);
  }, [hasStarted, crimped]);

  const startGame = () => {
    setHasStarted(true);
    setCrimped(false);
    setSecondsElapsed(0);
    setStartTime(Date.now());
    setCurrentWiring(Array(8).fill(null));
    setSpoolOptions(shuffleArray(WIRE_COLORS));
    setErrorPins(Array(8).fill(false));
    setSubmitting(false);
    setFeedbackScore(0);
    lastScoreRef.current = 0;
    gameDurationMsRef.current = 0;
  };

  // User places color spool wire into next empty RJ45 channel slot
  const handleSelectWire = (wire: WireItem) => {
    if (!hasStarted || crimped) return;

    // Find first vacant slot
    const firstEmptyIdx = currentWiring.findIndex((v) => v === null);
    if (firstEmptyIdx === -1) return; // fully packed already

    const newWiring = [...currentWiring];
    newWiring[firstEmptyIdx] = wire;
    setCurrentWiring(newWiring);

    // Remove from the remaining tray/spool
    setSpoolOptions((prev) => prev.filter((item) => item.id !== wire.id));
  };

  // User clicks slot to release/pull back wire
  const handleRemoveWireFromPin = (pinIdx: number) => {
    if (!hasStarted || crimped) return;
    const item = currentWiring[pinIdx];
    if (!item) return;

    const newWiring = [...currentWiring];
    newWiring[pinIdx] = null;
    setCurrentWiring(newWiring);

    // Append back to tray spool and reshuffle to maintain non-trivial positioning
    setSpoolOptions((prev) => shuffleArray([...prev, item]));
  };

  const handleCrimpConnector = () => {
    if (!hasStarted || crimped) return;

    const correctSequence = standard === "T568B" ? T568B_STANDARDS : T568A_STANDARDS;
    let perfectCount = 0;
    const validationErrors = Array(8).fill(false);

    currentWiring.forEach((placed, idx) => {
      const correctID = correctSequence[idx];
      if (placed && placed.id === correctID) {
        perfectCount++;
      } else {
        validationErrors[idx] = true;
      }
    });

    const totalTimeTakenMs = Date.now() - startTime;
    gameDurationMsRef.current = totalTimeTakenMs;
    setCrimped(true);
    setErrorPins(validationErrors);
    
    // Score formulas
    let scoreEarned = 0;
    const isPerfect = perfectCount === 8;

    if (isPerfect) {
      // Speed premium points reward
      // Full bonus if completed in under 4 seconds. Drops by 1 point per 2ms over 4s.
      const overtimeMs = Math.max(0, totalTimeTakenMs - 4000);
      const speedBonus = Math.max(500, 10000 - Math.round(overtimeMs / 2));
      scoreEarned = 4000 + speedBonus;
      setCrimpedOk(true);
    } else {
      scoreEarned = Math.max(200, perfectCount * 450 - (8 - perfectCount) * 150);
      setCrimpedOk(false);
    }

    lastScoreRef.current = scoreEarned;
    setFeedbackScore(scoreEarned);
  };

  const submitScoreToMultiplayer = () => {
    setSubmitting(true);
    // Use precise captured refs to bypass React state sync lags or dialog idle-time inflations
    const scoreToSubmit = lastScoreRef.current || feedbackScore;
    const finalDurationMs = gameDurationMsRef.current || (Date.now() - startTime);
    onGameEnd(scoreToSubmit, Math.round(finalDurationMs / 10));
  };

  return (
    <div id="crimper-active-workspace" className={`flex flex-col h-full border rounded-xl relative overflow-hidden transition-all duration-300 lab-light-panel text-ink`}>
      
      {/* Lab Result Dialog overlay */}
      <AnimatePresence>
        {crimped && (
          <motion.div
            id="crimp-result-dialog"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-surface`}
          >
            <div className={`border rounded-xl p-6 w-full max-w-md text-center space-y-6 shadow-2xl relative overflow-hidden bg-surface border-border text-ink`}>
              <div className="absolute top-0 left-0 w-20 h-20 bg-cyan-500/10 rounded-br-full pointer-events-none" />

              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center border bg-surface-raised border-border`}>
                {crimpedOk ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                )}
              </div>

              <div className="space-y-1.5">
                <h4 className={`text-lg font-medium font-display text-signal`}>
                  {crimpedOk ? "PERFECT WIRING ALIGNMENT!" : "CABLING INTERRUPTED"}
                </h4>
                <p className={`text-xs text-muted`}>
                  {crimpedOk 
                    ? "Fantastic crimp job! Complete pin conductivity check matches high-transmission requirements." 
                    : "Some wire channels were incorrectly ordered or crossed, resulting or causing packet loss."}
                </p>
              </div>

              {/* Score indicators */}
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className={`rounded-xl p-3 border bg-surface-raised border-border`}>
                  <span className={`text-[10px] uppercase block font-semibold font-mono `}>Cabling Score</span>
                  <span className={`font-mono text-xl font-medium text-warning`}>{feedbackScore} pts</span>
                </div>
                <div className={`rounded-xl p-3 border bg-surface-raised border-border`}>
                  <span className={`text-[10px] uppercase block font-semibold font-mono `}>Spent Time</span>
                  <span className="font-mono text-xl font-medium text-cyan-500">{secondsElapsed}s</span>
                </div>
              </div>

              {/* Pin alignment analysis mapping */}
              {!crimpedOk && (
                <div className={`text-left p-3.5 border rounded-xl text-[10px] space-y-2 border-border text-muted`}>
                  <span className="font-medium text-stone-400 uppercase tracking-widest block text-[9px]">Validation mapping:</span>
                  <div className="grid grid-cols-8 gap-1 font-mono text-center">
                    {errorPins.map((isErr, pinIdx) => (
                      <div
                        key={pinIdx}
                        className={`py-1 rounded font-medium ${
                          isErr 
                            ? "border bg-danger-subtle border-danger text-danger"
                            : "border bg-success-subtle border-success text-success"
                        }`}
                      >
                        P{pinIdx + 1}
                        <span className="block text-[8px] font-normal">{isErr ? "✕" : "✓"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  id="btn-wiring-restart"
                  onClick={startGame}
                  className={`flex-1 py-2.5 rounded-xl border transition text-xs font-mono font-medium uppercase cursor-pointer bg-surface-raised border-border text-muted hover:bg-surface-raised`}
                >
                  Retry Cable
                </button>
                <button
                  id="btn-wiring-submit"
                  onClick={submitScoreToMultiplayer}
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-[3px] transition text-xs font-mono font-medium uppercase cursor-pointer disabled:opacity-45 text-white bg-signal`}
                >
                  Submit Score
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar controls */}
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 bg-signal-subtle border-border`}>
        <div className="flex items-center gap-2">
          <Layers className={`w-4 h-4 text-signal`} />
          <h4 className={`text-[10px] uppercase font-mono tracking-widest font-medium font-black text-signal`}>
            RJ45 Cabling Laboratory
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="text-[11px] uppercase font-mono font-normal tracking-wider py-[6px] px-[14px] rounded-[3px] border-[1.5px] transition cursor-pointer bg-transparent border-border text-muted hover:border-danger hover:text-danger"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Active gameplay context container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 max-w-2xl mx-auto w-full">
        
        {/* State: Not yet started instruction card */}
        {!hasStarted && (
          <div className="text-left space-y-6 max-w-md border p-6 rounded-lg bg-surface border-border w-full">
            <div className="text-[11px] font-mono font-normal tracking-[0.06em] uppercase text-muted">
              MODULE 04 ACTIVE • CABLING BENCH
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-[20px] h-[20px] text-muted flex-shrink-0 animate-pulse" />
              <h1 className="text-[20px] font-mono font-semibold tracking-[-0.01em] text-ink">
                RJ45 Cabling Skill Certification
              </h1>
            </div>
            
            <p className="text-[15px] font-sans font-normal leading-[1.6] text-body">
              Align the 8 multi-color copper wires inside the crystal modular plug matching either the <span className="font-semibold text-signal font-mono">{standard}</span> color standard from Left-to-Right.
            </p>

            {/* Visual reference diagrams */}
            <div className="p-4 border rounded-md space-y-2.5 font-sans text-xs text-left bg-surface-raised border-border text-muted">
              <span className="font-mono text-[9px] block uppercase font-medium tracking-wider text-muted">Wiring Reference:</span>
              {standard === "T568B" ? (
                <div className={`space-y-1 text-muted`}>
                  <div className={`font-medium mb-1 text-signal`}>Standard B Colors (Most Common):</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[9.5px]">
                    <div>P1: White/Orange</div>
                    <div>P2: Orange</div>
                    <div>P3: White/Green</div>
                    <div>P4: Blue</div>
                    <div>P5: White/Blue</div>
                    <div>P6: Green</div>
                    <div>P7: White/Brown</div>
                    <div>P8: Brown</div>
                  </div>
                </div>
              ) : (
                <div className={`space-y-1 text-muted`}>
                  <div className={`font-medium mb-1 text-signal`}>Standard A Colors:</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[9.5px]">
                    <div>P1: White/Green</div>
                    <div>P2: Green</div>
                    <div>P3: White/Orange</div>
                    <div>P4: Blue</div>
                    <div>P5: White/Blue</div>
                    <div>P6: Orange</div>
                    <div>P7: White/Brown</div>
                    <div>P8: Brown</div>
                  </div>
                </div>
              )}
            </div>

            <button
              id="btn-start-wiring-challenge"
              onClick={startGame}
              className="w-full py-2.5 font-mono font-semibold text-xs uppercase tracking-wide rounded-[3px] transition cursor-pointer bg-signal hover:bg-signal-hover text-white shadow-sm"
            >
              Begin Wiring Lab
            </button>
          </div>
        )}

        {hasStarted && !crimped && (
          <div className="w-full space-y-6">
            
            {/* Cabling prompt display */}
            <div className={`flex justify-between items-center border rounded-xl px-4 py-2 text-xs font-mono bg-surface border-border`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse `} />
                <span className={"text-muted"}>CRIMP TARGET:</span>
                <span className={`font-medium text-signal`}>{standard} Standard</span>
              </div>
              <div className={"text-muted"}>
                Stopwatch: <span className="font-medium text-amber-500">{secondsElapsed}s</span>
              </div>
            </div>

            {/* RJ45 Crystal Plug Head Illustration */}
            <div className={`border rounded-xl p-6 relative flex flex-col items-center bg-surface-raised border-border`}>
              {/* Connector outline shell */}
              <div id="connector-outline-shell" className={`w-full max-w-[320px] border-2 rounded-xl p-4 shadow-inner flex flex-col justify-end min-h-[140px] items-center relative transition-colors bg-surface border-border`}>
                
                {/* Gold Pins row */}
                <div className={`grid grid-cols-8 gap-2.5 w-full border-b pb-3 mb-2 font-mono text-[10px] border-border`}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="text-center space-y-1">
                      <div className="w-full h-1 bg-amber-400/70 rounded-full" />
                      <span>{i + 1}</span>
                    </div>
                  ))}
                </div>

                {/* Placed Wire copper tubes row */}
                <div className="grid grid-cols-8 gap-2.5 w-full">
                  {currentWiring.map((wire, idx) => (
                    <div
                      key={idx}
                      id={`pin-slot-${idx}`}
                      onClick={() => handleRemoveWireFromPin(idx)}
                      className={`aspect-[1/5.5] border rounded-lg flex items-center justify-center cursor-pointer transition relative overflow-hidden duration-150 group bg-surface-raised border-border`}
                    >
                      {wire ? (
                        <div
                          style={{
                            backgroundColor: wire.stripe ? undefined : wire.hex,
                            backgroundImage: wire.stripe
                          }}
                          className="absolute inset-0 rounded flex flex-col justify-end pb-1"
                        >
                          {/* Inner gold conductivity point */}
                          <div className="w-1.5 h-1.5 bg-amber-300 rounded-full mx-auto" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 group-hover:text-stone-600 font-mono">+</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Cable sleeve base */}
                <div className={`absolute -bottom-4 w-44 h-5 border-t rounded-t-lg text-center font-mono text-[8.5px] py-0.5 uppercase tracking-widest pointer-events-none bg-surface-raised border-border text-muted`}>
                  UTP Cat6 Interface
                </div>
              </div>

              {/* Wire release notice */}
              <span className="text-[9px] font-mono text-stone-500 mt-4 uppercase block">
                (Click any placed wire above to pull it back)
              </span>
            </div>

            {/* Selected Wire Spool / Spindle Options Tray */}
            <div className={`space-y-3 p-5 border rounded-xl text-center bg-surface border-border`}>
              <span className={`text-[10.5px] font-medium font-mono tracking-wider uppercase block mb-2 text-signal`}>
                Available Multi-Core Spool
              </span>

              <div className="flex flex-wrap justify-center gap-2">
                {spoolOptions.map((wire) => (
                  <button
                    key={wire.id}
                    id={`wiring-color-${wire.id}`}
                    onClick={() => handleSelectWire(wire)}
                    className={`px-3 py-1.5 border rounded-xl flex items-center gap-2 text-xs font-medium transition duration-200 cursor-pointer bg-surface border-border text-muted hover:text-signal hover:border-signal`}
                  >
                    <div 
                      style={{
                        backgroundColor: wire.stripe ? undefined : wire.hex,
                        backgroundImage: wire.stripe
                      }}
                      className="w-3.5 h-3.5 rounded-full border border-stone-800"
                    />
                    <span>{wire.colorName}</span>
                  </button>
                ))}

                {spoolOptions.length === 0 && (
                  <div className="text-xs text-stone-500 italic py-2">
                    All wires aligned. Ready to crimp!
                  </div>
                )}
              </div>
            </div>

            {/* Action panel */}
            <div className="flex gap-2 justify-center items-center">
              <button
                onClick={onExit}
                className={`px-4 py-2.5 border text-xs font-mono font-medium uppercase rounded-xl transition cursor-pointer bg-danger-subtle border-danger text-danger`}
              >
                Exit
              </button>
              <button
                id="btn-wiring-reset-all"
                onClick={startGame}
                className={`px-5 py-2.5 border text-xs font-mono font-medium uppercase rounded-xl transition cursor-pointer bg-surface border-border text-muted hover:bg-surface-raised hover:bg-signal-subtle`}
              >
                Clear / Reset Spindle
              </button>
              <button
                id="btn-wiring-crimp-cabling"
                onClick={handleCrimpConnector}
                disabled={currentWiring.some((v) => v === null)}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-650 bg-gradient-to-r from-cyan-550 to-emerald-550 bg-gradient-to-r from-cyan-500 to-emerald-500 text-stone-950 font-mono font-medium text-xs uppercase tracking-wide rounded-xl transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10 hover:shadow-cyan-500/15"
              >
                Crimp Connector!
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
