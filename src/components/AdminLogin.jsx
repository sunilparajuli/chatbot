import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin");
    } catch (e) {
      setError("Invalid email or password. Please try again.");
      console.error("Login failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    // The main container that centers the form using inline flexbox styles
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* The form is wrapped in a "form" tag for semantic correctness */}
      <form
        onSubmit={handleLogin}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}
      >
        {/* --- LOGO ADDED HERE --- */}
        <img
          src="https://kathmandu.gov.np/wp-content/uploads/2021/02/cropped-logo.png" // Replace with your logo URL
          alt="Company Logo"
          style={{
            width: '80px', // Adjust size as needed
            marginBottom: '20px',
          }}
        />

        <h2
          style={{
            marginBottom: '25px',
            fontSize: '28px',
            fontWeight: '600',
            color: '#1d1d1f',
          }}
        >
          Admin Portal
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px 15px',
            marginBottom: '20px',
            fontSize: '16px',
            border: '1px solid #dcdcdc',
            borderRadius: '8px',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px 15px',
            marginBottom: '20px',
            fontSize: '16px',
            border: '1px solid #dcdcdc',
            borderRadius: '8px',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 15px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
            // --- Dynamic styles for loading state ---
            backgroundColor: loading ? '#6c757d' : '#007aff',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && (
          <p style={{ color: '#dc3545', marginTop: '15px', fontSize: '14px' }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}