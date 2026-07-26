import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";

import { Landing } from "./pages/Landing";
import { Pricing } from "./pages/Pricing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { Schedule } from "./pages/Schedule";
import { Test } from "./pages/Test";
import { History } from "./pages/History";
import { Analytics } from "./pages/Analytics";
import { Reports } from "./pages/Reports";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { Notifications } from "./pages/Notifications";
import { Upgrade } from "./pages/Upgrade";
import { NotFound } from "./pages/NotFound";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { TooltipProvider } from "./components/ui/tooltip";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function ThemeAwareToaster() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
    return (
      <Toaster
        position="top-center"
        theme={theme}
        toastOptions={{
          style: {
            borderRadius: "12px",
            fontFamily: "Inter, system-ui, sans-serif",
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
            boxShadow: theme === 'dark' ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.05)',
          },
        }}
      />
    );
}

function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <BrowserRouter>
        <ThemeAwareToaster />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* Protected Routes */}
        <Route path="/app/*" element={
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/lobby" element={<Test />} />
              <Route path="/room" element={<Test />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/pricing" element={<Upgrade />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
