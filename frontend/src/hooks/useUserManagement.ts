import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export interface ManagedUser {
  id: string;
  companyName: string;
  email: string;
  number: string;
  role: string;
  resellerCount: number;
  userCount: number;
  totalCampaigns: number;
  balance: number;
  status: 'active' | 'inactive' | 'deleted';
  createdAt: string;
  image: string;
}

export interface UsersData {
  totalUsers: number;
  users: ManagedUser[];
}

export interface ResellersData {
  totalResellers: number;
  resellers: ManagedUser[];
}

interface CreateForm {
  companyName: string;
  email: string;
  password: string;
  number: string;
  role: string;
  balance: string;
  image: File | null;
}

interface EditForm {
  companyName: string;
  email: string;
  number: string;
  password: string;
  confirmPassword: string;
}

export function useUserManagement(endpoint: string, listKey: 'users' | 'resellers') {
  const [data, setData] = useState<(UsersData | ResellersData) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [modal, setModal] = useState<'create' | 'view' | 'edit' | 'addCredit' | 'removeCredit' | 'freeze' | 'delete' | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>({ companyName: '', email: '', password: '', number: '', role: listKey === 'resellers' ? 'reseller' : 'user', balance: '', image: null });
  const [editForm, setEditForm] = useState<EditForm>({ companyName: '', email: '', number: '', password: '', confirmPassword: '' });
  const [creditAmt, setCreditAmt] = useState('');
  const [debitAmt, setDebitAmt] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: r } = await api.get<{ success: boolean; message?: string; data: UsersData | ResellersData }>(`/api/dashboard/${endpoint}`);
      if (r.success) setData(r.data);
      else setError(r.message || 'Failed to load');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toast = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const openModal = (type: typeof modal, r?: ManagedUser) => {
    setError(''); setSuccess('');
    if (r) setSelected(r);
    if (type === 'edit' && r) setEditForm({ companyName: r.companyName, email: r.email, number: r.number, password: '', confirmPassword: '' });
    if (type === 'addCredit') setCreditAmt('');
    if (type === 'removeCredit') setDebitAmt('');
    setModal(type);
  };

  const closeModal = () => { setModal(null); setSelected(null); setError(''); setSuccess(''); };

  const handleCreate = async () => {
    if (!createForm.companyName || !createForm.email || !createForm.password || !createForm.number || !createForm.balance) {
      setError('All fields are required'); return;
    }
    setActionLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(createForm).forEach(([k, v]) => { if (v !== null) fd.append(k, v instanceof File ? v : String(v)); });
      const { data: r } = await api.post<{ success: boolean; message?: string }>('/api/user/create', fd);
      if (r.success) {
        closeModal();
        setCreateForm({ companyName: '', email: '', password: '', number: '', role: listKey === 'resellers' ? 'reseller' : 'user', balance: '', image: null });
        fetchData();
        toast(`${listKey === 'resellers' ? 'Reseller' : 'User'} created successfully!`);
      } else setError(r.message || 'Failed to create');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    const hasProfile = editForm.companyName || editForm.email || editForm.number;
    const hasPass = editForm.password || editForm.confirmPassword;
    if (!hasProfile && !hasPass) { setError('Please provide at least one field'); return; }
    if (hasPass && editForm.password !== editForm.confirmPassword) { setError('Passwords do not match'); return; }
    setActionLoading(true); setError('');
    try {
      if (hasProfile) {
        const pd: Record<string, string> = {};
        if (editForm.companyName) pd.companyName = editForm.companyName;
        if (editForm.email)       pd.email       = editForm.email;
        if (editForm.number)      pd.number      = editForm.number;
        const { data: r } = await api.put<{ success: boolean; message?: string }>(`/api/user/update/${selected.id}`, pd);
        if (!r.success) { setError(r.message || 'Failed to update'); setActionLoading(false); return; }
      }
      if (hasPass) {
        const { data: r } = await api.put<{ success: boolean; message?: string }>(`/api/user/change-password/${selected.id}`, { password: editForm.password, confirmPassword: editForm.confirmPassword });
        if (!r.success) { setError(r.message || 'Failed to change password'); setActionLoading(false); return; }
      }
      closeModal(); fetchData(); toast('Updated successfully!');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleAddCredit = async () => {
    if (!selected || !creditAmt || parseFloat(creditAmt) <= 0) { setError('Enter a valid amount'); return; }
    setActionLoading(true); setError('');
    try {
      const { data: r } = await api.post<{ success: boolean; message?: string }>('/api/transaction/credit', { receiverId: selected.id, amount: parseFloat(creditAmt) });
      if (r.success) { closeModal(); fetchData(); toast(`₹${creditAmt} credited!`); }
      else setError(r.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleRemoveCredit = async () => {
    if (!selected || !debitAmt || parseFloat(debitAmt) <= 0) { setError('Enter a valid amount'); return; }
    setActionLoading(true); setError('');
    try {
      const { data: r } = await api.post<{ success: boolean; message?: string }>('/api/transaction/debit', { userId: selected.id, amount: parseFloat(debitAmt) });
      if (r.success) { closeModal(); fetchData(); toast(`₹${debitAmt} debited!`); }
      else setError(r.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleFreeze = async () => {
    if (!selected) return;
    setActionLoading(true); setError('');
    const ep = selected.status === 'active' ? 'freeze' : 'unfreeze';
    try {
      const { data: r } = await api.put<{ success: boolean; message?: string }>(`/api/user/${ep}/${selected.id}`);
      if (r.success) { closeModal(); fetchData(); toast(r.message || 'Done'); }
      else setError(r.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setActionLoading(true); setError('');
    try {
      const { data: r } = await api.delete<{ success: boolean; message?: string }>(`/api/user/delete/${selected.id}`);
      if (r.success) { closeModal(); fetchData(); toast(`${listKey === 'resellers' ? 'Reseller' : 'User'} deleted.`); }
      else setError(r.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const total = listKey === 'resellers'
    ? (data as ResellersData | null)?.totalResellers ?? 0
    : (data as UsersData | null)?.totalUsers ?? 0;

  const items = listKey === 'resellers'
    ? (data as ResellersData | null)?.resellers ?? []
    : (data as UsersData | null)?.users ?? [];

  return {
    data, loading, error, success, actionLoading,
    selected, modal, createForm, editForm, creditAmt, debitAmt,
    total, items,
    setCreateForm, setEditForm, setCreditAmt, setDebitAmt,
    openModal, closeModal,
    handleCreate, handleEdit, handleAddCredit, handleRemoveCredit, handleFreeze, handleDelete,
    refetch: fetchData,
  };
}
