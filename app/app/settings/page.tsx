'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiDelete, safeFetch } from '@/lib/safeFetch';

interface Guideline {
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
}

interface BrandProfile {
    industry: string;
    targetAudience: string;
    tone: string;
    language: string;
    products: string;
    uvp: string;
    primaryColor: string;
    secondaryColor: string | null;
    accentColor: string | null;
    fontFamily: string | null;
    fontStyle: string | null;
    logoUrl: string | null;
    companyDescription: string | null;
    tagline: string | null;
    websiteUrl: string | null;
    instagramHandle: string | null;
    doUseWords: string | null;
    dontUseWords: string | null;
    emojiUsage: string;
    guidelines: Guideline[];
}

export default function BrandSettings() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState<any>(null);
    const [formData, setFormData] = useState<BrandProfile>({
        industry: '',
        targetAudience: '',
        tone: 'Professional',
        language: 'EN',
        products: '',
        uvp: '',
        primaryColor: '#4F46E5',
        secondaryColor: '',
        accentColor: '',
        fontFamily: 'Inter',
        fontStyle: 'modern',
        logoUrl: '',
        companyDescription: '',
        tagline: '',
        websiteUrl: '',
        instagramHandle: '',
        doUseWords: '',
        dontUseWords: '',
        emojiUsage: 'light',
        guidelines: []
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const companyId = localStorage.getItem('selectedCompanyId');

            if (!token || !companyId) {
                router.push('/login');
                return;
            }

            // Fetch company details
            const { res: companiesRes, data: companiesData } = await apiGet('/api/companies', token);
            if (companiesRes.ok) {
                const current = companiesData.data.find((c: any) => c.id === companyId);
                if (current) setCompany(current);
            }

            // Fetch brand profile
            const { res: profileRes, data: profileData } = await apiGet(`/api/brand-profile?companyId=${companyId}`, token);
            if (profileRes.ok) {
                const kit = profileData.data;
                setFormData({
                    industry: kit.industry || '',
                    targetAudience: kit.targetAudience || '',
                    tone: kit.tone || 'Professional',
                    language: kit.language || 'EN',
                    products: kit.products || '',
                    uvp: kit.uvp || '',
                    primaryColor: kit.primaryColor || '#4F46E5',
                    secondaryColor: kit.secondaryColor || '',
                    accentColor: kit.accentColor || '',
                    fontFamily: kit.fontFamily || 'Inter',
                    fontStyle: kit.fontStyle || 'modern',
                    logoUrl: kit.logoUrl || '',
                    companyDescription: kit.companyDescription || '',
                    tagline: kit.tagline || '',
                    websiteUrl: kit.websiteUrl || '',
                    instagramHandle: kit.instagramHandle || '',
                    doUseWords: kit.doUseWords || '',
                    dontUseWords: kit.dontUseWords || '',
                    emojiUsage: kit.emojiUsage || 'light',
                    guidelines: kit.guidelines || []
                });
            }
        } catch (error) {
            console.error('Fetch settings error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const companyId = localStorage.getItem('selectedCompanyId');

            // Using PATCH as requested
            const { res } = await safeFetch(`/api/brand-profile?companyId=${companyId}`, {
                method: 'PATCH',
                token: token || undefined,
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Brand Kit updated successfully!' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setMessage({ type: 'error', text: 'Failed to update Brand Kit.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const token = localStorage.getItem('token');
            const companyId = localStorage.getItem('selectedCompanyId');
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const { res, data } = await apiPost(`/api/logo?companyId=${companyId}`, formDataUpload, token || undefined);
            if (res.ok) {
                setFormData(prev => ({
                    ...prev,
                    logoUrl: data.url
                }));
            }
        } catch (error) {
            console.error('Logo upload failed:', error);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleGuidelineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingDoc(true);
        try {
            const token = localStorage.getItem('token');
            const companyId = localStorage.getItem('selectedCompanyId');
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const { res, data } = await apiPost(`/api/brand-guidelines?companyId=${companyId}`, formDataUpload, token || undefined);
            if (res.ok) {
                setFormData(prev => ({
                    ...prev,
                    guidelines: [...prev.guidelines, data.data]
                }));
            }
        } catch (error) {
            console.error('Guideline upload failed:', error);
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleDeleteGuideline = async (id: string) => {
        if (!confirm('Are you sure you want to delete this guideline?')) return;

        try {
            const token = localStorage.getItem('token');
            const { res } = await apiDelete(`/api/brand-guidelines/${id}`, token || undefined);
            if (res.ok) {
                setFormData(prev => ({
                    ...prev,
                    guidelines: prev.guidelines.filter(g => g.id !== id)
                }));
            }
        } catch (error) {
            console.error('Delete guideline failed:', error);
        }
    };

    const isAdmin = company?.userRole?.toUpperCase() === 'ADMIN';

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/app')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Brand Kit Settings</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{company?.name}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="px-8 py-6 border-b bg-gray-50/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Brand Identity & Style</h2>
                            <p className="text-sm text-gray-500 mt-1">Configure your brand assets for AI-powered content generation.</p>
                        </div>
                        {!isAdmin && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">VIEW ONLY</span>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-10">
                        {message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                {message.type === 'success' ? (
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                ) : (
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                )}
                                <span className="text-sm font-medium">{message.text}</span>
                            </div>
                        )}

                        {/* Logo & Basic Info */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">1. Logo & Identity</h3>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Logo column */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-gray-700">Company Logo</label>
                                    <div className="relative group w-40 h-40 mx-auto lg:mx-0">
                                        <div className="w-40 h-40 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-indigo-300 transition-colors">
                                            {formData.logoUrl ? (
                                                <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs text-gray-400">No logo uploaded</span>
                                                </div>
                                            )}
                                        </div>
                                        {isAdmin && (
                                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                                                <div className="text-center text-white">
                                                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="text-xs font-bold uppercase">{uploadingLogo ? '...' : 'Replace'}</span>
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Text info column */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tagline</label>
                                        <input
                                            type="text"
                                            className="input focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="Your catchy brand tagline..."
                                            value={formData.tagline || ''}
                                            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Company Description</label>
                                        <textarea
                                            className="input min-h-[100px] py-3 focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="Tell us what your company does, in detail..."
                                            value={formData.companyDescription || ''}
                                            onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Style */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">2. Visual Style</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Color pickers */}
                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Primary Color</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1 bg-white shadow-sm"
                                                value={formData.primaryColor}
                                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                                disabled={!isAdmin}
                                            />
                                            <input
                                                type="text"
                                                className="input text-xs font-mono py-1 px-2 h-10 w-24 text-center"
                                                value={formData.primaryColor}
                                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Secondary</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1 bg-white shadow-sm"
                                                value={formData.secondaryColor || '#ffffff'}
                                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                                disabled={!isAdmin}
                                            />
                                            <input
                                                type="text"
                                                className="input text-xs font-mono py-1 px-2 h-10 w-24 text-center"
                                                value={formData.secondaryColor || ''}
                                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Accent</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1 bg-white shadow-sm"
                                                value={formData.accentColor || '#ffffff'}
                                                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                                disabled={!isAdmin}
                                            />
                                            <input
                                                type="text"
                                                className="input text-xs font-mono py-1 px-2 h-10 w-24 text-center"
                                                value={formData.accentColor || ''}
                                                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Typography */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Font Family</label>
                                        <select
                                            className="input h-10"
                                            value={formData.fontFamily || 'Inter'}
                                            onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                                            disabled={!isAdmin}
                                        >
                                            <option value="Inter">Inter (Modern)</option>
                                            <option value="Poppins">Poppins (Friendly)</option>
                                            <option value="Montserrat">Montserrat (Classic)</option>
                                            <option value="Roboto">Roboto (Technical)</option>
                                            <option value="Playfair Display">Playfair (Luxury)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Font Style</label>
                                        <select
                                            className="input h-10"
                                            value={formData.fontStyle || 'modern'}
                                            onChange={(e) => setFormData({ ...formData, fontStyle: e.target.value })}
                                            disabled={!isAdmin}
                                        >
                                            <option value="modern">Modern & Minimalist</option>
                                            <option value="classic">Classic & Formal</option>
                                            <option value="playful">Playful & Dynamic</option>
                                            <option value="bold">Bold & Industrial</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social & Web */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">3. Online Presence</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Website URL</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                        </div>
                                        <input
                                            type="url"
                                            className="input pl-10 h-10"
                                            placeholder="https://yourwebsite.com"
                                            value={formData.websiteUrl || ''}
                                            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Instagram (@handle)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                        </div>
                                        <input
                                            type="text"
                                            className="input pl-10 h-10"
                                            placeholder="@yourbrand"
                                            value={formData.instagramHandle || ''}
                                            onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Guardrails */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">4. Messaging Guardrails</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mandatory Keywords</label>
                                    <p className="text-xs text-gray-500 mb-2">Our AI will prioritize these words or phrases (one per line).</p>
                                    <textarea
                                        className="input min-h-[120px] py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="Innovation&#10;Sustainable&#10;Customer First"
                                        value={formData.doUseWords || ''}
                                        onChange={(e) => setFormData({ ...formData, doUseWords: e.target.value })}
                                        disabled={!isAdmin}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Forbidden Words & Topics</label>
                                    <p className="text-xs text-gray-500 mb-2">Our AI will STRICTLY avoid these (one per line).</p>
                                    <textarea
                                        className="input min-h-[120px] py-3 font-mono text-sm border-red-100 focus:ring-2 focus:ring-red-500/20"
                                        placeholder="Cheap&#10;Politics&#10;Competitor Name"
                                        value={formData.dontUseWords || ''}
                                        onChange={(e) => setFormData({ ...formData, dontUseWords: e.target.value })}
                                        disabled={!isAdmin}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Brand Guidelines */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">5. Brand Guidelines</h3>
                                {isAdmin && (
                                    <label className="btn-secondary py-1.5 px-4 text-xs inline-flex items-center gap-2 cursor-pointer transition-all hover:bg-gray-100">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        {uploadingDoc ? 'Uploading...' : 'Add PDF'}
                                        <input type="file" className="hidden" accept=".pdf" onChange={handleGuidelineUpload} disabled={uploadingDoc} />
                                    </label>
                                )}
                            </div>

                            <div className="space-y-3">
                                {formData.guidelines.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <p className="text-sm text-gray-400 italic">No guidelines uploaded yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {formData.guidelines.map(guideline => (
                                            <div key={guideline.id} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.363 2c4.155 0 2.637 6 2.637 6s6-1.518 6 2.638v11.362c0 .552-.448 1-1 1h-13c-.552 0-1-.448-1-1v-19c0-.552.448-1 1-1h6.363zm.637-2h-8c-1.104 0-2 .896-2 2v20c0 1.104.896 2 2 2h16c1.104 0 2-.896 2-2v-16l-8-8z" /></svg>
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{guideline.fileName}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">PDF Document</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={guideline.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="View PDF">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </a>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteGuideline(guideline.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete Guideline"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="flex justify-end pt-8 border-t border-gray-100">
                                <button
                                    type="submit"
                                    className="btn-primary px-10 py-3 text-base font-bold shadow-indigo-200 shadow-lg hover:shadow-indigo-300 active:scale-[0.98] transition-all"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            <span>Saving Changes...</span>
                                        </div>
                                    ) : (
                                        'Save Brand Profile'
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
}
