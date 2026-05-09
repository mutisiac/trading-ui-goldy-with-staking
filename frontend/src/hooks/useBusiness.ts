import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { api } from '../api/client';

export interface BusinessData {
  companyName: string;
  email: string;
  number: string;
  image?: string;
}

export function useBusiness() {
  const [originalData, setOriginalData] = useState<BusinessData>({ companyName: '', email: '', number: '' });
  const [formData, setFormData] = useState<BusinessData>({ companyName: '', email: '', number: '' });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const getUserId = (): string | null => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')._id ?? null; }
    catch { return null; }
  };

  const fetchData = useCallback(async () => {
    try {
      setFetchLoading(true);
      const { data: r } = await api.get('/api/dashboard/manage-business');
      if (r.success) {
        const d = { companyName: r.data.companyName || '', email: r.data.email || '', number: String(r.data.number ?? ''), image: r.data.image || '' };
        setOriginalData(d); setFormData(d);
        if (r.data.image) setPreviewUrl(r.data.image);
      } else setError(r.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setFetchLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('Max 5MB'); return; }
    if (!f.type.startsWith('image/')) { setError('Invalid image type'); return; }
    setSelectedImage(f); setPreviewUrl(URL.createObjectURL(f)); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    const userId = getUserId(); if (!userId) { setError('Session expired. Please login.'); return; }

    const updates: Partial<BusinessData> = {};
    if (formData.companyName !== originalData.companyName && formData.companyName.trim()) updates.companyName = formData.companyName;
    if (formData.email !== originalData.email && formData.email.trim()) updates.email = formData.email;
    if (formData.number !== originalData.number && formData.number.trim()) updates.number = formData.number;

    const hasProfile = Object.keys(updates).length > 0 || !!selectedImage;
    const hasPwd = !!(passwordData.newPassword || passwordData.confirmPassword);
    if (!hasProfile && !hasPwd) { setError('No changes detected.'); return; }

    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) { setError('Invalid email address'); return; }
    if (updates.number && !/^[0-9]{10}$/.test(updates.number)) { setError('Enter a valid 10-digit number'); return; }

    if (hasPwd) {
      if (!passwordData.newPassword || !passwordData.confirmPassword) { setError('Fill in both password fields'); return; }
      if (passwordData.newPassword !== passwordData.confirmPassword) { setError('Passwords do not match'); return; }
      if (passwordData.newPassword.length < 5) { setError('Password must be at least 5 characters'); return; }
    }

    setLoading(true);
    try {
      let profileOk = false; let pwdOk = false;
      const changed: string[] = [];

      if (hasProfile) {
        const fd = new FormData();
        if (updates.companyName) { fd.append('companyName', updates.companyName); changed.push('company name'); }
        if (updates.email)       { fd.append('email', updates.email); changed.push('email'); }
        if (updates.number)      { fd.append('number', updates.number); changed.push('phone number'); }
        if (selectedImage)       { fd.append('image', selectedImage); changed.push('profile image'); }
        const { data: r } = await api.put('/api/auth/update-profile', fd);
        if (r.success) {
          profileOk = true;
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...u, companyName: r.user.companyName, email: r.user.email, number: String(r.user.number), image: r.user.image }));
          const nd = { companyName: r.user.companyName, email: r.user.email, number: String(r.user.number), image: r.user.image };
          setOriginalData(nd); setFormData(nd);
          if (r.user.image) setPreviewUrl(r.user.image);
          setSelectedImage(null);
        } else { setError(r.message || 'Profile update failed'); setLoading(false); return; }
      }

      if (hasPwd) {
        const { data: r } = await api.put('/api/user/change-own-password', { newPassword: passwordData.newPassword, confirmPassword: passwordData.confirmPassword });
        if (r.success) { pwdOk = true; setPasswordData({ newPassword: '', confirmPassword: '' }); }
        else { setError(r.message || 'Password change failed'); setLoading(false); return; }
      }

      if (profileOk && pwdOk) setSuccess(`${changed.join(', ')} and password updated!`);
      else if (profileOk) setSuccess(`${changed.join(', ')} updated!`);
      else if (pwdOk) setSuccess('Password changed successfully!');

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      if (axios.isAxiosError(err)) setError(String((err.response?.data as { message?: string })?.message ?? 'Network error.'));
      else setError('Network error.');
    } finally { setLoading(false); }
  };

  return {
    formData, setFormData, passwordData, setPasswordData,
    previewUrl, loading, fetchLoading, success, setSuccess, error, setError,
    handleFile, handleSubmit,
  };
}
