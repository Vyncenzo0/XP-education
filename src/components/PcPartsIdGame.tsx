import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  ChevronRight, 
  Cpu, 
  Award, 
  Timer,
  Zap,
  Flame,
  Info,
  ShieldCheck,
  Binary,
  BookOpen,
  ArrowLeft,
  HelpCircle,
  Terminal
} from "lucide-react";

interface PcPartsIdGameProps {
  uid: string;
  displayName: string;
  onGameEnd: (score: number, avgReactionMs: number, customPrefix?: string) => void;
  onExit: () => void;
}

interface Question {
  id: string;
  category: string;
  difficulty: "Expert" | "Hard" | "Technical" | "Medium" | "Easy";
  title: string;
  diagramType: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// 20-question quiz focused specifically on identifying various PC components, their visual characteristics, slots, and form factors.
const QUESTIONS_POOL: Question[] = [
  {
    id: "q-cpu-brain",
    category: "Processors",
    difficulty: "Easy",
    title: "Central Processing Unit (CPU)",
    diagramType: "cpu-chip",
    question: "Which component is known as the \"brain\" of the computer and performs all processing instructions?",
    options: ["GPU", "RAM", "CPU", "Motherboard"],
    correctAnswer: "CPU",
    explanation: "The CPU (Central Processing Unit) carries out the main command logic and mathematical equations that run the computer software programs and operating systems."
  },
  {
    id: "q-dimm-ram",
    category: "Memory Slots",
    difficulty: "Easy",
    title: "DDR Memory Module (DIMM)",
    diagramType: "ram-dimm",
    question: "You see a long, rectangular circuit board with gold pins on one edge that clicks into a vertical slot next to the CPU. What is this?",
    options: ["M.2 SSD", "DIMM (RAM)", "PCIe Card", "SATA Cable"],
    correctAnswer: "DIMM (RAM)",
    explanation: "DIMM stands for Dual In-line Memory Module, which is the physical form factor of standard desktop computer RAM (Random Access Memory)."
  },
  {
    id: "q-vrm-purpose",
    category: "Power Subsystems",
    difficulty: "Medium",
    title: "Voltage Regulator Module",
    diagramType: "vrm",
    question: "What is the primary purpose of the Motherboard's VRM (Voltage Regulator Module)?",
    options: ["To provide audio output", "To convert electricity into stable voltage for the CPU", "To store BIOS settings", "To connect the mouse and keyboard"],
    correctAnswer: "To convert electricity into stable voltage for the CPU",
    explanation: "The VRM converts unstable high voltage from the PSU (like 12V) into raw, stable core voltage (around 1V to 1.3V) that processor chips require to run safely."
  },
  {
    id: "q-m2-drive",
    category: "Storage Sockets",
    difficulty: "Easy",
    title: "M.2 Expansion Key-ways",
    diagramType: "m2",
    question: "Which type of drive connects to an M.2 slot and lies flat against the motherboard?",
    options: ["HDD", "2.5-inch SATA SSD", "NVMe SSD", "Optical Drive"],
    correctAnswer: "NVMe SSD",
    explanation: "Modern high-speed NVMe solid state drives are manufactured in the compact M.2 card design and install flush against the motherboard."
  },
  {
    id: "q-form-factor",
    category: "Motherboards",
    difficulty: "Medium",
    title: "Board Physical Outlines",
    diagramType: "form-factor",
    question: "What does \"Form Factor\" refer to in the context of motherboards?",
    options: ["The physical size and layout of the board", "The color of the PCB", "The speed of the CPU socket", "The amount of RAM supported"],
    correctAnswer: "The physical size and layout of the board",
    explanation: "Motherboard form factors (such as ATX, Micro-ATX, and Mini-ITX) dictate the physical measurements, screw placement, and case compatibility standards."
  },
  {
    id: "q-pcie-x16-slot",
    category: "Expansion Slots",
    difficulty: "Easy",
    title: "High-Speed Expansion Lane",
    diagramType: "pcie-x16",
    question: "Which slot is traditionally used for high-bandwidth components like Graphics Cards (GPUs)?",
    options: ["PCIe x16", "SATA port", "USB header", "M.2 slot"],
    correctAnswer: "PCIe x16",
    explanation: "The PCIe x16 slot provides the full complement of 16 high-speed serial data lanes, essential for feed-heavy modern graphics processing."
  },
  {
    id: "q-cmos-battery",
    category: "Motherboard Battery",
    difficulty: "Easy",
    title: "Silver Coin-Cell Power",
    diagramType: "cr2032-battery",
    question: "A user complains their PC clock resets every time they unplug it. Which component likely needs replacing?",
    options: ["CPU", "PSU", "CMOS Battery (CR2032)", "RAM"],
    correctAnswer: "CMOS Battery (CR2032)",
    explanation: "A small CR2032 coin cell battery keeps the physical clock ticking and bios configurations intact when primary power lines are detached."
  },
  {
    id: "q-atx-24pin",
    category: "Power Cables",
    difficulty: "Easy",
    title: "Motherboard Main Input",
    diagramType: "atx-24pin",
    question: "What is the standard purpose of the 24-pin connector coming from the Power Supply?",
    options: ["Powering the GPU", "Powering the CPU", "Main motherboard power", "Powering the cooling fans"],
    correctAnswer: "Main motherboard power",
    explanation: "The 24-pin ATX connector feeds the motherboard with several voltages (3.3V, 5V, 12V) to run logic chips, memory lanes, and card slots."
  },
  {
    id: "q-volatile-ram",
    category: "Memory Sockets",
    difficulty: "Easy",
    title: "Volatile Access Memory",
    diagramType: "ram-volatile",
    question: "Which of the following is a \"volatile\" memory type?",
    options: ["HDD", "SSD", "RAM", "ROM"],
    correctAnswer: "RAM",
    explanation: "RAM is volatile memory, meaning it holds high-response data only. When the system loses power or turns off, everything in RAM is cleared."
  },
  {
    id: "q-io-shield",
    category: "Chassis Armor",
    difficulty: "Easy",
    title: "Input/Output Protection",
    diagramType: "io-shield",
    question: "What is the \"I/O Shield\"?",
    options: ["A protective film on the CPU", "A metal plate that covers rear ports", "A cooling cover for the GPU", "A dust filter for the case"],
    correctAnswer: "A metal plate that covers rear ports",
    explanation: "The Input/Output shield covers gaps around rear motherboard output ports, reducing electromagnetic noise and keeping bugs or dust out of the chassis."
  },
  {
    id: "q-northbridge",
    category: "Mainboard Core",
    difficulty: "Medium",
    title: "High-Speed Access Bridge",
    diagramType: "chipset",
    question: "Which component acts as a high-speed \"bridge\" for data between the CPU and RAM?",
    options: ["Northbridge/Chipset", "Sound Card", "PSU", "Optical Drive"],
    correctAnswer: "Northbridge/Chipset",
    explanation: "The Northbridge (or integrated system agent chipset) historically handles lightning-fast data exchanges between memory pools, GPUs, and the primary processor."
  },
  {
    id: "q-dual-channel",
    category: "Memory Routing",
    difficulty: "Medium",
    title: "Multi-Channel Jumpering",
    diagramType: "dual-channel",
    question: "What does \"Dual-Channel\" refer to when installing RAM?",
    options: ["Using two different speeds of RAM", "Installing RAM in specific slots to increase bandwidth", "Using two different brands", "Connecting RAM to both the GPU and CPU"],
    correctAnswer: "Installing RAM in specific slots to increase bandwidth",
    explanation: "Populating matching channels (often slots A2 and B2) opens up two parallel data paths, doubling potential memory speed access rails."
  },
  {
    id: "q-ssd-flash",
    category: "Storage Modules",
    difficulty: "Easy",
    title: "Direct Silicon Storage",
    diagramType: "sata-data",
    question: "Which component has no moving parts and stores data using flash memory?",
    options: ["HDD", "SSD", "Blu-ray drive", "Floppy disk"],
    correctAnswer: "SSD",
    explanation: "SSDs write data to non-volatile NAND flash silicon cells instead of heavy mechanical magnetic discs, running silently and far faster."
  },
  {
    id: "q-capacitors",
    category: "Power Subsystems",
    difficulty: "Medium",
    title: "Electrolytic Stave Filter",
    diagramType: "capacitors",
    question: "What are the small, tall cylinders on a motherboard responsible for?",
    options: ["Cooling", "Storing/Filtering electrical energy (Capacitors)", "Processing data", "Audio output"],
    correctAnswer: "Storing/Filtering electrical energy (Capacitors)",
    explanation: "The structural cylinders on motherboards are electronic capacitors designed to filter waves, clean electrical voltage noise, and shield electronics."
  },
  {
    id: "q-thermal-paste",
    category: "Cooling Materials",
    difficulty: "Easy",
    title: "Thermal Interface Paste",
    diagramType: "paste",
    question: "What is the function of Thermal Paste?",
    options: ["To glue the CPU to the socket", "To protect the pins from dust", "To eliminate air gaps for heat transfer", "To prevent short circuits"],
    correctAnswer: "To eliminate air gaps for heat transfer",
    explanation: "Thermal paste fills micro-texture bubbles of empty air between cooler metals and your processor's outer lid to optimize heat transfer paths."
  },
  {
    id: "q-lga-pins",
    category: "Processor Sockets",
    difficulty: "Easy",
    title: "Land Grid Array Standard",
    diagramType: "lga",
    question: "Which of the following describes an LGA socket?",
    options: ["Pins are on the CPU", "Pins are on the motherboard", "No pins, uses magnets", "Uses solder balls"],
    correctAnswer: "Pins are on the motherboard",
    explanation: "In Land Grid Array sockets (like Intel LGA1700 or AMD AM5), the socket inside the board hosts the delicate, springy connector pins."
  },
  {
    id: "q-powersw",
    category: "Chassis Buttons",
    difficulty: "Easy",
    title: "Power Switch Jumper",
    diagramType: "fpanel",
    question: "What is the function of the \"Power SW\" pins on the front panel header?",
    options: ["To turn the PC on/off", "To reset the BIOS", "To light up the case", "To adjust fan speed"],
    correctAnswer: "To turn the PC on/off",
    explanation: "Shorting the Power SW (Power Switch) pins via standard tactile pushbuttons lets the motherboard command power sequencing on the PSU."
  },
  {
    id: "q-gpu-card",
    category: "Graphics Core",
    difficulty: "Easy",
    title: "Dedicated Graphics Card",
    diagramType: "gpu-board",
    question: "Which component is the largest expansion card in a typical gaming PC?",
    options: ["Sound Card", "Network Card", "Graphics Card (GPU)", "Capture Card"],
    correctAnswer: "Graphics Card (GPU)",
    explanation: "Dedicated graphics cards (GPUs) require massive board circuits, dedicated VRAM chips, power delivery VRMs, and heavy fan heatsinks, making them the largest cards inside clean systems."
  },
  {
    id: "q-hdd-ssd-diff",
    category: "Storage Outlines",
    difficulty: "Easy",
    title: "Mechanical vs Flash Drive",
    diagramType: "hdd-platters",
    question: "What is the difference between a 3.5-inch HDD and a 2.5-inch SSD?",
    options: ["The HDD uses spinning platters", "The SSD is larger", "The HDD is faster", "The SSD uses magnets"],
    correctAnswer: "The HDD uses spinning platters",
    explanation: "Conventional mechanical hard disk drives read data off heavy magnetic aluminum disks rotating at high speeds, while solid-state drives contain zero moving parts."
  },
  {
    id: "q-cooler-heatsink",
    category: "Cooling Systems",
    difficulty: "Easy",
    title: "Radiator Cooling Fan",
    diagramType: "fan-head",
    question: "What is the purpose of a CPU Heatsink/Fan assembly?",
    options: ["To provide power", "To store temporary data", "To dissipate heat", "To connect external devices"],
    correctAnswer: "To dissipate heat",
    explanation: "Copper contact pins or heatpipes transfer intense thermal load off processor dies to aluminum fins where fresh air from fans sweeps it away."
  }
];

export default function PcPartsIdGame({ uid, displayName, onGameEnd, onExit }: PcPartsIdGameProps) {
  const { theme } = useTheme();
  const [screen, setScreen] = useState<"welcome" | "reviewer" | "playing" | "gameover">("welcome");
  const [reviewerIndex, setReviewerIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredRight, setAnsweredRight] = useState<boolean | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(20);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalTimeMs, setTotalTimeMs] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);

  // Initialize questions fallback
  useEffect(() => {
    const shuffled = [...QUESTIONS_POOL].sort(() => Math.random() - 0.5);
    const sliced = shuffled.slice(0, 10);
    const randomizedQuestions = sliced.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));
    setQuestions(randomizedQuestions);
  }, []);

  const startDiagnosticExam = () => {
    const shuffled = [...QUESTIONS_POOL].sort(() => Math.random() - 0.5);
    const sliced = shuffled.slice(0, 10);
    const randomizedQuestions = sliced.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));
    setQuestions(randomizedQuestions);
    setStreak(0);
    setMaxStreak(0);
    setScore(0);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnsweredRight(null);
    setTimeRemaining(20);
    setIsGameOver(false);
    setCorrectCount(0);
    setTotalTimeMs(0);
    setTimerActive(true);
    setQuestionsAnswered(0);
    setScreen("playing");
  };

  // Timer interval loop
  useEffect(() => {
    if (screen !== "playing" || isGameOver || !timerActive || selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          // Timeout: reset streak, record progress, and advance automatically to next question
          setStreak(0);
          setQuestionsAnswered((q) => q + 1);
          setTotalTimeMs((t) => t + 20000);

          setSelectedAnswer(null);
          setAnsweredRight(null);
          setTimeRemaining(20);

          if (currentIndex >= questions.length - 1) {
            setIsGameOver(true);
            setScreen("gameover");
          } else {
            setCurrentIndex((cur) => cur + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, selectedAnswer, isGameOver, timerActive, questions.length, screen]);

  const handleOptionClick = (option: string) => {
    if (selectedAnswer !== null) return; // Prevent double clicks
    
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;
    
    setSelectedAnswer(option);
    const isCorrect = option === currentQuestion.correctAnswer;
    setAnsweredRight(isCorrect);
    setQuestionsAnswered((prev) => prev + 1);

    // Track total response time for calculating average
    const timeSpentSeconds = 20 - timeRemaining;
    setTotalTimeMs((prev) => prev + (timeSpentSeconds * 1000));

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Score logic: 120 base + speed bonus + streak multiplier
      const speedBonus = Math.round(timeRemaining * 12);
      const streakMultiplier = 1 + (newStreak * 0.15); // +15% per streak tier
      const pointsEarned = Math.round((120 + speedBonus) * streakMultiplier);
      setScore((prev) => prev + pointsEarned);
    } else {
      setStreak(0); // Break streak
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setAnsweredRight(null);
    setTimeRemaining(20);

    if (currentIndex >= questions.length - 1) {
      // Finished all 10 questions
      setIsGameOver(true);
      setScreen("gameover");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    const shuffled = [...QUESTIONS_POOL].sort(() => Math.random() - 0.5);
    const sliced = shuffled.slice(0, 10);
    const randomizedQuestions = sliced.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));
    setQuestions(randomizedQuestions);
    setStreak(0);
    setMaxStreak(0);
    setScore(0);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnsweredRight(null);
    setTimeRemaining(20);
    setIsGameOver(false);
    setCorrectCount(0);
    setTotalTimeMs(0);
    setTimerActive(true);
    setQuestionsAnswered(0);
    setScreen("playing");
  };

  const handleFinishAndSave = () => {
    const avgReactionTimeMs = questionsAnswered > 0 ? Math.round(totalTimeMs / questionsAnswered) : 2000;
    // Log matching the custom prefix layout
    onGameEnd(score, avgReactionTimeMs, "🔍 SPEC-ID:");
  };

  if (questions.length === 0 || !questions[currentIndex]) return null;

  const currentQuestion = questions[currentIndex];

  // Helper to render responsive specialized schematic/CAD blueprint style SVGs
  const renderBlueprintSvg = (type: string, isReviewMode = false) => {
    const baseColor = "stroke-stone-800";
    const highlightColor = "stroke-cyan-400";

    const filterText = (str: string): string => {
      if (isReviewMode) return str;
      
      let result = str;
      const mappings = [
        { regex: /VRM INDUCTORS \/ POWER CHOKES/gi, repl: "VOLTAGE POWER FILTER CHOKES" },
        { regex: /LGA_CPU_SOCKET/gi, repl: "PROCESSOR_INTERFACE_SOCKET" },
        { regex: /7-PIN SATA DATA STORAGE CONNECTOR/gi, repl: "7-PIN STORAGE BUS INTERFACE" },
        { regex: /M\.2 NVMe SSD EDGE CONNECTOR \(M-KEY\)/gi, repl: "M-KEY SOLID STATE CARD PINOUT" },
        { regex: /HIGH-SPEED SSD STORAGE PINOUT/gi, repl: "HIGH-SPEED NVMe FLASH CONNECTOR" },
        { regex: /8-PIN EPS CPU POWER DELIVERY CONNECTOR/gi, repl: "8-PIN PROCESSOR AUXILIARY POWER" },
        { regex: /DESKTOP RAM MEMORY STICK MODULE \(DIMM\)/gi, repl: "DRAM WORKSPACE MEMORY BLOCK (DIMM)" },
        { regex: /USB 3\.0 MOTHERBOARD HEADER \(20-1 PIN\)/gi, repl: "FRONT PANEL HEADER PORT" },
        { regex: /LGA \(LAND GRID ARRAY\) CPU SOCKET SPRING-PINS/gi, repl: "LGA CONTACT TERMINAL CONNECTOR" },
        { regex: /4-PIN PWM FAN \/ LIQUID PUMP HEADER \(CPU_FAN\)/gi, repl: "SYSTEM COOLING SPEED CONTROL HEADER" },
        { regex: /AIO CPU LIQUID COOLER COPPER COLDPLATE BASE/gi, repl: "ACTIVE CHASSIS COOLER COLDPLATE" },
        { regex: /CLRTC JUMPER \(BIOS\/CMOS CLEAR RESET PINOUT\)/gi, repl: "SYSTEM RESET & PARAMETER CLEAR PINS" },
        { regex: /THERMAL PASTE APPLICATION ON PROCESSOR IHS/gi, repl: "CONDUCTIVE INTERMEDIARY HEAT COMPLEX" },
        { regex: /12VHPWR 16-PIN \(12\+4\) HIGH POWER GPU CONNECTOR/gi, repl: "16-PIN GPU POWER INTERCONNECT" },
        { regex: /CR2032 LITHIUM COIN-CELL BATTERY/gi, repl: "CMOS VOLTAGE REGULATOR BATTERY" },
        { regex: /24-PIN ATX MAINBOARD POWER RECEIVER/gi, repl: "24-PIN MOTHERBOARD PRIMARY POWER INTERACTION" },
        { regex: /MODULAR 6\+2 PIN PCIE POWER CONNECTOR/gi, repl: "6+2 POSITION POWER TERMINAL PIPES" },
        { regex: /ATX SWITCHING POWER SUPPLY \(PSU\)/gi, repl: "AC-DC VOLTAGE STEERING COMPARTMENT" },
        { regex: /CENTRAL PROCESSING UNIT \(CPU\) PROCESSOR/gi, repl: "CORE COMPUTER CHIP INSTRUCTION ENGINE" },
        { regex: /PCIE X16 HIGH-SPEED EXPANSION SLOT/gi, repl: "HIGH-SPEED EXPANSION PORT" },
        { regex: /MOTHERBOARD STANDARDS & FORM FACTORS/gi, repl: "MOTHERBOARD PHYSICAL FORM SPECIFICATIONS" },
        { regex: /VOLATILE SYSTEM WORKSPACE MEMORY \(RAM\)/gi, repl: "VOLATILE MEMORY DEVICE" },
        { regex: /MOTHERBOARD BACK PANEL INPUT\/OUTPUT SHIELD/gi, repl: "REAR PORTS PROTECTIVE CHASSIS BRACKET" },
        { regex: /SYSTEM INTEGRATED CHIPSET HUB \(NORTHBRIDGE \/ PCH\)/gi, repl: "SYSTEM CONTROL HUB (INTEL/AMD PCH)" },
        { regex: /DUAL-CHANNEL MEMORY BANK ARCHITECTURE/gi, repl: "BALANCED MULTI-CHANNEL DRAM SCHEME" },
        { regex: /DEDICATED INTERNAL GRAPHICS CARD \(EXPANSION GPU\)/gi, repl: "HIGH-END VIDEO ACCELERATOR MODULE" },
        { regex: /3\.5-INCH MECHANICAL HARD DISK DRIVE \(HDD\)/gi, repl: "MAGNETIC PLATTER SPINNING DRIVE" },
        { regex: /ELECTROLYTIC CANISTER POWER CAPACITORS \(560uF FILTER\)/gi, repl: "CANISTER RECEPTACLE VOLTAGE STABILIZERS" },
        { regex: /ATX STANDARD/gi, repl: "LARGE FORM" },
        { regex: /MICRO-ATX \(mATX\)/gi, repl: "MID FORM (mATX)" },
        { regex: /MINI-ITX \(mITX\)/gi, repl: "SMALL FORM (mITX)" },
        { regex: /SYS_PCH/gi, repl: "CHIPSET_PCH" },
        { regex: /DIMM_MODULE/gi, repl: "MEMORY_BLOCK" },
        { regex: /CR2032/gi, repl: "SYS_BATT" },
        { regex: /3V LITHIUM/gi, repl: "3V BACKUP" },
        { regex: /intel core/gi, repl: "PROCESSOR" },
        { regex: /i7-14700K/gi, repl: "CORE CHIP" },
        { regex: /LGA1700 BASE CLK 3\.4GHz/gi, repl: "CPU SOCKET COMPATIBLE BASE" },
        { regex: /CLRTC/gi, repl: "CLR_CMOS" },
        { regex: /FRONT PANEL HEADER \(JFP1\)/gi, repl: "MAIN PORT PANEL HEADER" },
        { regex: /POWER SWITCH JUMP \(PW_SW\)/gi, repl: "SWITCH CONTROL SIGNAL" },
        { regex: /PWM SPEED PIN/gi, repl: "SPD_PIN" }
      ];
      
      for (const mapping of mappings) {
        result = result.replace(mapping.regex, mapping.repl);
      }
      return result;
    };

    const textLabel = (x: number, y: number, text: string, className?: string) => (
      <text x={x} y={y} fill="#94a3b8" className={`text-[8.5px] font-mono select-none tracking-wide ${className || "fill-stone-400"}`}>
        {filterText(text)}
      </text>
    );

    const bgGrid = (
      <g className="opacity-15">
        <line x1="0" y1="50" x2="300" y2="50" stroke="#00d8f6" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1="100" x2="300" y2="100" stroke="#00d8f6" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1="150" x2="300" y2="150" stroke="#00d8f6" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="50" y1="0" x2="50" y2="200" stroke="#00d8f6" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="100" y1="0" x2="100" y2="200" stroke="#00d8f6" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="150" y1="0" x2="150" y2="200" stroke="#00d8f6" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="200" y1="0" x2="200" y2="200" stroke="#00d8f6" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="250" y1="0" x2="250" y2="200" stroke="#00d8f6" strokeWidth="0.5" strokeDasharray="3,3" />
      </g>
    );

    const getRawSvg = () => {
      switch (type) {
      case "fpanel":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            {/* Motherboard header base outline */}
            <rect x="50" y="60" width="200" height="80" rx="4" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
            <text x="65" y="125" fill="#475569" className="text-[9px] font-mono select-none font-medium" tracking-widest="true">{filterText("FRONT PANEL HEADER (JFP1)")}</text>
            
            {/* Pins grid - 2x5 */}
            {Array.from({ length: 5 }).map((_, col) => (
              <g key={col}>
                {col !== 4 && ( // Top-right pin is missing on standard headers
                  <g>
                    {/* Top Row Pin */}
                    <circle cx={80 + col * 35} cy={80} r="4" fill="#0f172a" stroke={col === 3 ? "#fb923c" : "#475569"} strokeWidth="1.5" />
                    {col === 3 && <circle cx={80 + col * 35} cy={80} r="7" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" className="animate-spin" style={{ transformOrigin: `${80 + col * 35}px 80px` }} />}
                    {col === 3 && <line x1={80 + col * 35} y1="80" x2="135" y2="40" stroke="#f59e0b" strokeWidth="1" />}
                  </g>
                )}
                {/* Bottom Row Pin */}
                <circle cx={80 + col * 35} cy={100} r="4" fill="#0f172a" stroke={col === 3 ? "#fb923c" : "#475569"} strokeWidth="1.5" />
                {col === 3 && <circle cx={80 + col * 35} cy={100} r="7" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />}
                {col === 3 && <line x1={80 + col * 35} y1="100" x2="135" y2="40" stroke="#f59e0b" strokeWidth="1" />}
              </g>
            ))}

            <g transform="translate(140, 20)">
              <rect x="0" y="0" width="125" height="30" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
              <text x="8" y="18" fill="#a5b4fc" className="text-[9px] font-mono font-medium">{filterText("POWER SWITCH JUMP (PW_SW)")}</text>
            </g>
          </svg>
        );

      case "vrm":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* CPU Socket outline */}
            <rect x="110" y="50" width="140" height="110" rx="4" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="180" cy="105" r="25" stroke="#10b981" strokeWidth="1" className="opacity-40 animate-pulse" />

            {/* Chokes/Power Stages Arrangement */}
            <g className="stroke-cyan-400" strokeWidth="1.5">
              {/* Vertical line left of socket */}
              {Array.from({ length: 4 }).map((_, idx) => (
                <rect key={idx} x="60" y={50 + idx * 28} width="18" height="18" rx="2" fill="#111827" className="animate-pulse" style={{ animationDelay: `${idx * 0.15}s` }} />
              ))}
              {/* Horizontal line top of socket */}
              {Array.from({ length: 3 }).map((_, idx) => (
                <rect key={idx} x="110 + idx * 30" y="15" width="18" height="18" rx="2" fill="#111827" className="animate-pulse" style={{ animationDelay: `${idx * 0.2}s` }} />
              ))}
            </g>
            
            <line x1="45" y1="120" x2="65" y2="105" stroke="#22d3ee" strokeWidth="1.5" />
            {textLabel(20, 140, "VRM INDUCTORS / POWER CHOKES", "fill-cyan-400 font-medium")}
            {textLabel(140, 110, "LGA_CPU_SOCKET", "fill-stone-600 font-medium")}
          </svg>
        );

      case "sata-data":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Connector molded frame */}
            <path d="M70,80 L230,80 L230,120 L195,120 L195,130 L185,130 L185,120 L70,120 Z" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            {/* Intended L-Shape Channel */}
            <path d="M85,95 L200,95 L200,105 L215,105 L215,112 L190,112 L190,105 L85,105 Z" fill="#020617" stroke="#22d3ee" strokeWidth="1.5" />
            
            {/* Seven mini contact lanes */}
            {Array.from({ length: 7 }).map((_, idx) => (
              <line key={idx} x1={95 + idx * 12} y1="99" x2="95 + idx * 12" y2="101" stroke="#f59e0b" strokeWidth="2" />
            ))}

            {textLabel(40, 60, "7-PIN SATA DATA STORAGE CONNECTOR", "fill-sky-400 font-medium font-mono text-[9px]")}
          </svg>
        );

      case "m2":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            {/* M.2 gold fingers edge connector */}
            <rect x="40" y="90" width="220" height="40" rx="2" fill="#0b1329" stroke="#1e293b" strokeWidth="1.5" />
            
            <g fill="#f59e0b">
              {/* Left pins block (approx 45 pins equivalent represented by lines) */}
              {Array.from({ length: 18 }).map((_, idx) => (
                <rect key={idx} x={50 + idx * 7} y="92" width="3" height="15" rx="0.5" />
              ))}

              {/* Notch Gap around pin 5-6 */}
              <rect x="185" y="90" width="12" height="19" fill="#020617" stroke="#1e293b" strokeWidth="1" />

              {/* Right pins block */}
              {Array.from({ length: 5 }).map((_, idx) => (
                <rect key={idx} x={205 + idx * 7} y="92" width="3" height="15" rx="0.5" />
              ))}
            </g>

            <rect x="180" y="85" width="22" height="26" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
            {textLabel(40, 165, "M.2 NVMe SSD EDGE CONNECTOR (M-KEY)", "fill-cyan-400 font-medium font-mono text-[9px]")}
            {textLabel(40, 70, "HIGH-SPEED SSD STORAGE PINOUT")}
          </svg>
        );

      case "eps":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            <g transform="translate(60, 45)">
              {/* 2x4 8 pin matrix socket sleeve */}
              <rect x="0" y="0" width="180" height="96" rx="6" fill="#0c111d" stroke="#334155" strokeWidth="2.5" />
              
              {/* Layout for EPS, top row: square, rounded, rounded, square. Bottom row: rounded, square, square, rounded */}
              {/* Column 0 */}
              {/* Square */}
              <rect x="15" y="15" width="26" height="26" rx="2" fill="#040815" stroke="#fb923c" strokeWidth="2" />
              {/* Rounded */}
              <rect x="15" y="55" width="26" height="26" rx="10" fill="#040815" stroke="#475569" strokeWidth="2" />

              {/* Column 1 */}
              {/* Rounded */}
              <rect x="55" y="15" width="26" height="26" rx="10" fill="#040815" stroke="#475569" strokeWidth="2" />
              {/* Square */}
              <rect x="55" y="55" width="26" height="26" rx="2" fill="#040815" stroke="#fb923c" strokeWidth="2" />

              {/* Column 2 */}
              {/* Rounded */}
              <rect x="95" y="15" width="26" height="26" rx="10" fill="#040815" stroke="#475569" strokeWidth="2" />
              {/* Square */}
              <rect x="95" y="55" width="26" height="26" rx="2" fill="#040815" stroke="#fb923c" strokeWidth="2" />

              {/* Column 3 */}
              {/* Square */}
              <rect x="135" y="15" width="26" height="26" rx="2" fill="#040815" stroke="#fb923c" strokeWidth="2" />
              {/* Rounded */}
              <rect x="135" y="55" width="26" height="26" rx="10" fill="#040815" stroke="#475569" strokeWidth="2" />
            </g>

            {textLabel(30, 32, "8-PIN EPS CPU POWER DELIVERY CONNECTOR", "fill-amber-400 font-medium font-mono text-[9px]")}
            {textLabel(30, 168, "Gold highlight = Square keyed terminals profile", "fill-stone-500")}
          </svg>
        );

      case "ram-dimm":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            {/* RAM module stick outline */}
            <rect x="25" y="65" width="250" height="50" rx="3" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
            <rect x="40" y="75" width="35" height="30" rx="2" fill="#1e293b" stroke="#334155" />
            <rect x="90" y="75" width="35" height="30" rx="2" fill="#1e293b" stroke="#334155" />
            <rect x="175" y="75" width="35" height="30" rx="2" fill="#1e293b" stroke="#334155" />
            <rect x="225" y="75" width="35" height="30" rx="2" fill="#1e293b" stroke="#334155" />

            {/* RAM Teeth with mid-ish offset notch gap */}
            <g fill="#f59e0b">
              {/* Left Teeth */}
              {Array.from({ length: 16 }).map((_, idx) => (
                <rect key={idx} x={30 + idx * 6} y="115" width="3" height="8" rx="0.5" />
              ))}
              
              {/* Shifted center key gap */}
              <rect x="132" y="113" width="10" height="11" fill="#020617" />

              {/* Right Teeth */}
              {Array.from({ length: 18 }).map((_, idx) => (
                <rect key={idx} x={146 + idx * 6} y="115" width="3" height="8" rx="0.5" />
              ))}
            </g>

            <circle cx="137" cy="118" r="10" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
            {textLabel(28, 50, "DESKTOP RAM MEMORY STICK MODULE (DIMM)", "fill-cyan-400 font-medium font-mono text-[9px]")}
            {textLabel(28, 158, "Offset alignment notch prevents incorrect socketing", "fill-stone-400")}
          </svg>
        );

      case "usb3":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            <g transform="translate(45, 55)">
              {/* 19/20 Pin header outer box plastic block */}
              <rect x="0" y="0" width="210" height="70" rx="3" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2.5" />
              
              {/* Alignment notch block insert on the top wall */}
              <rect x="95" y="0" width="20" height="12" fill="#020617" stroke="#3b82f6" strokeWidth="1.5" />

              {/* Gold Pin slots grid 2x10 */}
              {Array.from({ length: 10 }).map((_, col) => (
                <React.Fragment key={col}>
                  {/* Top row connector pin */}
                  <circle cx={20 + col * 19} cy={22} r="3" fill="#fb923c" />
                  {/* Bottom row connector pin (Except bottom-right pin is dead/missing for alignment) */}
                  {col !== 9 ? (
                    <circle cx={20 + col * 19} cy={48} r="3" fill="#fb923c" />
                  ) : (
                    <circle cx={20 + col * 19} cy={48} r="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                  )}
                </React.Fragment>
              ))}
            </g>

            {textLabel(15, 38, "USB 3.0 MOTHERBOARD HEADER (20-1 PIN)", "fill-cyan-400 font-medium font-mono text-[9px]")}
            {textLabel(20, 160, "Note missing pin 20 at corner used for keying alignment.", "fill-stone-400")}
          </svg>
        );

      case "lga":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            {/* Standard Socket Frame */}
            <rect x="80" y="35" width="140" height="130" rx="4" fill="#070a13" stroke="#334155" strokeWidth="2.5" />
            
            {/* Array of microscopic contact dots */}
            <g fill="#e2e8f0" className="opacity-45">
              {Array.from({ length: 11 }).map((_, r) => (
                <g key={r}>
                  {Array.from({ length: 11 }).map((_, c) => {
                    // Make a CPU contact center hole empty
                    const disabled = r > 3 && r < 7 && c > 3 && c < 7;
                    if (disabled) return null;
                    return (
                      <circle key={c} cx={94 + c * 11} cy={48 + r * 10} r="1" fill="#f59e0b" />
                    );
                  })}
                </g>
              ))}
            </g>

            {/* Heavy tension locking lever arm */}
            <line x1="222" y1="45" x2="222" y2="155" stroke="#94a3b8" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="222" y1="155" x2="255" y2="155" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

            {textLabel(24, 25, "LGA (LAND GRID ARRAY) CPU SOCKET SPRING-PINS", "fill-amber-400 font-medium font-mono text-[9px]")}
          </svg>
        );

      case "fan-head":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            {/* Fan pin block base shroud */}
            <rect x="50" y="100" width="200" height="35" rx="2" fill="#0c111d" stroke="#334155" strokeWidth="1.5" />
            {/* Guide key vertical plate */}
            <rect x="50" y="80" width="150" height="20" fill="#0c111d" stroke="#334155" strokeWidth="1" />

            {/* 4 copper pins */}
            {Array.from({ length: 4 }).map((_, idx) => (
              <g key={idx}>
                {/* Pin stem */}
                <rect x={70 + idx * 45} y="40" width="8" height="60" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                {/* Pin gold tips */}
                <rect x={70 + idx * 45} y="35" width="8" height="8" fill="#f59e0b" />
                
                {idx === 3 && (
                  <g>
                    <circle cx={74 + idx * 45} cy="40" r="14" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1={74 + idx * 45} y1="40" x2="215" y2="25" stroke="#ef4444" strokeWidth="1" />
                  </g>
                )}
              </g>
            ))}

            <g transform="translate(185, 10)">
              <rect x="0" y="0" width="95" height="25" rx="3" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
              <text x="8" y="15" fill="#fca5a5" className="text-[9px] font-mono font-medium">{filterText("PWM SPEED PIN")}</text>
            </g>
            {textLabel(25, 172, "4-PIN PWM FAN / LIQUID PUMP HEADER (CPU_FAN)", "fill-cyan-400 font-medium font-mono text-[9px]")}
          </svg>
        );

      case "coldplate":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            {/* Circular copper coldplate body */}
            <circle cx="150" cy="100" r="70" fill="#312e81" stroke="#f97316" strokeWidth="2.5" />
            
            {/* Split dense fins pattern inside core */}
            <g stroke="#ea580c" strokeWidth="1">
              {Array.from({ length: 25 }).map((_, idx) => (
                <line key={idx} x1={100 + idx * 4} y1={100 - Math.sqrt(4900 - Math.pow(50 - idx * 4, 2))} x2={100 + idx * 4} y2={100 + Math.sqrt(4900 - Math.pow(50 - idx * 4, 2))} />
              ))}
            </g>

            <rect x="110" y="75" width="80" height="50" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3,3" />
            {textLabel(15, 24, "AIO CPU LIQUID COOLER COPPER COLDPLATE BASE", "fill-cyan-400 font-medium font-mono text-[9px]")}
            {textLabel(110, 168, "Microscopic Split-Fin Channels", "fill-orange-400 font-medium")}
          </svg>
        );

      case "m2-screw":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            {/* Tiny Screw sketch */}
            <g transform="translate(60, 45)">
              {/* Screw Flat Head */}
              <rect x="25" y="10" width="50" height="15" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
              {/* Screw Shank Threads */}
              <rect x="35" y="25" width="30" height="45" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
              
              {/* Thread ridges pattern */}
              {Array.from({ length: 6 }).map((_, idx) => (
                <line key={idx} x1="33" y1={30 + idx * 7} x2="67" y2={32 + idx * 7} stroke="#334155" strokeWidth="2" />
              ))}
            </g>

            {/* Standpoint Brass Stud lock */}
            <g transform="translate(180, 50)">
              {/* Hex Base */}
              <polygon points="15,0 45,0 55,25 45,50 15,50 5,25" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              {/* Inner threaded hollow hole */}
              <circle cx="30" cy="25" r="10" fill="#020617" stroke="#d97706" strokeWidth="1.5" />
            </g>

            {textLabel(20, 150, "M2 MACHINE SCREW SPLIT SPEC", "fill-stone-500 font-mono")}
            {textLabel(150, 130, "M2 BRASS STANDOFF LOCK STUD", "fill-amber-400 font-medium")}
          </svg>
        );

      case "jumper":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            {/* Jumper Header Pins on PCB */}
            <rect x="70" y="65" width="160" height="70" rx="4" fill="#0b1329" stroke="#1e293b" strokeWidth="2" />
            <text x="120" y="120" fill="#475569" className="text-[10px] font-mono tracking-widest font-medium">{filterText("CLRTC")}</text>

            <circle cx="110" cy="90" r="5" fill="#020617" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="110" cy="90" r="1.5" fill="#cbd5e1" />
            
            <circle cx="190" cy="90" r="5" fill="#020617" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="190" cy="90" r="1.5" fill="#cbd5e1" />

            {/* Arrow screwdriver bridging jumper */}
            <g transform="translate(150, 40)" className="animate-pulse">
              <path d="M-30,20 L15,30 M10,25 L10,50 L-30,50 Z" fill="#9333ea" stroke="#a855f7" strokeWidth="1.5" />
            </g>

            <circle cx="150" cy="90" r="48" stroke="#d946ef" strokeWidth="1.5" strokeDasharray="3,3" />
            {textLabel(20, 50, "CLRTC JUMPER (BIOS/CMOS CLEAR RESET PINOUT)", "fill-magenta-400 font-medium")}
          </svg>
        );

      case "paste":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            {/* Cpu core casing */}
            <rect x="80" y="30" width="140" height="140" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            {/* Integrated Heatspreader (IHS) silver top */}
            <rect x="95" y="45" width="110" height="110" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="3" />
            
            {/* Cross paste placement */}
            <g stroke="#cbd5e1" strokeWidth="7" strokeLinecap="round" className="opacity-90">
              <line x1="110" y1="60" x2="190" y2="140" />
              <line x1="190" y1="60" x2="110" y2="140" />
            </g>

            {textLabel(15, 22, "THERMAL PASTE APPLICATION ON PROCESSOR IHS", "fill-emerald-400 font-medium font-mono text-[9px]")}
            {textLabel(130, 110, "X-CROSS COATING", "fill-slate-350 font-medium")}
          </svg>
        );

      case "12vhpwr":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}

            <g transform="translate(60, 40)">
              {/* Massive terminal frame plug */}
              <rect x="0" y="10" width="180" height="90" rx="4" fill="#0a0f1d" stroke="#cbd5e1" strokeWidth="2" />
              
              {/* Latch lock hook */}
              <rect x="50" y="0" width="80" height="12" rx="1" fill="#cbd5e1" />

              {/* 12 pin high load grid */}
              {Array.from({ length: 2 }).map((_, rIdx) => (
                <g key={rIdx}>
                  {Array.from({ length: 6 }).map((_, cIdx) => (
                    <rect key={cIdx} x={15 + cIdx * 26} y={30 + rIdx * 28} width="16" height="16" rx="2" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                  ))}
                </g>
              ))}

              {/* 4 micro signals pins right under latch hook */}
              {Array.from({ length: 4 }).map((_, cIdx) => (
                <rect key={cIdx} x={45 + cIdx * 24} y="15" width="10" height="6" fill="#3b82f6" rx="1" />
              ))}
            </g>

            {textLabel(25, 28, "12VHPWR 16-PIN (12+4) HIGH POWER GPU CONNECTOR", "fill-amber-400 font-medium font-mono text-[8.5px]")}
            {textLabel(25, 168, "4 smart signal lines at top communicate maximum power limit.", "fill-stone-505")}
          </svg>
        );

      case "cr2032-battery":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            {/* Battery holder socket */}
            <circle cx="150" cy="100" r="55" fill="#0c1120" stroke="#334155" strokeWidth="2" />
            <circle cx="150" cy="100" r="50" fill="#070a13" stroke="#1e293b" strokeWidth="1" />
            
            {/* Silver coin cell itself */}
            <circle cx="147" cy="97" r="41" fill="url(#silverGradient)" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Metal tension clips */}
            <path d="M100,100 L112,100 M188,100 L200,100" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            <path d="M140,51 L160,51 L150,60 Z" fill="#64748b" />

            {/* Battery text & positive symbol */}
            <text x="135" y="88" fill="#475569" className="text-[12px] font-sans font-medium select-none">+</text>
            <text x="127" y="105" fill="#475569" className="text-[9px] font-mono font-medium select-none tracking-wider">{filterText("CR2032")}</text>
            <text x="131" y="118" fill="#64748b" className="text-[7px] font-mono select-none">{filterText("3V LITHIUM")}</text>

            <defs>
              <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="40%" stopColor="#94a3b8" />
                <stop offset="70%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>

            {textLabel(20, 26, "CR2032 LITHIUM COIN-CELL BATTERY", "fill-cyan-400 font-medium font-mono text-[9px]")}
            {textLabel(20, 175, "Powers the non-volatile CMOS memory clock/configuration.", "fill-stone-500")}
          </svg>
        );

      case "atx-24pin":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Giant power header box */}
            <rect x="25" y="55" width="250" height="85" rx="6" fill="#080e1a" stroke="#475569" strokeWidth="2.5" />
            
            {/* Latch helper bar in the middle */}
            <rect x="100" y="47" width="100" height="10" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            
            {/* 2 x 12 pins socket grid */}
            {Array.from({ length: 2 }).map((_, row) => (
              <g key={row}>
                {Array.from({ length: 12 }).map((_, col) => {
                  const x = 38 + col * 19;
                  const y = 68 + row * 32;
                  return (
                    <g key={col}>
                      {/* Outer terminal */}
                      <rect x={x} y={y} width="14" height="14" rx="2" fill="#111c30" stroke="#10b981" strokeWidth="1" />
                      {/* Inside gold contact */}
                      <circle cx={x + 7} cy={y + 7} r="3" fill="#f59e0b" />
                    </g>
                  );
                })}
              </g>
            ))}

            {textLabel(16, 26, "24-PIN ATX MAINBOARD POWER RECEIVER", "fill-emerald-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 175, "Main distribution hub for 3.3V, 5V, and 12V rails.", "fill-stone-500")}
          </svg>
        );

      case "pcie-6and2":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Main 6-Pin block */}
            <rect x="50" y="60" width="105" height="80" rx="5" fill="#090f1d" stroke="#3b82f6" strokeWidth="2" />
            {/* Latch on 6-pin */}
            <rect x="82" y="50" width="40" height="10" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
            
            {/* 2 x 3 pin grid inside 6-Pin */}
            {Array.from({ length: 2 }).map((_, row) => (
              <g key={`row-${row}`}>
                {Array.from({ length: 3 }).map((_, col) => {
                  const x = 62 + col * 30;
                  const y = 72 + row * 34;
                  return (
                    <g key={`col-${col}`}>
                      <rect x={x} y={y} width="18" height="18" rx="3" fill="#111c30" stroke="#38bdf8" strokeWidth="1" />
                      <circle cx={x + 9} cy={y + 9} r="4" fill="#cbd5e1" />
                    </g>
                  );
                })}
              </g>
            ))}

            {/* Split Gap Indicator */}
            <line x1="164" y1="55" x2="164" y2="145" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3" />

            {/* Attached +2 Pin block */}
            <rect x="172" y="60" width="75" height="80" rx="5" fill="#090f1d" stroke="#f59e0b" strokeWidth="2" />
            
            {/* 2 x 1 pin grid inside +2-Pin */}
            {Array.from({ length: 2 }).map((_, row) => {
              const x = 186;
              const y = 72 + row * 34;
              return (
                <g key={`plus2-row-${row}`}>
                  <rect x={x} y={y} width="18" height="18" rx="3" fill="#111c30" stroke="#fbbf24" strokeWidth="1" />
                  <circle cx={x + 9} cy={y + 9} r="4" fill="#cbd5e1" />
                </g>
              );
            })}

            {/* Indicator showing they can snap together */}
            <path d="M 140,155 C 150,165 170,165 180,155" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" strokeLinecap="round" />
            <text x="145" y="174" fill="#475569" className="text-[7.5px] font-mono select-none">{filterText("SNAP TOGETHER FOR 8-PIN")}</text>

            {textLabel(16, 26, "MODULAR 6+2 PIN PCIE POWER CONNECTOR", "fill-amber-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 185, "Supplies 75W (6-pin) or 150W (8-pin) dedicated juice directly to GPUs.", "fill-stone-500")}
          </svg>
        );

      case "psu-box":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Steel chassis box */}
            <rect x="40" y="30" width="220" height="135" rx="6" fill="#090f1d" stroke="#cbd5e1" strokeWidth="2" />
            
            {/* Fan circular protective grill */}
            <circle cx="150" cy="92" r="50" fill="#000" stroke="#334155" strokeWidth="2" />
            <circle cx="150" cy="92" r="40" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="150" cy="92" r="25" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="5,5" />
            
            {/* Internal fan core */}
            <circle cx="150" cy="92" r="10" fill="#cbd5e1" />
            
            {/* Radial grill spokes */}
            {Array.from({ length: 8 }).map((_, spIdx) => {
              const angle = (spIdx * 45 * Math.PI) / 180;
              const x2 = 150 + Math.cos(angle) * 50;
              const y2 = 92 + Math.sin(angle) * 50;
              return (
                <line key={spIdx} x1="150" y1="92" x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="1.5" />
              );
            })}
            
            {/* Power output cable harness coming out of right corner */}
            <rect x="230" y="115" width="40" height="30" rx="2" fill="#2d3748" />
            <path d="M250,130 C270,130 280,140 290,140 M250,135 C275,135 285,150 295,150" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />
            
            {/* Safety badge sticker */}
            <rect x="52" y="42" width="45" height="35" rx="1" fill="#cbd5e1" />
            <rect x="56" y="46" width="37" height="6" fill="#ef4444" />

            {textLabel(16, 20, "ATX SWITCHING POWER SUPPLY (PSU)", "fill-cyan-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 185, "Converts dangerous AC wall current into safe system DC power.", "fill-stone-500")}
          </svg>
        );

      case "cpu-chip":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Green silicon substrate board */}
            <rect x="70" y="30" width="160" height="135" rx="6" fill="#043224" stroke="#10b981" strokeWidth="3" />
            
            {/* Gold triangle alignment marker top-left */}
            <polygon points="73,33 85,33 73,45" fill="#f59e0b" />
            
            {/* Metallic Integrated Heat Spreader (IHS) silver faceplate */}
            <rect x="90" y="48" width="120" height="100" rx="4" fill="url(#ihsGradient)" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Laser etched silicon text details */}
            <text x="105" y="70" fill="#64748b" className="text-[9px] font-sans font-medium select-none tracking-widest">{filterText("INTEL CORE")}</text>
            <text x="105" y="85" fill="#475569" className="text-[14px] font-mono font-medium select-none">{filterText("i7-14700K")}</text>
            <text x="105" y="105" fill="#64748b" className="text-[7px] font-mono select-none">{filterText("LGA1700 BASE CLK 3.4GHz")}</text>
            
            {/* Small surface mount capacitors visible on green substrate */}
            <rect x="140" y="36" width="10" height="5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
            <rect x="155" y="36" width="10" height="5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />

            <defs>
              <linearGradient id="ihsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="30%" stopColor="#cbd5e1" />
                <stop offset="70%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>

            {textLabel(16, 20, "CENTRAL PROCESSING UNIT (CPU) PROCESSOR", "fill-teal-300 font-medium font-mono text-[9px]")}
            {textLabel(16, 185, "Completes billion-scale instruction operations per second.", "fill-stone-500")}
          </svg>
        );

      case "pcie-x16":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Motherboard PCB space */}
            <rect x="25" y="80" width="250" height="40" rx="4" fill="#051229" stroke="#1e293b" strokeWidth="1" />
            
            {/* Long black slot housing */}
            <rect x="35" y="90" width="230" height="18" rx="2" fill="#05070f" stroke="#475569" strokeWidth="1.5" />
            
            {/* Small division spacer (around pin 11/12) */}
            <rect x="68" y="88" width="5" height="22" fill="#1e293b" rx="1" />
            
            {/* Metallic pins array visualization - first segment */}
            {Array.from({ length: 4 }).map((_, idx) => (
              <line key={`pins1-${idx}`} x1={40 + idx * 6} y1="94" x2={40 + idx * 6} y2="104" stroke="#e0f2fe" strokeWidth="1" strokeOpacity="0.8" />
            ))}
            
            {/* Metallic pins array visualization - long segment */}
            {Array.from({ length: 24 }).map((_, idx) => (
              <line key={`pins2-${idx}`} x1={78 + idx * 7.2} y1="94" x2={78 + idx * 7.2} y2="104" stroke="#e0f2fe" strokeWidth="1" strokeOpacity="0.8" />
            ))}

            {/* Retention clip/latch on the right end */}
            <path d="M 252,86 L 260,86 L 258,110 L 250,110 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            <circle cx="254" cy="98" r="1.5" fill="#05070f" />

            {/* Indicator annotations */}
            <path d="M 54,124 L 54,136 M 160,124 L 160,136" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,2" />
            <text x="75" y="142" fill="#0284c7" className="text-[7.5px] font-mono select-none tracking-widest uppercase">{filterText("16 Parallel Serial Lanes")}</text>

            {textLabel(16, 26, "PCIE X16 HIGH-SPEED EXPANSION SLOT", "fill-sky-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 185, "Primary slot for dedicated Graphics Cards (GPUs) and expansion accelerators.", "fill-stone-500")}
          </svg>
        );

      case "form-factor":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* ATX Outline */}
            <rect x="25" y="42" width="75" height="110" rx="4" fill="#05101a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="29" y="54" fill="#38bdf8" className="text-[7px] font-mono font-medium">{filterText("ATX STANDARD")}</text>
            <rect x="30" y="62" width="22" height="22" rx="2" stroke="#334155" strokeWidth="1" fill="none" />
            <rect x="58" y="62" width="8" height="30" rx="1" fill="#334155" />
            
            {/* Micro-ATX Outline */}
            <rect x="110" y="55" width="75" height="85" rx="4" fill="#03161c" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,1" />
            <text x="114" y="67" fill="#f59e0b" className="text-[6.5px] font-mono font-medium">{filterText("MICRO-ATX (mATX)")}</text>
            <rect x="115" y="75" width="18" height="18" rx="2" stroke="#334155" strokeWidth="1" fill="none" />
            
            {/* Mini-ITX Outline */}
            <rect x="195" y="70" width="70" height="70" rx="4" fill="#1e1808" stroke="#10b981" strokeWidth="1.5" />
            <text x="199" y="82" fill="#10b981" className="text-[6px] font-mono font-medium">{filterText("MINI-ITX (mITX)")}</text>
            <rect x="200" y="90" width="15" height="15" rx="1" stroke="#334155" strokeWidth="1" fill="none" />
            
            {textLabel(16, 24, "MOTHERBOARD STANDARDS & FORM FACTORS", "fill-cyan-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 178, "Defines physical dimensions, screw mounting layouts, and chassis clearance constraints.", "fill-stone-500")}
          </svg>
        );

      case "ram-volatile":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Dual memory module containers */}
            <rect x="35" y="60" width="230" height="60" rx="4" fill="#0c1220" stroke="#f43f5e" strokeWidth="1.5" />
            
            {/* Dynamic capacitor grid to mimic ram chips */}
            {Array.from({ length: 6 }).map((_, idx) => (
              <rect key={idx} x={45 + idx * 36} y="72" width="24" height="34" rx="1.5" fill="#111827" stroke="#fda4af" strokeWidth="1" />
            ))}
            
            {/* Power wave showing current dynamic charge */}
            <path d="M 45,110 L 80,110 L 95,65 L 115,115 L 130,110 M 150,110 L 195,110" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2,2" />
            
            {textLabel(16, 26, "VOLATILE SYSTEM WORKSPACE MEMORY (RAM)", "fill-rose-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 155, "Maintains lightning fast active runtime data streams using electrical storage charges.", "fill-stone-500")}
            {textLabel(16, 175, "CRITICAL: Cutting general system input power drains stored charges instantly.", "fill-rose-500/85 font-semibold text-[8px]")}
          </svg>
        );

      case "io-shield":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Shield Frame plate contour */}
            <rect x="25" y="55" width="250" height="85" rx="4" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
            
            {/* Video Outs ports cutout */}
            <rect x="40" y="75" width="24" height="15" rx="1" stroke="#3b82f6" fill="#090d16" />
            <rect x="72" y="75" width="24" height="15" rx="1" stroke="#3b82f6" fill="#090d16" />
            
            {/* USB Core columns cutouts */}
            <rect x="105" y="75" width="22" height="12" rx="1" stroke="#fb923c" fill="#090d16" />
            <rect x="105" y="92" width="22" height="12" rx="1" stroke="#fb923c" fill="#090d16" />
            
            <rect x="135" y="75" width="22" height="12" rx="1" stroke="#fb923c" fill="#090d16" />
            <rect x="135" y="92" width="22" height="12" rx="1" stroke="#fb923c" fill="#090d16" />
            
            {/* Ethernet port cutout */}
            <rect x="170" y="75" width="26" height="20" rx="1" stroke="#ec4899" fill="#090d16" />
            
            {/* Audio Jacks round cutouts */}
            <circle cx="225" cy="78" r="6" stroke="#22c55e" strokeWidth="1.5" fill="#090d16" />
            <circle cx="225" cy="97" r="6" stroke="#ef4444" strokeWidth="1.5" fill="#090d16" />
            <circle cx="225" cy="116" r="6" stroke="#3b82f6" strokeWidth="1.5" fill="#090d16" />
            
            {textLabel(16, 24, "MOTHERBOARD BACK PANEL INPUT/OUTPUT SHIELD", "fill-slate-450 font-medium font-mono text-[9px]")}
            {textLabel(16, 172, "Ensures tight ground chassis fitment, blocks EMI, and prevents layout dust intake.", "fill-slate-540")}
          </svg>
        );

      case "chipset":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Mainboard base layer */}
            <rect x="45" y="45" width="210" height="110" rx="4" fill="#070c14" stroke="#1e293b" strokeWidth="1.5" />
            
            {/* Chipset physical package block */}
            <rect x="95" y="60" width="110" height="80" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            
            {/* Core silicon block center */}
            <rect x="120" y="75" width="60" height="50" rx="2" fill="url(#chipsetGradVal)" stroke="#94a3b8" />
            <text x="131" y="105" fill="#cbd5e1" className="text-[8px] font-mono font-medium select-none tracking-widest leading-none">{filterText("SYS_PCH")}</text>
            
            {/* Printed circuit gold lane lines */}
            <path d="M 45,75 L 95,75 M 45,115 L 95,115 M 205,85 L 255,85 M 205,120 L 255,120" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
            
            <defs>
              <linearGradient id="chipsetGradVal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>
            
            {textLabel(16, 24, "SYSTEM INTEGRATED CHIPSET HUB (NORTHBRIDGE / PCH)", "fill-amber-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 178, "Channels storage buses, peripheral ports, and auxiliary card controllers to CPU.", "fill-stone-500")}
          </svg>
        );

      case "dual-channel":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Slots DIMM A1, A2, B1, B2 */}
            {Array.from({ length: 4 }).map((_, idx) => {
              const isPopulated = idx === 1 || idx === 3; // Slots 2 and 4 are populated for Dual-Channel
              return (
                <g key={idx}>
                  {/* Slot socket base container */}
                  <rect x={50 + idx * 54} y="40" width="22" height="120" rx="2" fill="#0b1329" stroke={isPopulated ? "#38bdf8" : "#334155"} strokeWidth="1.5" />
                  
                  {isPopulated ? (
                    <g>
                      {/* Inserting RAM sticks */}
                      <rect x={53 + idx * 54} y="45" width="16" height="110" rx="1" fill="#111827" stroke="#00e5ff" strokeWidth="1" />
                      <circle cx={61 + idx * 54} cy="50" r="2" fill="#10b981" />
                      <circle cx={61 + idx * 54} cy="150" r="2" fill="#10b981" />
                      <text x={60 + idx * 54} y="105" fill="#38bdf8" transform={`rotate(90 ${60 + idx * 54} 105)`} className="text-[7px] font-mono leading-none">{filterText("DIMM_MODULE")}</text>
                    </g>
                  ) : (
                    <text x={61 + idx * 54} y="105" fill="#475569" transform={`rotate(90 ${61 + idx * 54} 105)`} className="text-[6.5px] font-mono select-none">{filterText("EMPTY_SLOT")}</text>
                  )}
                  
                  <text x={58 + idx * 54} y="172" fill={isPopulated ? "#22d3ee" : "#475569"} className="text-[8px] font-mono font-medium">
                    {idx === 0 ? "A1" : idx === 1 ? "A2" : idx === 2 ? "B1" : "B2"}
                  </text>
                </g>
              );
            })}
            
            {textLabel(16, 24, "DUAL-CHANNEL MEMORY BANK ARCHITECTURE", "fill-cyan-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 188, "Aligns slots A2 & B2 specifically to double the standard memory bandwidth lanes.", "fill-stone-500")}
          </svg>
        );

      case "gpu-board":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* The primary Graphics Card heavy design casing */}
            <rect x="45" y="48" width="210" height="100" rx="6" fill="#0c111d" stroke="#64748b" strokeWidth="2" />
            
            {/* Left Cooler active cooling Fan casing */}
            <circle cx="95" cy="98" r="30" fill="#020617" stroke="#334155" strokeWidth="1.5" />
            <circle cx="95" cy="98" r="6" fill="#cbd5e1" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60 * Math.PI) / 180;
              return (
                <line key={`f1-${i}`} x1="95" y1="98" x2={95 + Math.cos(angle) * 28} y2={98 + Math.sin(angle) * 28} stroke="#475569" strokeWidth="2.5" />
              );
            })}
            
            {/* Right Cooler active cooling Fan casing */}
            <circle cx="205" cy="98" r="30" fill="#020617" stroke="#334155" strokeWidth="1.5" />
            <circle cx="205" cy="98" r="6" fill="#cbd5e1" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60 * Math.PI) / 180;
              return (
                <line key={`f2-${i}`} x1="205" y1="98" x2={205 + Math.cos(angle) * 28} y2={98 + Math.sin(angle) * 28} stroke="#475569" strokeWidth="2.5" />
              );
            })}
            
            {/* PCIe golden core interface fingers along the card edge */}
            <rect x="65" y="148" width="130" height="8" fill="#eab308" rx="1" />
            {Array.from({ length: 18 }).map((_, i) => (
              <line key={`busf-${i}`} x1={68 + i * 7} y1="148" x2={68 + i * 7} y2="154" stroke="#a16207" strokeWidth="1.5" />
            ))}
            
            {/* Chassis Mounting metal bracket */}
            <rect x="35" y="44" width="10" height="108" rx="1" fill="#475569" />
            <line x1="39" y1="48" x2="39" y2="148" stroke="#1e293b" />
            
            {textLabel(16, 24, "DEDICATED INTERNAL GRAPHICS CARD (EXPANSION GPU)", "fill-sky-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 178, "Connective gold bus fingers insert directly into high-bandwidth pcie x16 slot.", "fill-stone-500")}
          </svg>
        );

      case "hdd-platters":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* Aluminum Outer HDD Housing box */}
            <rect x="75" y="32" width="150" height="135" rx="6" fill="#111827" stroke="#cbd5e1" strokeWidth="2" />
            
            {/* Spinning Magnetic Platter Circle */}
            <circle cx="150" cy="110" r="46" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
            <circle cx="150" cy="110" r="40" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3,6" />
            
            {/* Hub Spindle center spindle cylinder */}
            <circle cx="150" cy="110" r="12" fill="#475569" stroke="#64748b" strokeWidth="2" />
            <circle cx="150" cy="110" r="4" fill="#020617" />
            
            {/* Magnet pivot drive unit */}
            <rect x="90" y="45" width="25" height="25" rx="2" fill="#2d3748" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="102" cy="57" r="7" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
            
            {/* Moving Actuator read/write arm line */}
            <path d="M 102,57 L 140,94" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
            <path d="M 140,94 L 145,102" stroke="#e11d48" strokeWidth="1.5" />
            <circle cx="145" cy="102" r="1.2" fill="#f43f5e" />
            
            {textLabel(16, 20, "3.5-INCH MECHANICAL HARD DISK DRIVE (HDD)", "fill-amber-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 184, "Magnetic metal platter plates spin at high speeds while read pin scans tracks.", "fill-stone-500")}
          </svg>
        );

      case "capacitors":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
            {bgGrid}
            
            {/* PCB motherboard green sector backing */}
            <rect x="40" y="40" width="220" height="120" rx="6" fill="#051912" stroke="#047857" strokeWidth="2" strokeDasharray="1,1" />
            
            {/* First Canister electrolytic Capacitor */}
            <g transform="translate(80, 52)">
              {/* Core Cylinder cylinder shape */}
              <rect x="0" y="0" width="45" height="85" rx="4" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
              
              {/* Negative Charge visual white stripe */}
              <rect x="28" y="0" width="17" height="85" fill="#64748b" rx="1" />
              <text x="34" y="46" fill="#000" className="text-[12px] font-sans font-black select-none">-</text>
              
              {/* Top cooling scores vents detail */}
              <line x1="22.5" y1="5" x2="22.5" y2="15" stroke="#334155" strokeWidth="1.5" />
              
              {/* Label specifics */}
              <text x="5" y="30" fill="#f97316" className="text-[6.5px] font-mono leading-none font-medium">6.3V</text>
              <text x="5" y="44" fill="#f97316" className="text-[6.5px] font-mono leading-none font-medium">560uF</text>
              <text x="5" y="58" fill="#94a3b8" className="text-[5.5px] font-mono leading-none">105°C</text>
            </g>
            
            {/* Second Canister electrolytic Capacitor */}
            <g transform="translate(170, 52)">
              <rect x="0" y="0" width="45" height="85" rx="4" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
              <rect x="28" y="0" width="17" height="85" fill="#64748b" rx="1" />
              <text x="34" y="46" fill="#000" className="text-[12px] font-sans font-black select-none">-</text>
              <line x1="22.5" y1="5" x2="22.5" y2="15" stroke="#334155" strokeWidth="1.5" />
              <text x="5" y="30" fill="#f97316" className="text-[6.5px] font-mono leading-none font-medium">6.3V</text>
              <text x="5" y="44" fill="#f97316" className="text-[6.5px] font-mono leading-none font-medium">560uF</text>
            </g>
            
            {textLabel(16, 26, "ELECTROLYTIC CANISTER POWER CAPACITORS (560uF FILTER)", "fill-emerald-400 font-medium font-mono text-[9px]")}
            {textLabel(16, 178, "Stores temporary energy charges, smooths ripples, and protects board silicon from voltage spikes.", "fill-stone-500")}
          </svg>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-stone-950 rounded-xl border border-stone-800">
            <Cpu className="w-16 h-16 text-cyan-500 animate-pulse" />
          </div>
        );
      }
    };

    return (
      <div className="w-full h-full flex items-center justify-center relative select-none">
        <div className="w-full h-full flex items-center justify-center">
          {getRawSvg()}
        </div>
      </div>
    );
  };

  const textLabel = (x: number, y: number, text: string, className?: string) => (
    <text x={x} y={y} fill="#94a3b8" className={`text-[8.5px] font-mono select-none tracking-wide ${className || "fill-stone-400"}`}>
      {text}
    </text>
  );

  return (
    <div id="pc-parts-lab-root" className={`flex flex-col h-full border rounded-xl relative overflow-hidden transition-all duration-300 lab-light-panel text-ink`}>
      
      {/* Top Mainheader controls */}
      <div className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 transition-colors duration-300 bg-surface border-border text-signal`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className={`text-xs font-mono font-medium uppercase tracking-widest flex items-center gap-1.5 text-signal`}>
            <Binary className={`w-4 h-4 font-medium text-warning`} />
            Active Lab: PC Parts Identification
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          {/* Active stats metrics */}
          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Streak Indicator */}
            {streak > 0 && (
              <motion.div 
                initial={{ scale: 0.8 }} 
                animate={{ scale: 1 }}
                className={`flex items-center gap-1 border px-2 py-0.5 rounded font-medium transition-colors ${
                  "bg-warning-subtle border-warning text-warning"
                }`}
              >
                <Flame className={`w-3.5 h-3.5 animate-bounce fill-amber-600`} />
                <span>STREAK: {streak}</span>
              </motion.div>
            )}

            <div className={"text-signal"}>
              Score: <span className={`font-medium text-success`}>{score}</span>
            </div>
          </div>
          
          <div className={`h-4 w-px hidden sm:block bg-surface-raised`} />
          <button
            onClick={onExit}
            className="text-[11px] uppercase font-mono font-normal tracking-wider py-[6px] px-[14px] rounded-[3px] border-[1.5px] transition cursor-pointer bg-transparent border-border text-muted hover:border-danger hover:text-danger"
          >
            Exit
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {screen === "welcome" && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex-1 flex items-center justify-center p-4 md:p-8"
          >
            <div className={`w-full max-w-4xl border rounded-lg p-6 md:p-10 relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 shadow-sm transition-colors ${
              "bg-surface border-border"
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none" />
              
              {/* Left Column: Visual schematic teaser */}
              <div className="col-span-1 md:col-span-12 lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="text-[11px] font-mono font-normal tracking-[0.06em] uppercase text-muted mb-2">
                    MODULE 02 ACTIVE • COMPONENT TRAINING LAB
                  </div>
                  <div className="flex items-center gap-2">
                    <Binary className="w-[20px] h-[20px] text-muted flex-shrink-0" />
                    <h1 className="text-[20px] font-mono font-semibold tracking-[-0.01em] text-ink">
                      Hardware SPEC-ID Lab
                    </h1>
                  </div>
                </div>

                <div className={`p-4 rounded-md border flex flex-col items-center justify-center h-[180px] relative overflow-hidden transition-colors ${
                  "bg-surface-raised border-border"
                }`}>
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" />
                  <Cpu className={`w-16 h-16 absolute animate-pulse text-signal`} />
                  <div className="relative text-center space-y-2">
                    <span className={`text-[11px] font-mono uppercase tracking-[0.06em] block font-normal text-muted`}>SYSTEM ACTIVE</span>
                    <span className={`text-[11px] font-mono font-normal block px-3 py-1.5 rounded-[3px] transition-colors ${
                      "bg-surface border-border text-signal"
                    }`}>20 CORE COMPONENTS</span>
                    <span className={`text-[11px] font-mono block tracking-[0.06em] font-normal`}>● OPTION RANDOMIZER ENHANCED</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Descriptions and actions */}
              <div className="col-span-1 md:col-span-12 lg:col-span-7 flex flex-col justify-between space-y-6 text-left">
                <div className="space-y-5">
                  <p className="text-[15px] font-sans font-normal leading-[1.6] text-body">
                    Welcome to the specialized system diagnostics training lab. Test your knowledge on core PC parts, motherboard sockets, power interface headers, memory clips, and thermal conduction mediums based on technical blueprints.
                  </p>

                  <div className="space-y-3 font-mono">
                    <div className={`flex items-start gap-2.5 p-3 rounded-md border transition-colors ${
                      "bg-surface border-border text-muted"
                    }`}>
                      <span className="text-[11px] font-mono font-normal text-success">01.</span>
                      <div>
                        <strong className="block uppercase text-[11px] tracking-[0.06em] text-signal font-mono font-normal">📖 QUICK REVIEWER GUIDE</strong>
                        <p className="text-[12px] font-sans font-normal italic leading-[1.5] mt-0.5 text-muted">Study all 20 basic hardware component blueprint diagrams, descriptions, and answers at your own speed before testing.</p>
                      </div>
                    </div>

                    <div className={`flex items-start gap-2.5 p-3 rounded-md border transition-colors ${
                      "bg-surface border-border text-muted"
                    }`}>
                      <span className="text-[11px] font-mono font-normal text-success">02.</span>
                      <div>
                        <strong className="block uppercase text-[11px] tracking-[0.06em] text-signal font-mono font-normal">⚡ 10-QUESTION EXAMINATION</strong>
                        <p className="text-[12px] font-sans font-normal italic leading-[1.5] mt-0.5 text-muted">Launches a fast-paced assessment picking 10 randomized diagnostic cases from the pool of 20 with speed multipliers.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => {
                      setReviewerIndex(0);
                      setScreen("reviewer");
                    }}
                    className="flex-1 py-3 px-5 rounded-[3px] font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer min-h-[44px] transition border bg-transparent border-border text-muted hover:bg-surface-raised hover:text-signal"
                  >
                    <BookOpen className="w-4 h-4 text-success" />
                    Open Reviewer
                  </button>

                  <button
                    onClick={startDiagnosticExam}
                    className="flex-1 py-3 px-5 rounded-[3px] font-mono text-[11px] font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px] bg-signal hover:bg-signal-hover text-white shadow-sm"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    Start Exam
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {screen === "reviewer" && (
          <motion.div 
            key="reviewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-y-auto"
          >
            {/* Left box: Interactive Blueprint Diagram display */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              <div className={`flex-1 min-h-[220px] md:min-h-[300px] border rounded-xl p-4 flex items-center justify-center relative group transition-colors ${
                "bg-surface border-border"
              }`}>
                <div className={`absolute top-2 left-2 text-[8px] font-mono px-1 border uppercase tracking-widest ${
                  "bg-surface-raised border-border"
                }`}>
                  Reviewer Blueprint // Lab Standard Guide
                </div>
                {renderBlueprintSvg(QUESTIONS_POOL[reviewerIndex]?.diagramType, true)}
              </div>

              {/* Back Button and direct game triggers */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setScreen("welcome")}
                  className="px-4 py-2.5 text-xs font-mono text-stone-400 hover:text-white flex items-center gap-1.5 bg-stone-950/60 border border-stone-800 hover:bg-stone-900 rounded-lg transition shrink-0 cursor-pointer min-h-[38px]"
                >
                  <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
                
                <button
                  onClick={startDiagnosticExam}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-stone-950 font-medium font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer transition min-h-[38px] hover:brightness-105 active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Launch diagnostic exam
                </button>
              </div>
            </div>

            {/* Right box: 20 Items scrollable selector & details */}
            <div className="lg:col-span-7 flex flex-col md:grid md:grid-cols-12 md:gap-5 h-full overflow-hidden min-h-[400px]">
              
              {/* Column 1: Items Selector list */}
              <div className="md:col-span-5 flex flex-col h-[280px] md:h-full justify-start space-y-2">
                <span className="text-[10px] font-mono font-medium tracking-widest text-stone-500 uppercase block select-none">
                  🔍 STUDY DECK (20 COMPONENTS)
                </span>
                
                <div className={`flex-1 overflow-y-auto pr-1 space-y-1.5 border rounded-xl p-2.5 custom-scrollbar max-h-[320px] md:max-h-[500px] transition-colors ${
                  "bg-surface border-border"
                }`}>
                  {QUESTIONS_POOL.map((item, idx) => {
                    const isSelected = reviewerIndex === idx;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setReviewerIndex(idx)}
                        className={`w-full py-1.5 px-2.5 rounded-md text-left transition text-[11px] flex items-center justify-between cursor-pointer border ${
                          isSelected 
                            ? ("font-medium border-border text-signal")
                            : ("bg-surface text-muted hover:bg-surface-raised")
                        }`}
                      >
                        <span className="truncate">{item.title}</span>
                        <ChevronRight className={`w-3 h-3 ${isSelected ? ("text-signal") : ("")}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Selected Item detailed breakdown */}
              <div className="md:col-span-7 flex flex-col justify-start space-y-4 mt-4 md:mt-0">
                <span className="text-[10px] font-mono font-medium tracking-widest text-cyan-400 uppercase block select-none">
                  📋 SYSTEM DOCUMENT DETAILS
                </span>

                <div className={`border p-4 rounded-xl space-y-3.5 flex-1 flex flex-col justify-between transition-colors ${
                  "bg-surface border-border"
                }`}>
                  <div className="space-y-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-medium uppercase tracking-widest border transition-colors ${
                      "border-border text-signal"
                    }`}>
                      {QUESTIONS_POOL[reviewerIndex]?.category}
                    </span>
                    <h3 className={`text-base font-medium tracking-normal pt-1 flex items-center gap-1.5 leading-none uppercase transition-colors ${
                      "text-signal"
                    }`}>
                      {QUESTIONS_POOL[reviewerIndex]?.title}
                    </h3>

                    <div className="text-xs space-y-1 pt-1.5 font-sans">
                      <p className={`font-semibold text-[11px] uppercase tracking-wide transition-colors text-signal`}>Key Assessment Question:</p>
                      <p className={`p-2.5 rounded border text-[10.5px] leading-relaxed italic transition-colors ${
                        "bg-surface-raised border-border text-muted"
                      }`}>
                        "{QUESTIONS_POOL[reviewerIndex]?.question}"
                      </p>
                    </div>
                  </div>

                  <div className={`pt-2 border-t transition-colors border-border`}>
                    <div className="space-y-3.5">
                      <div className="space-y-1 font-sans">
                        <p className={`text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1 font-mono transition-colors `}>
                          <ShieldCheck className="w-3.5 h-3.5" /> Direct Alignment Target:
                        </p>
                        <p className={`text-xs font-medium pl-1 font-mono py-1 px-2 rounded border transition-colors ${
                          "bg-success-subtle border-success text-success"
                        }`}>
                          {QUESTIONS_POOL[reviewerIndex]?.correctAnswer}
                        </p>
                      </div>

                      <div className="space-y-1 font-sans">
                        <p className={`text-[10px] font-semibold uppercase tracking-widest font-mono flex items-center gap-1 transition-colors text-muted`}>
                          <Info className="w-3.5 h-3.5" /> Technical Explanation:
                        </p>
                        <p className={`text-[11px] leading-relaxed font-sans pl-1 transition-colors text-muted`}>
                          {QUESTIONS_POOL[reviewerIndex]?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {screen === "playing" && (
          <motion.div 
            key="gameplay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-y-auto"
          >
            {/* Left Box: Graphic Diagram Probing blueprint */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              <div className={`flex-1 min-h-[220px] md:min-h-[300px] border rounded-xl p-4 flex items-center justify-center relative group transition-colors ${
                "bg-surface border-border"
              }`}>
                {/* Visual diagnostic overlay bounds */}
                <div className={`absolute top-2 left-2 text-[8px] font-mono px-1 border uppercase transition-colors ${
                  "bg-surface-raised border-border text-muted"
                }`}>
                  Scope Zoom: 1200x // POST active
                </div>
                {renderBlueprintSvg(currentQuestion.diagramType, false)}
              </div>

              {/* Progress Tracker dots */}
              <div className="flex items-center justify-between px-2 font-mono text-[9px] text-stone-500">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Array.from({ length: questions.length }).map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        idx < currentIndex 
                          ? "bg-cyan-500" 
                          : idx === currentIndex 
                            ? "bg-amber-400 scale-125" 
                            : "bg-stone-800"
                      }`} 
                    />
                  ))}
                </div>
                <span>LAB COMPLIANCE: {currentIndex + 1} / {questions.length}</span>
              </div>
            </div>

            {/* Right Box: Problem Statement and Options interaction */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                {/* Meta details */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-medium tracking-widest uppercase border transition-colors ${
                    "border-border text-signal"
                  }`}>
                    {currentQuestion.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-medium uppercase tracking-wider border transition-colors ${
                    currentQuestion.difficulty === "Expert" 
                      ? "bg-red-950/40 text-red-500 border border-red-900/35"
                      : ("border bg-warning-subtle border-warning text-warning")
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className={`text-lg font-medium tracking-tight leading-tight transition-colors text-signal`}>
                    {currentQuestion.question}
                  </h3>
                  <p className={`text-xs leading-relaxed font-sans transition-colors text-muted`}>
                    Analyze the schematic indicators on the left thoroughly before choosing your terminal diagnostic key option. Incorrect responses instantly break your current streak multiplier.
                  </p>
                </div>
              </div>

              {/* Multiple Options Board */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrectAnswer = opt === currentQuestion.correctAnswer;
                  
                  let optStyle = "bg-surface border-border text-muted hover:bg-surface-raised hover:border-signal";
                  let badgeIcon = null;

                  if (selectedAnswer !== null) {
                    if (isCorrectAnswer) {
                      optStyle = "font-medium bg-success-subtle border-success text-success";
                      badgeIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                    } else if (isSelected) {
                      optStyle = "font-medium bg-danger-subtle border-danger text-danger";
                      badgeIcon = <XCircle className="w-4 h-4 text-red-500" />;
                    } else {
                      optStyle = "opacity-40 pointer-events-none bg-surface";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleOptionClick(opt)}
                      className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-sans transition-all flex items-center justify-between cursor-pointer min-h-[50px] shadow-sm ${optStyle}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`font-mono text-[10px] w-4 font-medium text-signal`}>{String.fromCharCode(65 + idx)}.</span>
                        <span>{opt}</span>
                      </span>
                      {badgeIcon}
                    </button>
                  );
                })}
              </div>

              {/* Countdown Dynamic Meter or Explanation Overlay */}
              <div className={`p-4 rounded-xl border transition-colors bg-surface border-border`}>
                <AnimatePresence mode="wait">
                  {selectedAnswer === null ? (
                    <motion.div 
                      key="timer-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center justify-between text-xs font-mono transition-colors text-signal`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Timer className={`w-4 h-4 animate-spin text-warning`} />
                        <span>ANALYSIS DEADLINE:</span>
                      </div>
                      <span className={`text-sm font-medium ${timeRemaining < 7 ? "text-red-500 animate-pulse" : ("text-warning")}`}>
                        {timeRemaining} SECS
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="explanation-view"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        {answeredRight ? (
                          <div id="badge-diag-pass" className="text-emerald-500 flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-4 h-4" /> DIAGNOSTIC PASSED (+{streak > 0 ? Math.round((100 + timeRemaining * 10) * (1 + streak * 0.15)) : 100} points)
                          </div>
                        ) : (
                          <div id="badge-diag-fail" className="text-red-500 flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-4 h-4" /> DIAGNOSTIC UNRESOLVED (Streak Intercepted)
                          </div>
                        )}
                      </div>
                      
                      <p className={`text-xs leading-relaxed font-sans transition-colors text-muted`}>
                        {currentQuestion.explanation}
                      </p>

                      <div className={`pt-2 flex justify-end border-t transition-colors border-border`}>
                        <button
                          onClick={handleNextQuestion}
                          className={`px-4 py-2 rounded-[3px] font-medium font-mono text-xs tracking-wider uppercase flex items-center gap-1 cursor-pointer transition min-h-[38px] bg-signal text-white hover:bg-signal-hover`}
                        >
                          {currentIndex >= questions.length - 1 ? "Complete Hardware Board" : "Analyze Next Part"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {screen === "gameover" && (
          /* Scoring Screen Summary */
          <motion.div
            key="scorecard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex-1 flex items-center justify-center p-6 transition-colors bg-surface-raised`}
          >
            <div className={`w-full max-w-md border rounded-xl p-6 relative overflow-hidden space-y-6 text-center shadow-xl transition-colors ${
              "bg-surface border-border"
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className={`mx-auto w-12 h-12 border rounded-full flex items-center justify-center transition-colors ${
                "bg-warning-subtle border-warning text-warning"
              }`}>
                <Award className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className={`text-xl font-medium tracking-widest font-display uppercase transition-colors text-signal`}>SPEC-ID SYSTEM COMPLETED</h3>
                <p className={`text-[11px] max-w-xs mx-auto transition-colors text-muted`}>
                  IT-MASTERY diagnostics have evaluated your technical part alignment speed.
                </p>
              </div>

              {/* Scoring Board Metrics */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className={`p-3 border rounded-xl space-y-1 transition-colors bg-surface-raised border-border`}>
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest block">Accuracy</span>
                  <span className={`text-lg font-medium transition-colors `}>{Math.round((correctCount / questions.length) * 100)}%</span>
                  <span className="text-[9px] text-stone-400 block">({correctCount} of {questions.length})</span>
                </div>

                <div className={`p-3 border rounded-xl space-y-1 transition-colors bg-surface-raised border-border`}>
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest block">Peak Streak</span>
                  <span className={`text-lg font-medium transition-colors text-warning`}>{maxStreak}</span>
                  <span className="text-[9px] text-stone-400 block">Streak Multipliers</span>
                </div>

                <div className={`p-3 border rounded-xl space-y-1 col-span-2 transition-colors border-border`}>
                  <span className={`text-[10px] uppercase tracking-widest block font-medium text-signal`}>Final Score Rating</span>
                  <div className={`text-2xl font-black transition-colors text-signal`}>{score} XP</div>
                  <span className={`text-[9.5px] font-medium block transition-colors text-warning`}>
                    {score >= (questions.length * 150) ? "👑 GRANDMASTER BUILDER" : score >= (questions.length * 100) ? "⚙️ SYSTEMS ARCHITECT" : score >= (questions.length * 60) ? "🔧 FIELD TECHNICIAN" : "🔩 TRAINEE"}
                  </span>
                </div>
              </div>

              {/* Call to actions bottom row */}
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex gap-3">
                  <button
                    onClick={() => setScreen("welcome")}
                    className={`flex-1 px-4 py-3 border transition rounded-xl font-mono text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                      "bg-surface border-border text-muted hover:bg-surface-raised"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Lobby
                  </button>

                  <button
                    onClick={handleRestart}
                    className={`flex-1 px-4 py-3 border transition rounded-xl font-mono text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                      "bg-surface border-border text-muted hover:bg-surface-raised"
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Redo Exam
                  </button>
                </div>

                <button
                  onClick={handleFinishAndSave}
                  className={`w-full px-4 py-3 shadow-lg active:scale-[0.98] transition rounded-[3px] font-mono text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] bg-signal text-white`}
                >
                  <Award className="w-4 h-4" />
                  Save Grade and exit
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
