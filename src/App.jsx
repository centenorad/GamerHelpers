// React imports
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// File imports
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FullScreen, Center } from "./templates/Layouts";

// Page imports
import Login from "./pages/login/Login";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import AdminLogin from "./pages/login/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, type, loading } = useAuth();

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
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      ) : type === "regular" ? (
        // Normal users logged in
        <>
          <Route path="/" element={<Home />} />
          <Route path="/chats" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      ) : (
        // Admin logged in
        <>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
}
