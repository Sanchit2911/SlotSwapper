// client/src/components/Navbar.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
// 1. Import the icons for the hamburger menu
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 2. Add state to track if the mobile menu is open
  const [isOpen, setIsOpen] = useState(false);

  // 3. Helper function to close the mobile menu on navigation
  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu(); // Also close menu on logout
    navigate("/login");
  };

  return (
    // Add relative positioning for the absolute-positioned mobile menu
    <nav className="bg-white shadow-lg dark:bg-gray-800 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link
              to="/"
              onClick={closeMenu}
              className="text-2xl font-bold text-blue-600 dark:text-blue-500 flex-shrink-0"
            >
              SlotSwapper
            </Link>
            {/* 4. DESKTOP NAV LINKS - Hidden on mobile */}
            {user && (
              <div className="hidden md:flex ml-10 space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 dark:text-gray-300 dark:hover:text-blue-400 rounded-md text-sm font-medium"
                >
                  My Events
                </Link>
                <Link
                  to="/marketplace"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 dark:text-gray-300 dark:hover:text-blue-400 rounded-md text-sm font-medium"
                >
                  Marketplace
                </Link>
                <Link
                  to="/requests"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 dark:text-gray-300 dark:hover:text-blue-400 rounded-md text-sm font-medium"
                >
                  Requests
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {/* 5. DESKTOP AUTH - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                    Hello, {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 dark:text-gray-300 dark:hover:text-blue-400 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Theme Toggle (visible on both) */}
            <div className="ml-4">
              <ThemeToggle />
            </div>

            {/* 6. HAMBURGER BUTTON - Visible on mobile only */}
            <div className="md:hidden flex items-center ml-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. MOBILE MENU - Conditionally rendered */}
      <div
        className={`md:hidden absolute w-full bg-white dark:bg-gray-800 shadow-lg ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium"
              >
                My Events
              </Link>
              <Link
                to="/marketplace"
                onClick={closeMenu}
                className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium"
              >
                Marketplace
              </Link>
              <Link
                to="/requests"
                onClick={closeMenu}
                className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium"
              >
                Requests
              </Link>
              {/* User info and logout for mobile */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <div className="px-3 mb-2">
                  <span className="block text-base font-medium text-gray-700 dark:text-gray-300">
                    Hello, {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left bg-red-500 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={closeMenu}
                className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={closeMenu}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
