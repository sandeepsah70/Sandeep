import { useState, useId } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import type { SubmissionFormData, FormErrors, SubmissionRecord } from './types';
import './index.css';

export function App() {
  const [formData, setFormData] = useState<SubmissionFormData>({
    name: '',
    phone: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionSubmissions, setSessionSubmissions] = useState<SubmissionRecord[]>([]);

  const nameInputId = useId();
  const phoneInputId = useId();

  // Helper to clean phone numbers: remove spaces, hyphens, and brackets
  const cleanPhone = (raw: string): string => {
    return raw.replace(/[\s\-()]/g, '');
  };

  // Validate form according to PRD
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedName = formData.name.trim();
    const cleanedPhone = cleanPhone(formData.phone);

    // FR2 & FR3: Name validation
    if (!trimmedName) {
      newErrors.name = 'Naam bharana anivarya hai (Mandatory)';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Naam kam se kam 2 characters ka hona chahiye';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'Naam 100 characters se zyada nahi ho sakta';
    }

    // FR2 & FR4: Phone validation
    const phoneRegex = /^[0-9+]{10,13}$/;
    if (!cleanedPhone) {
      newErrors.phone = 'Phone number bharana anivarya hai (Mandatory)';
    } else if (!phoneRegex.test(cleanedPhone)) {
      newErrors.phone = 'Valid phone number enter karein (10 digits ya +91 ke sath)';
    } else {
      // Check standard 10 digit Indian number or +91 followed by 10 digits
      const digitsOnly = cleanedPhone.replace('+', '');
      if (digitsOnly.length !== 10 && !(digitsOnly.startsWith('91') && digitsOnly.length === 12)) {
        newErrors.phone = '10 digit ka valid mobile number enter karein (jaise: 9876543210 ya +919876543210)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error on edit
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear global messages on fresh typing
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = formData.name.trim();
    const cleanedPhone = cleanPhone(formData.phone);

    try {
      // Insert directly into Supabase table submissions
      const { error } = await supabase
        .from('submissions')
        .insert([
          {
            name: trimmedName,
            phone: cleanedPhone,
          },
        ]);

      if (error) {
        throw error;
      }

      // Success: Celebrate & Reset
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#10b981', '#38bdf8', '#fbbf24', '#a855f7'],
        });
      } catch {
        // Safe fallback if confetti canvas is not supported
      }

      setSuccessMessage('Thank you! Aapki details save ho gayi');

      // Record in local session list for instant verification
      const insertedItem: SubmissionRecord = {
        name: trimmedName,
        phone: cleanedPhone,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setSessionSubmissions((prev) => [insertedItem, ...prev]);

      // FR6: Clear the form on success
      setFormData({ name: '', phone: '' });
      setErrors({});
    } catch (err: unknown) {
      // FR7: User friendly error without losing form data
      console.error('Supabase submission error:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Data save karte samay error aaya. Kripya apna internet connection check karke dobara koshish karein.';
      setErrorMessage(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-container">
      {/* Background ambient lighting */}
      <div className="ambient-glow ambient-glow-1" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-2" aria-hidden="true" />

      <div className="form-wrapper">
        {/* Status Indicator */}
        <div style={{ textAlign: 'center' }}>
          <div className="status-badge">
            <span className="status-dot" />
            <span>Supabase Connected &bull; Project Kuldeep</span>
          </div>
        </div>

        {/* Main Glassmorphic Card */}
        <div className="glass-card">
          <header>
            <h1 className="card-title">
              Contact <span className="highlight">Details</span>
            </h1>
            <p className="card-subtitle">
              Apna Name aur Phone number fill karein. Aapka data seedha Supabase ke <code>submissions</code> table me safely store hoga.
            </p>
          </header>

          {/* Success Banner (PRD FR6) */}
          {successMessage && (
            <div className="alert-banner success" role="alert" aria-live="polite">
              <div className="alert-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="alert-content">
                <div className="alert-title">Kamyabi!</div>
                <div>{successMessage}</div>
              </div>
              <button
                type="button"
                className="alert-close"
                onClick={() => setSuccessMessage(null)}
                aria-label="Close notification"
              >
                &times;
              </button>
            </div>
          )}

          {/* Error Banner (PRD FR7) */}
          {errorMessage && (
            <div className="alert-banner error" role="alert" aria-live="assertive">
              <div className="alert-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="alert-content">
                <div className="alert-title">Submit Failed</div>
                <div>{errorMessage}</div>
              </div>
              <button
                type="button"
                className="alert-close"
                onClick={() => setErrorMessage(null)}
                aria-label="Close error message"
              >
                &times;
              </button>
            </div>
          )}

          {/* Form */}
          <form className="submit-form" onSubmit={handleSubmit} noValidate>
            {/* Field 1: Name */}
            <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
              <div className="label-row">
                <label htmlFor={nameInputId} className="form-label">
                  Full Name <span className="required-mark">*</span>
                </label>
                <span className="label-hint">
                  {formData.name.length}/100
                </span>
              </div>

              <div className="input-container">
                <div className="input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  id={nameInputId}
                  name="name"
                  type="text"
                  className="text-input"
                  placeholder="Jaise: Kuldeep Sharma"
                  value={formData.name}
                  onChange={handleInputChange}
                  maxLength={100}
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </div>

              {errors.name && (
                <div className="field-error-msg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Field 2: Phone */}
            <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
              <div className="label-row">
                <label htmlFor={phoneInputId} className="form-label">
                  Phone Number <span className="required-mark">*</span>
                </label>
                <span className="label-hint">India (+91)</span>
              </div>

              <div className="input-container">
                <div className="input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <input
                  id={phoneInputId}
                  name="phone"
                  type="tel"
                  className="text-input"
                  placeholder="Jaise: 9876543210 ya +919876543210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={16}
                  disabled={isSubmitting}
                  autoComplete="tel"
                />
              </div>

              <div className="phone-format-helper">
                <span>Allowed:</span>
                <span className="phone-badge">10 Digits</span>
                <span className="phone-badge">+91 Format</span>
              </div>

              {errors.phone && (
                <div className="field-error-msg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>

            {/* Submit Button (PRD FR5) */}
            <button
              type="submit"
              id="submit-form-button"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" aria-hidden="true" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <span>Submit Details</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Security & RLS Policy Notes */}
          <footer className="security-note">
            <div className="security-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Row-Level Security (RLS) Active</span>
            </div>
            <span>Table: <code>submissions</code></span>
          </footer>

          {/* Recent Submissions Activity Tracker */}
          {sessionSubmissions.length > 0 && (
            <div className="recent-records-box">
              <div className="recent-records-header">
                <span className="recent-title">Is Session Ke Submissions</span>
                <span className="badge-count">{sessionSubmissions.length} Saved</span>
              </div>
              <div className="records-list">
                {sessionSubmissions.map((record, index) => (
                  <div key={index} className="record-item">
                    <div>
                      <div className="record-name">{record.name}</div>
                      <div className="record-time">Saved at {record.created_at}</div>
                    </div>
                    <div className="record-phone">{record.phone}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
