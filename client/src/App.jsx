import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
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
        <Route index element={<ComingSoon />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/quote"
          element={
            <ProtectedRoute>
              <Quote />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/privacy"
          element={
            <ProtectedRoute>
              <Privacy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/terms"
          element={
            <ProtectedRoute>
              <Terms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Navigate to="/portal" replace />} />
        <Route path="/about" element={<Navigate to="/portal/about" replace />} />
        <Route path="/services" element={<Navigate to="/portal/services" replace />} />
        <Route path="/quote" element={<Navigate to="/portal/quote" replace />} />
        <Route path="/contact" element={<Navigate to="/portal/contact" replace />} />
        <Route path="/privacy" element={<Navigate to="/portal/privacy" replace />} />
        <Route path="/terms" element={<Navigate to="/portal/terms" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
