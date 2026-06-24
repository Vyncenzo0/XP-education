import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Mail, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

interface VerifyPendingScreenProps {
  email: string;
  tempPassword?: string;
  onBackToLogin: () => void;
}

export default function VerifyPendingScreen({ email, tempPassword = "", onBackToLogin }: VerifyPendingScreenProps) {
  const [cooldown, setCooldown] = useState<number>(0);
  const [resendCount, setResendCount] = useState<number>(0);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0) return;

    if (resendCount >= 5) {
      setError("Too many attempts. Please wait 10 minutes before requesting another email.");
      return;
    }

    const effectivePassword = tempPassword || passwordInput;
    if (!effectivePassword) {
      setError("Password is required to resend the verification email.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, effectivePassword);
      console.log("RESENDING: Attempting to resend verification email for:", userCredential.user.email);
      await sendEmailVerification(userCredential.user);
      console.log("SUCCESS: Email verification resent for:", userCredential.user.email);
      await signOut(auth);

      setSuccess("Verification email resent.");
      setCooldown(60);
      setResendCount(prev => prev + 1);
      setPasswordInput(""); // clear it
    } catch (err: any) {
      console.error("Resend verification error:", err);
      setError("Could not resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="verify-pending-container" className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-md mx-auto p-4">
      {/* Platform Title */}
      <h1 className="text-[20px] font-mono font-semibold tracking-[-0.01em] text-ink uppercase text-center mb-6">
        IT-MASTERY
      </h1>

      {/* Verification Card */}
      <div 
        id="verify-pending-card" 
        className="w-full border rounded-[6px] p-8 shadow-xl bg-surface border-border text-ink text-left select-none relative"
      >
        <h2 className="text-[16px] font-mono font-medium tracking-tight text-ink uppercase mb-2">
          CHECK YOUR GMAIL
        </h2>

        <p className="text-[14px] font-sans text-muted leading-relaxed mb-4">
          We sent a verification link to:<br />
          <strong className="text-ink font-mono select-all break-all">{email || "student@gmail.com"}</strong>
        </p>

        <p className="text-[14px] font-sans text-ink leading-relaxed mb-6">
          Click the link in your Gmail to activate your IT-MASTERY account.
        </p>

        {/* Conditional password entry if we don't have password cached (e.g. reload or session start) */}
        {!tempPassword && cooldown <= 0 && resendCount < 5 && (
          <form onSubmit={handleResend} className="space-y-2 mb-6 p-3 bg-surface-raised border border-border rounded-[4px]">
            <label className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted block">
              ENTER PASSWORD TO RESEND EMAIL
            </label>
            <input
              type="password"
              required
              placeholder="Your account password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full rounded-[3px] py-1.5 px-3 text-xs font-sans border bg-surface border-border text-ink focus:outline-none focus:border-signal"
            />
          </form>
        )}

        {/* Buttons List */}
        <div id="verify-actions" className="space-y-3">
          {cooldown > 0 ? (
            <p className="text-xs font-mono text-muted py-2 text-center bg-surface-raised border border-border rounded-[3px]">
              Resend available in {cooldown}s
            </p>
          ) : resendCount >= 5 ? (
            <p className="text-xs font-sans text-danger text-center bg-danger-subtle p-3 border border-danger/30 rounded-[3px] leading-tight font-medium">
              Too many attempts. Please wait 10 minutes before requesting another email.
            </p>
          ) : (
            <button
              type="button"
              disabled={loading || (!tempPassword && !passwordInput)}
              onClick={() => handleResend()}
              className="w-full py-2 bg-transparent border-[1.5px] border-ink text-ink hover:bg-signal-subtle font-mono font-medium text-xs rounded-[3px] tracking-wider transition-colors uppercase cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> RESENDING...
                </span>
              ) : "RESEND VERIFICATION EMAIL"}
            </button>
          )}

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2 bg-transparent border-[1.5px] border-ink text-ink hover:bg-signal-subtle font-mono font-medium text-xs rounded-[3px] tracking-wider transition-colors uppercase cursor-pointer"
          >
            BACK TO SIGN IN
          </button>
        </div>

        {/* FEEDBACK STATUSES */}
        {success && (
          <div className="text-xs font-sans text-success font-medium mt-4 flex items-center gap-1.5 justify-center">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="text-xs font-sans text-danger font-medium mt-4 flex items-center gap-1.5 justify-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border-t border-border mt-6 pt-4">
          <p className="text-[12px] font-sans italic text-muted leading-tight">
            Didn't receive it? Check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}
