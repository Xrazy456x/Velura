import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Privacy from "./pages/Privacy.jsx";
import Quote from "./pages/Quote.jsx";
import Services from "./pages/Services.jsx";
import Terms from "./pages/Terms.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/portal" element={<Navigate to="/" replace />} />
        <Route path="/portal/about" element={<Navigate to="/about" replace />} />
        <Route path="/portal/services" element={<Navigate to="/services" replace />} />
        <Route path="/portal/quote" element={<Navigate to="/quote" replace />} />
        <Route path="/portal/contact" element={<Navigate to="/contact" replace />} />
        <Route path="/portal/privacy" element={<Navigate to="/privacy" replace />} />
        <Route path="/portal/terms" element={<Navigate to="/terms" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
