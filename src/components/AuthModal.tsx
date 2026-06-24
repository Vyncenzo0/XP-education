import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { Lock, Mail, RefreshCw, AlertCircle, GraduationCap, Building } from "lucide-react";
import { auth, db, isInitialized } from "../lib/firebase";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { useTheme } from "../context/ThemeContext";

interface AuthModalProps {
  onSuccess: (uid: string, displayName: string) => void;
  onBackToHome?: () => void;
}

export default function AuthModal({ onSuccess, onBackToHome }: AuthModalProps) {
  const { theme } = useTheme();
  const [view, setView] = useState<"login" | "forgotPassword">("login");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignUp) {
      if (!email.trim()) {
        setError("Email is required.");
        setLoading(false);
        return;
      }
      if (!password) {
        setError("Password is required.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      // Proceed with registration
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: "" });

        // Initialize Firestore profile
        if (isInitialized) {
          try {
            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: "",
              studentId: "",
              highScore: 0,
              gamesPlayed: 0,
              avgReactionTime: 0,
              badges: [],
              createdAt: new Date().toISOString()
            });
          } catch (dbErr) {
            console.warn("Firestore profile initialization skipped:", dbErr);
          }
        }

        onSuccess(user.uid, user.displayName || "");
      } catch (err: any) {
        console.error("Auth registration error:", err);
        if (err.code === "auth/email-already-in-use") {
          setError("User already exists. Please sign in");
        } else {
          setError("Connection failed. Check your internet and try again.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Login flow
      if (!email.trim()) {
        setError("Email is required.");
        setLoading(false);
        return;
      }
      if (!password) {
        setError("Password is required.");
        setLoading(false);
        return;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        onSuccess(user.uid, user.displayName || "");
      } catch (err: any) {
        console.error("Auth login error:", err);
        setError("Email or password is incorrect");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div id="auth-container" className="flex items-center justify-center min-h-[500px]">
      <motion.div
        id="auth-card"
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md border rounded-[6px] shadow-xl p-8 relative overflow-hidden transition-all duration-300 bg-surface border-border text-ink"
      >
        <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full blur-3xl pointer-events-none bg-indigo-500/5" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full blur-3xl pointer-events-none bg-indigo-500/5" />

        {onBackToHome && (
          <button
            onClick={onBackToHome}
            id="btn-back-to-home"
            className="absolute top-4 left-4 flex items-center gap-1.5 text-[11px] font-mono font-medium uppercase tracking-wider transition-colors cursor-pointer z-10 py-1 px-2.5 rounded-[3px] bg-surface-raised border border-border text-ink hover:text-signal hover:border-signal"
          >
            ← Home
          </button>
        )}

        <div id="auth-header" className="text-center mb-8 relative">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-[6px] flex items-center justify-center shadow-md transform rotate-6 duration-350">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-mono font-semibold tracking-[-0.01em] mt-4 text-ink">
            IT-MASTERY
          </h1>
          <p className="text-[10px] text-muted max-w-[220px] mx-auto mt-1 leading-tight font-sans">
            Gamification Platform for Foundational IT Concepts
          </p>
          <p className="text-muted text-xs mt-3 font-sans border-t border-border pt-3">
            {isSignUp ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        {view === "forgotPassword" ? (
          <ForgotPasswordForm onBackToLogin={() => setView("login")} />
        ) : (
          <>
            <form id="auth-email-form" onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted block">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-450" />
                  <input
                    id="auth-gmail"
                    type="email"
                    required
                    placeholder="yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-[3px] py-2.5 pl-10 pr-4 text-sm font-sans focus:outline-none focus:border-signal transition duration-200 border placeholder-stone-400 bg-surface-raised border-border text-ink"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted block">PASSWORD</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setView("forgotPassword")}
                      className="text-xs font-sans text-signal hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-450" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    placeholder={isSignUp ? "Create a password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-[3px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-signal transition duration-200 border placeholder-stone-400 bg-surface-raised border-border text-ink font-sans"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted block">CONFIRM PASSWORD</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-450" />
                    <input
                      id="auth-confirm-password"
                      type="password"
                      required
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-[3px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-signal transition duration-200 border placeholder-stone-400 bg-surface-raised border-border text-ink font-sans"
                    />
                  </div>
                </div>
              )}

              <button
                id="submit-auth-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-signal hover:bg-signal-hover text-white font-mono font-medium text-sm rounded-[3px] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer uppercase"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : isSignUp ? (
                  "CREATE ACCOUNT"
                ) : (
                  "SIGN IN"
                )}
              </button>

              {error && (
                <div
                  id="auth-error-inline"
                  className="text-xs font-sans text-danger text-center mt-2 flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2 text-center text-xs">
                <button
                  id="toggle-auth-mode"
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                  }}
                  className="transition duration-150 text-[13px] font-sans text-muted hover:text-signal cursor-pointer"
                >
                  {isSignUp ? (
                    <>
                      Already have an account? <span className="text-signal font-medium">Sign in</span>
                    </>
                  ) : (
                    <>
                      Don't have an account? <span className="text-signal font-medium">Register</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
