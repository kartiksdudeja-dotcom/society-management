import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiChevronDown } from "react-icons/fi";

/**
 * MonthSelector Component
 * 
 * Dropdown to select from available months with cached data.
 * Shows instant loading when cached, fetches from API if not.
 */
const MonthSelector = ({ onSelectMonth, selectedMonth, isLoading = false }) => {
  const [months, setMonths] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingMonths, setLoadingMonths] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch available months on component mount
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setLoadingMonths(true);
        const res = await axios.get(
          "http://localhost:5000/api/bank/available-months",
          { headers }
        );
        setMonths(res.data.months || []);
      } catch (err) {
        console.error("Error fetching months:", err);
      } finally {
        setLoadingMonths(false);
      }
    };

    fetchMonths();
  }, []);

  // Find currently selected month label
  const selectedMonthLabel = months.find(
    m => m.yearMonth === selectedMonth
  )?.label || "Select Month";

  const handleSelectMonth = useCallback((month) => {
    onSelectMonth(month.yearMonth, month.year, month.month);
    setIsOpen(false);
  }, [onSelectMonth]);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || loadingMonths}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <span className="font-semibold text-sm">
          {loadingMonths ? "Loading..." : selectedMonthLabel}
        </span>
        <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && months.length > 0 && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {months.map((month) => {
            const isSelected = month.yearMonth === selectedMonth;
            return (
              <button
                key={month.yearMonth}
                onClick={() => handleSelectMonth(month)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">{month.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {month.count} transactions
                  </div>
                </div>
                {isSelected && (
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(MonthSelector);
