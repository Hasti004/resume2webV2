import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateResume from "./pages/CreateResume";
import ReviewExtractedText from "./pages/ReviewExtractedText";
import ViewStructuredResume from "./pages/ViewStructuredResume";
import ResumeScanning from "./pages/ResumeScanning";
import EditSite from "./pages/EditSite";
import EditorRedirect from "./pages/EditorRedirect";
import EditorPage from "./pages/EditorPage";
import EditorTemplatePicker from "./pages/EditorTemplatePicker";
import DashboardEditorRedirect from "./pages/DashboardEditorRedirect";
import DashboardEditorPage from "./pages/DashboardEditorPage";
import TemplateSelection from "./pages/TemplateSelection";
import TemplatesRedirect from "./pages/TemplatesRedirect";
import EditorEditPage from "./pages/EditorEditPage";
import PublishSite from "./pages/PublishSite";
import SyncAccounts from "./pages/SyncAccounts";
import Upgrade from "./pages/Upgrade";
import PortfolioView from "./pages/PortfolioView";
import PublicPortfolio from "./pages/PublicPortfolio";
import NotFound from "./pages/NotFound";
import Intake from "./pages/Intake";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={300}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />

          {/* Intake (protected) */}
          <Route path="/intake" element={<ProtectedRoute><Intake /></ProtectedRoute>} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/create" element={<CreateResume />} />
          <Route path="/dashboard/create/review" element={<ReviewExtractedText />} />
          <Route path="/dashboard/scanning" element={<ResumeScanning />} />
          <Route path="/dashboard/edit" element={<EditSite />} />
          <Route path="/dashboard/editor" element={<DashboardEditorRedirect />} />
          <Route path="/dashboard/editor/:resumeId" element={<DashboardEditorPage />} />
          <Route path="/dashboard/editor/:resumeId/structured" element={<ViewStructuredResume />} />
          <Route path="/dashboard/editor/:resumeId/edit" element={<EditorEditPage />} />
          <Route path="/dashboard/editor/:resumeId/template" element={<TemplateSelection />} />
          <Route path="/dashboard/templates" element={<TemplatesRedirect />} />
          <Route path="/dashboard/publish" element={<PublishSite />} />
          <Route path="/dashboard/sync" element={<SyncAccounts />} />
          <Route path="/dashboard/upgrade" element={<Upgrade />} />

          {/* Editor (Google Docs–like) */}
          <Route path="/editor" element={<EditorRedirect />} />
          <Route path="/editor/:resumeId" element={<EditorPage />} />
          <Route path="/editor/:resumeId/template" element={<EditorTemplatePicker />} />

          {/* Public portfolio */}
          <Route path="/u/:username" element={<PublicPortfolio />} />
          <Route path="/portfolio/:siteId" element={<PortfolioView />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
