import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CollectionManager from "@/pages/CollectionManager";
import SetViewer from "@/pages/SetViewer";
import SetViewerNew from "@/pages/SetViewerNew";
import MyCollection from "@/pages/MyCollection";
import Statistics from "@/pages/Statistics";
import SimpleStats from "@/pages/SimpleStats";
import StatisticsNew from "@/pages/StatisticsNew";
import EnhancedStatistics from "@/pages/EnhancedStatistics";
import ImprovedStatistics from "@/pages/ImprovedStatistics";
import CollectionOverview from "@/pages/CollectionOverview";
import Search from "@/pages/Search";
import SearchResults from "@/pages/SearchResults";
import SimpleSearch from "@/pages/SimpleSearch";
//import CardRecognitionPage from "@/pages/CardRecognitionPage";
import AuthPage from "@/pages/AuthPage";
import ProfileCompletionPage from "@/pages/ProfileCompletionPage";
import UserSettings from "@/pages/UserSettings"; 
import Layout from "@/components/Layout";
import { Toast } from "@/components/Toast";
import { CollectionProvider } from "./context/CollectionContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GlobalNavProvider } from "./context/GlobalNavContext";
import GlobalMobileNav from "./components/GlobalMobileNav";
import GlobalMobileSidebar from "./components/GlobalMobileSidebar";
import { useGlobalNav } from "./context/GlobalNavContext";
import { AdminRoute } from "./components/AdminRoute";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminCollections from "@/pages/admin/Collections";
import AdminCards from "@/pages/admin/Cards";
import AdminSettings from "@/pages/admin/Settings";

function AppRouter() {
  return (
    <AuthProvider>
      <CollectionProvider>
        <GlobalNavProvider>
          <AppWithGlobalNav />
        </GlobalNavProvider>
      </CollectionProvider>
    </AuthProvider>
  );
}

// Navigation wrapper component
function AppWithGlobalNav() {
  const { isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar } = useGlobalNav();

  return (
    <>
      <Layout>
        <Switch>
          {/* User routes */}
          <ProtectedRoute path="/" component={Home} />
          <ProtectedRoute path="/collection" component={CollectionOverview} />
          <ProtectedRoute path="/set/:setId" component={SetViewerNew} />
          <ProtectedRoute path="/sets/:setId" component={SetViewerNew} />
          <ProtectedRoute path="/my-collection" component={MyCollection} />
          <ProtectedRoute path="/collections" component={CollectionOverview} />
          <ProtectedRoute path="/statistics" component={ImprovedStatistics} />
          <ProtectedRoute path="/search" component={SimpleSearch} />
          <ProtectedRoute path="/search-results" component={SearchResults} />
          <ProtectedRoute path="/simple-search" component={SimpleSearch} />
          <ProtectedRoute path="/settings" component={UserSettings} />
          
          {/* Auth routes */}
          <Route path="/auth" component={AuthPage} />
          <Route path="/profile-completion" component={ProfileCompletionPage} />
          
          {/* Admin routes */}
          <AdminRoute path="/admin" component={AdminDashboard} />
          <AdminRoute path="/admin/users" component={AdminUsers} />
          <AdminRoute path="/admin/collections" component={AdminCollections} />
          <AdminRoute path="/admin/cards" component={AdminCards} />
          <AdminRoute path="/admin/settings" component={AdminSettings} />
          
          {/* Fallback route */}
          <Route component={NotFound} />
        </Switch>
      </Layout>

      {/* Global Mobile Navigation */}
      <GlobalMobileNav onSidebarToggle={openMobileSidebar} />
      <GlobalMobileSidebar 
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />
    </>
  );
}

function App() {
  const [toastInfo, setToastInfo] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToastInfo({ message, type, visible: true });
    setTimeout(() => {
      setToastInfo((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Expose the showToast function globally for other components to use
  useEffect(() => {
    (window as any).showToast = showToast;
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppRouter />
          <Toaster />
          <Toast
            message={toastInfo.message}
            type={toastInfo.type}
            visible={toastInfo.visible}
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
