// React imports
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// File imports
import { useAuth } from "./context/AuthContext";
import { FullScreen, Center } from "./templates/Layouts";

// Page imports
import LandingPage from "./pages/LandingPage";
import Login from "./pages/login/Login";
import CreateAccount from "./pages/login/CreateAccount";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Apply from "./pages/Apply";
import AdminLogin from "./pages/login/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <FullScreen>
        <Center>Loading...</Center>
      </FullScreen>
    );
  }

  return (
    <Routes>
      {!user ? (
        // Not logged in
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      ) : role === "admin" ? (
        // Admin logged in
        <>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      ) : (
        // Regular users (user or employee) logged in
        <>
          <Route path="/" element={<Home />} />
          <Route path="/chats" element={<Chat />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
}
