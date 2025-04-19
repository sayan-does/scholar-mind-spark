import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Papers from "./pages/Papers";
import Notepad from "./pages/Notepad";
import Whiteboard from "./pages/Whiteboard";
import Insights from "./pages/Insights";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/papers" replace />} />
          <Route path="/papers" element={<Layout><Papers /></Layout>} />
          <Route path="/notepad" element={<Layout><Notepad /></Layout>} />
          <Route path="/whiteboard" element={<Layout><Whiteboard /></Layout>} />
          <Route path="/insights" element={<Layout><Insights /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
