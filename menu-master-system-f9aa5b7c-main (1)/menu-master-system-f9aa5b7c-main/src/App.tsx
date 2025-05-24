
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/index';
import { CartProvider } from "@/contexts/CartContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import Index from "./pages/Index";
import Kitchen from "./pages/Kitchen";
import Dashboard from "./pages/Dashboard";
import OrderManagementPage from "./pages/OrderManagement";
import AdminPanel from "./pages/admin";
import MenuConfig from "./pages/admin/MenuConfig";
import WhatsAppConfig from "./pages/admin/WhatsAppConfig";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage"; // Nova página do painel administrativo
import NotFound from "./pages/NotFound";

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CustomerProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orders" element={<OrderManagementPage />} />
              <Route path="/admin" element={<PrivateRoute allowedRoles={[UserRole.ADMIN]}><AdminPanel /></PrivateRoute>} />
              <Route path="/admin/menu" element={<MenuConfig />} />
              <Route path="/admin/whatsapp" element={<WhatsAppConfig />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} /> {/* Nova rota */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </CustomerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return children;
};

export default App;
