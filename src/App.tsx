import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandingProvider } from "@/lib/branding/BrandingProvider";
import { AppRoutes } from "@/routes/AppRoutes";
import { AuthProvider } from "@/state/auth";
import { queryClient } from "@/state/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <BrandingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-right" />
            <AppRoutes />
          </TooltipProvider>
        </BrandingProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
