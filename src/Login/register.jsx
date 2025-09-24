import { useState, useCallback } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { z } from "zod";
import { register, login } from "../api/authApi"; // import login too
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Stack,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Person, Email, Lock, Visibility, VisibilityOff } from "@mui/icons-material";

// ✅ Validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.string().min(1, "Role is required"),
});

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "", 
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setErrors({});
      const result = registerSchema.safeParse(formData);
      if (!result.success) {
        setErrors(result.error.flatten().fieldErrors);
        return;
      }

      try {
        // 1️⃣ Register user
        await register(
          formData.firstName,
          formData.lastName,
          formData.email,
          formData.password,
          formData.role || "Employee"
        );

        // 2️⃣ Automatically log in new user
        const loginData = await login(formData.email, formData.password);

        // 3️⃣ Save tokens and role correctly
        localStorage.setItem("accessToken", loginData.accessToken);
        localStorage.setItem("userRole", formData.role || "Employee");

        // 4️⃣ Navigate to dashboard or main page
        navigate("/backend/dashboard"); // adjust route as needed
      } catch (err) {
        setErrors({
          general: "Registration failed: " + (err?.message || "Unknown error"),
        });
      }
    },
    [formData, navigate]
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Left Side - Form */}
      <Box
        sx={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 3, sm: 5 },
          bgcolor: "#fff",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h3" fontWeight="700" gutterBottom>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register now to get started.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* First Name */}
                <TextField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  variant="standard"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Last Name */}
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  variant="standard"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Email */}
                <TextField
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  variant="standard"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password */}
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  variant="standard"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Role */}
                <TextField
                  select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  error={!!errors.role}
                  helperText={errors.role}
                  variant="standard"
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="">Select role</option>
                  <option value="Admin">Admin</option>
                  <option value="Employee">Employee</option>
                </TextField>

                {errors.general && <Alert severity="error">{errors.general}</Alert>}

                <Button type="submit" variant="contained" fullWidth>
                  Sign Up
                </Button>
              </Stack>
            </form>

            <Typography variant="body2" textAlign="center">
              Already have an account?{" "}
              <Link component={RouterLink} to="/backend/login" underline="hover">
                Sign In
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Right Side Image */}
      <Box
        sx={{
          flex: 8,
          display: { xs: "none", md: "block" },
          backgroundImage:
            "url('https://i.pinimg.com/736x/50/7a/09/507a092b29a4329f5f6f1c8701bb1a83.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </Box>
  );
}

export default Register;
