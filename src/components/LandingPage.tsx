import { motion } from "motion/react";
import { Sparkles, Timer, LineChart, Users, Brain, BookOpen, ArrowRight, Gamepad2, Award, Cpu, Layers, Keyboard, Cable, Binary, Wrench, Network, Sun, Moon, Server, GraduationCap } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface LandingPageProps {
  onEnterPortal: () => void;
}

export default function LandingPage({ onEnterPortal }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();

  const handleScrollToFeatures = () => {
    const el = document.getElementById("features-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const LAB_MODULES = [
    {
      id: "pcbuilder",
      number: "01",
      title: "PC Build",
      desc: "Determine compatible motherboard sockets, size PSU power limits, and design production specs.",
      icon: <Cpu className="w-5 h-5" />,
      color: "cyan",
      theme: {
        icon: "bg-cyan-100/80 dark:bg-cyan-900/40 border-cyan-200 dark:border-cyan-800/60 text-cyan-600 dark:text-cyan-400",
        hover: "hover:border-cyan-400 dark:hover:border-cyan-700 hover:bg-cyan-100/30 dark:hover:bg-cyan-950/30"
      }
    },
    {
      id: "rj45",
      number: "02",
      title: "Cat6 Wiring",
      desc: "Sequence colored copper lines left-to-right to match T568A and T568B specifications.",
      icon: <Layers className="w-5 h-5" />,
      color: "amber",
      theme: {
        icon: "bg-amber-100/80 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400",
        hover: "hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-100/30 dark:hover:bg-amber-950/30"
      }
    },
    {
      id: "typing",
      number: "03",
      title: "Terminal Speed",
      desc: "Build typing speed and command-line accuracy using authentic commands and terminal syntax.",
      icon: <Keyboard className="w-5 h-5" />,
      color: "emerald",
      theme: {
        icon: "bg-emerald-100/80 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400",
        hover: "hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-100/30 dark:hover:bg-emerald-950/30"
      }
    },
    {
      id: "patch",
      number: "04",
      title: "Patch Panel",
      desc: "Organize server link cabling and configure logical VLAN ports on professional server rack setups.",
      icon: <Cable className="w-5 h-5" />,
      color: "indigo",
      theme: {
        icon: "bg-indigo-100/80 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400",
        hover: "hover:border-indigo-400 dark:hover:border-indigo-700 hover:bg-indigo-100/30 dark:hover:bg-indigo-950/30"
      }
    },
    {
      id: "partsid",
      number: "05",
      title: "Parts ID",
      desc: "Inspect motherboard connectors, memory lanes, expansion bus keyways under close magnifiers.",
      icon: <Binary className="w-5 h-5" />,
      color: "orange",
      theme: {
        icon: "bg-orange-100/80 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400",
        hover: "hover:border-orange-400 dark:hover:border-orange-700 hover:bg-orange-100/30 dark:hover:bg-orange-950/30"
      }
    },
    {
      id: "techsupport",
      number: "06",
      title: "Tech Support",
      desc: "Resolve hardware support incidents, deploy driver files, restore memory vaults, and trace faults.",
      icon: <Wrench className="w-5 h-5" />,
      color: "rose",
      theme: {
        icon: "bg-rose-100/80 dark:bg-rose-900/40 border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400",
        hover: "hover:border-rose-400 dark:hover:border-rose-700 hover:bg-rose-100/30 dark:hover:bg-rose-950/30"
      }
    },
    {
      id: "pingtest",
      number: "07",
      title: "Cisco Ping",
      desc: "Configure gateways, subnets, and type Cisco IOS CLI commands to troubleshoot route paths.",
      icon: <Network className="w-5 h-5" />,
      color: "sky",
      theme: {
        icon: "bg-sky-100/80 dark:bg-sky-900/40 border-sky-200 dark:border-sky-850/60 text-sky-600 dark:text-sky-400",
        hover: "hover:border-sky-400 dark:hover:border-sky-700 hover:bg-sky-100/30 dark:hover:bg-sky-950/30"
      }
    }
  ];

  return (
    <div className={`min-h-screen bg-surface-raised text-ink flex flex-col relative overflow-hidden`}>
      {/* Decorative Background Elements */}
      <div className={`absolute top-0 left-1/4 w-96 h-96  rounded-full blur-3xl pointer-events-none`} />
      <div className={`absolute bottom-0 right-1/4 w-96 h-96  rounded-full blur-3xl pointer-events-none`} />
      <div className={`absolute top-1/3 right-10 w-48 h-48  rounded-full blur-3xl pointer-events-none`} />

      {/* Navigation Header */}
      <header className={`w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-border z-10`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md transform rotate-3">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-sans font-semibold tracking-tight text-signal flex items-center gap-1`}>
              IT-MASTERY
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Switcher Toggle Button */}
          <button
            onClick={toggleTheme}
            id="btn-landing-theme"
            className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-200 h-10 w-10 cursor-pointer ${
              "bg-surface border-border text-signal hover:bg-surface-raised"
            }`}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={onEnterPortal}
            id="btn-nav-portal"
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-medium tracking-wider uppercase transition-all cursor-pointer min-h-[40px] min-w-[110px] flex items-center justify-center shadow-sm border ${
              "bg-surface border-border text-signal hover:bg-surface-raised hover:border-signal"
            }`}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col justify-center z-10">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
              "border-border text-signal"
            } text-[10px] font-mono tracking-wider uppercase border`}>
              <Sparkles className={`w-3 h-3 text-signal`} /> 
              Interactive Hardware & Routing Labs
            </div>

            <h2 className={`text-4xl md:text-5xl lg:text-5.5xl font-medium tracking-tight text-signal font-sans leading-tight`}>
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600">Networking & Hardware</span> with Hands-On Labs
            </h2>

            <p className={`text-muted text-sm md:text-base max-w-xl leading-relaxed`}>
              IT-MASTERY is a Web-Based Interactive Gamification Platform for Enhancing Student Engagement in Foundational IT Concepts. Practice motherboard hardware assembly, RJ45 continuity crimping, Cisco IOS terminal diagnostics, and patch-frame cable routing inside dynamic sandboxed exercises.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={onEnterPortal}
                id="btn-hero-launch"
                className="group relative px-8 py-4 rounded-xl text-xs font-medium tracking-wider uppercase bg-indigo-600 hover:bg-[#001175] text-white shadow-lg shadow-indigo-600/20 transition-all font-mono min-h-[48px] flex items-center justify-center gap-2 cursor-pointer"
              >
                Access Lab Portal
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleScrollToFeatures}
                id="btn-hero-learn"
                className={`px-6 py-4 rounded-xl text-xs font-medium tracking-wider uppercase font-mono transition-all min-h-[48px] flex items-center justify-center gap-2 cursor-pointer border ${
                  "bg-surface border-border text-ink hover:bg-surface-raised hover:text-signal hover:border-signal"
                }`}
              >
                <BookOpen className="w-4 h-4 text-stone-500" />
                Browse Exercises
              </button>
            </div>

            <div className={`grid grid-cols-3 gap-6 pt-8 border-t border-border max-w-md`}>
              <div>
                <span className={`block text-2xl font-medium font-mono `}>7</span>
                <span className={`text-[10px] uppercase font-mono tracking-wider text-muted`}>Practice Labs</span>
              </div>
              <div>
                <span className={`block text-2xl font-medium font-mono `}>100%</span>
                <span className={`text-[10px] uppercase font-mono tracking-wider text-muted`}>Hands-on</span>
              </div>
              <div>
                <span className={`block text-2xl font-medium font-mono `}>Active</span>
                <span className={`text-[10px] uppercase font-mono tracking-wider text-muted`}>Leaderboard</span>
              </div>
            </div>
          </div>

          {/* Eye-catching Visual Mockup/Hero Graphic */}
          <div className="lg:col-span-5 relative flex items-center justify-center px-4 lg:px-0">
            <div className={`absolute inset-0 bg-gradient-to-tr  rounded-full blur-3xl opacity-50 pointer-events-none`} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="w-full max-w-md p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-default group/blueprint lab-dark-panel border-indigo-900/40 text-stone-100 shadow-2xl shadow-blue-950/40 border-glow-blue"
            >
              {/* Schematic Aesthetic - Blueprint nodes */}
              <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 0 50 L 50 50 L 50 100" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-blue-500" />
                  <path d="M 50 0 L 50 50 L 100 50" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-red-500" />
                  <circle cx="50" cy="50" r="2" className="fill-white" />
                </svg>
              </div>

              <div className="relative flex items-center justify-between border-b pb-4 mb-5 border-stone-800">
                <span className="text-[11px] font-mono font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-widest">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  IT-MASTERY
                </span>
                <span className="text-[10px] font-mono text-stone-500">SCH-01</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40">
                  <Cpu className="w-8 h-8 text-cyan-400 mb-2" />
                  <span className="text-[10px] font-medium text-stone-300 uppercase">CPU Core</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-red-950/20 border border-red-900/40">
                  <Server className="w-8 h-8 text-red-400 mb-2" />
                  <span className="text-[10px] font-medium text-stone-300 uppercase">Server Rack</span>
                </div>
              </div>

              <div className="mt-5 text-center px-2">
                <p className="text-[11px] leading-relaxed text-stone-400">
                  Interactive schematic environment. Validate your hardware knowledge and network connectivity in real-time.
                </p>
              </div>

              <div className="mt-5 py-3 border-t border-stone-800 text-center">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Simulation Status</span>
                <div className="text-xs font-medium text-emerald-400">
                  Blueprint Calibrated & Ready
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section id="features-section" className="pt-24 md:pt-36 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h3 className={`text-xs font-mono font-medium  uppercase tracking-widest text-signal`}>
              Thematic Curriculum
            </h3>
            <h4 className={`text-2xl md:text-3xl font-medium tracking-tight text-ink font-display`}>
              Master Foundational IT Concepts Through Play
            </h4>
            <p className={`text-xs md:text-sm text-muted leading-relaxed`}>
              Our interactive laboratories are designed to enhance student engagement using real-world hardware pinouts and diagnostic simulations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {LAB_MODULES.map((module) => (
              <div 
                key={module.id}
                className={`p-5 rounded-xl transition-all space-y-3 group border bg-surface border-border ${module.theme.hover}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${module.theme.icon}`}>
                  {module.icon}
                </div>
                <h5 className={`text-sm font-medium tracking-tight transition-colors text-ink`}>
                  {module.number}. {module.title}
                </h5>
                <p className={`text-[11px] leading-relaxed transition-colors text-muted`}>
                  {module.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Aesthetic Site Footer */}
      <footer className={`w-full border-t py-6 mt-12 transition-all bg-surface border-border`}>
        <div className={`max-w-7xl mx-auto px-6 text-center text-[10px] font-mono text-muted`}>
          <span>© 2026 IT-MASTERY · ICCT Colleges Foundation Inc. · v1.4</span>
        </div>
      </footer>
    </div>
  );
}
