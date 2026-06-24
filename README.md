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

### **v1.4.0 - IT-Mastery Profile Completion & Student ID Validation** (Current Version)
* **Interactive Profile Completion Modal**: Introduced a beautifully crafted, dark-themed profile completion flow that prompts users to enter their custom display name, campus selection, and verified student ID.
* **Campus-Specific Prefixes**: Replaced generic Philippine campuses with the local student ID prefixes (**Cainta (CA)**, **Taytay (TA)**, **Antipolo (AN)**, **Sumulong (SU)**, **San Mateo (SM)**, **Binangonan (BI)**, and **Cogeo (CO)**). The student ID form dynamically renders the correct prefix alongside a 9-digit numeric input.
* **Transaction-safe ID Claims**: Leveraged a multi-document secure Firestore Transaction to guarantee student ID uniqueness. It validates that a student ID is unclaimed before writing the document claim and updating the user profile.
* **User Experience & Later Bypass**: Added an elegant "Update Later" dismissal action to prevent hard blocks on initial dashboard visits, while displaying real-time frontend validation warnings (e.g. name length limits, numeric digit constraints) and a clean loading spinner during submissions.

### **v1.3.0 - Typing Test Redesign & Leaderboard Optimization**
* **MonkeyType Typing Experience**: Completely redesigned the layout mechanics of the Terminal Precision Typing Test. Contained the text sequences within a centered, constrained-width container (850px max) utilizing a clean, highly readable monospace font with elegant line-heights and smooth vertical text container scrolling.
* **Typing Focus Layer**: Integrated a sophisticated focus overlay that blurs out the terminal when the user clicks away or loses input focus. Clear keyboard mappings (like **TAB** to quickly restart, and **ESC** to release focus) ensure zero distraction.
* **Expanded Leaderboard Filters**: Updated the Rankings component to dynamically filter records based on the newly introduced typing test modes. Added dropdown supports for all 4 difficulties (**Easy**, **Medium**, **Hard**, and **Elite**) and 3 duration configurations (**15s**, **30s**, **60s**).
* **Presence List Simplification**: Removed individual user scores from the real-time engagement roster to keep focus purely on peer activity and clean up layout space.

### **v1.2.0 - Educational Branding & UI Optimization**
* **Branding Alignment**: Swapped out generic network indicators and target icons across the app with an elegant **GraduationCap** (`GraduationCap`) logo to reflect the platform's core educational mission of training, reviewing, and mastering IT & Networking concepts.
* **SVG Favicon Integration**: Integrated a high-fidelity, inline dynamic graduation-themed SVG icon inside `index.html` to serve as a custom browser favicon matching the refreshed visual identity.
* **Presence List Simplification**: Removed the redundant "You" (Self) card from the active presence roster. Since each user is already signed into their single local account, displaying self-status alongside other active lab peers was cluttering the lobby panel.
* **Compilation & Linting**: Fully validated and built the production-ready code with zero errors.

### **v1.1.0 - Production Launch Preparation**
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
