import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { motion } from "motion/react";
import { Mail, ArrowLeft, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { auth } from "../lib/firebase";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [gmailVal, setGmailVal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const typedGmail = gmailVal.trim().toLowerCase();
    
    if (!typedGmail) {
      setError("Gmail address is required.");
      return;
    }
    
    const gmailRegex = /^[^@]+@gmail\.com$/;
    if (!gmailRegex.test(typedGmail)) {
      setError("Only @gmail.com addresses are accepted.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, typedGmail);
      setSuccess(true);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found for that Gmail address.");
      } else {
        setError(err.message || "Failed to send reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl font-mono font-semibold tracking-[-0.01em] text-ink">Reset Password</h2>
        <p className="text-sm font-sans text-stone-500">
          Enter your registered Gmail address to receive a secure password reset link.
        </p>
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[4px] p-4 flex flex-col items-center gap-3 text-center border bg-success-subtle border-success text-success"
        >
          <CheckCircle className="w-10 h-10 text-success" />
          <p className="text-sm font-sans">Password reset link sent successfully! Please check your Gmail inbox.</p>
          <button
            onClick={onBackToLogin}
            className="text-sm font-mono font-semibold text-signal hover:underline mt-2"
          >
            Back to Log In
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          {error && (
            <div className="rounded-[4px] p-3 flex items-start gap-2.5 text-xs border bg-danger-subtle border-danger text-danger font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted block">GMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={gmailVal}
                onChange={(e) => setGmailVal(e.target.value)}
                className="w-full rounded-[3px] py-2.5 pl-10 pr-4 text-sm font-sans focus:outline-none focus:border-signal transition duration-200 border placeholder-stone-400 bg-surface-raised border-border text-ink"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-signal hover:bg-signal-hover text-white font-mono font-medium text-sm rounded-[3px] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              "SEND RESET LINK"
            )}
          </button>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full text-center text-xs flex items-center justify-center gap-1.5 transition-colors text-muted hover:text-signal cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Log In
          </button>
        </form>
      )}
    </motion.div>
  );
}
