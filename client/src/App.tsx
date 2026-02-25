import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Prompt from "./pages/Prompt";
import ImagePage from "./pages/Image";
import VideoPage from "./pages/Video";
import Profile from "./pages/Profile";
import NotFound from "./pages/not-found";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={() => <Layout><Home /></Layout>} />
      <Route path="/chat" component={() => <ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
      <Route path="/prompt" component={() => <ProtectedRoute><Layout><Prompt /></Layout></ProtectedRoute>} />
      <Route path="/image" component={() => <ProtectedRoute><Layout><ImagePage /></Layout></ProtectedRoute>} />
      <Route path="/video" component={() => <ProtectedRoute><Layout><VideoPage /></Layout></ProtectedRoute>} />
      <Route path="/profile" component={() => <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      <Route component={() => <Layout><NotFound /></Layout>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
