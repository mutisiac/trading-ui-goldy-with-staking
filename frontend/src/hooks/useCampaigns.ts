import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export interface Campaign {
  campaignId: string;
  campaignName: string;
  status: string;
  statusMessage: string;
  message: string;
  createdBy: string;
  mobileNumberCount: number;
  createdAt: string;
  image: string;
  userData?: {
    companyName: string;
    email: string;
    number: string;
    role: string;
    status: string;
    createdAt: string;
  };
}

export interface CampaignsData {
  totalCampaigns: number;
  campaigns: Campaign[];
}

export function useCampaigns(endpoint: string) {
  const [data, setData] = useState<CampaignsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<Campaign['userData'] | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: r } = await api.get<{ success: boolean; message?: string; data: CampaignsData; userData?: Campaign['userData'] }>(endpoint);
      if (r.success) {
        setData(r.data);
        if (r.userData) setUserData(r.userData);
      } else setError(r.message || 'Failed');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const downloadExcel = async (
    id: string,
    downloading: Set<string>,
    setDownloading: React.Dispatch<React.SetStateAction<Set<string>>>,
    setDlError: (e: string | null) => void,
  ) => {
    if (downloading.has(id)) return;
    setDownloading(p => new Set(p).add(id)); setDlError(null);
    try {
      const res = await api.get(`/api/dashboard/export-campaign/${id}`, { responseType: 'blob', validateStatus: () => true });
      if (res.status >= 400) { const t = await (res.data as Blob).text(); throw new Error(JSON.parse(t)?.message || 'Failed'); }
      const cd = res.headers['content-disposition'] || '';
      const fn = cd.match(/filename="?(.+)"?/i)?.[1] || `Campaign_${id}.xlsx`;
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a'); a.href = url; a.download = fn;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) {
      setDlError(e instanceof Error ? e.message : 'Failed');
      setTimeout(() => setDlError(null), 5000);
    } finally {
      setDownloading(p => { const n = new Set(p); n.delete(id); return n; });
    }
  };

  return { data, loading, error, userData, refetch: fetchData, downloadExcel };
}
