# IT-MASTERY: Interactive IT & Networking Simulation Lab

IT-MASTERY is a highly polished, interactive full-stack learning platform designed to help students and IT enthusiasts master hardware configuration, structured cabling, CLI operations, and systems troubleshooting. Through dynamic hands-on simulation modules (labs), users build real-world skills in a gamified environment.

---

## 🚀 Lab Modules & Simulations

IT-MASTERY features 7 realistic mini-game simulators:

1. **PC Build (Module 01)**: Learn compatibility matching of motherboard sockets, compute safe PSU power levels, and design production PC build specifications.
2. **Cat6 Wiring (Module 02)**: Arrange colored copper wires left-to-right to build standard straight-through or crossover cables in T568A and T568B sequence standards.
3. **Terminal Speed (Module 03)**: Practice keyboard command fluency and system command execution using standard Linux/Unix syntax and real commands.
4. **Patch Panel (Module 04)**: Manage server rack links, connect drop lines, and map custom VLAN layouts across logical server ports.
5. **Parts ID (Module 05)**: Zoom into Motherboards to identify chipsets, PCIe slots, VRM modules, capacitors, RAM banks, and rear I/O connectors.
6. **Tech Support (Module 06)**: Diagnose simulation tickets, analyze hardware logs, load driver files, reset physical interfaces, and trace system faults.
7. **Cisco Ping (Module 07)**: Interact with an authentic Cisco IOS emulator to configure gateway IP parameters, address subnet targets, and run traceroute checks.

---

## 🛠️ System Architecture & Features

- **Persistent Cloud Database**: Integrates directly with Google Firestore for real-time leaderboards, scoreboards, and persistent account profiles.
- **Dynamic Live Presence**: Displays active online users inside the simulator utilizing real-time presence hooks.
- **Global Leaderboard**: Tracks top student timings, accuracy, and overall scoreboards across labs.
- **Badge System**: Dynamically awards SVG badges to profiles for achieving specific speed, accuracy, and troubleshooting goals.
- **Secure Authentication**: Built with Firebase Authentication supporting email verification, password recovery, and secure session management.
- **Bespoke UI styling**: Fully responsive design supporting native **Light & Dark Mode** via custom Tailwind styling.

---

## 📈 Patch Notes & Version History

### **v1.1.0 - Production Launch Preparation** (Current Version)
* **Performance Enhancements**: Cleaned up stale reskin scripts and unused build logs (`reskin.cjs`, `fix-reskin*.cjs`, `output.txt`) to minimize package bundle weight.
* **Firebase Resiliency**: Refactored `firebase.ts` to support fallback default Firestore databases dynamically if custom configured firestore IDs are unassigned, preventing database load crashes during external deployments.
* **UI Calibration**: Polished layout margins, verified all SVGs from `lucide-react`, and ensured stable theme context propagation.
* **Validation**: Codebase successfully linted and built with zero errors, ready for official public deployment.

### **v1.0.5 - Cisco CLI & Multiplay Update**
* **New Cisco Simulator**: Introduced the interactive Cisco IOS console emulator with active terminal outputs.
* **Presence Engine**: Deployed live presence sync across current lab channels.
* **Badge Service**: Added a dynamic SVG reward mechanism directly tracking user scores.

### **v1.0.0 - Core Engine Release**
* **Core Launch**: Rolled out the first 6 simulation modules (PC Build, RJ45 Wiring, Terminal Speed, Patch Panel, Parts Identification, Tech Support).
* **Database Hooks**: Established core Firestore schemas and verified security rules.

---

## 📦 How to Run Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

3. **Verify Linter & Production Build**:
   ```bash
   npm run lint
   ```
   ```bash
   npm run build
   ```
