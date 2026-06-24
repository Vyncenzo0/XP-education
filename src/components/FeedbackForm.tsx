import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, MessageSquare, Send, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FeedbackFormProps {
  uid: string;
  displayName: string;
  onClose: () => void;
}

export default function FeedbackForm({ uid, displayName, onClose }: FeedbackFormProps) {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [uiDesignRating, setUiDesignRating] = useState<number>(0);
  const [difficultyRating, setDifficultyRating] = useState<number>(0);
  const [educationalValue, setEducationalValue] = useState<number>(0);
  const [technicalIssues, setTechnicalIssues] = useState<string>('');
  const [generalComments, setGeneralComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (overallRating === 0) {
      setError("Please provide an overall rating.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'feedbacks'), {
        uid,
        displayName,
        overallRating,
        uiDesignRating,
        difficultyRating,
        educationalValue,
        technicalIssues,
        generalComments,
        timestamp: new Date().toISOString(),
        serverTime: serverTimestamp()
      });
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingStars = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) => (
    <div className="space-y-2">
      <label className="text-xs font-mono text-muted uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`transition-all duration-200 ${
              star <= value ? 'text-warning scale-110' : 'text-stone-700 hover:text-stone-500'
            }`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h3 className="text-xl font-display font-medium text-ink">Feedback Submitted!</h3>
        <p className="text-sm text-muted">
          Thank you for helping us improve IT-MASTERY. Your feedback is valuable for our capstone evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="relative p-6 max-w-lg w-full bg-surface border border-border rounded-xl shadow-2xl">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-muted hover:text-ink transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-display font-medium text-ink flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-signal" />
          Capstone Evaluation
        </h2>
        <p className="text-xs text-muted mt-1 font-sans">
          Please share your thoughts on the IT-MASTERY platform to help us refine our capstone project.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <RatingStars label="Overall Experience" value={overallRating} onChange={setOverallRating} />
          <RatingStars label="Visual Design & UI" value={uiDesignRating} onChange={setUiDesignRating} />
          <RatingStars label="Complexity Balance" value={difficultyRating} onChange={setDifficultyRating} />
          <RatingStars label="Educational Value" value={educationalValue} onChange={setEducationalValue} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-muted uppercase tracking-wider">Technical Issues / Bugs</label>
          <textarea
            value={technicalIssues}
            onChange={(e) => setTechnicalIssues(e.target.value)}
            placeholder="Did you encounter any technical glitches?"
            className="w-full h-24 p-3 bg-surface-raised border border-border rounded-lg text-sm focus:ring-1 focus:ring-signal focus:border-signal outline-none transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-muted uppercase tracking-wider">General Comments</label>
          <textarea
            value={generalComments}
            onChange={(e) => setGeneralComments(e.target.value)}
            placeholder="Any other suggestions or thoughts?"
            className="w-full h-24 p-3 bg-surface-raised border border-border rounded-lg text-sm focus:ring-1 focus:ring-signal focus:border-signal outline-none transition-all resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-lg font-display font-medium uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
            isSubmitting 
              ? 'bg-stone-800 text-stone-500 cursor-not-allowed' 
              : 'bg-signal text-white hover:bg-signal-hover shadow-lg shadow-signal/20'
          }`}
        >
          {isSubmitting ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            </motion.div>
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isSubmitting ? 'Transmitting...' : 'Submit Evaluation'}
        </button>
      </form>
    </div>
  );
}
