'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/safeFetch';

interface Company {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    coverImage?: string;
    memberCount: number;
    userRole: string;
}

export default function CompaniesPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        // Filter companies based on search query
        if (searchQuery) {
            const filtered = companies.filter((company) =>
                company.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCompanies(filtered);
        } else {
            setFilteredCompanies(companies);
        }
    }, [searchQuery, companies]);

    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            // Fetch user info
            const { res: userRes, data: userData } = await apiGet('/api/me', token);

            if (!userRes.ok) {
                if (userRes.status === 401) {
                    throw new Error('Authentication failed');
                }
                throw new Error('Failed to load user profile');
            }

            setUser(userData.data);

            // Fetch companies
            const { res: companiesRes, data: companiesData } = await apiGet('/api/companies', token);

            if (!companiesRes.ok) {
                throw new Error('Failed to fetch companies');
            }

            setCompanies(companiesData.data);
            setFilteredCompanies(companiesData.data);
        } catch (err: any) {
            setError(err.message);
            if (err.message === 'Authentication failed') {
                localStorage.removeItem('token');
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCompanySelect = (companyId: string) => {
        localStorage.setItem('selectedCompanyId', companyId);
        router.push('/app');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('selectedCompanyId');
        router.push('/login');
    };

    const handleJoinDemo = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const { res, data } = await apiPost('/api/companies/demo-join', {}, token);

            if (!res.ok) {
                throw new Error('Failed to join demo company');
            }

            setCompanies(data.data);
            setFilteredCompanies(data.data);
            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-primary-500">Social Media Manager</h1>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-500">Social Media Manager</h1>
                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold">
                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="text-sm text-gray-700">{user.fullName}</span>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Workspace</h2>
                        <p className="text-gray-600">Choose a company to continue</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Company
                    </button>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search companies..."
                            className="input pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Companies Grid */}
                {filteredCompanies.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg
                                className="w-12 h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No companies found' : 'No companies yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search'
                                : "You haven't been added to any companies yet."}
                        </p>

                        {!searchQuery && (
                            <button
                                onClick={handleJoinDemo}
                                className="btn-primary inline-flex items-center gap-2"
                                disabled={loading}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Join Demo Company
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCompanies.map((company) => (
                            <button
                                key={company.id}
                                onClick={() => handleCompanySelect(company.id)}
                                className="text-left bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group"
                            >
                                {/* Cover Image */}
                                <div
                                    className="w-full h-32 bg-gradient-to-br from-primary-500 to-primary-700 group-hover:from-primary-600 group-hover:to-primary-800 transition-all duration-300"
                                    style={
                                        company.coverImage
                                            ? {
                                                backgroundImage: `url(${company.coverImage})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }
                                            : undefined
                                    }
                                />

                                {/* Logo */}
                                <div className="relative px-6 -mt-8 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                                        {company.logo ? (
                                            <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                                                {company.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 pb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{company.name}</h3>
                                    <p className="text-sm text-gray-600">
                                        {company.memberCount} {company.memberCount === 1 ? 'member' : 'members'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
            {showCreateModal && (
                <CreateCompanyModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={(newCompanyId) => {
                        handleCompanySelect(newCompanyId);
                    }}
                />
            )}
        </div>
    );
}

function CreateCompanyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
    const [name, setName] = useState('');
    const [industry, setIndustry] = useState('');
    const [brandColor, setBrandColor] = useState('#6366f1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Company name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiPost('/api/companies', {
                name: name.trim(),
                industry: industry.trim(),
                brandColor
            }, token || undefined);

            if (res.ok) {
                // Success
                onSuccess(data.data.company.id);
            } else {
                setError(data.error || 'Failed to create company');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Create Company</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={`input ${error.includes('name') ? 'border-red-500' : ''}`}
                            placeholder="e.g. Acme Corp"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Industry <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g. Technology, Fashion"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Brand Color <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                className="w-10 h-10 rounded cursor-pointer border-none p-0"
                                value={brandColor}
                                onChange={(e) => setBrandColor(e.target.value)}
                                disabled={loading}
                            />
                            <input
                                type="text"
                                className="input flex-1"
                                placeholder="#6366f1"
                                value={brandColor}
                                onChange={(e) => setBrandColor(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
