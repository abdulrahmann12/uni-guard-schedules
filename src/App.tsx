import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UniGuardProvider } from "@/lib/uniguard/store";
import Index from "./pages/Index.tsx";
import Scheduler from "./pages/uniguard/Scheduler";
import People from "./pages/uniguard/People";
import Rooms from "./pages/uniguard/Rooms";
import Timeline from "./pages/uniguard/Timeline";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <UniGuardProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/people" element={<People />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UniGuardProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
