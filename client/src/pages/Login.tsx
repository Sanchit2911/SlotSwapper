// client/src/pages/Login.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "../schemas/auth.schema";
import { getErrorMessage } from "../services/api";

export const Login = () => {
  const [serverError, setServerError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError("");
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    // Removed 'bg-gray-50' - App.tsx now handles this.
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Added dark:text-gray-100 */}
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Sign in to SlotSwapper
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Added dark:bg-gray-800 to the card */}
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {serverError}
              </div>
            )}

            <div>
              {/* Added dark:text-gray-300 */}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                type="email"
                required
                {...register("email")}
                /*
                 * Added dark:bg-gray-700, dark:text-gray-100, dark:border-gray-600
                 */
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${
                  errors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              {/* Added dark:text-gray-300 */}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                required
                {...register("password")}
                /*
                 * Added dark:bg-gray-700, dark:text-gray-100, dark:border-gray-600
                 */
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${
                  errors.password
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            {/*Added dark:text-blue-400 */}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
