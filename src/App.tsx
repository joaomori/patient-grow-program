import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PublicReferral from "./pages/PublicReferral";
import LandingAfiliados from "./pages/LandingAfiliados";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAffiliates from "./pages/admin/AdminAffiliates";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminRewardRules from "./pages/admin/AdminRewardRules";
import AdminRewards from "./pages/admin/AdminRewards";
import AdminReports from "./pages/admin/AdminReports";
import AffiliateDashboard from "./pages/affiliate/AffiliateDashboard";
import { AdminLayout } from "./components/admin/AdminLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AdminPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRole="admin">
    <AdminLayout>{children}</AdminLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/indicar" element={<PublicReferral />} />
            <Route path="/seja-afiliado" element={<LandingAfiliados />} />
            <Route path="/admin" element={<AdminPage><AdminDashboard /></AdminPage>} />
            <Route path="/admin/afiliados" element={<AdminPage><AdminAffiliates /></AdminPage>} />
            <Route path="/admin/indicacoes" element={<AdminPage><AdminReferrals /></AdminPage>} />
            <Route path="/admin/regras" element={<AdminPage><AdminRewardRules /></AdminPage>} />
            <Route path="/admin/recompensas" element={<AdminPage><AdminRewards /></AdminPage>} />
            <Route path="/admin/relatorios" element={<AdminPage><AdminReports /></AdminPage>} />
            <Route
              path="/afiliado"
              element={
                <ProtectedRoute requiredRole="affiliate">
                  <AffiliateDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
