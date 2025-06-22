// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

// Import all components
import ChatWidget from "./components/ChatWidget";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import TopicManager from "./components/TopicManger"; // <-- Corrected typo from "TopicManger"
import AdminLayout from "./components/AdminLayout";
import OfficeInfoManager from "./components/OfficeInfoManager";

// This new component will contain our main app logic.
// Because it's a child of <BrowserRouter>, it can use React Router hooks.
function AppContent() {
  const location = useLocation(); // Hook to get the current URL
  const [user, loading] = useAuthState(auth);

  // --- Check if the current page is an admin page ---
  const isAdminPage = location.pathname.startsWith('/admin');

  if (loading) {
    return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading Application...</div>;
  }

  return (
    <>
      {/* --- Conditionally render the ChatWidget --- */}
      {/* If it's NOT an admin page, show the widget. */}
      {!isAdminPage && <ChatWidget />}

      <Routes>
        <Route path="/" element={ 
          <div style={{padding: '50px', textAlign: 'center'}}>
            
            
          </div> 
        } />
        
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* This parent route handles authentication and renders the layout */}
        <Route 
          path="/admin" 
          element={user ? <AdminLayout /> : <Navigate to="/admin/login" />}
        >
          {/* Child routes render inside the AdminLayout's <Outlet> */}
          <Route index element={<AdminPanel />} />
          <Route path="topics" element={<TopicManager />} />
          <Route path="office-info" element={<OfficeInfoManager />} />
        </Route>
        
      </Routes>
    </>
  );
}

// The main App component just sets up the router.
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}