import React, { useEffect, useState } from "react";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";

/**
 * RecentPaymentCard
 * 
 * Displays the most recent transaction with smooth animations.
 * Updates when new transactions arrive via props.
 * 
 * Features:
 * - Morphism-style UI with frosted glass effect
 * - Fade-in animation on new transaction
 * - Shows name, amount, type, time, and VPA
 * - Displays "Waiting for new transactions..." when empty
 */
const RecentPaymentCard = ({ latestTransaction, theme = "light" }) => {
  const [displayTransaction, setDisplayTransaction] = useState(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (latestTransaction) {
      // Trigger animation on new transaction
      setIsNew(true);
      setDisplayTransaction(latestTransaction);
      
      // Reset animation flag after animation completes
      const timer = setTimeout(() => setIsNew(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [latestTransaction?._id]); // Only re-run when transaction ID changes

  const formatTime = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString();
  };

  const isCredit = displayTransaction?.type === "credit";
  const isDark = theme === "dark";

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6 mb-6
        transition-all duration-500 ease-out
        ${isDark 
          ? "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/30 backdrop-blur-xl" 
          : "bg-gradient-to-br from-white/40 to-blue-50/30 border border-white/30 backdrop-blur-xl"
        }
        ${isNew ? "shadow-lg" : "shadow-md"}
      `}
    >
      {/* Animated background blur effect on new transaction */}
      {isNew && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 blur-2xl animate-pulse"
          style={{
            animation: "fadeInOut 1s ease-out",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {!displayTransaction ? (
          // Empty state
          <div className="text-center py-8">
            <div className={`text-lg font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Waiting for new transactions…
            </div>
            <div className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"} mt-2`}>
              Your latest payment will appear here
            </div>
          </div>
        ) : (
          // Transaction display
          <div>
            {/* Header with type indicator */}
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Latest Payment
              </h3>
              <div
                className={`
                  p-2 rounded-full
                  ${isCredit 
                    ? isDark 
                      ? "bg-emerald-900/50 text-emerald-400" 
                      : "bg-emerald-100/50 text-emerald-600"
                    : isDark
                      ? "bg-red-900/50 text-red-400"
                      : "bg-red-100/50 text-red-600"
                  }
                `}
              >
                {isCredit ? (
                  <MdTrendingUp size={20} />
                ) : (
                  <MdTrendingDown size={20} />
                )}
              </div>
            </div>

            {/* Person name */}
            <div className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              {displayTransaction.name || displayTransaction.description || "Unknown"}
            </div>

            {/* Amount */}
            <div
              className={`
                text-3xl font-bold mb-4
                ${isCredit
                  ? isDark
                    ? "text-emerald-400"
                    : "text-emerald-600"
                  : isDark
                    ? "text-red-400"
                    : "text-red-600"
                }
              `}
            >
              {isCredit ? "+" : "−"}₹{displayTransaction.amount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            {/* Details row */}
            <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${isDark ? "border-slate-700/50" : "border-white/30"}`}>
              {/* Time */}
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Time
                </div>
                <div className={`text-sm font-semibold mt-1 ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                  {formatTime(displayTransaction.date)}
                </div>
              </div>

              {/* VPA or Account */}
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {displayTransaction.upiId ? "VPA" : "Account"}
                </div>
                <div
                  className={`text-sm font-semibold mt-1 break-all ${
                    isDark ? "text-slate-200" : "text-slate-900"
                  }`}
                >
                  {displayTransaction.upiId || `...${displayTransaction.accountLast4 || "****"}`}
                </div>
              </div>
            </div>

            {/* Reference number if available */}
            {displayTransaction.referenceNumber && (
              <div className={`mt-4 pt-4 border-t ${isDark ? "border-slate-700/50" : "border-white/30"}`}>
                <div className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Reference
                </div>
                <div className={`text-xs font-mono mt-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {displayTransaction.referenceNumber}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Styling for animation */}
      <style>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: scale(1.5);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default RecentPaymentCard;
