import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { login, autoLogin } from "../api/authApi";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be 100 characters or less"),
});

function Login({ setUserName, setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // ✅ PREFILL email + password from localStorage
  //    AND try silent autoLogin()
  // ---------------------------------------------------------
  useEffect(() => {
    (async () => {
      // Prefill saved login
      const saved = JSON.parse(localStorage.getItem("rememberLogin") || "{}");
      if (saved.email) {
        setFormData({
          email: saved.email,
          password: saved.password || "",
          rememberMe: true,
        });
      }

      // // Try backend cookie auto-login
      // try {
      //   const auto = await autoLogin();
      //   if (auto) {
      //     setUserName(auto.userFullName);
      //     setIsAuthenticated(true);
      //     navigate("/");
      //   }
      // } catch {
      //   // no cookie — ignore
      // }
    })();
  }, [navigate, setIsAuthenticated, setUserName]);

  // ---------------------------------------------------------
  // Handle input change
  // ---------------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ---------------------------------------------------------
  // Handle form submit
  // ---------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const data = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      // Store user state
      setUserName(data.userFullName);
      setIsAuthenticated(true);

      // ---------------------------------------------------------
      // ✅ SAVE email + password for next login
      // ---------------------------------------------------------
      if (formData.rememberMe) {
        localStorage.setItem(
          "rememberLogin",
          JSON.stringify({
            email: formData.email,
            password: formData.password,
          })
        );
      } else {
        localStorage.removeItem("rememberLogin");
      }

      navigate("/");
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Invalid email or password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px">

            {/* Email */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 text-gray-400"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Remember + forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                id="remember-me"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Remember me</span>
            </label>

            <Link
              to="/forgot"
              className="font-medium text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Forgot password?
            </Link>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800">
                {errors.general}
              </h3>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-75"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
