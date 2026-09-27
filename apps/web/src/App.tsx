import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { RequireRole, RequireWorkerProfile, RequireBusinessProfile } from "@/components/RouteGuards";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AccountSettings from "@/pages/AccountSettings";

import WorkerOnboarding from "@/pages/worker/WorkerOnboarding";
import WorkerMatches from "@/pages/worker/WorkerMatches";
import WorkerJobDetail from "@/pages/worker/WorkerJobDetail";
import WorkerApply from "@/pages/worker/WorkerApply";
import WorkerApplications from "@/pages/worker/WorkerApplications";
import WorkerProfile from "@/pages/worker/WorkerProfile";

import BusinessOnboarding from "@/pages/business/BusinessOnboarding";
import BusinessDashboard from "@/pages/business/BusinessDashboard";
import BusinessJobs from "@/pages/business/BusinessJobs";
import BusinessCandidates from "@/pages/business/BusinessCandidates";
import CandidateDetail from "@/pages/business/CandidateDetail";
import BusinessApplications from "@/pages/business/BusinessApplications";
import BusinessProfile from "@/pages/business/BusinessProfile";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<RequireRole role="WORKER" />}>
              <Route path="/worker/onboarding" element={<WorkerOnboarding />} />
              <Route element={<RequireWorkerProfile />}>
                <Route path="/worker/matches" element={<WorkerMatches />} />
                <Route path="/worker/jobs/:jobId" element={<WorkerJobDetail />} />
                <Route path="/worker/jobs/:jobId/apply" element={<WorkerApply />} />
                <Route path="/worker/applications" element={<WorkerApplications />} />
                <Route path="/worker/profile" element={<WorkerProfile />} />
                <Route path="/worker/settings" element={<AccountSettings role="worker" />} />
              </Route>
            </Route>

            <Route element={<RequireRole role="BUSINESS" />}>
              <Route path="/business/onboarding" element={<BusinessOnboarding />} />
              <Route element={<RequireBusinessProfile />}>
                <Route path="/business/dashboard" element={<BusinessDashboard />} />
                <Route path="/business/jobs" element={<BusinessJobs />} />
                <Route path="/business/candidates" element={<BusinessCandidates />} />
                <Route path="/business/candidates/:workerId" element={<CandidateDetail />} />
                <Route path="/business/applications" element={<BusinessApplications />} />
                <Route path="/business/profile" element={<BusinessProfile />} />
                <Route path="/business/settings" element={<AccountSettings role="business" />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
