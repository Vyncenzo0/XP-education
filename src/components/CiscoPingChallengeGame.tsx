import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { 
  Network, Monitor, Server, Router, Terminal, Settings, Wrench, BookOpen, 
  ArrowLeft, CheckCircle2, AlertTriangle, Play, HelpCircle, RefreshCw, Award, Activity, Check
} from "lucide-react";

interface CiscoPingChallengeGameProps {
  uid: string;
  displayName: string;
  onGameEnd: (score: number, avgReactionMs: number, customPrefix?: string) => void;
  onExit: () => void;
}

const getDeviceIcon = (type: "pc" | "laptop" | "switch" | "router" | "server") => {
  switch (type) {
    case "pc":
      return <Monitor className="w-5 h-5 text-cyan-400" />;
    case "laptop":
      return <Monitor className="w-5 h-5 text-amber-400" />;
    case "switch":
      return <Network className="w-5 h-5 text-indigo-400" />;
    case "router":
      return <Router className="w-5 h-5 text-pink-400" />;
    case "server":
      return <Server className="w-5 h-5 text-emerald-400" />;
    default:
      return <Monitor className="w-5 h-5 text-stone-400" />;
  }
};

interface Device {
  id: string;
  name: string;
  type: "pc" | "laptop" | "switch" | "router" | "server";
  ip: string;
  subnet: string;
  gateway: string;
  // Specific settings for lab
  interfaces?: {
    [key: string]: {
      status: "up" | "down" | "shutdown";
      ip: string;
      subnet: string;
    };
  };
}

interface Scenario {
  id: number;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  objective: string;
  targetPingFrom: string; // Device ID
  targetPingTo: string; // IP Address to ping successfully
  devices: Record<string, Device>;
  clues: string[];
}

export default function CiscoPingChallengeGame({
  uid,
  displayName,
  onGameEnd,
  onExit
}: CiscoPingChallengeGameProps) {
  // Scenario state templates
  const INITIAL_SCENARIOS: Scenario[] = [
    {
      id: 1,
      title: "Lab 01: Subnet Mismatch Diagnosis",
      difficulty: "Beginner",
      objective: "Verify connectivity between Client-A and Local-Server on the same switch frame. Ping server IP (192.168.1.11) successfully from PC-A.",
      targetPingFrom: "pc_a",
      targetPingTo: "192.168.1.11",
      clues: [
        "Select Local-Server and check its IP parameters.",
        "Currently, Local-Server has IP '192.168.2.11'. Double-click or select it to edit its configuration.",
        "Change Local-Server's IP to '192.168.1.11' and subnet mask to '255.255.255.0' so it resides in the same Class C network as PC-A."
      ],
      devices: {
        pc_a: {
          id: "pc_a",
          name: "Client-A (PC-A)",
          type: "pc",
          ip: "192.168.1.10",
          subnet: "255.255.255.0",
          gateway: "192.168.1.1"
        },
        switch: {
          id: "switch",
          name: "Switch-L2",
          type: "switch",
          ip: "",
          subnet: "",
          gateway: ""
        },
        server: {
          id: "server",
          name: "Local-Server",
          type: "server",
          ip: "192.168.2.11", // Mismatch subnet initially
          subnet: "255.255.255.0",
          gateway: "192.168.1.1"
        }
      }
    },
    {
      id: 2,
      title: "Lab 02: Default Gateway & Cisco Interface Up",
      difficulty: "Intermediate",
      objective: "Configure Client-A network parameters and activate Router interface g0/1 to route ping packets to the remote Web-Host (10.0.0.10).",
      targetPingFrom: "pc_a",
      targetPingTo: "10.0.0.10",
      clues: [
        "Select Client-A. Notice its Default Gateway parameter is empty. Configure it to route outside its local subnet (Gateway should be 192.168.1.1).",
        "Select Router-HQ. Look at GigabitEthernet0/1 current status (Administratively Down / shutdown).",
        "Access Router-HQ CLI tab. Type 'enable', then 'configure terminal', 'interface g0/1', and execute the 'no shutdown' command to bring the link UP!"
      ],
      devices: {
        pc_a: {
          id: "pc_a",
          name: "Client-A (PC-A)",
          type: "pc",
          ip: "192.168.1.10",
          subnet: "255.255.255.0",
          gateway: "" // Missing initially
        },
        router: {
          id: "router",
          name: "Router-HQ",
          type: "router",
          ip: "192.168.1.1",
          subnet: "255.255.255.0",
          gateway: "",
          interfaces: {
            "g0/0": { status: "up", ip: "192.168.1.1", subnet: "255.255.255.0" },
            "g0/1": { status: "shutdown", ip: "10.0.0.1", subnet: "255.255.255.0" } // Mismatch shut initially
          }
        },
        server: {
          id: "server",
          name: "Web-Host",
          type: "server",
          ip: "10.0.0.10",
          subnet: "255.255.255.0",
          gateway: "10.0.0.1"
        }
      }
    },
    {
      id: 3,
      title: "Lab 03: Router RIP Static Route & Subnet Overload",
      difficulty: "Advanced",
      objective: "Route packets successfully between LAN-A and the DMZ Server IP (8.8.8.8) by resolving Gateway collisions and improper Subnet mappings.",
      targetPingFrom: "pc_a",
      targetPingTo: "8.8.8.8",
      clues: [
        "PC-A needs to query the backup DNS/DMZ Server at 8.8.8.8.",
        "Check Laptop-B configuration: it is currently misconfigured with IP '192.168.1.1', which collides directly with the Router's Gateway interface IP!",
        "Change Laptop-B IP address to '192.168.1.12' to clear the gateway route path.",
        "Access Router CLI and configure interface g0/1 IP to correctly route to DMZ gateway if needed."
      ],
      devices: {
        pc_a: {
          id: "pc_a",
          name: "Client-A (PC-A)",
          type: "pc",
          ip: "192.168.1.10",
          subnet: "255.255.255.0",
          gateway: "192.168.1.1"
        },
        laptop: {
          id: "laptop",
          name: "Mobile-Laptop-B",
          type: "laptop",
          ip: "192.168.1.1", // IP Collision with default gateway
          subnet: "255.255.255.0",
          gateway: "192.168.1.1"
        },
        router: {
          id: "router",
          name: "Core-Router",
          type: "router",
          ip: "192.168.1.1",
          subnet: "255.255.255.0",
          gateway: "",
          interfaces: {
            "g0/0": { status: "up", ip: "192.168.1.1", subnet: "255.255.255.0" },
            "g0/1": { status: "up", ip: "8.8.8.1", subnet: "255.255.255.0" }
          }
        },
        server: {
          id: "server",
          name: "DMZ-Server",
          type: "server",
          ip: "8.8.8.8",
          subnet: "255.255.255.0",
          gateway: "8.8.8.1"
        }
      }
    }
  ];

  // Game States
  const { theme } = useTheme();
  const [screen, setScreen] = useState<"lobby" | "reviewer" | "play">("lobby");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"all" | "Beginner" | "Intermediate" | "Advanced">("all");
  const [scenarios, setScenarios] = useState<Scenario[]>(INITIAL_SCENARIOS);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState<number>(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("pc_a");
  const [consoleTab, setConsoleTab] = useState<"config" | "cli">("config");

  // Router CLI specific sequence state variables
  const [cliHost, setCliHost] = useState<string>("Router>"); // router CLI prompt
  const [routerEnableLevel, setRouterEnableLevel] = useState<"user" | "privileged" | "config" | "config-if">("user");
  const [selectedInterface, setSelectedInterface] = useState<string>("");

  // CLI execution histories
  const [cliHistory, setCliHistory] = useState<Array<{ text: string; type: "input" | "output" | "error" | "system" }>>([
    { text: "Cisco IOS Lab Node Engine Ready.", type: "system" },
    { text: "Enter standard network diagnostics & commands. Type 'help' for info.", type: "system" }
  ]);
  const [currentInput, setCurrentInput] = useState<string>("");

  // Play attributes
  const [score, setScore] = useState<number>(0);
  const [completedScenarios, setCompletedScenarios] = useState<Record<number, boolean>>({});
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [lastCheckResult, setLastCheckResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [showTimeoutModal, setShowTimeoutModal] = useState<boolean>(false);
  const [showScorecard, setShowScorecard] = useState<boolean>(false);

  // References
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeScenario = scenarios[activeScenarioIdx];
  const activeDevice = activeScenario?.devices[selectedDeviceId];

  // Automatic Terminal scroll trigger
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [cliHistory]);

  // Global game loop timers
  useEffect(() => {
    if (screen === "play" && !hasStarted) {
      setHasStarted(true);
      setSecondsElapsed(0);
      setScore(0);
      setCompletedScenarios({});
      
      // Filter current state templates
      let filtered = JSON.parse(JSON.stringify(INITIAL_SCENARIOS));
      if (selectedDifficulty !== "all") {
        filtered = filtered.filter((s: Scenario) => s.difficulty === selectedDifficulty);
      }
      
      setScenarios(filtered);
      setActiveScenarioIdx(0);
      
      // Select appropriate initial device
      const firstDevId = Object.keys(filtered[0]?.devices || {})[0] || "pc_a";
      setSelectedDeviceId(firstDevId);
      setConsoleTab("config");
      setCliHistory([
        { text: "Cisco IOS CLI Engine Booted. Connection set on administrative console entry.", type: "system" },
        { text: "Type 'ping <ip>' to test network path or configuration. Use 'ipconfig' to view settings.", type: "system" }
      ]);
    }
  }, [screen, hasStarted, selectedDifficulty]);

  useEffect(() => {
    if (screen === "play" && hasStarted && !showTimeoutModal) {
      playTimerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          if (prev >= 600) {
            if (playTimerRef.current) {
              clearInterval(playTimerRef.current);
            }
            setShowTimeoutModal(true);
            return 600;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [screen, hasStarted, showTimeoutModal]);

  const handleStartGame = () => {
    setScreen("play");
  };

  // Cisco device select handler
  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    const targetDev = activeScenario.devices[deviceId];
    
    // Clear terminal layout when switching to match specific mock device
    if (targetDev.type === "router") {
      setCliHost("Router>");
      setRouterEnableLevel("user");
      setSelectedInterface("");
      setCliHistory([
        { text: `--- Connected to ${targetDev.name} CLI Console ---`, type: "system" },
        { text: "Cisco IOS Software, Catalyst L3 Router Virtual Platform.", type: "output" },
        { text: "Type 'enable' to enter privileged executive mode.", type: "output" }
      ]);
    } else {
      setCliHistory([
        { text: `--- Switched to ${targetDev.name} Desktop command line ---`, type: "system" },
        { text: "PC Command Prompt utility initialized.", type: "output" },
        { text: `Current node IP configuration: ${targetDev.ip || "Unassigned"}`, type: "output" }
      ]);
    }
  };

  // Device configuration update inputs handler
  const handleConfigChange = (field: "ip" | "subnet" | "gateway", val: string) => {
    const updatedScenarios = [...scenarios];
    const dev = updatedScenarios[activeScenarioIdx].devices[selectedDeviceId];
    if (dev) {
      dev[field] = val;
      setScenarios(updatedScenarios);
    }
  };

  // CLI command submission processor
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = currentInput.trim();
    if (!command) return;

    const lowerCommand = command.toLowerCase();
    const newHistory = [...cliHistory, { text: `${cliPromptText()}${command}`, type: "input" as const }];

    let responseOutput: Array<{ text: string; type: "output" | "error" | "system" }> = [];

    // Check device type context
    if (activeDevice.type === "router") {
      // CISCO ROUTER CLI CONFIG SHORTCUTS
      if (lowerCommand === "enable" || lowerCommand === "en") {
        setRouterEnableLevel("privileged");
        responseOutput.push({ text: "Router#", type: "system" });
      } else if (lowerCommand === "disable") {
        setRouterEnableLevel("user");
        responseOutput.push({ text: "Router>", type: "system" });
      } else if (lowerCommand === "configure terminal" || lowerCommand === "conf t" || lowerCommand === "config t") {
        if (routerEnableLevel === "user") {
          responseOutput.push({ text: "% Access level error: enter enable mode first.", type: "error" });
        } else {
          setRouterEnableLevel("config");
          responseOutput.push({ text: "Enter configuration commands, one per line. End with CNTL/Z.", type: "output" });
        }
      } else if (lowerCommand.startsWith("interface ") || lowerCommand.startsWith("int ")) {
        if (routerEnableLevel === "user" || routerEnableLevel === "privileged") {
          responseOutput.push({ text: "% Command complete error: must enter config mode.", type: "error" });
        } else {
          const parts = command.split(" ");
          const intName = parts[parts.length - 1];
          // Check if interface g0/1, g0/0 exists
          if (activeDevice.interfaces && activeDevice.interfaces[intName]) {
            setRouterEnableLevel("config-if");
            setSelectedInterface(intName);
            responseOutput.push({ text: `Router(config-if)# interface selected: ${intName}`, type: "system" });
          } else {
            responseOutput.push({ text: "% Invalid interface name (Try: g0/0, g0/1)", type: "error" });
          }
        }
      } else if (lowerCommand === "no shutdown" || lowerCommand === "no shut") {
        if (routerEnableLevel !== "config-if") {
          responseOutput.push({ text: "% Command reject: Select an active interface first.", type: "error" });
        } else {
          // ACTIVATE ROUTER PORT LINK
          const updatedScenarios = [...scenarios];
          const routerDev = updatedScenarios[activeScenarioIdx].devices[selectedDeviceId];
          if (routerDev && routerDev.interfaces && routerDev.interfaces[selectedInterface]) {
            routerDev.interfaces[selectedInterface].status = "up";
            setScenarios(updatedScenarios);
            responseOutput.push({ text: `Router(config-if)# port links requested UP.`, type: "system" });
            responseOutput.push({ text: `%LINK-5-CHANGED: Interface ${selectedInterface.toUpperCase()}, changed state to up`, type: "output" });
            responseOutput.push({ text: `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${selectedInterface.toUpperCase()}, changed state to up`, type: "output" });
          }
        }
      } else if (lowerCommand === "shutdown" || lowerCommand === "shut") {
        if (routerEnableLevel !== "config-if") {
          responseOutput.push({ text: "% Command reject: Select an active interface first.", type: "error" });
        } else {
          const updatedScenarios = [...scenarios];
          const routerDev = updatedScenarios[activeScenarioIdx].devices[selectedDeviceId];
          if (routerDev && routerDev.interfaces && routerDev.interfaces[selectedInterface]) {
            routerDev.interfaces[selectedInterface].status = "shutdown";
            setScenarios(updatedScenarios);
            responseOutput.push({ text: `%LINK-5-CHANGED: Interface ${selectedInterface.toUpperCase()}, changed state to down`, type: "output" });
          }
        }
      } else if (lowerCommand.startsWith("ip address ") || lowerCommand.startsWith("ip add ")) {
        if (routerEnableLevel !== "config-if") {
          responseOutput.push({ text: "% Command reject: Enter interface configuration hierarchy.", type: "error" });
        } else {
          // Parse IP: ip address 10.0.0.1 255.255.255.0
          const parts = command.split(/\s+/);
          if (parts.length >= 5) {
            const ipParam = parts[2];
            const maskParam = parts[3];
            const updatedScenarios = [...scenarios];
            const routerDev = updatedScenarios[activeScenarioIdx].devices[selectedDeviceId];
            if (routerDev && routerDev.interfaces && routerDev.interfaces[selectedInterface]) {
              routerDev.interfaces[selectedInterface].ip = ipParam;
              routerDev.interfaces[selectedInterface].subnet = maskParam;
              setScenarios(updatedScenarios);
              responseOutput.push({ text: `Address ${ipParam} configured on portal reference.`, type: "output" });
            }
          } else {
            responseOutput.push({ text: "% Incomplete command syntax. Usage: 'ip address [ip] [mask]'", type: "error" });
          }
        }
      } else if (lowerCommand === "exit") {
        if (routerEnableLevel === "config-if") {
          setRouterEnableLevel("config");
          setSelectedInterface("");
        } else if (routerEnableLevel === "config") {
          setRouterEnableLevel("privileged");
        } else if (routerEnableLevel === "privileged") {
          setRouterEnableLevel("user");
        } else {
          responseOutput.push({ text: "Console session closed. Recourse to interactive panels.", type: "output" });
        }
      } else if (lowerCommand === "show ip interface brief" || lowerCommand === "sh ip int br") {
        responseOutput.push({ text: "Interface             IP-Address      OK? Method Status                Protocol", type: "system" });
        if (activeDevice.interfaces) {
          (Object.entries(activeDevice.interfaces) as [string, { status: "up" | "down" | "shutdown"; ip: string; subnet: string }][]).forEach(([name, config]) => {
            const upStatus = config.status === "up" ? "up                    up" : `${config.status}              down`;
            responseOutput.push({ text: `${name.padEnd(21)}${config.ip.padEnd(16)}YES manual ${upStatus}`, type: "output" });
          });
        }
      } else if (lowerCommand === "help" || lowerCommand === "?") {
        responseOutput.push({ text: "Available Cisco CLI commands in this tutorial environment:", type: "system" });
        responseOutput.push({ text: " - enable (en) / disable: Enter/exit administrative modes", type: "output" });
        responseOutput.push({ text: " - configure terminal (conf t): Enter system layout parameters", type: "output" });
        responseOutput.push({ text: " - interface [name] (int g0/1): Access specific gigabit ports", type: "output" });
        responseOutput.push({ text: " - no shutdown (no shut) / shutdown: Toggle port power administratively", type: "output" });
        responseOutput.push({ text: " - ip address [ip] [mask]: Set local interface parameters", type: "output" });
        responseOutput.push({ text: " - show ip interface brief: Audit running port configurations", type: "output" });
        responseOutput.push({ text: " - exit: Navigate backwards in the router IOS menu", type: "output" });
      } else {
        responseOutput.push({ text: `% Unknown Cisco command: '${command}'. Type '?' or 'help' for support.`, type: "error" });
      }
    } else {
      // WINDOWS PC CLIENT OR HARDWARE COMMAND CONSOLE
      if (lowerCommand.startsWith("ping ")) {
        const pingArgs = command.split(" ");
        const targetIp = pingArgs[pingArgs.length - 1];

        if (targetIp) {
          responseOutput.push({ text: `Pinging ${targetIp} with 32 bytes of packet payload:`, type: "output" });
          
          // CRITICAL: Diagnose connection status to see if ping reaches target
          const isSuccessfulReachString = verifyNetworkPingRoute(targetIp);
          
          if (isSuccessfulReachString === "SUCCESS") {
            responseOutput.push({ text: `Reply from ${targetIp}: bytes=32 time=4ms TTL=128`, type: "output" });
            responseOutput.push({ text: `Reply from ${targetIp}: bytes=32 time=3ms TTL=128`, type: "output" });
            responseOutput.push({ text: `Reply from ${targetIp}: bytes=32 time=5ms TTL=128`, type: "output" });
            responseOutput.push({ text: `Reply from ${targetIp}: bytes=32 time=4ms TTL=128`, type: "output" });
            responseOutput.push({ text: `Ping statistics for ${targetIp}: Packets: Sent = 4, Received = 4, Lost = 0 (0% Loss)`, type: "output" });
            
            // Trigger check to see if we reached objective
            if (targetIp === activeScenario.targetPingTo && activeDevice.id === activeScenario.targetPingFrom) {
              responseOutput.push({ text: "🎉 DIAGNOSTIC GOAL ACQUIRED! Target ping command complete and network path verified.", type: "system" });
              
              // Handle completion marks
              setTimeout(() => {
                triggerScenarioCompleted();
              }, 1800);
            }
          } else {
            // Echo back detailed diagnostic error message to guide student
            responseOutput.push({ text: "Request timed out.", type: "error" });
            responseOutput.push({ text: `Reply from ${activeDevice.ip || "127.0.0.1"}: Destination host unreachable. Error: ${isSuccessfulReachString}`, type: "error" });
            responseOutput.push({ text: "Request timed out.", type: "error" });
            responseOutput.push({ text: `Ping statistics: Packets Sent = 4, Received = 0, Lost = 4 (100% loss)`, type: "error" });
          }
        } else {
          responseOutput.push({ text: "Error: No destination parameters specified. Usage: 'ping [ip_address]'", type: "error" });
        }
      } else if (lowerCommand === "ipconfig") {
        responseOutput.push({ text: "Ethernet adapter Local Area Connection:", type: "output" });
        responseOutput.push({ text: `   IPv4 Address. . . . . . . . . . . : ${activeDevice.ip || "0.0.0.0"}`, type: "output" });
        responseOutput.push({ text: `   Subnet Mask . . . . . . . . . . . : ${activeDevice.subnet || "0.0.0.0"}`, type: "output" });
        responseOutput.push({ text: `   Default Gateway . . . . . . . . . : ${activeDevice.gateway || "None specified"}`, type: "output" });
      } else if (lowerCommand === "help") {
        responseOutput.push({ text: "Supported Command Line Utilities:", type: "system" });
        responseOutput.push({ text: " - ipconfig: View local TCP/IP networking variables", type: "output" });
        responseOutput.push({ text: " - ping [IP]: Diagnose active path to targeted destination nodes", type: "output" });
        responseOutput.push({ text: " - clear: Clear screen history buffer", type: "output" });
      } else if (lowerCommand === "clear") {
        setCliHistory([{ text: "Console history wiped clean.", type: "system" }]);
        setCurrentInput("");
        return;
      } else {
        responseOutput.push({ text: `'${command}' is not recognized as an internal or external CLI utility command. Type 'help' for assistance.`, type: "error" });
      }
    }

    setCliHistory([...newHistory, ...responseOutput]);
    setCurrentInput("");
  };

  // Node relative path connection verify routine
  const verifyNetworkPingRoute = (targetIp: string): string => {
    // Audit active configurations dynamically
    const sourceDev = activeScenario.devices[activeScenario.targetPingFrom];
    const serverDev = activeScenario.devices["server"];

    // Scenario 1 Diagnosis
    if (activeScenario.id === 1) {
      if (sourceDev.subnet !== serverDev.subnet) {
        return "Subnet Mismatch error";
      }
      if (serverDev.ip !== "192.168.1.11") {
        return `Target IP address mismatch (You pinged Server, but server IP is currently configured as ${serverDev.ip})`;
      }
      return "SUCCESS";
    }

    // Scenario 2 Diagnosis
    if (activeScenario.id === 2) {
      const routerDev = activeScenario.devices["router"];
      
      // PC-A must have correct Default Gateway set
      if (sourceDev.gateway !== "192.168.1.1") {
        return "No route to host - Missing gateway configuration on source PC-A";
      }
      // Router g0/1 port must NOT be shutdown
      if (routerDev.interfaces && routerDev.interfaces["g0/1"]?.status !== "up") {
        return "No route to host - Gateway outbound router interface GigabitEthernet0/1 is Administratively DOWN!";
      }
      // Server is configured at 10.0.0.10
      if (targetIp === "10.0.0.10") {
        return "SUCCESS";
      }
      return "Host not found on targeted route mapping";
    }

    // Scenario 3 Diagnosis
    if (activeScenario.id === 3) {
      const laptopDev = activeScenario.devices["laptop"];
      const routerDev = activeScenario.devices["router"];

      // Check duplicate IP collision on 192.168.1.1
      if (laptopDev.ip === "192.168.1.1") {
        return "Gate link error: IP Collision detected at Default Gateway (192.168.1.1)! Laptop-B and Router are conflicting.";
      }
      
      if (targetIp === "8.8.8.8") {
        return "SUCCESS";
      }
      return "Destination Host Unreachable";
    }

    return "No link established";
  };

  // Helper formatting for router CLI hierarchy
  const cliPromptText = () => {
    if (activeDevice.type === "router") {
      switch (routerEnableLevel) {
        case "privileged": return "Router# ";
        case "config": return "Router(config)# ";
        case "config-if": return `Router(config-if)# `;
        default: return "Router> ";
      }
    }
    return "C:\\users\\admin> ";
  };

  const triggerScenarioCompleted = () => {
    // Scenario Completed successfully
    if (completedScenarios[activeScenario.id]) return; // already solved

    setCompletedScenarios({
      ...completedScenarios,
      [activeScenario.id]: true
    });

    const isLast = activeScenarioIdx === scenarios.length - 1;
    let completedPointsSum = 4500;
    
    // Time efficiency calculations
    const timeBonus = Math.max(0, 1000 - secondsElapsed);
    const addedScore = completedPointsSum + timeBonus;
    setScore((prev) => prev + addedScore);

    setLastCheckResult({
      success: true,
      msg: `Module Certified! ${activeScenario.title} complete. You earned +${addedScore} diagnostics points!`
    });
  };

  const handleNextChallenge = () => {
    setLastCheckResult(null);
    if (activeScenarioIdx < scenarios.length - 1) {
      setActiveScenarioIdx((prev) => prev + 1);
      setTimeout(() => {
        // Find first PC to auto select
        setSelectedDeviceId("pc_a");
      }, 100);
    } else {
      // Finish the entire Cisco Lab
      handleSaveScoresAndClose();
    }
  };

  const handleSaveScoresAndClose = () => {
    setShowScorecard(true);
  };

  const submitScoreResult = () => {
    // Terminal feedback average reaction
    const avgReact = Math.max(1, Math.round(secondsElapsed / (scenarios.length || 1)));
    let customPrefix = "🔌 PING-ALL:";
    if (selectedDifficulty === "Beginner") {
      customPrefix = "🔌 PING-BEG:";
    } else if (selectedDifficulty === "Intermediate") {
      customPrefix = "🔌 PING-INT:";
    } else if (selectedDifficulty === "Advanced") {
      customPrefix = "🔌 PING-ADV:";
    }
    
    onGameEnd(score > 0 ? score : 1200, avgReact, customPrefix);
  };

  return (
    <div className={`flex flex-col h-full border rounded-xl relative overflow-hidden transition-all duration-300 lab-light-panel text-ink min-h-[550px]`} id="cisco-lab-pane">
      
      {/* Lab Result Dialog overlay */}
      <AnimatePresence>
        {showScorecard && (
          <motion.div
            id="cisco-result-dialog"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute inset-0 z-50 flex items-center justify-center p-6 bg-surface`}
          >
            <div className={`border rounded-xl p-6 w-full max-w-md text-center space-y-6 shadow-2xl relative overflow-hidden transition-colors bg-surface border-border text-signal`}>
              <div className={`absolute top-0 left-0 w-20 h-20 rounded-br-full pointer-events-none `} />

              <div className={`mx-auto w-12 h-12 border rounded-full flex items-center justify-center transition-colors bg-signal-subtle border-border text-signal`}>
                <Award className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h4 className={`text-lg font-medium font-display uppercase tracking-widest text-signal`}>
                  CISCO ROUTING LAB CERTIFIED!
                </h4>
                <p className={`text-xs text-signal`}>
                  Congratulations! Your computer networking and router routing coordinates are successfully synchronized.
                </p>
              </div>

              {/* Score indicators */}
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className={`rounded-xl p-3 border transition-colors bg-surface-raised border-border`}>
                  <span className={`text-[10px] uppercase block font-semibold font-mono text-signal`}>Routing Score</span>
                  <span className={`font-mono text-xl font-medium text-warning`}>{score > 0 ? score : 1200} XP</span>
                </div>
                <div className={`rounded-xl p-3 border transition-colors bg-surface-raised border-border`}>
                  <span className={`text-[10px] uppercase block font-semibold font-mono text-signal`}>Pacing Index</span>
                  <span className={`font-mono text-xl font-medium text-success`}>
                    {Math.max(1, Math.round(secondsElapsed / (scenarios.length || 1)))}s
                  </span>
                </div>
              </div>

              <div className={`text-left p-3.5 border rounded-xl text-[10px] transition-colors border-border text-signal`}>
                <span className={`font-medium uppercase tracking-widest block text-[9px] mb-1 text-signal`}>Diagnostic Report:</span>
                <p className={`font-mono leading-normal text-muted`}>
                  - Certified Sub-Modules: <span className={`font-medium `}>{scenarios.length} of {scenarios.length}</span><br />
                  - Network Loop Carrier speed: <span className={`font-medium `}>100% Verified G-Trunk</span><br />
                  - ICMP Echo Request/Reply: <span className={`font-medium `}>Success (0% packet loss)</span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-cisco-restart"
                  onClick={() => {
                    setShowScorecard(false);
                    setScreen("lobby");
                    setHasStarted(false);
                    setScore(0);
                    setCompletedScenarios({});
                    setSecondsElapsed(0);
                    setLastCheckResult(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl border transition-all text-xs font-mono font-medium uppercase cursor-pointer ${
                    "bg-surface border-border text-signal hover:bg-surface-raised"
                  }`}
                >
                  Reset / Retry
                </button>
                <button
                  id="btn-cisco-submit"
                  onClick={submitScoreResult}
                  className={`flex-[2] py-2.5 rounded-xl transition text-xs font-mono font-medium uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow ${
                    ""
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Submit Score
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Lab Header */}
      <div className={`flex items-center justify-between border-b p-4 transition-colors duration-300 bg-surface border-border`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-mono text-[9px] text-indigo-400 font-medium uppercase tracking-widest">LAB MODULE 07</span>
            <h1 className={`font-display font-black text-base tracking-tight transition-colors text-signal`}>Cisco Packet Tracer Router Challenge</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="font-mono text-[9px] text-stone-500 uppercase">Diagnose Progress</span>
            <span className="font-medium font-mono text-xs text-indigo-400">
              {Object.keys(completedScenarios).length} / {scenarios.length} Solved
            </span>
          </div>
          <div className={`w-px h-6 bg-surface-raised`}></div>
          <div className="flex flex-col text-right">
            <span className="font-mono text-[9px] text-stone-500 uppercase">Diagnostics Score</span>
            <span className="font-medium font-mono text-emerald-400 text-sm">
              {score.toLocaleString()} pts
            </span>
          </div>
          {screen === "play" && (
            <>
              <div className="w-px h-6 bg-stone-800"></div>
              <div className={`flex flex-col text-right px-2 py-0.5 rounded ${600 - secondsElapsed < 60 ? "text-red-400 bg-red-950/20 border border-red-800/20 animate-pulse" : "text-sky-400"}`}>
                <span className="font-mono text-[9px] text-stone-500 uppercase">Limit Remaining</span>
                <span className="font-medium font-mono text-xs">
                  {(() => {
                    const rem = Math.max(0, 600 - secondsElapsed);
                    const m = Math.floor(rem / 60);
                    const s = rem % 60;
                    return `${m}:${s < 10 ? "0" : ""}${s}`;
                  })()}
                </span>
              </div>
            </>
          )}
          <button
            onClick={() => {
              if (screen !== "lobby") {
                setScreen("lobby");
                setHasStarted(false);
              } else {
                onExit();
              }
            }}
            className="text-[11px] uppercase font-mono font-normal tracking-wider py-[6px] px-[14px] rounded-[3px] border-[1.5px] transition cursor-pointer bg-transparent border-border text-muted hover:border-danger hover:text-danger"
          >
            {screen !== "lobby" ? "Back" : "Exit"}
          </button>
        </div>
      </div>

      {screen === "lobby" ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto text-center space-y-8">
          <div className="relative">
            <div className={`absolute -inset-1 rounded-full blur-xl animate-pulse bg-signal-subtle`}></div>
            <div className={`relative p-6 border rounded-xl transition-colors border-border`}>
              <Network className={`w-16 h-16 transition-colors text-signal`} />
            </div>
          </div>

          <div className="max-w-xl space-y-3">
            <span className={`text-[10px] uppercase font-mono font-black tracking-widest px-3 py-1 rounded-full border transition-colors ${
              "bg-signal-subtle border-border text-signal"
            }`}>
              CCNA LABS
            </span>
            <h2 className={`text-3xl font-medium font-display transition-colors text-signal`}>Packet Tracer: Diagnostic Route Ping Labs</h2>
            <p className={`text-sm leading-relaxed font-sans transition-colors text-muted`}>
              Test your configuration capacity on active network topologies. Solve routing failures, assign IP configurations, write real Cisco router terminal parameters, and establish successful ping packets inside isolated virtual subnets.
            </p>
          </div>

          {/* STEP-BY-STEP OVERVIEW: Easy to Understand */}
          <div className={`w-full border rounded-xl p-5 text-left space-y-4 transition-colors bg-surface border-border`}>
            <div className={`flex items-center gap-2 border-b pb-2 border-border`}>
              <HelpCircle className={`w-4 h-4 text-signal`} />
              <h3 className={`font-medium text-sm font-display text-signal`}>How to Run the Diagnostic Lab</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className={`font-mono text-xs font-black text-signal`}>01. SELECT</span>
                <p className={`text-[11px] leading-normal text-muted`}>
                  Click on any device node in the live network topology diagram to open its terminal console wrapper.
                </p>
              </div>
              <div className="space-y-1">
                <span className={`font-mono text-xs font-black text-success`}>02. IDENTIFY</span>
                <p className={`text-[11px] leading-normal text-muted`}>
                  Read the scenario objectives. Match subnets (e.g. 192.168.1.x) or search for missing static pathways.
                </p>
              </div>
              <div className="space-y-1">
                <span className={`font-mono text-xs font-black text-warning`}>03. RE-CONFIGURE</span>
                <p className={`text-[11px] leading-normal text-muted`}>
                  Fix IP settings in the desktop forms, or execute Router IOS CLI directives like <code className="text-emerald-600">no shutdown</code>.
                </p>
              </div>
              <div className="space-y-1">
                <span className={`font-mono text-xs font-black `}>04. ESTABLISH</span>
                <p className={`text-[11px] leading-normal text-muted`}>
                  Open Client PC CLI, type <code className="text-emerald-600 font-mono">ping [Server_IP]</code>, and establish connection green!
                </p>
              </div>
            </div>
          </div>

          {/* DIFFICULTY CONTAINER */}
          <div className={`w-full border rounded-xl p-6 text-left space-y-5 transition-colors border-border`}>
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3 border-border`}>
              <div>
                <h4 className={`font-medium text-sm font-display flex items-center gap-2 text-signal`}>
                  <Settings className={`w-4 h-4 text-signal`} />
                  Select Lab Difficulty Level
                </h4>
                <p className={`text-xs mt-0.5 text-signal`}>
                  Choose your training level or play all consecutively.
                </p>
              </div>
              <span className={`font-mono text-[10px] px-2.5 py-1 rounded-lg border font-medium uppercase self-start md:self-auto ${
                "bg-surface border-border text-signal"
              }`}>
                {selectedDifficulty === "all" ? "Campaign: All 3 Labs" : `Solo Lab: ${selectedDifficulty}`}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { 
                  id: "all", 
                  title: "Full Campaign", 
                  desc: "All three diagnostics sequentially", 
                  badge: "Seq Mode",
                  color: "",
                },
                { 
                  id: "Beginner", 
                  title: "Beginner", 
                  desc: "Lab 01: Host Subnet Mismatch", 
                  badge: "Static Check",
                  color: "bg-success-subtle border-success text-success",
                },
                { 
                  id: "Intermediate", 
                  title: "Intermediate", 
                  desc: "Lab 02: Missing Default Gateways", 
                  badge: "Cisco CLI",
                  color: "bg-warning-subtle border-warning text-warning",
                },
                { 
                  id: "Advanced", 
                  title: "Advanced", 
                  desc: "Lab 03: Subnet Clashes & Router Ports", 
                  badge: "Gate Clash",
                  color: "",
                }
              ].map((diff) => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id as any)}
                    className={`p-3.5 rounded-lg text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 relative border-l-[3px] ${
                      isSelected 
                        ? "border-l-signal bg-signal-subtle border-border" 
                        : "border-l-transparent bg-surface border-border hover:border-l-signal hover:bg-signal-subtle"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className={`w-4 h-4 fill-white text-signal`} />
                      </div>
                    )}
                    <div>
                      <span className={`text-[12px] font-black font-display block truncate text-signal`}>
                        {diff.title}
                      </span>
                      <span className={`text-[10px] leading-tight line-clamp-2 mt-1 text-muted`}>
                        {diff.desc}
                      </span>
                    </div>
                    <span className={`inline-block text-[9px] font-mono font-medium px-1.5 py-0.5 rounded self-start ${diff.color}`}>
                      {diff.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-3 w-full justify-center items-center">
              <button
                onClick={handleStartGame}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-mono text-xs font-medium uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg min-h-[44px] ${
                  ""
                }`}
              >
                <Play className="w-4 h-4 text-white animate-pulse" />
                Initialize Lab Bootlink
              </button>
              <button
                onClick={() => setScreen("reviewer")}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl border transition-all font-mono text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                  "bg-surface border-border text-muted hover:bg-surface-raised hover:text-signal"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Field Notes Review
              </button>
            </div>
          </div>
        </div>
      ) : screen === "reviewer" ? (
        <div className={`p-8 max-w-4xl mx-auto space-y-6 transition-colors ${"text-signal"}`}>
          <div className="space-y-2">
            <h2 className={`text-2xl font-medium font-display flex items-center gap-2 transition-colors text-signal`}>
              <BookOpen className={`w-6 h-6 text-signal`} />
              CCNA Diagnostic Quick Field Guide
            </h2>
            <p className={`text-sm leading-relaxed transition-colors text-muted`}>
              Review critical commands and variables before initializing the diagnostic lab.
            </p>
          </div>

          <div className={`space-y-4 border p-6 rounded-xl transition-colors bg-surface border-border`}>
            <div className="space-y-2">
              <h3 className={`font-medium text-sm transition-colors text-signal`}>1. Subnet Addressing Structure</h3>
              <p className={`text-xs leading-relaxed transition-colors text-muted`}>
                Computers on the same layer 2 Switch can only transmit with one another directly if they reside within the exact same Class IP subnet range. For prefix standard `/24` (Subnet mask `255.255.255.0`), the first three octets of the IP address must match perfectly (e.g., `192.168.1.5` and `192.168.1.11`).
              </p>
            </div>

            <div className={`space-y-2 pt-2 border-t transition-colors border-border`}>
              <h3 className={`font-medium text-sm transition-colors text-signal`}>2. Default Gateway Assignment</h3>
              <p className={`text-xs leading-relaxed transition-colors text-muted`}>
                To route packets to external/remote subnets, a local computer registers a Default Gateway. The Gateway address corresponds directly to the localized Router Interface address (usually configured on path IP `.1`). Without a defined Gateway, any outbound sub-traffic exits with a Routing timed-out fault.
              </p>
            </div>

            <div className={`space-y-2 pt-2 border-t transition-colors border-border`}>
              <h3 className={`font-medium text-sm font-mono transition-colors text-signal`}>3. Cisco Router CLI Command Cheat Sheet</h3>
              <ul className={`text-xs space-y-1.5 list-disc pl-5 transition-colors text-muted`}>
                <li><code className={"font-mono font-medium text-success"}>enable</code>: Escalate access level from normal guest user mode ({"Router>"}) to administrator Privileged Execution mode ({"Router#"}).</li>
                <li><code className={"font-mono font-medium text-success"}>configure terminal</code>: Enter configuration mode to write system directives ({"Router(config)#"}).</li>
                <li><code className={"font-mono font-medium text-success"}>interface gigabitEthernet 0/1</code>: Target a physical router portal interface to configure.</li>
                <li><code className={"font-mono font-medium text-success"}>no shutdown</code>: Bring Cisco router interfaces online to power the interface green!</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setScreen("lobby")}
            className={`px-6 py-2.5 rounded-xl border transition-all font-mono text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
              "bg-surface border-border text-muted hover:bg-surface-raised hover:text-signal"
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Got it, Back to Lobby
          </button>
        </div>
      ) : (
        // MAIN PLAYSCREEN INTERFACE
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 items-stretch overflow-y-auto lg:overflow-hidden min-h-0">
          
          {/* LEFT 5 COLUMNS: SCENARIO DETAILS & NETWORK TOPOLOGY DIAGRAM */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Scenario objective details */}
            <div className={`border p-5 rounded-xl relative overflow-hidden backdrop-blur-sm transition-colors ${
              "bg-surface border-border"
            }`}>
              <div className="absolute top-0 right-0 p-3">
                <span className={`text-[9px] font-medium uppercase font-mono px-2 py-0.5 rounded-full ${
                  activeScenario.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                  activeScenario.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                  "bg-pink-500/15 text-pink-500 border border-pink-500/20"
                }`}>
                  {activeScenario.difficulty}
                </span>
              </div>
              
              <div className="space-y-3">
                <h2 className={`text-md font-medium tracking-tight transition-colors text-signal`}>{activeScenario.title}</h2>
                <div className={`p-3 rounded-xl border transition-colors bg-surface-raised border-border`}>
                  <p className={`text-xs leading-relaxed font-sans font-medium transition-colors text-muted`}>
                    <span className={`font-medium font-mono uppercase block text-[9.5px] tracking-wider mb-1 transition-colors text-signal`}>TASK OBJECTIVE</span>
                    {activeScenario.objective}
                  </p>
                </div>
                
                {/* Hints dropdown logic */}
                <details className={`group border rounded-xl transition-colors bg-surface border-border`}>
                  <summary className={`flex items-center justify-between p-3 text-[11px] font-medium select-none cursor-pointer transition-colors text-muted hover:text-signal`}>
                    <span className="flex items-center gap-2"><HelpCircle className={`w-4 h-4 text-signal`} /> Hint: Need diagnostic checklist?</span>
                    <span className="transition duration-200 group-open:rotate-180">▼</span>
                  </summary>
                  <div className={`p-3 pt-0 border-t text-xs space-y-2 transition-colors bg-surface-raised border-border`}>
                    {activeScenario.clues.map((clue, index) => (
                      <p key={index} className={`leading-relaxed font-sans flex gap-2 transition-colors text-muted`}>
                        <span className={`font-mono font-medium transition-colors text-signal`}>{index + 1}.</span>
                        {clue}
                      </p>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            {/* Network Topology Visual Interface */}
            <div className={`flex-1 border rounded-xl p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm min-h-[300px] transition-colors ${
              "bg-surface border-border"
            }`}>
              <div className="absolute top-4 left-4">
                <span className={`font-mono text-[9px] font-medium uppercase tracking-wider block transition-colors text-muted`}>PACKET TRACER TOPOLOGY WORKSPACE</span>
              </div>

              {/* Topology SVG map links rendering */}
              <div className="relative flex-1 flex items-center justify-center p-4">
                
                {/* Simulated connection cables with links status LEDs */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-full h-full" style={{ minHeight: "180px" }}>
                    <defs>
                      <linearGradient id="cableGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={"indigo-600"} />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    
                    {/* Scenario 1 Cable Link */}
                    {activeScenario.id === 1 && (
                      <>
                        <line x1="25%" y1="50%" x2="50%" y2="50%" stroke="url(#cableGrad)" strokeWidth="3" strokeDasharray="4 2" />
                        <line x1="50%" y1="50%" x2="75%" y2="50%" stroke="url(#cableGrad)" strokeWidth="3" strokeDasharray="4 2" />
                        {/* Status LED circles */}
                        <circle cx="28%" cy="50%" r="4" fill="#22c55e" />
                        <circle cx="47%" cy="50%" r="4" fill="#22c55e" />
                        <circle cx="53%" cy="50%" r="4" fill="#22c55e" />
                        <circle cx="72%" cy="50%" r="4" fill="#22c55e" />
                      </>
                    )}

                    {/* Scenario 2 Cable Link */}
                    {activeScenario.id === 2 && (
                      <>
                        {/* PC-A to Router */}
                        <line x1="20%" y1="50%" x2="50%" y2="35%" stroke={"indigo-600"} strokeWidth="3" />
                        {/* Router to Web Server */}
                        <line 
                          x1="50%" y1="35%" x2="80%" y2="50%" 
                          stroke={activeScenario.devices.router.interfaces?.["g0/1"]?.status === "up" ? "#22c55e" : "#ef4444"} 
                          strokeWidth="3" 
                        />
                        {/* Status LEDs Link Light */}
                        <circle cx="24%" cy="48%" r="4" fill="#22c55e" />
                        <circle cx="47%" cy="38%" r="4" fill="#22c55e" />
                        
                        {/* Outbound Interface Route LED light */}
                        <circle 
                          cx="54%" cy="38%" r="4.5" 
                          fill={activeScenario.devices.router.interfaces?.["g0/1"]?.status === "up" ? "#22c55e" : "#ef4444"} 
                          className={activeScenario.devices.router.interfaces?.["g0/1"]?.status === "up" ? "" : "animate-ping"}
                        />
                        <circle cx="76%" cy="48%" r="4" fill="#22c55e" />
                      </>
                    )}

                    {/* Scenario 3 Cable Link */}
                    {activeScenario.id === 3 && (
                      <>
                        {/* PC-A to Router */}
                        <line x1="20%" y1="40%" x2="50%" y2="30%" stroke={"indigo-600"} strokeWidth="3" />
                        {/* Laptop-B to Router */}
                        <line x1="20%" y1="70%" x2="50%" y2="30%" stroke={"indigo-600"} strokeWidth="3" />
                        {/* Router to DMZ Server */}
                        <line x1="50%" y1="30%" x2="80%" y2="50%" stroke="#10b981" strokeWidth="3" />
                        
                        <circle cx="24%" cy="42%" r="4" fill="#22c55e" />
                        {/* Collision warning LED if IP duplicates gateway */}
                        <circle 
                          cx="24%" cy="68%" r="4.5" 
                          fill={activeScenario.devices.laptop.ip === "192.168.1.1" ? "#f59e0b" : "#22c55e"} 
                        />
                        <circle cx="47%" cy="32%" r="4" fill="#22c55e" />
                        <circle cx="53%" cy="32%" r="4" fill="#22c55e" />
                        <circle cx="76%" cy="48%" r="4" fill="#22c55e" />
                      </>
                    )}
                  </svg>
                </div>

                {/* Network Devices Flex mapping positioning */}
                <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                  {(Object.entries(activeScenario.devices) as [string, Device][]).map(([deviceId, dev]) => (
                    <motion.div
                      key={deviceId}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleSelectDevice(deviceId)}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-xl cursor-pointer w-24 text-center transition-all ${
                        selectedDeviceId === deviceId 
                          ? ("bg-surface border-signal") 
                          : ("bg-surface border-border hover:border-signal")
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl border transition-colors ${
                        selectedDeviceId === deviceId 
                          ? ("border-signal text-signal") 
                          : ("bg-surface-raised border-border text-muted")
                      }`}>
                        {getDeviceIcon(dev.type)}
                      </div>
                      <span className={`font-mono text-[10px] font-medium truncate w-full block transition-colors text-signal`}>
                        {dev.name}
                      </span>
                      <span className={`font-mono text-[9px] block truncate w-full transition-colors text-muted`}>
                        {dev.ip ? dev.ip : "Layer 2 Bridge"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tips panel inside map view */}
              <div className={`border p-3 rounded-xl flex items-start gap-2 text-[10px] leading-relaxed font-sans transition-colors ${
                "bg-surface-raised border-border text-muted"
              }`}>
                <span className={`p-1 rounded font-medium font-mono transition-colors bg-signal-subtle text-signal`}>i</span>
                <span>Click on a device above to configure its IP Parameters or type command logs on its Virtual command prompt.</span>
              </div>
            </div>

          </div>

          {/* RIGHT 7 COLUMNS: ACTIVE DEVICE CONFIG & CISCO ROUTER TERMINAL */}
          <div className={`lg:col-span-7 flex flex-col rounded-xl overflow-hidden relative border transition-colors ${
            "bg-surface border-border"
          }`}>
            
            {/* Tab console picker bar */}
            <div className={`border-b px-5 py-3 flex items-center justify-between gap-4 transition-colors ${
              "bg-surface-raised border-border"
            }`}>
              <div className="flex items-center gap-1.5">
                <div className={`p-1 rounded border transition-colors ${
                  "bg-surface border-border"
                }`}>
                  <Terminal className={`w-3.5 h-3.5 text-signal`} />
                </div>
                <h3 className={`font-display font-black text-xs transition-colors text-muted`}>
                  DEVICE CONSOLE: <span className={"font-medium text-signal"}>{activeDevice ? activeDevice.name : "None Selected"}</span>
                </h3>
              </div>

              <div className={`flex gap-1.5 p-0.5 border rounded-xl transition-colors ${
                "bg-surface border-border"
              }`}>
                <button
                  onClick={() => setConsoleTab("config")}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-medium font-mono transition uppercase ${
                    consoleTab === "config" 
                      ? ("font-black animate-fade-in") 
                      : ("bg-surface-raised text-muted hover:bg-surface-raised hover:text-signal")
                  }`}
                >
                  <Settings className="w-3 h-3 inline-block mr-1.5" />
                  Config Desk
                </button>
                <button
                  onClick={() => setConsoleTab("cli")}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-medium font-mono transition uppercase ${
                    consoleTab === "cli" 
                      ? ("font-black animate-fade-in") 
                      : ("bg-surface-raised text-muted hover:bg-surface-raised hover:text-signal")
                  }`}
                >
                  <Terminal className="w-3 h-3 inline-block mr-1.5" />
                  CLI Console
                </button>
              </div>
            </div>

            {/* TAB CONTENT PANES */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col">
              {consoleTab === "config" ? (
                // DEVICE IP CONFIGURATION PANEL
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className={`border-b pb-3 transition-colors border-border`}>
                      <h4 className={`text-xs font-black uppercase font-mono tracking-wider flex items-center gap-2 transition-colors text-ink`}>
                        <Settings className="w-4 h-4 text-cyan-500" /> Desktop IP Setting Variables
                      </h4>
                      <p className={`text-[11px] mt-1 font-sans transition-colors text-muted`}>
                        Assign standard local interfaces configuration attributes below. Click apply changes.
                      </p>
                    </div>

                    {activeDevice.type === "switch" ? (
                      <div className={`p-8 text-center rounded-xl border my-8 space-y-3 transition-colors ${
                        "bg-surface-raised border-border"
                      }`}>
                        <Network className="w-10 h-10 text-stone-400 mx-auto" />
                        <h5 className={`font-medium text-sm text-muted`}>Layer 2 Switch Device Profile</h5>
                        <p className={`text-xs leading-relaxed max-w-sm mx-auto `}>
                          This Catalyst switch works transparently on MAC addresses tables. VLANs tags are routed out interface trunks automatic links. No IP needed for direct bridge connections.
                        </p>
                      </div>
                    ) : activeDevice.type === "router" ? (
                      // ROUTER CONFIG INFO SCREEN
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeDevice.interfaces && (Object.entries(activeDevice.interfaces) as [string, { status: "up" | "down" | "shutdown"; ip: string; subnet: string }][]).map(([intName, intConfig]) => (
                            <div key={intName} className={`p-4 border rounded-xl space-y-3 transition-colors ${
                              "bg-surface-raised border-border"
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className={`font-mono text-[10.5px] font-medium text-signal`}>{intName.toUpperCase()}</span>
                                <span className={`text-[9px] font-medium font-mono px-2 py-0.5 rounded-full ${
                                  intConfig.status === "up" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-500 border border-red-500/20"
                                }`}>
                                  {intConfig.status === "up" ? "Port ACTIVE" : "Port SHUTDOWN"}
                                </span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-[11px]"><span className="text-slate-550 font-medium">Interface IP:</span> <span className={`font-mono font-medium text-muted`}>{intConfig.ip || "Not set"}</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-550 font-medium">Subnet Mask:</span> <span className={`font-mono text-muted`}>{intConfig.subnet || "Not set"}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className={`p-4 border rounded-xl text-xs space-y-2 transition-colors ${
                          "bg-signal-subtle border-border"
                        }`}>
                          <h5 className={`font-medium flex items-center gap-1.5 text-signal`}><Terminal className="w-3.5 h-3.5" /> Cisco IOS CLI required for Router config:</h5>
                          <p className={`leading-relaxed text-[11px] `}>
                            Access the **CLI Console** tab on the top-right button to configure Router system parameters, add subnet route definitions, and issue standard Cisco CLI configuration scripts.
                          </p>
                        </div>
                      </div>
                    ) : (
                      // END-HOSTS CONFIG (PC’s / LAPTOP / SERVER)
                      <div className="grid grid-cols-1 gap-5 max-w-md">
                        <div className="space-y-1.5">
                          <label className={`text-[10px] uppercase font-medium font-mono tracking-wider block `}>IPv4 IP Address Parameters</label>
                          <input
                            type="text"
                            value={activeDevice.ip || ""}
                            onChange={(e) => handleConfigChange("ip", e.target.value)}
                            placeholder="e.g. 192.168.1.10"
                            className={`w-full rounded-xl px-4 py-2.5 font-mono text-xs transition border outline-none focus:ring-1 ${
                              "placeholder-stone-400 focus:border-indigo-600 focus:ring-[indigo-600] bg-surface border-border text-ink"
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className={`text-[10px] uppercase font-medium font-mono tracking-wider block `}>Subnet Mask Octet Configuration</label>
                          <input
                            type="text"
                            value={activeDevice.subnet || ""}
                            onChange={(e) => handleConfigChange("subnet", e.target.value)}
                            placeholder="255.255.255.0"
                            className={`w-full rounded-xl px-4 py-2.5 font-mono text-xs transition border outline-none focus:ring-1 ${
                              "placeholder-stone-400 focus:border-indigo-600 focus:ring-[indigo-600] bg-surface border-border text-ink"
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className={`text-[10px] uppercase font-medium font-mono tracking-wider block `}>IPv4 Default Gateway Route</label>
                          <input
                            type="text"
                            value={activeDevice.gateway || ""}
                            onChange={(e) => handleConfigChange("gateway", e.target.value)}
                            placeholder="e.g. 192.168.1.1 (Required for cross-subnet path routing)"
                            className={`w-full rounded-xl px-4 py-2.5 font-mono text-xs transition border outline-none focus:ring-1 ${
                              "placeholder-stone-400 focus:border-indigo-600 focus:ring-[indigo-600] bg-surface border-border text-ink"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Diagnostic manual verify test shortcut */}
                  <div className={`border-t pt-5 mt-5 border-border`}>
                    <button
                      onClick={() => setConsoleTab("cli")}
                      className={`px-5 py-2.5 rounded-xl transition border font-mono text-xs font-medium flex items-center justify-center gap-2 cursor-pointer ${
                        "bg-surface border-border text-signal hover:bg-surface-raised"
                      }`}
                    >
                      <Terminal className="w-4 h-4" /> Open Command Shell to execute ping route tests
                    </button>
                  </div>
                </div>
              ) : (
                // REAL-TIME CISCO IOS TERMINAL INTERFACE
                <div className={`flex-1 flex flex-col p-4 rounded-xl relative border transition-colors ${
                  "border-border"
                }`}>
                  
                  {/* CLI historical trace screen buffer */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto mb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-indigo-950 pr-2 max-h-[340px]" style={{ minHeight: "260px" }}>
                    {cliHistory.map((item, index) => (
                      <div 
                        key={index} 
                        className={`text-xs font-mono leading-relaxed break-all ${
                          item.type === "input" ? "text-white font-medium" :
                          item.type === "error" ? "text-amber-400 font-medium animate-pulse" :
                          item.type === "system" ? "text-indigo-400 font-semibold italic" :
                          "text-stone-300"
                        }`}
                      >
                        {item.text}
                      </div>
                    ))}
                    <div ref={terminalBottomRef} />
                  </div>

                  {/* Terminal CLI prompt input line form */}
                  <form onSubmit={handleCommandSubmit} className={`flex items-center gap-2 pt-3 border-t bg-transparent border-border`}>
                    <span className="font-mono text-xs text-indigo-450 whitespace-nowrap font-medium select-none">
                      {cliPromptText()}
                    </span>
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder={activeDevice.type === "router" ? "Type Cisco CLI (e.g., 'enable', 'conf t', '?' )" : "Type desk shell (e.g., 'ipconfig', 'ping 10.0.0.10' )"}
                      className="flex-1 bg-transparent border-none text-white font-mono text-xs outline-none focus:ring-0 placeholder-stone-600 p-0"
                      autoFocus
                    />
                  </form>
                </div>
              )}
            </div>

            {/* Diagnostics checker results overlay card (AnimatePresence) */}
            <AnimatePresence>
              {lastCheckResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-0 inset-x-0 p-5 bg-stone-950/95 border-t border-emerald-500/30 backdrop-blur-md z-45 flex flex-col gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-white text-sm">System diagnostic successful!</h4>
                      <p className="text-xs text-stone-400 leading-relaxed font-sans">{lastCheckResult.msg}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    {activeScenarioIdx < scenarios.length - 1 ? (
                      <button
                        onClick={handleNextChallenge}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-stone-950 font-medium transition hover:scale-103 text-xs"
                      >
                        Advance to next routing scenario
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveScoresAndClose}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium transition hover:scale-103 text-xs flex items-center gap-2"
                      >
                        <Award className="w-4 h-4" /> Save score and certify lab complete
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      )}

      {/* 10 Minutes Session Timeout Modal overlay */}
      <AnimatePresence>
        {showTimeoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
              ""
            }`}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`p-8 rounded-xl shadow-2xl w-full max-w-md text-center space-y-6 border ${
                "bg-surface border-border text-ink"
              }`}
            >
              <div className="mx-auto w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className={`text-2xl font-medium font-display text-ink`}>10-Min Session Timeout</h2>
                <p className={`text-sm leading-relaxed text-muted`}>
                  Your diagnostic training window has expired. Don't worry, you can register whatever score you have earned up to this threshold!
                </p>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${
                "bg-surface-raised border-border"
              }`}>
                <span className="text-slate-550">Earned Score:</span>
                <span className={`font-medium `}>{score.toLocaleString()} pts</span>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => {
                    setShowTimeoutModal(false);
                    handleSaveScoresAndClose();
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-indigo-500 text-white font-medium transition hover:scale-[1.02] text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4" /> Save Score & Certify Completion
                </button>
                <button
                  onClick={() => {
                    setShowTimeoutModal(false);
                    setScreen("lobby");
                    setHasStarted(false);
                  }}
                  className={`px-6 py-2.5 rounded-xl border transition text-xs font-medium ${
                    "bg-surface border-border text-ink hover:bg-surface-raised"
                  }`}
                >
                  Restart without Saving
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
