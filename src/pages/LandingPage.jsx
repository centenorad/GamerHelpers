// React imports
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <>
      landing_page
      <button onClick={() => navigate("/login")}>Login</button>
    </>
  );
}
