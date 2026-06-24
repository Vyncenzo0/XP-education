import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { Keyboard, RotateCcw, Award, CheckCircle, AlertCircle, Sparkles, Timer } from "lucide-react";

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
  
  // Shuffle the paragraphs to randomize every instance
  const shuffledParagraphs = [...selectedParagraphs].sort(() => 0.5 - Math.random());
  
  let words: string[] = [];
  let pIdx = 0;
  
  while (words.length < count) {
    if (pIdx >= shuffledParagraphs.length) {
      // If we run out, shuffle again and reset
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
  const [timeLeft, setTimeLeft] = useState<number>(30); // 30s test standard
  const [testActive, setTestActive] = useState<boolean>(false);
  const [testFinished, setTestFinished] = useState<boolean>(false);
  
  // Scoring parameters
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [correctCharacters, setCorrectCharacters] = useState<number>(0);
  const [wrongKeystrokes, setWrongKeystrokes] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);

  // References
  const textInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the words
  useEffect(() => {
    resetTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testDurationSetting, testDifficultySetting]);

  const resetTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // We want enough words for the time. 45 is good for 30s for an average typist, let's just make it big enough
    setWords(generateWordList(250, testDifficultySetting));
    setTypedInput("");
    setTimeLeft(testDurationSetting);
    setTestActive(false);
    setTestFinished(false);
    setTotalKeystrokes(0);
    setCorrectCharacters(0);
    setWrongKeystrokes(0);
    setWpm(0);
    setAccuracy(100);
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
    
    // Calculate accuracy and WPM
    const elapsedSeconds = testDurationSetting - timeLeft;
    const elapsedMinutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 1 / 60;
    
    // WPM = (correct chars / 5) / (elapsed minutes)
    const currentWpm = Math.round((correctCharacters / 5) / elapsedMinutes);
    setWpm(Math.max(0, currentWpm));

    const totalTypedCount = correctCharacters + wrongKeystrokes;
    const currentAcc = totalTypedCount > 0 ? Math.round((correctCharacters / totalTypedCount) * 100) : 100;
    setAccuracy(currentAcc);
  }, [timeLeft, correctCharacters, wrongKeystrokes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (testFinished) return;
    
    const value = e.target.value;
    if (!testActive && value.length > 0) {
      startTimer();
    }

    setTypedInput(value);

    // Calculate correct vs wrong characters comparing value with consolidated word string
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
    // Pass wpm as score for achievements and leaderboard
    const diffLabel = testDifficultySetting.charAt(0).toUpperCase() + testDifficultySetting.slice(1);
    onGameEnd(Math.round(wpm), accuracy, `⌨️ TYPE (${testDurationSetting}s, ${diffLabel}):`);
  };

  const targetText = words.join(" ");

  return (
    <div className={`flex flex-col h-full border rounded-xl relative overflow-hidden font-sans transition-all duration-300 lab-light-panel text-ink`}>
      
      {/* Top Header Controls */}
      <div className={`p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 transition-colors duration-300 bg-surface border-border`}>
        <div className="flex items-center flex-wrap gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-medium text-muted`}>
              Active Lab: Terminal Typing Master
            </span>
          </div>
          
          {/* Settings Toggles */}
          {!testActive && !testFinished && (
            <div className={`flex items-center gap-2 border-l pl-3 border-border`}>
              <select
                value={testDurationSetting}
                onChange={(e) => setTestDurationSetting(Number(e.target.value))}
                className={`text-[10px] sm:text-xs font-mono px-2 py-1 rounded outline-none cursor-pointer border transition-colors ${
                  "bg-surface-raised border-border text-ink"
                }`}
              >
                <option value={30}>30s Test</option>
                <option value={60}>60s Test</option>
              </select>
              <select
                value={testDifficultySetting}
                onChange={(e) => setTestDifficultySetting(e.target.value as "easy" | "medium" | "hard" | "elite")}
                className={`text-[10px] sm:text-xs font-mono px-2 py-1 rounded outline-none cursor-pointer border transition-colors ${
                  "bg-surface-raised border-border text-ink"
                }`}
              >
                <option value="easy">Easy Words</option>
                <option value="medium">Med Words</option>
                <option value="hard">Hard Words</option>
                <option value="elite">Elite Code</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 font-mono text-xs text-stone-400 w-full md:w-auto justify-end">
          <div className={`flex items-center gap-1 border px-2 py-1 rounded transition-colors bg-surface-raised border-border`}>
            <Timer className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className={`font-medium text-success`}>{timeLeft}s</span>
          </div>
          <div className={`flex items-center gap-1 border px-2 py-1 rounded transition-colors bg-surface-raised border-border`}>
            <span className="text-xs font-medium text-emerald-400">{wpm} WPM</span>
          </div>
          <div className={`flex items-center gap-1 border px-2 py-1 rounded transition-colors bg-surface-raised border-border`}>
            <span className="text-xs font-medium text-sky-400">{accuracy}% Acc</span>
          </div>
          <div className={`h-4 w-px hidden sm:block bg-surface-raised`} />
          <button
            onClick={onExit}
            className={`text-[9px] uppercase font-mono font-medium tracking-wider px-2.5 py-1 rounded border transition cursor-pointer ${
              "bg-surface border-border text-muted hover:bg-surface-raised"
            }`}
          >
            Exit
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full p-6 md:p-8 space-y-8">
        
        {!testFinished ? (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 block font-medium">TERMINAL TYPING SPEED</span>
              <p className="text-xs text-stone-500">Click in the box below and start typing to initialize the countdown.</p>
            </div>

            {/* Simulated Keyboard Icon Accent */}
            <div className="flex justify-center">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors bg-surface border-border text-muted`}>
                <Keyboard className="w-5 h-5" />
              </div>
            </div>

            {/* Immersive Typing Text Arena */}
            <div 
              className={`relative p-6 md:p-8 border rounded-xl overflow-hidden min-h-[160px] cursor-text transition-colors bg-surface border-border`}
              onClick={() => textInputRef.current?.focus()}
            >
              <div className="text-base md:text-lg font-mono leading-relaxed select-none text-left tracking-wide">
                {targetText.split("").map((char, index) => {
                  let colorClass = ""; // not typed
                  let isCurrent = index === typedInput.length;
                  
                  if (index < typedInput.length) {
                    const isCorrect = typedInput[index] === char;
                    if (isCorrect) {
                      colorClass = "font-medium text-success";
                    } else {
                      colorClass = "font-semibold underline decoration-red-600 bg-danger-subtle text-danger";
                    }
                  }

                  return (
                    <span
                      key={index}
                      className={`relative inline ${colorClass} ${
                        isCurrent ? `animate-pulse border-success text-ink` : ""
                      }`}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>

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
                className="absolute inset-0 opacity-0 w-full h-full cursor-text"
                disabled={testFinished}
              />
            </div>

            {/* Quick Actions Panel */}
            <div className="flex justify-center">
              <button
                onClick={resetTest}
                className={`px-4 py-2 border text-xs font-mono font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  "bg-surface border-border text-muted hover:text-signal"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Test
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 md:p-8 border rounded-xl text-center space-y-6 transition-colors bg-surface border-border`}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className={`text-xl font-medium text-ink`}>Terminal Test Completed!</h3>
              <p className={`text-xs text-muted`}>Excellent pace! Your calculated system performance statistics are compiled below.</p>
            </div>

            {/* Dynamic Recap Stats Cards */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className={`p-4 border rounded-xl space-y-0.5 transition-colors bg-surface-raised border-border`}>
                <span className="text-[9px] font-mono uppercase text-stone-500 font-medium block">Gross Speed</span>
                <span className={`text-2xl font-black font-mono block text-success`}>{wpm}</span>
                <span className="text-[10px] font-mono text-stone-500">Words Per Minute</span>
              </div>

              <div className={`p-4 border rounded-xl space-y-0.5 transition-colors bg-surface-raised border-border`}>
                <span className="text-[9px] font-mono uppercase text-stone-500 font-medium block">Accuracy Rating</span>
                <span className={`text-2xl font-black font-mono block `}>{accuracy}%</span>
                <span className="text-[10px] font-mono text-stone-500">Correct Inputs</span>
              </div>
            </div>

            {/* Action flow buttons */}
            <div className="flex gap-2 justify-center max-w-sm mx-auto pt-2">
              <button
                onClick={resetTest}
                className={`flex-1 px-4 py-2.5 border text-xs font-mono font-medium uppercase rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  "bg-surface border-border text-muted hover:bg-surface-raised"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
              <button
                onClick={handleFinishAndSave}
                className="flex-[2] px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-stone-950 hover:from-cyan-400 hover:to-emerald-400 text-xs font-mono font-medium uppercase rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <Award className="w-4 h-4" />
                Record Results
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className={`p-4 border-t flex items-center justify-center text-[10.5px] font-mono transition-colors bg-surface-raised border-border text-muted`}>
        <span className={"text-muted"}>Tip: Quick-restart typing at any point during active timer using the Reset Test button.</span>
      </div>
    </div>
  );
}
