import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { AuthContext } from "../context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6).max(100),
});

function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Prefill saved login
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("rememberLogin") || "{}");
    if (saved.email) {
      setFormData({
        email: saved.email,
        password: saved.password || "",
        rememberMe: true,
      });
    }
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      await authLogin(
        formData.email,
        formData.password,
        formData.rememberMe
      );

      // Save Remember Me
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-lg">
        <h2 className="text-3xl font-extrabold text-center mb-6">
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg"
            />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-3"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              Remember me
            </label>

            <Link to="/forgot" className="text-sm text-indigo-600">
              Forgot password?
            </Link>
          </div>

          {/* Error */}
          {errors.general && (
            <div className="bg-red-50 p-3 rounded">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Login;
