
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import Index from "./pages/Index";
import Kitchen from "./pages/Kitchen";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/admin";
import MenuConfig from "./pages/admin/MenuConfig";
import WhatsAppConfig from "./pages/admin/WhatsAppConfig";
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
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/menu" element={<MenuConfig />} />
              <Route path="/admin/whatsapp" element={<WhatsAppConfig />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </CustomerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
