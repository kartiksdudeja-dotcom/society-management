import React, { useState, useEffect } from "react";
import { MdExpandMore } from "react-icons/md";

/**
 * MonthFilter
 * 
 * Dropdown component for selecting transaction month or recent view.
 * Fetches available months from backend.
 * 
 * Features:
 * - Dropdown with month options (November 2025, October 2025, etc.)
 * - "Recent (Last 3 Days)" option
 * - Smooth animations
 * - Responsive design
 */
const MonthFilter = ({ onMonthChange, theme = "light", selectedMonth = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("Recent (Last 3 Days)");

  const isDark = theme === "dark";

  // Fetch available months from backend
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/bank/available-months");
        const data = await response.json();
        setMonths(data.months || []);
      } catch (err) {
        console.error("Error fetching months:", err);
        setMonths([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonths();
  }, []);

  // Update selected label when selectedMonth prop changes
  useEffect(() => {
    if (selectedMonth === "recent" || !selectedMonth) {
      setSelectedLabel("Recent (Last 3 Days)");
    } else {
      const found = months.find(m => m.yearMonth === selectedMonth);
      if (found) {
        setSelectedLabel(found.label);
      }
    }
  }, [selectedMonth, months]);

  const handleSelectMonth = (yearMonth) => {
    setSelectedLabel(
      months.find(m => m.yearMonth === yearMonth)?.label || "Recent"
    );
    onMonthChange(yearMonth);
    setIsOpen(false);
  };

  const handleSelectRecent = () => {
    setSelectedLabel("Recent (Last 3 Days)");
    onMonthChange("recent");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg
          font-medium text-sm transition-all duration-200
          ${isDark
            ? "bg-slate-700/50 hover:bg-slate-700/70 text-slate-200 border border-slate-600/30"
            : "bg-white/50 hover:bg-white/70 text-slate-700 border border-white/30 backdrop-blur-sm"
          }
          ${isOpen ? (isDark ? "bg-slate-700/70" : "bg-white/70") : ""}
        `}
      >
        <span className="truncate">{selectedLabel}</span>
        <MdExpandMore
          size={20}
          className={`
            transition-transform duration-300 flex-shrink-0
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`
            absolute top-full right-0 mt-2 min-w-max rounded-lg
            shadow-2xl border z-50
            ${isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
            }
          `}
        >
          {/* Recent option */}
          <button
            onClick={handleSelectRecent}
            className={`
              w-full text-left px-4 py-3 text-sm font-medium
              border-b
              transition-colors duration-150
              ${isDark
                ? "hover:bg-slate-700/50 border-slate-700 text-slate-200"
                : "hover:bg-blue-50 border-slate-100 text-slate-700"
              }
            `}
          >
            📅 Recent (Last 3 Days)
          </button>

          {/* Month options */}
          <div
            className={`
              max-h-64 overflow-y-auto
              ${isDark ? "divide-slate-700" : "divide-slate-100"}
            `}
          >
            {loading ? (
              <div
                className={`
                  px-4 py-6 text-center text-sm
                  ${isDark ? "text-slate-400" : "text-slate-500"}
                `}
              >
                Loading months...
              </div>
            ) : months.length === 0 ? (
              <div
                className={`
                  px-4 py-6 text-center text-sm
                  ${isDark ? "text-slate-400" : "text-slate-500"}
                `}
              >
                No transactions yet
              </div>
            ) : (
              months.map((month) => (
                <button
                  key={month.yearMonth}
                  onClick={() => handleSelectMonth(month.yearMonth)}
                  className={`
                    w-full text-left px-4 py-3 text-sm font-medium
                    border-b last:border-b-0
                    transition-colors duration-150
                    flex items-center justify-between
                    ${isDark
                      ? "hover:bg-slate-700/50 border-slate-700 text-slate-200"
                      : "hover:bg-blue-50 border-slate-100 text-slate-700"
                    }
                  `}
                >
                  <span>{month.label}</span>
                  <span
                    className={`
                      text-xs font-semibold px-2 py-1 rounded
                      ${isDark
                        ? "bg-slate-600/50 text-slate-300"
                        : "bg-blue-100/50 text-blue-600"
                      }
                    `}
                  >
                    {month.count}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default MonthFilter;
