import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthInitializer from "@/components/AuthInitializer";
import PlayGround from "./pages/PlayGround";

function App() {
  return (
    <AuthInitializer>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route 
          path="/auth" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Auth />
            </ProtectedRoute>
          } 
        />
        <Route path="/playground" element={
          <ProtectedRoute requireAuth={true}>
            <PlayGround />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthInitializer>
  );
}

export default App;
