import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Welcome from "./pages/auth/Welcome";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import VerifyOTP from "./pages/auth/VerifyOTP";

import DriverLayout from "./layouts/DriverLayout";
import Dashboard from "./pages/driver/Dashboard";
import PersonalDetails from "./pages/driver/PersonalDetails";
import ContactDetails from "./pages/driver/ContactDetails";
import IdentityVerification from "./pages/driver/IdentityVerification";
import VehicleDetails from "./pages/driver/VehicleDetails";
import DriverDocuments from "./pages/driver/DriverDocuments";
import VehicleDocuments from "./pages/driver/VehicleDocuments";
import ReviewApplication from "./pages/driver/ReviewApplication";
import ApplicationSubmitted from "./pages/driver/ApplicationSubmitted";
import DriverDocumentsPage from "./pages/driver/DriverDocumentsPage";
import Profile from "./pages/driver/Profile";

import AdminLogin from "./pages/admin/Login";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Applications from "./pages/admin/Applications";
import ApplicationDetails from "./pages/admin/ApplicationDetails";
import Drivers from "./pages/admin/Drivers";
import DriverDetails from "./pages/admin/DriverDetails";

function withDriverLayout(children: React.ReactNode) {
  return (
    <ProtectedRoute role="DRIVER">
      <DriverLayout>{children}</DriverLayout>
    </ProtectedRoute>
  );
}

function withAdminLayout(children: React.ReactNode) {
  return (
    <ProtectedRoute role="ADMIN">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/verify-otp" element={<VerifyOTP />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/driver/dashboard" element={withDriverLayout(<Dashboard />)} />
          <Route path="/driver/documents" element={withDriverLayout(<DriverDocumentsPage />)} />
          <Route path="/driver/profile" element={withDriverLayout(<Profile />)} />
          <Route path="/driver/application-submitted" element={withDriverLayout(<ApplicationSubmitted />)} />

          <Route path="/onboarding/personal" element={withDriverLayout(<PersonalDetails />)} />
          <Route path="/onboarding/contact" element={withDriverLayout(<ContactDetails />)} />
          <Route path="/onboarding/identity" element={withDriverLayout(<IdentityVerification />)} />
          <Route path="/onboarding/vehicle" element={withDriverLayout(<VehicleDetails />)} />
          <Route path="/onboarding/driver-documents" element={withDriverLayout(<DriverDocuments />)} />
          <Route path="/onboarding/vehicle-documents" element={withDriverLayout(<VehicleDocuments />)} />
          <Route path="/onboarding/review" element={withDriverLayout(<ReviewApplication />)} />

          <Route path="/admin/dashboard" element={withAdminLayout(<AdminDashboard />)} />
          <Route path="/admin/applications" element={withAdminLayout(<Applications />)} />
          <Route path="/admin/applications/:applicationId" element={withAdminLayout(<ApplicationDetails />)} />
          <Route path="/admin/drivers" element={withAdminLayout(<Drivers />)} />
          <Route path="/admin/drivers/:driverId" element={withAdminLayout(<DriverDetails />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
