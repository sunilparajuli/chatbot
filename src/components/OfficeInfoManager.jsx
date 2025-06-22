// src/components/OfficeInfoManager.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function OfficeInfoManager() {
  const [formData, setFormData] = useState({
    organizationName: '',
    welcomeMessage: '',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Path to our single config document
  const configDocRef = doc(db, 'widgetConfig', 'main');

  // Fetch the current config when the component loads
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(configDocRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        } else {
          console.log("No widget config document found! Will use defaults.");
        }
      } catch(error) {
        console.error("Error fetching config:", error);
        setMessage('Error loading configuration.');
      }
      setLoading(false);
    };
    fetchConfig();
  }, []); // The empty dependency array ensures this runs only once

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      // Using setDoc with merge: true will create the document if it doesn't exist,
      // or update it if it does, without overwriting other fields.
      await setDoc(configDocRef, formData, { merge: true });
      setMessage('Information saved successfully!');
      setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    } catch (error) {
      console.error("Error saving config: ", error);
      setMessage('Error saving information.');
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{padding: '40px'}}>Loading Configuration...</div>;
  }

  return (
    <div style={styles.container}>
      <h2>Manage Office Information</h2>
      <p>This information will appear on the chat widget's welcome screen.</p>
      <form onSubmit={handleSave} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="organizationName">Organization Name</label>
          <input
            id="organizationName"
            name="organizationName"
            type="text"
            value={formData.organizationName}
            onChange={handleInputChange}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="welcomeMessage">Welcome Message / Subtitle</label>
          <textarea
            id="welcomeMessage"
            name="welcomeMessage"
            value={formData.welcomeMessage}
            onChange={handleInputChange}
            rows="4"
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="logoUrl">Logo Image URL</label>
          <input
            id="logoUrl"
            name="logoUrl"
            type="text"
            value={formData.logoUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/logo.png"
            style={styles.input}
          />
          {formData.logoUrl && <img src={formData.logoUrl} alt="logo preview" style={styles.logoPreview} />}
        </div>
        <button type="submit" disabled={saving} style={styles.saveButton}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {message && <p style={{ color: message.includes('Error') ? 'red' : 'green', marginTop: '15px' }}>{message}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: { padding: '20px 40px' },
  form: { maxWidth: '600px' },
  formGroup: { marginBottom: '20px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  saveButton: { padding: '10px 20px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '5px', cursor: 'pointer' },
  logoPreview: { maxWidth: '100px', maxHeight: '100px', marginTop: '10px', border: '1px solid #ddd', padding: '5px' }
};