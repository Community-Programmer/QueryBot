import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  return (
    <>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
