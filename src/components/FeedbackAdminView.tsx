import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Clock, User, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Feedback {
  id: string;
  uid: string;
  displayName: string;
  overallRating: number;
  uiDesignRating: number;
  difficultyRating: number;
  educationalValue: number;
  technicalIssues: string;
  generalComments: string;
  timestamp: string;
  serverTime?: any;
}

export default function FeedbackAdminView() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'feedbacks'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
      setFeedbacks(data);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      setError("Failed to load feedbacks. You may not have permission.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const RatingBadge = ({ label, value }: { label: string, value: number }) => (
    <div className="flex flex-col items-center p-2 bg-surface-raised rounded-lg border border-border/50">
      <span className="text-[10px] text-muted uppercase font-mono mb-1">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-ink">{value}</span>
        <Star className={`w-3 h-3 ${value >= 4 ? 'text-warning fill-current' : 'text-stone-600'}`} />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-medium text-ink flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            Feedback Dashboard
          </h2>
          <p className="text-xs text-muted font-mono uppercase tracking-widest mt-1">
            Project Capstone Evaluation Logs
          </p>
        </div>
        <button 
          onClick={fetchFeedbacks}
          disabled={isLoading}
          className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-ink transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {isLoading && feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-50">
            <RefreshCw className="w-8 h-8 animate-spin text-muted" />
            <span className="text-xs font-mono uppercase tracking-widest">Scanning Uplink...</span>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-surface/50">
            <MessageSquare className="w-12 h-12 text-stone-700 mx-auto mb-4" />
            <p className="text-muted text-sm font-display">No evaluation data retrieved yet.</p>
          </div>
        ) : (
          feedbacks.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div 
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <User className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-ink">{item.displayName}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] font-mono text-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-2.5 h-2.5 ${s <= item.overallRating ? 'text-warning fill-current' : 'text-stone-800'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-muted">
                  {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-surface-raised/30"
                  >
                    <div className="p-5 space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <RatingBadge label="Overall" value={item.overallRating} />
                        <RatingBadge label="UI/UX" value={item.uiDesignRating} />
                        <RatingBadge label="Difficulty" value={item.difficultyRating} />
                        <RatingBadge label="Education" value={item.educationalValue} />
                      </div>

                      <div className="space-y-4">
                        {item.technicalIssues && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono text-danger uppercase tracking-widest flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Technical Issues
                            </span>
                            <p className="text-xs text-muted leading-relaxed p-3 bg-danger/5 border border-danger/10 rounded-lg">
                              {item.technicalIssues}
                            </p>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            General Comments
                          </span>
                          <p className="text-xs text-muted leading-relaxed p-3 bg-surface border border-border rounded-lg italic">
                            "{item.generalComments || 'No comments provided.'}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
