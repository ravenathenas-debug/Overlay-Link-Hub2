import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SetupPage from "@/pages/setup";
import OverlayPage from "@/pages/overlay";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={SetupPage} />
      <Route path="/overlay" component={OverlayPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isOverlay = location.startsWith("/overlay");

  return (
    <>
      <Router />
      {!isOverlay && <Toaster />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <AppContent />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
