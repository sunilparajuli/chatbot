// src/components/AdminLayout.jsx
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    signOut(auth);
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3>Support Panel</h3>
          <button onClick={handleSignOut} style={styles.logoutButton}>Logout</button>
        </div>
        
        <nav style={styles.menu}>
          <Link to="/admin" style={isActive('/admin') ? {...styles.menuLink, ...styles.activeMenuLink} : styles.menuLink}>
            Chat Dashboard
          </Link>
          <Link to="/admin/topics" style={isActive('/admin/topics') ? {...styles.menuLink, ...styles.activeMenuLink} : styles.menuLink}>
            Manage Topics
          </Link>
          {/* --- ADD THIS NEW LINK --- */}
          <Link to="/admin/office-info" style={isActive('/admin/office-info') ? {...styles.menuLink, ...styles.activeMenuLink} : styles.menuLink}>
            Office Info
          </Link>
        </nav>
      </div>

      <main style={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: 'sans-serif' },
  sidebar: { width: 250, borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' },
  sidebarHeader: { padding: '20px', borderBottom: '1px solid #ccc' },
  logoutButton: { marginTop: '10px', padding: '5px 10px', width: '100%' },
  menu: { display: 'flex', flexDirection: 'column', padding: '10px 0' },
  menuLink: { padding: '15px 20px', color: '#333', textDecoration: 'none', borderLeft: '4px solid transparent' },
  activeMenuLink: { borderLeft: '4px solid #007bff', backgroundColor: '#e9ecef', fontWeight: 'bold' },
  mainContent: { flex: 1, overflowY: 'auto' },
};