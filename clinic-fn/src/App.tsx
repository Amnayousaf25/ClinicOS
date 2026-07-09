import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Spinner } from '@/components/Spinner';
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

import { AnimatePresence, motion } from "framer-motion";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import CalendarView from "./pages/CalendarView";
import IntakeForms from "./pages/IntakeForms";
import Patients from "./pages/Patients";
import Reports from "./pages/Reports";
import SmsReminders from "./pages/SmsReminders";
import SettingsPage from "./pages/SettingsPage";
import StaffPage from "./pages/StaffPage";
import BookingPage from "./pages/BookingPage";
import InviteAcceptPage from "./pages/InviteAcceptPage";
import IntakeFormPublic from "./pages/IntakeFormPublic";
import NotFound from "./pages/NotFound";

// Public pages
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import CareersPage from "./pages/CareersPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import SecurityPage from "./pages/SecurityPage";
import CookiesPage from "./pages/CookiesPage";

const queryClient = new QueryClient();

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease } },
};

// Public routes accessible regardless of auth state
const publicRoutes = (
  <>
    <Route path="/about" element={<AboutPage />} />
    <Route path="/blog" element={<BlogPage />} />
    <Route path="/careers" element={<CareersPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/security" element={<SecurityPage />} />
    <Route path="/cookies" element={<CookiesPage />} />
    <Route path="/invite/:token" element={<InviteAcceptPage />} />
    <Route path="/book" element={<BookingPage />} />
    <Route path="/intake-form" element={<IntakeFormPublic />} />
  </>
);

const AppRoutes = () => {
  const { isLoggedIn, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} {...pageTransition} className="min-h-screen">
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {publicRoutes}
            <Route path="*" element={<Index />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <Routes location={location}>
      {publicRoutes}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/intake-forms" element={<IntakeForms />} />
        {role === 'admin' && (
          <>
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/sms-reminders" element={<SmsReminders />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/staff" element={<StaffPage />} />
          </>
        )}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
