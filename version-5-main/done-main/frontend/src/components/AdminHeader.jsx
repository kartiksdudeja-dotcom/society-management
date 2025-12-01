import React from "react";
import { FiBell } from "react-icons/fi";
import { Link } from "react-router-dom";

const AdminHeader = ({ user }) => {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const getUserInitials = (user) => {
    if (!user || !user.name) return "U";
    const names = user.name.split(" ");
    return names.map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold">HB</div>
            <nav className="hidden md:flex gap-6">
              <Link to="/overview" className="text-gray-600 hover:text-gray-900">Overview</Link>
              <Link to="/reports" className="text-gray-600 hover:text-gray-900">Reports</Link>
              <Link to="/admin/bank" className="text-purple-600 font-semibold">Transactions</Link>
              <Link to="/integrations" className="text-gray-600 hover:text-gray-900">Integrations</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 hidden sm:block">{today}</div>
            <button className="p-2 rounded-md hover:bg-gray-50"><FiBell className="text-gray-600" /></button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">{getUserInitials(user)}</div>
              <div className="hidden sm:block text-sm text-gray-700">{user?.name || "Guest"}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
