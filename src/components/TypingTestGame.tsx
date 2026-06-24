import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { Keyboard, RotateCcw, Award, CheckCircle, Timer, RefreshCw } from "lucide-react";

interface TypingTestGameProps {
  uid: string;
  displayName: string;
  onGameEnd: (score: number, accuracy: number, customPrefix?: string) => void;
  onExit: () => void;
}

const EASY_PARAGRAPHS: string[] = [
  "The quick brown fox jumps over the lazy dog. Programming is the process of creating instructions that tell a computer how to perform a task. It can be done using a variety of computer programming languages. Great developers write code that is not only functional but also perfectly readable and optimized.",
  "Web development involves building interactive applications for the internet. It ranges from simple static pages to complex dynamic web applications. Understanding components, state management, and user interfaces are key skills for any modern developer looking to create impactful digital experiences.",
  "A computer network is a group of interconnected devices that can communicate, share resources, and exchange data. These connections can be wired or wireless, using protocols that ensure reliable data delivery. Networking forms the invisible backbone of the entire modern internet infrastructure.",
  "Cloud computing allows users to access shared processing power, storage, and databases over the internet. Instead of maintaining physical servers, organizations can dynamically scale their resources on demand. This approach provides incredible flexibility and reliability for modern applications.",
  "Debugging is an essential part of the software development lifecycle. When an application behaves unexpectedly, developers must carefully trace the execution path and inspect variations in state. Good debugging skills can save countless hours of frustration and lead to a more robust final product."
];

const MEDIUM_PARAGRAPHS: string[] = [
  "Advanced network engineering requires an understanding of diverse protocols, intricate routing tables, and deep packet inspection. Without proper configuration, the underlying infrastructure can suffer from severe latency, jitter, and unmitigated packet loss, severely degrading overall performance.",
  "Modern frontend frameworks increasingly rely on asynchronous state resolution, abstract virtual representations of the document object model, and highly concurrent execution environments. This paradigm shift enables developers to construct dynamic architectures that scale predictably under heavy user interactions.",
  "A comprehensive cybersecurity posture demands meticulous vulnerability assessments, cryptographic integration schemes, and proactive forensic diagnostics. Intrusions often exploit misconfigured permission sets or unpatched zero-day vulnerabilities across distributed enterprise environments.",
  "Database administrators design resilient schemas with normalized constraints to minimize redundant data anomalies. Through careful indexing strategies and complex transactional oversight, they ensure that concurrent read and write operations conform seamlessly to absolute ACID principles.",
  "Microprocessor microarchitecture focuses on optimizing instructions per cycle through sophisticated pipelining, speculative execution, and cache hierarchy management. Nanometer-scale transistor scaling permits exponentially greater computational bandwidth, though it introduces significant thermal management challenges."
];

const HARD_PARAGRAPHS: string[] = [
  "The implementation of the WebSocket protocol (RFC 6455) requires a sophisticated handshake phase where the client sends a Sec-WebSocket-Key header. Upon successful validation, the server responds with a 101 Switching Protocols status code, establishing a persistent bi-directional communication channel over a single TCP connection.",
  "To optimize database performance, one must consider normalizing table structures to the Third Normal Form (3NF) to mitigate redundancy. However, extreme denormalization might be necessary for read-heavy workloads where join operations on large datasets introduce significant I/O overhead and CPU utilization spikes during peak traffic intervals.",
  "Asynchronous programming in JavaScript utilizes an event loop mechanism that manages the execution of multiple scripts while prioritizing the call stack. Promises and the async/await syntax provide a more readable abstraction over the underlying microtask queue, allowing developers to handle non-blocking operations without falling into callback hell.",
  "Cryptographic hashing algorithms like SHA-256 produce a fixed-size bit string that is deterministic and collision-resistant. In blockchain applications, these hashes are used to link blocks chronologically, ensuring that any modification to historical transaction data results in an immediate invalidation of the subsequent chain state.",
  "The deployment of containerized services via Kubernetes involves defining stateful sets, ingress controllers, and persistent volume claims within YAML manifests. Orchestration layers automate the scaling and self-healing processes, ensuring high availability across distributed multi-cloud clusters."
];

const ELITE_PARAGRAPHS: string[] = [
  "export const useAuth = () => { const [user, setUser] = useState<User | null>(null); useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u)); return () => unsubscribe(); }, []); return { user, isAuthenticated: !!user }; }; // Authentication state management hook.",
  "void main() { vec2 uv = gl_FragCoord.xy / iResolution.xy; float d = length(uv - 0.5); vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4)); gl_FragColor = vec4(col * smoothstep(0.4, 0.39, d), 1.0); } // Fragment shader with signed distance fields.",
  "class Singleton { private static instance: Singleton; private constructor() {} public static getInstance(): Singleton { if (!Singleton.instance) { Singleton.instance = new Singleton(); } return Singleton.instance; } } // Standard Singleton pattern implementation in TypeScript.",
  "const matrix = Array.from({ length: size }, () => Array(size).fill(0)); for(let i=0; i<size; i++) { for(let j=0; j<size; j++) { matrix[i][j] = (i === j) ? 1 : 0; } } return matrix; // Generating an identity matrix for linear algebraic computations.",
  "git checkout -b feature/auth && git add . && git commit -m 'feat: implement jwt validation middleware' && git push origin feature/auth // CLI-based developer workflow for branch management and collaborative version control."
];

function generateWordList(count: number = 40, difficulty: "easy" | "medium" | "hard" | "elite" = "medium"): string[] {
  let selectedParagraphs = difficulty === "easy" ? EASY_PARAGRAPHS 
                         : difficulty === "medium" ? MEDIUM_PARAGRAPHS
                         : difficulty === "hard" ? HARD_PARAGRAPHS
                         : ELITE_PARAGRAPHS;
  
  const shuffledParagraphs = [...selectedParagraphs].sort(() => 0.5 - Math.random());
  
  let words: string[] = [];
  let pIdx = 0;
  
  while (words.length < count) {
    if (pIdx >= shuffledParagraphs.length) {
      shuffledParagraphs.sort(() => 0.5 - Math.random());
      pIdx = 0;
    }
    const nextParagraph = shuffledParagraphs[pIdx];
    words = words.concat(nextParagraph.split(" "));
    pIdx++;
  }
  
  return words.slice(0, count);
}

export default function TypingTestGame({ uid, displayName, onGameEnd, onExit }: TypingTestGameProps) {
  const { theme } = useTheme();
  const [words, setWords] = useState<string[]>([]);
  const [typedInput, setTypedInput] = useState<string>("");
  const [testDurationSetting, setTestDurationSetting] = useState<number>(30);
  const [testDifficultySetting, setTestDifficultySetting] = useState<"easy" | "medium" | "hard" | "elite">("medium");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [testActive, setTestActive] = useState<boolean>(false);
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(true);
  
  // Scoring parameters
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [correctCharacters, setCorrectCharacters] = useState<number>(0);
  const [wrongKeystrokes, setWrongKeystrokes] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);

  // References
  const textInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize the words
  useEffect(() => {
    resetTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testDurationSetting, testDifficultySetting]);

  // Focus mechanics and global keydown listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key === "Escape") {
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        resetTest();
        return;
      }
      if (document.activeElement !== textInputRef.current && !testFinished) {
        textInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [testFinished]);

  // Line scrolling as user types
  useEffect(() => {
    const activeWordIdx = typedInput.split(" ").length - 1;
    const activeWordEl = document.getElementById(`word-${activeWordIdx}`);
    const container = containerRef.current;
    if (activeWordEl && container) {
      const containerHeight = container.clientHeight;
      const wordTop = activeWordEl.offsetTop;
      const wordHeight = activeWordEl.clientHeight;
      
      const targetScroll = wordTop - (containerHeight / 2) + (wordHeight / 2);
      container.scrollTo({
        top: targetScroll,
        behavior: "smooth"
      });
    }
  }, [typedInput]);

  const resetTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setWords(generateWordList(200, testDifficultySetting));
    setTypedInput("");
    setTimeLeft(testDurationSetting);
    setTestActive(false);
    setTestFinished(false);
    setTotalKeystrokes(0);
    setCorrectCharacters(0);
    setWrongKeystrokes(0);
    setWpm(0);
    setAccuracy(100);
    setIsInputFocused(true);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  };

  const startTimer = () => {
    setTestActive(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTestActive(false);
          setTestFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Compute stats in real-time
  useEffect(() => {
    if (!testActive && timeLeft === testDurationSetting) return;
    
    const elapsedSeconds = testDurationSetting - timeLeft;
    const elapsedMinutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 1 / 60;
    
    const currentWpm = Math.round((correctCharacters / 5) / elapsedMinutes);
    setWpm(Math.max(0, currentWpm));

    const totalTypedCount = correctCharacters + wrongKeystrokes;
    const currentAcc = totalTypedCount > 0 ? Math.round((correctCharacters / totalTypedCount) * 100) : 100;
    setAccuracy(currentAcc);
  }, [timeLeft, correctCharacters, wrongKeystrokes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (testFinished) return;
    
    let value = e.target.value;
    value = value.replace(/  +/g, " "); // prevent multiple spaces
    
    if (!testActive && value.length > 0) {
      startTimer();
    }

    setTypedInput(value);

    const targetString = words.join(" ");
    let correct = 0;
    let wrong = 0;

    for (let i = 0; i < value.length; i++) {
      if (i < targetString.length) {
        if (value[i] === targetString[i]) {
          correct++;
        } else {
          wrong++;
        }
      } else {
        wrong++;
      }
    }

    setCorrectCharacters(correct);
    setWrongKeystrokes(wrong);
    setTotalKeystrokes(value.length);
  };

  const handleFinishAndSave = () => {
    const diffLabel = testDifficultySetting.charAt(0).toUpperCase() + testDifficultySetting.slice(1);
    onGameEnd(Math.round(wpm), accuracy, `⌨️ TYPE (${testDurationSetting}s, ${diffLabel}):`);
  };

  // Build the MonkeyType style word list rendering with flat indices
  let globalCharIdx = 0;
  const renderedWords = words.map((word, wIdx) => {
    const activeWordIdx = typedInput.split(" ").length - 1;
    const isWordActive = wIdx === activeWordIdx;
    const wordCharSpans = [];

    // Render characters inside the word
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const flatIdx = globalCharIdx;
      globalCharIdx++;

      let charClass = "text-muted/30 transition-colors duration-150";
      let isCurrent = flatIdx === typedInput.length;

      if (flatIdx < typedInput.length) {
        const isCorrect = typedInput[flatIdx] === char;
        charClass = isCorrect 
          ? "text-ink font-medium" 
          : "text-danger border-b-2 border-danger/60 font-semibold";
      }

      wordCharSpans.push(
        <span key={`char-${wIdx}-${i}`} className="relative inline">
          {isCurrent && <span className="custom-caret" />}
          <span className={charClass}>{char}</span>
        </span>
      );
    }

    // Handle extra typed characters at the end of active word (typos past word length)
    const typedWords = typedInput.split(" ");
    if (isWordActive && typedWords[wIdx] && typedWords[wIdx].length > word.length) {
      const extraTyped = typedWords[wIdx].slice(word.length);
      for (let i = 0; i < extraTyped.length; i++) {
        const char = extraTyped[i];
        const isCurrent = (globalCharIdx + i) === typedInput.length;
        wordCharSpans.push(
          <span key={`extra-${wIdx}-${i}`} className="relative inline animate-pulse">
            {isCurrent && <span className="custom-caret" />}
            <span className="text-danger/90 border-b-2 border-danger font-semibold bg-danger-subtle/10">{char}</span>
          </span>
        );
      }
    }

    // Space after the word
    const hasSpace = wIdx < words.length - 1;
    let spaceSpan = null;
    if (hasSpace) {
      const spaceFlatIdx = globalCharIdx;
      globalCharIdx++;
      const isCurrent = spaceFlatIdx === typedInput.length;
      let spaceClass = "text-muted/10";
      
      if (spaceFlatIdx < typedInput.length) {
        const isCorrect = typedInput[spaceFlatIdx] === " ";
        spaceClass = isCorrect ? "text-muted/10" : "text-danger bg-danger/10 border-b-2 border-danger/60 font-semibold";
      }

      spaceSpan = (
        <span key={`space-${wIdx}`} className="relative inline">
          {isCurrent && <span className="custom-caret" />}
          <span className={spaceClass}>&nbsp;</span>
        </span>
      );
    }

    return (
      <span 
        key={`word-wrap-${wIdx}`} 
        id={`word-${wIdx}`}
        className={`inline-block py-0.5 px-1 rounded transition-colors duration-200 ${
          isWordActive ? "bg-signal-subtle/10" : ""
        }`}
      >
        <span className="inline-flex">
          {wordCharSpans}
        </span>
        {spaceSpan}
      </span>
    );
  });

  return (
    <div className="flex flex-col h-full border rounded-xl relative overflow-hidden font-sans transition-all duration-300 lab-light-panel text-ink">
      <style>{`
        @keyframes caretBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .custom-caret {
          position: absolute;
          left: 0;
          top: 15%;
          height: 70%;
          width: 2px;
          background-color: var(--signal);
          animation: caretBlink 1s infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Top Header Controls */}
      <div className="p-4 border-b flex items-center justify-between gap-4 relative z-10 transition-colors duration-300 bg-surface border-border">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-signal" />
          <span className="text-xs font-mono font-medium tracking-wide uppercase">
            Lab Terminal Precision
          </span>
        </div>
        <button
          onClick={onExit}
          className="text-[9px] uppercase font-mono font-medium tracking-wider px-2.5 py-1 rounded border transition cursor-pointer bg-surface border-border text-muted hover:bg-surface-raised"
        >
          Exit
        </button>
      </div>

      {/* Main Centered Play Mechanics */}
      <div className="flex-1 flex flex-col justify-center items-center py-10 px-4 md:px-8 relative overflow-hidden bg-surface">
        
        {/* Focusing Layer */}
        <AnimatePresence>
          {!isInputFocused && !testFinished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface/90 backdrop-blur-[1.5px] z-20 flex flex-col items-center justify-center cursor-pointer"
              onClick={() => textInputRef.current?.focus()}
            >
              <div className="text-center space-y-3">
                <p className="text-sm font-mono text-signal font-medium animate-pulse">
                  🖱️ Click inside or press any key to focus typing arena
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted/60 font-mono">
                  Pressing TAB resets test immediately
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-[850px] w-full space-y-10 flex flex-col justify-center">
          
          {!testFinished ? (
            <>
              {/* Minimalist MonkeyType Config Option Bar */}
              <AnimatePresence>
                {!testActive && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-center relative z-30"
                  >
                    <div className="inline-flex items-center gap-4 bg-surface-raised border border-border/50 rounded-full px-5 py-1.5 shadow-sm text-[11px] font-mono select-none">
                      {/* Time */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted/50 uppercase text-[9px] tracking-wider font-semibold">Time:</span>
                        {[15, 30, 60].map((t) => (
                          <button
                            key={t}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setTestDurationSetting(t);
                              setTimeLeft(t);
                              textInputRef.current?.focus();
                            }}
                            className={`px-2 py-0.5 rounded transition-all font-semibold cursor-pointer ${
                              testDurationSetting === t
                                ? "text-signal bg-signal-subtle/40"
                                : "text-muted hover:text-ink"
                            }`}
                          >
                            {t}s
                          </button>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="h-3.5 w-px bg-border/60" />

                      {/* Difficulty */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted/50 uppercase text-[9px] tracking-wider font-semibold">Words:</span>
                        {(["easy", "medium", "hard", "elite"] as const).map((diff) => (
                          <button
                            key={diff}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setTestDifficultySetting(diff);
                              textInputRef.current?.focus();
                            }}
                            className={`px-2 py-0.5 rounded capitalize transition-all font-semibold cursor-pointer ${
                              testDifficultySetting === diff
                                ? "text-signal bg-signal-subtle/40"
                                : "text-muted hover:text-ink"
                            }`}
                          >
                            {diff === "elite" ? "Elite Code" : diff}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live HUD (Minimal Stats Overlay) */}
              <div className="flex justify-between items-baseline border-b border-border/20 pb-2 px-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-light font-mono text-signal leading-none">
                    {timeLeft}
                  </span>
                  <span className="text-xs font-mono text-muted/60 uppercase tracking-widest font-semibold">s left</span>
                </div>
                {testActive && (
                  <div className="flex items-center gap-4 font-mono text-xs">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-muted/40 uppercase tracking-wider">Speed</span>
                      <span className="text-sm font-semibold text-ink leading-none">{wpm} WPM</span>
                    </div>
                    <div className="h-6 w-px bg-border/20" />
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-muted/40 uppercase tracking-wider">Accuracy</span>
                      <span className="text-sm font-semibold text-ink leading-none">{accuracy}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bounded, Fluid Typing Area */}
              <div className="relative">
                {/* Hidden focused text input field */}
                <input
                  ref={textInputRef}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={typedInput}
                  onChange={handleInputChange}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-text z-0"
                  disabled={testFinished}
                />

                {/* 3-Line Constrained Scrollable Word Container */}
                <div 
                  ref={containerRef}
                  className="h-[140px] overflow-hidden relative w-full pr-2 select-none cursor-text text-left leading-relaxed font-mono text-lg md:text-xl text-justify"
                  onClick={() => textInputRef.current?.focus()}
                >
                  <div className="flex flex-wrap gap-x-3 gap-y-4 items-center">
                    {renderedWords}
                  </div>
                </div>
              </div>

              {/* Minimalist Controls Section */}
              <div className="flex justify-center pt-4 relative z-30">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    resetTest();
                    textInputRef.current?.focus();
                  }}
                  title="Reset (or press TAB)"
                  className="p-3 border border-border/40 rounded-full transition bg-surface hover:bg-surface-raised text-muted/60 hover:text-signal shadow-sm hover:scale-105 active:scale-95 duration-150 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            /* Premium MonkeyType End Stats Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 border rounded-2xl text-center space-y-8 bg-surface-raised border-border/60 shadow-lg max-w-xl mx-auto w-full"
            >
              <div className="w-14 h-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-success mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-light tracking-tight text-ink">Test Complete</h3>
                <p className="text-xs text-muted">Excellent effort! Your terminal speed performance data has been finalized.</p>
              </div>

              {/* Large Display Stats */}
              <div className="grid grid-cols-2 gap-6 py-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted block">Speed</span>
                  <span className="text-5xl font-extralight font-mono text-signal leading-none">{wpm}</span>
                  <span className="text-[10px] font-mono text-muted/60 block mt-1">Words Per Minute</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted block">Accuracy</span>
                  <span className="text-5xl font-extralight font-mono text-success leading-none">{accuracy}%</span>
                  <span className="text-[10px] font-mono text-muted/60 block mt-1">Correct Key Inputs</span>
                </div>
              </div>

              {/* Metadata details */}
              <div className="border-t border-b border-border/30 py-3 grid grid-cols-3 text-center text-xs font-mono text-muted/80">
                <div>
                  <span className="block text-[9px] text-muted/40 uppercase">Difficulty</span>
                  <span className="font-semibold text-ink capitalize">{testDifficultySetting}</span>
                </div>
                <div className="border-l border-r border-border/30">
                  <span className="block text-[9px] text-muted/40 uppercase">Keystrokes</span>
                  <span className="font-semibold text-ink">{totalKeystrokes}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted/40 uppercase">Errors</span>
                  <span className="font-semibold text-danger">{wrongKeystrokes}</span>
                </div>
              </div>

              {/* Actions panel */}
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={resetTest}
                  className="flex-1 py-3 px-5 border text-xs font-mono font-medium uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-2 bg-surface border-border text-muted hover:bg-surface-raised"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
                <button
                  onClick={handleFinishAndSave}
                  className="flex-[2] py-3 px-6 bg-gradient-to-r from-signal to-indigo-600 hover:from-signal-hover hover:to-indigo-500 text-white text-xs font-mono font-medium uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] duration-150"
                >
                  <Award className="w-4 h-4" />
                  Record Results
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      <div className="p-3 border-t flex items-center justify-center text-[11px] font-mono transition-colors bg-surface-raised border-border text-muted">
        <span className="flex items-center gap-1.5 opacity-60">
          <kbd className="px-1.5 py-0.5 bg-surface border border-border/60 rounded text-[9px] shadow-sm">TAB</kbd>
          <span>Quick restart typing test</span>
          <span className="text-muted/40">•</span>
          <kbd className="px-1.5 py-0.5 bg-surface border border-border/60 rounded text-[9px] shadow-sm">ESC</kbd>
          <span>Unfocus typing arena</span>
        </span>
      </div>
    </div>
  );
}
