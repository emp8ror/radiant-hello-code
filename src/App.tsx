import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Auth from "./pages/Auth";
import LandlordDashboard from "./pages/landlord/Dashboard";
import TenantDashboard from "./pages/tenant/Dashboard";
import BrowseProperties from "./pages/tenant/BrowseProperties";
import PropertyForm from "./pages/landlord/PropertyForm";
import JoinRequests from "./pages/landlord/JoinRequests";
import LandlordPayments from "./pages/landlord/Payments";
import JoinProperty from "./pages/tenant/JoinProperty";
import PayRent from "./pages/tenant/PayRent";
import TenantPayments from "./pages/tenant/TenantPayments";
import ReviewProperty from "./pages/tenant/ReviewProperty";
import PropertyDetail from "./pages/PropertyDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Landlord Routes */}
            <Route path="/landlord/dashboard" element={<LandlordDashboard />} />
            <Route path="/landlord/properties/new" element={<PropertyForm />} />
            <Route path="/landlord/properties/:id/edit" element={<PropertyForm />} />
            <Route path="/landlord/properties/:id" element={<PropertyDetail />} />
            <Route path="/landlord/requests" element={<JoinRequests />} />
            <Route path="/landlord/payments" element={<LandlordPayments />} />
            
            {/* Tenant Routes */}
            <Route path="/tenant/dashboard" element={<TenantDashboard />} />
            <Route path="/tenant/browse" element={<BrowseProperties />} />
            <Route path="/tenant/join" element={<JoinProperty />} />
            <Route path="/tenant/pay/:propertyId" element={<PayRent />} />
            <Route path="/tenant/payments" element={<TenantPayments />} />
            <Route path="/tenant/review/:propertyId" element={<ReviewProperty />} />
            
            {/* Shared Routes */}
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
