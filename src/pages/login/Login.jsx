// React imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// File imports
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();

    const user = { email: email, password: password };
    loginUser(user);
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-white text-center">
          Login
        </h2>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Log In
        </button>
        <button
          onClick={() => navigate("/admin-login")}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded"
        >
          Admin Log In
        </button>
      </form>
    </div>
  );
}
