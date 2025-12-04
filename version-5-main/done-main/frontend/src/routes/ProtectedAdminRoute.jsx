import React from "react";

const ProtectedAdminRoute = ({ children, user }) => {
  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center transform transition-all duration-300 hover:scale-105">
          <div className="flex justify-center mb-6">
            <svg
              className="w-16 h-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18.364 18.364A9 9 0 015.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              ></path>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-base mb-6">
            Oops! It seems you don't have the necessary permissions to view this page.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
            This section is restricted to administrators only. If you believe this is an
            error, please contact your system administrator for assistance.
          </p>
          <button
            onClick={() => window.location.href = "/app/dashboard"}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedAdminRoute;
