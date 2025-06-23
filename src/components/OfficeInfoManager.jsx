import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function OfficeInfoManager() {
  // MODIFIED: State now matches the bilingual Firestore structure
  const [formData, setFormData] = useState({
    organizationName: { en: '', np: '' },
    welcomeMessage: { en: '', np: '' },
    logoUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const configDocRef = doc(db, 'widgetConfig', 'main');

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(configDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // MODIFIED: Ensure the state is populated correctly even if fields are missing in Firestore
          setFormData({
            organizationName: data.organizationName || { en: '', np: '' },
            welcomeMessage: data.welcomeMessage || { en: '', np: '' },
            logoUrl: data.logoUrl || ''
          });
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
  }, []);

  // MODIFIED: Handle changes for nested, bilingual fields
  const handleTextChange = (field, lang, value) => {
    setFormData(prev => ({
        ...prev,
        [field]: {
            ...prev[field],
            [lang]: value
        }
    }));
  };

  // Handle changes for the flat logoUrl field
  const handleLogoChange = (e) => {
    setFormData(prev => ({ ...prev, logoUrl: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await setDoc(configDocRef, formData, { merge: true });
      setMessage('Information saved successfully!');
      setTimeout(() => setMessage(''), 3000);
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
        
        {/* MODIFIED: Bilingual inputs for Organization Name */}
        <div style={styles.formGroup}>
          <label htmlFor="organizationNameEn">Organization Name (English)</label>
          <input
            id="organizationNameEn"
            type="text"
            value={formData.organizationName.en}
            onChange={(e) => handleTextChange('organizationName', 'en', e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="organizationNameNp">Organization Name (Nepali)</label>
          <input
            id="organizationNameNp"
            type="text"
            value={formData.organizationName.np}
            onChange={(e) => handleTextChange('organizationName', 'np', e.target.value)}
            style={styles.input}
          />
        </div>

        {/* MODIFIED: Bilingual inputs for Welcome Message */}
        <div style={styles.formGroup}>
          <label htmlFor="welcomeMessageEn">Welcome Message (English)</label>
          <textarea
            id="welcomeMessageEn"
            value={formData.welcomeMessage.en}
            onChange={(e) => handleTextChange('welcomeMessage', 'en', e.target.value)}
            rows="4"
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="welcomeMessageNp">Welcome Message (Nepali)</label>
          <textarea
            id="welcomeMessageNp"
            value={formData.welcomeMessage.np}
            onChange={(e) => handleTextChange('welcomeMessage', 'np', e.target.value)}
            rows="4"
            style={styles.input}
          />
        </div>

        {/* This part remains the same as logoUrl is not bilingual */}
        <div style={styles.formGroup}>
          <label htmlFor="logoUrl">Logo Image URL</label>
          <input
            id="logoUrl"
            name="logoUrl"
            type="text"
            value={formData.logoUrl}
            onChange={handleLogoChange}
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