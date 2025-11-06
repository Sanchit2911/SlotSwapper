// client/src/components/Navbar.tsx

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle"; // <-- 1. IMPORT THE TOGGLE

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    // Add dark mode class for the nav background
    <nav className="bg-white shadow-lg dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Dark mode for the logo/brand */}
            <Link
              to="/"
              className="text-2xl font-bold text-blue-600 dark:text-blue-500"
            >
              SlotSwapper
            </Link>
            {user && (
              <div className="ml-10 flex space-x-4">
                {/* Dark mode for nav links */}
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  My Events
                </Link>
                <Link
                  to="/marketplace"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  Marketplace
                </Link>
                <Link
                  to="/requests"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  Requests
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Dark mode for user name text */}
                <span className="text-gray-700 dark:text-gray-300">
                  Hello, {user.name}
                </span>
                {/* Dark mode for red logout button */}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Dark mode for login link */}
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  Login
                </Link>
                {/* Dark mode for blue sign up button */}
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* 2. ADD THE TOGGLE BUTTON HERE */}
            <div className="ml-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
