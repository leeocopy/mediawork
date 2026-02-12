'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatMonthYear, getMonthDays, isSameMonth, isSameDay, startOfMonth, endOfMonth } from '@/lib/calendarUtils';
import { Platform, PostStatus, PostType } from '@/lib/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/safeFetch';

interface Post {
    id: string;
    companyId: string;
    date: string; // YYYY-MM-DD format
    platform: Platform;
    postType: PostType;
    title: string;
    notes?: string;
    status: PostStatus;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

interface Company {
    id: string;
    name: string;
}

// ============================================================================
// EXACT dayKey FUNCTION USED EVERYWHERE
// ============================================================================
/**
 * Converts a Date object to "YYYY-MM-DD" string format (local timezone).
 * This is THE SINGLE SOURCE OF TRUTH for date comparison.
 */
function getDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// ============================================================================

export default function CalendarDashboard() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [posts, setPosts] = useState<Post[]>([]);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [user, setUser] = useState<any>(null);
    const [approvedPosts, setApprovedPosts] = useState<Post[]>([]);
    const [loadingApproved, setLoadingApproved] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        initializePage();
    }, []);

    useEffect(() => {
        if (company) {
            fetchPosts();
            fetchApprovedPosts();
        }
    }, [currentDate, company]);

    const initializePage = async () => {
        try {
            const token = localStorage.getItem('token');
            const selectedCompanyId = localStorage.getItem('selectedCompanyId');

            console.log('🔍 [INIT] selectedCompanyId from localStorage:', selectedCompanyId);

            if (!token) {
                router.push('/login');
                return;
            }

            if (!selectedCompanyId) {
                console.warn('⚠️ [INIT] No selectedCompanyId found, redirecting to companies');
                router.push('/companies');
                return;
            }

            // Fetch user info
            const { res: userRes, data: userData } = await apiGet('/api/me', token);
            if (userRes.ok) {
                setUser(userData.data);
                console.log('✅ [INIT] User loaded:', userData.data.email);
            }

            // Fetch company info
            const { res: companiesRes, data: companiesData } = await apiGet('/api/companies', token);
            if (companiesRes.ok) {
                const selectedCompany = companiesData.data.find((c: any) => c.id === selectedCompanyId);

                if (selectedCompany) {
                    setCompany(selectedCompany);
                    console.log('✅ [INIT] Company loaded:', selectedCompany.name, '(ID:', selectedCompany.id, ')');
                } else {
                    console.error('❌ [INIT] Selected company not found in user companies');
                    console.error('  - selectedCompanyId:', selectedCompanyId);
                    console.error('  - Available companies:', companiesData.data.map((c: any) => c.id));
                    // Clear invalid selection and redirect
                    localStorage.removeItem('selectedCompanyId');
                    router.push('/companies');
                }
            } else {
                console.error('❌ [INIT] Failed to fetch companies');
            }
        } catch (error) {
            console.error('❌ [INIT] Init error:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        if (!company) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const start = getDayKey(startOfMonth(currentDate));
            const end = getDayKey(endOfMonth(currentDate));

            const { res, data } = await apiGet(
                `/api/companies/${company.id}/posts?startDate=${start}&endDate=${end}`,
                token || undefined
            );

            if (res.ok) {
                console.log(`✅ Fetched ${data?.data?.length || 0} posts for ${formatMonthYear(currentDate)}`);
                setPosts(data?.data || []);
            }
        } catch (error) {
            console.error('Fetch posts error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApprovedPosts = async () => {
        if (!company) return;
        setLoadingApproved(true);
        try {
            const token = localStorage.getItem('token');
            const start = getDayKey(startOfMonth(currentDate));
            const end = getDayKey(endOfMonth(currentDate));
            const { res, data } = await apiGet(`/api/companies/${company.id}/approved?from=${start}&to=${end}`, token || undefined);
            if (res.ok) {
                setApprovedPosts(data.data);
            }
        } catch (err) {
            console.error('Fetch approved posts error:', err);
        } finally {
            setLoadingApproved(false);
        }
    };

    const handleExportPackage = async (postId: string) => {
        try {
            const token = localStorage.getItem('token');
            const { res } = await apiGet(`/api/posts/${postId}/export`, token || undefined);
            if (res.ok) {
                const blob = await res.blob();
                const disposition = res.headers.get('Content-Disposition');
                let filename = 'package.zip';
                if (disposition && disposition.indexOf('filename=') !== -1) {
                    filename = disposition.split('filename=')[1].replace(/["']/g, '');
                }
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to export package.');
            }
        } catch (err) {
            console.error('Export error:', err);
            alert('Error exporting package.');
        }
    };

    const handleCreatePost = async (postData: any) => {
        const token = localStorage.getItem('token');
        const selectedCompanyId = localStorage.getItem('selectedCompanyId');

        // Detailed logging for debugging
        console.log(' [FRONTEND] handleCreatePost called:');
        console.log('  - Company state:', company);
        console.log('  - Company ID from state:', company?.id);
        console.log('  - selectedCompanyId from localStorage:', selectedCompanyId);
        console.log('  - Post data:', postData);

        if (!company) {
            console.error('❌ [FRONTEND] Company state is null!');
            return {
                success: false,
                error: 'Company not loaded. Please refresh the page and try again.',
            };
        }

        const apiUrl = `/api/companies/${company.id}/posts`;
        console.log(`📤 [FRONTEND] Sending POST to: ${apiUrl}`);

        const { res, data } = await apiPost(apiUrl, postData, token!);

        if (res.ok) {
            console.log('✅ Post created successfully:', data.data);
            setShowCreateModal(false);

            // Immediately refresh posts to show the new one
            await fetchPosts();
            return { success: true, data: data.data };
        } else {
            const result = data;
            console.error('❌ Create post failed:', result);
            console.error('  - Status:', res.status);
            console.error('  - Error:', result.error);
            console.error('  - Details:', result.details);

            // Handle 403 Forbidden with user-friendly message
            if (res.status === 403) {
                const hint = result.details?.hint || 'You may not have permission to create posts in this company.';
                return {
                    success: false,
                    error: `${result.error || 'Access Denied'}`,
                    hint: hint,
                    showCompanySwitchCTA: true,
                };
            }

            // Return errors to the modal
            return {
                success: false,
                error: result.error,
                fieldErrors: result.details || {},
            };
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const token = localStorage.getItem('token');
            const { res } = await apiDelete(`/api/posts/${postId}`, token || undefined);

            if (res.ok) {
                console.log('✅ Post deleted:', postId);
                setSelectedPost(null);
                fetchPosts();
            }
        } catch (error) {
            console.error('Delete post error:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('selectedCompanyId');
        router.push('/login');
    };

    const handleSwitchCompany = () => {
        router.push('/companies');
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    /**
     * Get all posts for a specific date.
     * Uses getDayKey() for consistent "YYYY-MM-DD" comparison.
     */
    const getPostsForDate = (date: Date): Post[] => {
        const dayKey = getDayKey(date);
        return posts.filter(post => {
            const matchesDate = post.date === dayKey;
            if (statusFilter === 'ALL') return matchesDate;
            return matchesDate && post.status === statusFilter;
        });
    };

    const getPlatformColor = (platform: Platform): string => {
        switch (platform) {
            case 'Instagram': return 'from-purple-500 to-pink-500';
            case 'Facebook': return 'from-blue-600 to-blue-700';
            case 'LinkedIn': return 'from-blue-700 to-blue-800';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const getPlatformIcon = (platform: Platform): string => {
        switch (platform) {
            case 'Instagram': return '📷';
            case 'Facebook': return '👥';
            case 'LinkedIn': return '💼';
            default: return '📱';
        }
    };

    const monthDays = getMonthDays(currentDate);
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (loading && !company) {
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
                            <h1 className="text-2xl font-bold text-primary-500">Social Media Manager</h1>
                            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">Step 2 Calendar (build v1)</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {company && (
                                <button
                                    onClick={handleSwitchCompany}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    <span className="font-medium">{company.name}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            )}
                            {user && (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                                        {user.fullName?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            )}
                            {company && (
                                <button
                                    onClick={() => router.push('/app/settings')}
                                    className="text-sm text-gray-600 hover:text-gray-900 border-r pr-4 mr-2"
                                >
                                    Brand Kit
                                </button>
                            )}
                            <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Approved Projects Panel */}
                {approvedPosts.length > 0 && (
                    <div className="mb-8 bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">✅</span>
                                <h3 className="font-bold text-green-800">Ready for Handoff ({approvedPosts.length})</h3>
                            </div>
                            <p className="text-xs text-green-600 font-medium">Approved this month</p>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {approvedPosts.map((post: any) => (
                                <div key={post.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50 hover:border-green-300 transition-colors group">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-xs">{getPlatformIcon(post.platform)}</span>
                                            <p className="text-sm font-bold text-gray-900 truncate" title={post.title}>{post.title}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-500 uppercase">{post.platform} • {post.date}</p>
                                    </div>
                                    <button
                                        onClick={() => handleExportPackage(post.id)}
                                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
                                        title="Export ZIP Package"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Calendar Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button onClick={prevMonth} className="p-2 hover:bg-gray-200 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900 min-w-[200px] text-center">{formatMonthYear(currentDate)}</h2>
                            <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Filter Chips */}
                        <div className="flex items-center bg-white border rounded-lg p-1 ml-4 shadow-sm">
                            {(['ALL', 'APPROVED', 'SCHEDULED', 'PUBLISHED'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === s
                                        ? 'bg-primary-500 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {s === 'ALL' ? 'All Posts' : s.charAt(0) + s.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedDate(getDayKey(new Date()));
                            setShowCreateModal(true);
                        }}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Post
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Week day headers */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b">
                        {weekDays.map(day => (
                            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7">
                        {monthDays.map((day, idx) => {
                            const dayPosts = getPostsForDate(day);
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isToday = isSameDay(day, new Date());
                            const dayKey = getDayKey(day);

                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[120px] border-b border-r p-2 cursor-pointer ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                                        } ${isToday ? 'bg-blue-50' : ''}`}
                                    onClick={() => {
                                        setSelectedDate(dayKey);
                                        setShowCreateModal(true);
                                    }}
                                    title={`Click to add post on ${dayKey}`}
                                >
                                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-600 font-bold' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                        {day.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                        {dayPosts.slice(0, 3).map(post => (
                                            <button
                                                key={post.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPost(post);
                                                }}
                                                className={`relative w-full text-left p-1.5 rounded text-xs bg-gradient-to-r ${getPlatformColor(post.platform)} text-white hover:shadow-md transition-all border-l-4 ${post.status === 'APPROVED' ? 'border-green-400' :
                                                    post.status === 'SCHEDULED' ? 'border-blue-400' :
                                                        post.status === 'PUBLISHED' ? 'border-purple-400' :
                                                            post.status === 'CHANGES_REQUESTED' ? 'border-red-400' :
                                                                post.status === 'PENDING_REVIEW' ? 'border-amber-400' :
                                                                    'border-transparent'
                                                    }`}
                                                title={`${post.title} - ${post.platform} (${post.status})`}
                                            >
                                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                                    <div className="flex items-center gap-1 truncate font-bold">
                                                        <span>{getPlatformIcon(post.platform)}</span>
                                                        <span className="truncate">{post.title}</span>
                                                    </div>
                                                    {(post.status === 'APPROVED' || post.status === 'PUBLISHED') && (
                                                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    {post.status === 'SCHEDULED' && (
                                                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] opacity-90">
                                                    <span>{post.postType}</span>
                                                    <span className="uppercase text-[7px] font-black bg-white bg-opacity-20 px-1 rounded">{post.status.split('_')[0]}</span>
                                                </div>
                                            </button>
                                        ))}
                                        {dayPosts.length > 3 && (
                                            <div className="text-xs text-gray-500 text-center">+{dayPosts.length - 3} more</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Empty State */}
                {posts.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-5xl mb-4">📅</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts scheduled</h3>
                        <p className="text-gray-600 mb-4">Click &quot;+ Add Post&quot; or click on a date to create your first post</p>
                    </div>
                )}
            </main>

            {/* Create Post Modal */}
            {showCreateModal && (
                <CreatePostModal
                    date={selectedDate}
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreatePost}
                />
            )}

            {/* Post Details Modal */}
            {selectedPost && (
                <PostDetailsModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onDelete={handleDeletePost}
                    onUpdate={() => {
                        fetchPosts();
                        fetchApprovedPosts();
                    }}
                    handleExportPackage={handleExportPackage}
                />
            )}
        </div>
    );
}

// Create Post Modal Component with Field-Level Error Handling
function CreatePostModal({ date, onClose, onCreate }: any) {
    const [formData, setFormData] = useState({
        date: date,
        platform: 'Instagram' as Platform,
        postType: 'Promo' as PostType,
        title: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [generalError, setGeneralError] = useState('');
    const [errorHint, setErrorHint] = useState('');
    const [showCompanySwitchCTA, setShowCompanySwitchCTA] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setErrors({});
        setGeneralError('');
        setErrorHint('');
        setShowCompanySwitchCTA(false);

        // Client-side validation
        const newErrors: Record<string, string> = {};

        if (!formData.date) {
            newErrors.date = 'Date is required';
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
            newErrors.date = 'Date must be in YYYY-MM-DD format';
        }

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);

        try {
            const result = await onCreate(formData);

            if (!result.success) {
                // Handle API validation errors
                if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
                    setErrors(result.fieldErrors);
                } else {
                    setGeneralError(result.error || 'Failed to create post');
                    if (result.hint) {
                        setErrorHint(result.hint);
                    }
                    if (result.showCompanySwitchCTA) {
                        setShowCompanySwitchCTA(true);
                    }
                }
                setSubmitting(false);
            }
            // If successful, modal will close automatically via parent
        } catch (err) {
            setGeneralError('Failed to create post. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Create Post</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={submitting}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date * <span className="text-xs text-gray-500">(YYYY-MM-DD)</span>
                        </label>
                        <input
                            type="date"
                            className={`input ${errors.date ? 'border-red-500 focus:ring-red-500' : ''}`}
                            value={formData.date}
                            onChange={(e) => {
                                setFormData({ ...formData, date: e.target.value });
                                // Clear error when user types
                                if (errors.date) {
                                    setErrors({ ...errors, date: '' });
                                }
                            }}
                            required
                            disabled={submitting}
                        />
                        {errors.date && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.date}
                            </p>
                        )}
                    </div>

                    {/* Platform Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Platform *</label>
                        <div className="flex gap-3">
                            {['Instagram', 'Facebook', 'LinkedIn'].map(platform => (
                                <label key={platform} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="platform"
                                        value={platform}
                                        checked={formData.platform === platform}
                                        onChange={(e) => setFormData({ ...formData, platform: e.target.value as Platform })}
                                        className="text-primary-500"
                                        disabled={submitting}
                                    />
                                    <span className="text-sm">{platform}</span>
                                </label>
                            ))}
                        </div>
                        {errors.platform && (
                            <p className="mt-1 text-sm text-red-600">{errors.platform}</p>
                        )}
                    </div>

                    {/* Post Type Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Post Type *</label>
                        <select
                            className={`input ${errors.postType ? 'border-red-500' : ''}`}
                            value={formData.postType}
                            onChange={(e) => {
                                setFormData({ ...formData, postType: e.target.value as PostType });
                                if (errors.postType) {
                                    setErrors({ ...errors, postType: '' });
                                }
                            }}
                            required
                            disabled={submitting}
                        >
                            <option value="Promo">Promo</option>
                            <option value="Educational">Educational</option>
                            <option value="Announcement">Announcement</option>
                            <option value="Testimonial">Testimonial</option>
                        </select>
                        {errors.postType && (
                            <p className="mt-1 text-sm text-red-600">{errors.postType}</p>
                        )}
                    </div>

                    {/* Title Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            className={`input ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                            value={formData.title}
                            onChange={(e) => {
                                setFormData({ ...formData, title: e.target.value });
                                if (errors.title) {
                                    setErrors({ ...errors, title: '' });
                                }
                            }}
                            placeholder="e.g., Product Launch"
                            maxLength={100}
                            required
                            disabled={submitting}
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                    </div>

                    {/* Notes Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            className={`input ${errors.notes ? 'border-red-500' : ''}`}
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => {
                                setFormData({ ...formData, notes: e.target.value });
                                if (errors.notes) {
                                    setErrors({ ...errors, notes: '' });
                                }
                            }}
                            placeholder="Optional description..."
                            maxLength={1000}
                            disabled={submitting}
                        />
                        {errors.notes && (
                            <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                        )}
                    </div>

                    {/* General Error Message */}
                    {generalError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2 mb-2">
                                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800">{generalError}</p>
                                    {errorHint && (
                                        <p className="text-xs text-red-600 mt-1">{errorHint}</p>
                                    )}
                                </div>
                            </div>
                            {showCompanySwitchCTA && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        window.location.href = '/companies';
                                    }}
                                    className="w-full mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    Switch Company
                                </button>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            {submitting ? 'Creating...' : 'Create Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Helper component for secure image loading
function SecureImage({ url, alt, className }: { url: string; alt: string; className?: string }) {
    const [src, setSrc] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let currentSrc = '';

        const fetchImage = async () => {
            try {
                const token = localStorage.getItem('token');
                const { res: response } = await apiGet(url, token || undefined);
                if (response.ok) {
                    const blob = await response.blob();
                    currentSrc = URL.createObjectURL(blob);
                    if (isMounted) {
                        setSrc(currentSrc);
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error('Error fetching secure image:', error);
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
            if (currentSrc) URL.revokeObjectURL(currentSrc);
        };
    }, [url]);

    if (loading) {
        return <div className="w-full h-full bg-gray-100 animate-pulse" />;
    }

    return <img src={src} alt={alt} className={className} />;
}

// Post Details Modal Component with AI Generation
function PostDetailsModal({ post: initialPost, onClose, onDelete, onUpdate, handleExportPackage }: any) {
    const router = useRouter();
    const [post, setPost] = useState(initialPost);
    const [aiOutput, setAiOutput] = useState<any>(null);
    const [assets, setAssets] = useState<any[]>([]);
    const [review, setReview] = useState<any>(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [loadingReview, setLoadingReview] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [reviewComment, setReviewComment] = useState('');
    const [error, setError] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [publishedUrl, setPublishedUrl] = useState('');
    const [scheduling, setScheduling] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [rendering, setRendering] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [activeAiTab, setActiveAiTab] = useState<'content' | 'images'>('content');

    useEffect(() => {
        fetchData();
    }, [post.id]);

    const fetchData = async () => {
        fetchAIOutput();
        fetchAssets();
        fetchReview();
    };

    const fetchAIOutput = async () => {
        setLoadingAI(true);
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiGet(`/api/posts/${post.id}/ai-output`, token || undefined);
            if (res.ok) {
                setAiOutput(data.data);
            }
        } catch (err) {
            console.error('Fetch AI output error:', err);
        } finally {
            setLoadingAI(false);
        }
    };

    const fetchAssets = async () => {
        setLoadingAssets(true);
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiGet(`/api/posts/${post.id}/assets`, token || undefined);
            if (res.ok) {
                setAssets(data.data);
            }
        } catch (err) {
            console.error('Fetch assets error:', err);
        } finally {
            setLoadingAssets(false);
        }
    };

    const fetchReview = async () => {
        setLoadingReview(true);
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiGet(`/api/posts/${post.id}/review`, token || undefined);
            if (res.ok) {
                setReview(data.data);
            }
        } catch (err) {
            console.error('Fetch review error:', err);
        } finally {
            setLoadingReview(false);
        }
    };

    const handleGenerateAI = async () => {
        setGenerating(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiPost(`/api/posts/${post.id}/generate`, {}, token || undefined);
            if (res.ok) {
                setAiOutput(data.data);
            } else {
                setError(data.error || 'Failed to generate content');
            }
        } catch (err) {
            setError('An error occurred during generation');
        } finally {
            setGenerating(false);
        }
    };

    const handleRenderVisuals = async () => {
        setRendering(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiPost(`/api/posts/${post.id}/render`, {}, token || undefined);
            if (res.ok) {
                fetchAIOutput();
                onUpdate();
            } else {
                setError(data.error || 'Failed to render visuals');
            }
        } catch (err) {
            setError('An error occurred during rendering');
        } finally {
            setRendering(false);
        }
    };

    const handleExportZIP = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/posts/${post.id}/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `post_package_${post.id}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                setError('Export failed');
            }
        } catch (err) {
            setError('Error exporting package');
        } finally {
            setExporting(false);
        }
    };

    const handleUploadDesign = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);

            const { res, data } = await apiPost(`/api/posts/${post.id}/assets`, formData, token || undefined);
            if (res.ok) {
                setAssets(prev => [data.data, ...prev]);
                // Refresh post status
                setPost({ ...post, status: 'PENDING_REVIEW' });
                onUpdate();
            } else {
                setError(data.error || 'Failed to upload design');
            }
        } catch (err) {
            setError('An error occurred during upload');
        } finally {
            setUploading(false);
        }
    };

    const handleReview = async (status: 'APPROVED' | 'CHANGES_REQUESTED') => {
        if (status === 'CHANGES_REQUESTED' && !reviewComment) {
            setError('Please provide a comment for requested changes');
            return;
        }

        setReviewing(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiPost(`/api/posts/${post.id}/review`, { status, comment: reviewComment }, token || undefined);
            if (res.ok) {
                setReview(data.data);
                setPost({ ...post, status: data.data.status });
                onUpdate();
                setReviewComment('');
            } else {
                setError(data.error || 'Failed to submit review');
            }
        } catch (err) {
            setError('An error occurred during review submission');
        } finally {
            setReviewing(false);
        }
    };

    const handleSecureDownload = async (assetId: string, fileName: string) => {
        try {
            const token = localStorage.getItem('token');
            const { res } = await apiGet(`/api/posts/${post.id}/assets/${assetId}/download`, token || undefined);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }, 0);
            } else {
                alert('Failed to download file.');
            }
        } catch (err) {
            console.error('Download error:', err);
            alert('Error downloading file.');
        }
    };

    const handleSchedule = async () => {
        if (!scheduledAt) {
            setError('Please select a date and time');
            return;
        }

        setScheduling(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiPut(`/api/posts/${post.id}/schedule`, { scheduledAt }, token || undefined);
            if (res.ok) {
                setPost({ ...post, status: 'SCHEDULED', scheduledAt });
                onUpdate();
            } else {
                setError(data.error || 'Failed to schedule post');
            }
        } catch (err) {
            setError('An error occurred during scheduling');
        } finally {
            setScheduling(false);
        }
    };

    const handlePublish = async () => {
        setPublishing(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiPut(`/api/posts/${post.id}/publish`, { publishedUrl }, token || undefined);
            if (res.ok) {
                setPost({ ...post, status: 'PUBLISHED', publishedAt: new Date().toISOString(), publishedUrl });
                onUpdate();
            } else {
                setError(data.error || 'Failed to publish post');
            }
        } catch (err) {
            setError('An error occurred during publishing');
        } finally {
            setPublishing(false);
        }
    };

    // Initialize scheduledAt from post if available
    useEffect(() => {
        if (post.scheduledAt) {
            // Format for datetime-local input: YYYY-MM-DDTHH:mm
            const date = new Date(post.scheduledAt);
            // Adjust to local time string manual formatting to avoid timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            setScheduledAt(`${year}-${month}-${day}T${hours}:${minutes}`);
        }
        if (post.publishedUrl) {
            setPublishedUrl(post.publishedUrl);
        }
    }, [post]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Post Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Metadata */}
                    <div className="md:col-span-1 space-y-4 border-r pr-6">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900">{post.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                📅 {post.date}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-lg text-center font-medium">
                                {post.platform}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-lg text-center font-medium">
                                {post.postType}
                            </span>
                            <div className="mt-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                                <span className={`block px-3 py-1 text-sm rounded-lg text-center font-bold ${post.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    post.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                        post.status === 'PUBLISHED' ? 'bg-purple-100 text-purple-700' :
                                            post.status === 'CHANGES_REQUESTED' ? 'bg-red-100 text-red-700' :
                                                post.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-700'
                                    }`}>
                                    {post.status.replace('_', ' ')}
                                </span>
                            </div>

                            {post.status === 'APPROVED' && (
                                <button
                                    onClick={() => handleExportPackage(post.id, post.title)}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-all shadow-md shadow-green-100"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export Package
                                </button>
                            )}

                            {/* Scheduling Section */}
                            {(post.status === 'APPROVED' || post.status === 'SCHEDULED') && (
                                <div className="mt-6 pt-6 border-t">
                                    <h5 className="text-sm font-bold text-gray-900 mb-2">📅 Schedule</h5>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        className="w-full text-sm border rounded p-2 mb-2"
                                    />
                                    <button
                                        onClick={handleSchedule}
                                        disabled={scheduling}
                                        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {scheduling ? 'Saving...' : 'Save Schedule'}
                                    </button>
                                </div>
                            )}

                            {/* Publishing Section */}
                            {(post.status === 'APPROVED' || post.status === 'SCHEDULED') && (
                                <div className="mt-6 pt-6 border-t">
                                    <h5 className="text-sm font-bold text-gray-900 mb-2">🚀 Publish</h5>
                                    <input
                                        type="text"
                                        placeholder="Post URL (optional)"
                                        value={publishedUrl}
                                        onChange={(e) => setPublishedUrl(e.target.value)}
                                        className="w-full text-sm border rounded p-2 mb-2"
                                    />
                                    <button
                                        onClick={handlePublish}
                                        disabled={publishing}
                                        className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {publishing ? 'Publishing...' : 'Mark as Published'}
                                    </button>
                                </div>
                            )}

                            {/* Published View */}
                            {post.status === 'PUBLISHED' && (
                                <div className="mt-6 pt-6 border-t">
                                    <h5 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
                                        <span>🚀 Published</span>
                                        <span className="text-xs font-normal text-gray-500">
                                            {new Date(post.publishedAt).toLocaleDateString()}
                                        </span>
                                    </h5>
                                    {post.publishedUrl && (
                                        <a
                                            href={post.publishedUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline break-all"
                                        >
                                            {post.publishedUrl}
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {post.notes && (
                            <div className="pt-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Description:</p>
                                <p className="text-sm text-gray-700 leading-relaxed italic">{post.notes}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <button
                                onClick={() => onDelete(post.id)}
                                className="w-full px-4 py-2 text-red-600 hover:bg-red-50 text-sm rounded-lg transition-colors"
                            >
                                Delete Post
                            </button>
                        </div>
                    </div>

                    {/* Right: Content & Assets Area */}
                    <div className="md:col-span-2 space-y-8">
                        {/* AI Content Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="font-bold text-gray-900">1. AI Content</h4>
                                <div className="flex items-center gap-3">
                                    {aiOutput && (
                                        <>
                                            <span className="text-[10px] text-green-600 font-black bg-green-50 px-2 py-0.5 rounded border border-green-100">V{aiOutput.version}</span>
                                            <div className="flex bg-gray-100 p-0.5 rounded-lg border">
                                                <button
                                                    onClick={() => setActiveAiTab('content')}
                                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeAiTab === 'content' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    CONTENT
                                                </button>
                                                <button
                                                    onClick={() => setActiveAiTab('images')}
                                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeAiTab === 'images' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    IMAGES
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {loadingAI ? (
                                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                                    <p className="mt-2 text-sm text-gray-500">Loading output...</p>
                                </div>
                            ) : aiOutput ? (
                                <div className="space-y-6">
                                    {activeAiTab === 'content' ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                            {/* Brief */}
                                            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                                                <h5 className="text-xs font-bold text-primary-700 uppercase mb-2">Internal Brief</h5>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-[10px] text-primary-600 font-bold uppercase">Hook:</p>
                                                        <p className="text-sm text-gray-900">{aiOutput.internalBrief?.hook || 'No hook generated.'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-primary-600 font-bold uppercase">Key Message:</p>
                                                        <p className="text-sm text-gray-900">{aiOutput.internalBrief?.keyMessage || 'No key message generated.'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-primary-600 font-bold uppercase">CTA:</p>
                                                        <p className="text-sm text-gray-900 font-medium">{aiOutput.internalBrief?.cta || 'No CTA generated.'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Caption */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h5 className="text-xs font-bold text-gray-500 uppercase">Primary Caption</h5>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(aiOutput.primaryCaption || '')}
                                                        className="text-xs text-primary-600 hover:underline"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                                <div className="bg-white border rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                                                    {aiOutput.primaryCaption || 'No caption generated.'}
                                                </div>
                                            </div>

                                            {/* Accessibility */}
                                            {aiOutput.altText && (
                                                <div className="bg-gray-100 p-3 rounded-lg border border-dashed">
                                                    <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Accessibility (Alt Text)</h5>
                                                    <p className="text-xs text-gray-700 italic">{aiOutput.altText}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                                            {/* Visual System Header */}
                                            {aiOutput.visualSystem && (
                                                <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                                                    <div className="flex items-center gap-6">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Brand Palette</p>
                                                            <div className="flex gap-1.5">
                                                                <div className="w-5 h-5 rounded-md border border-gray-200 shadow-sm" style={{ backgroundColor: aiOutput.visualSystem.palette.primary }} title="Primary"></div>
                                                                <div className="w-5 h-5 rounded-md border border-gray-200 shadow-sm" style={{ backgroundColor: aiOutput.visualSystem.palette.secondary }} title="Secondary"></div>
                                                                <div className="w-5 h-5 rounded-md border border-gray-200 shadow-sm" style={{ backgroundColor: aiOutput.visualSystem.palette.accent }} title="Accent"></div>
                                                            </div>
                                                        </div>
                                                        <div className="w-px h-8 bg-gray-100"></div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Typography</p>
                                                            <p className="text-xs font-black text-gray-900">{aiOutput.visualSystem.typography.fontFamily}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase">{aiOutput.visualSystem.typography.fontStyle}</p>
                                                        </div>
                                                    </div>

                                                    {!aiOutput.image_ideas?.some((p: any) => p.status === 'RENDERED') ? (
                                                        <button
                                                            onClick={handleRenderVisuals}
                                                            disabled={rendering}
                                                            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 group"
                                                        >
                                                            {rendering ? (
                                                                <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> RENDERING...</>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                    GENERATE FINAL VISUALS
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={handleExportZIP}
                                                            disabled={exporting}
                                                            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black shadow-lg transition-all flex items-center gap-2"
                                                        >
                                                            {exporting ? 'EXPORTING...' : 'EXPORT ZIP PACKAGE'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {aiOutput.image_ideas && aiOutput.image_ideas.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-8">
                                                    {aiOutput.image_ideas.map((plan: any, idx: number) => (
                                                        <div key={idx} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group/card border-gray-100">
                                                            <div className="bg-gray-50/50 px-5 py-3 border-b flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="flex items-center justify-center w-6 h-6 bg-gray-900 text-white text-[10px] font-black rounded-lg">#0{(idx + 1)}</span>
                                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{plan.format?.replace('_', ' ') || plan.id?.replace('_', ' ') || 'TEMPLATE'}</span>
                                                                </div>
                                                                {plan.status === 'RENDERED' ? (
                                                                    <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                                        RENDERED
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 uppercase">Pending Render</span>
                                                                )}
                                                            </div>

                                                            <div className="relative aspect-square md:aspect-video bg-gray-100 overflow-hidden">
                                                                {plan.finalUrl ? (
                                                                    <>
                                                                        <img
                                                                            src={plan.finalUrl}
                                                                            alt={plan.title}
                                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                                                                        />
                                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                            <div className="flex gap-2">
                                                                                <a href={plan.finalUrl} target="_blank" rel="noreferrer" className="flex-1 bg-white text-black py-2.5 rounded-xl text-xs font-black text-center shadow-2xl hover:bg-gray-50 transition-colors">VIEW FULL PNG</a>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const link = document.createElement('a');
                                                                                        link.href = plan.finalUrl;
                                                                                        link.download = `visual_${(idx + 1)}.png`;
                                                                                        link.click();
                                                                                    }}
                                                                                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-2xl hover:bg-indigo-700 transition-colors"
                                                                                >
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-8 text-center">
                                                                        <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center animate-pulse">
                                                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-gray-900">Visual Plan Ready</p>
                                                                            <p className="text-xs text-gray-400 mt-1">Click &quot;Generate Final Visuals&quot; to render the high-quality PNG based on your brand kit.</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="p-6 space-y-5 bg-white">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[10px] font-black text-indigo-600 uppercase">Image Prompt</p>
                                                                        <p className="text-xs text-gray-600 leading-relaxed italic">&quot;{plan.image_prompt}&quot;</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[10px] font-black text-gray-400 uppercase">Dimensions</p>
                                                                        <p className="text-xs text-gray-900 font-bold">{plan.composition}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Overlay Headline</p>
                                                                        <p className="text-sm font-black text-gray-800 leading-tight tracking-tight uppercase">{plan.text_overlay.headline}</p>
                                                                    </div>
                                                                    {plan.text_overlay.sub && (
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Sub-headline</p>
                                                                            <p className="text-xs text-gray-600">{plan.text_overlay.sub}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                    <h3 className="text-gray-900 font-bold">No Visual Plans Yet</h3>
                                                    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">Generate AI content first to receive 5 tailored visual templates for your post.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerateAI}
                                    className="w-full btn-primary py-4 flex flex-col items-center justify-center gap-2"
                                    disabled={generating}
                                >
                                    {generating ? (
                                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Generating...</>
                                    ) : (
                                        <>
                                            <span className="text-2xl">✨</span>
                                            <span className="font-bold">Generate AI Content</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </section>

                        {/* Design Assets Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="font-bold text-gray-900">2. Design Files</h4>
                                <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded hover:bg-primary-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploading ? 'Uploading...' : 'Upload Design'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleUploadDesign}
                                        disabled={uploading}
                                        accept="image/png,image/jpeg,application/pdf"
                                    />
                                </label>
                            </div>

                            {loadingAssets ? (
                                <div className="py-4 text-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mx-auto"></div>
                                </div>
                            ) : assets.length > 0 ? (
                                <div className="space-y-3">
                                    {assets.map((asset, index) => {
                                        const downloadUrl = `/api/posts/${post.id}/assets/${asset.id}/download`;
                                        const previewUrl = `${downloadUrl}?inline=true`;
                                        const isLatest = index === 0;

                                        return (
                                            <div key={asset.id} className={`flex items-center justify-between p-3 border rounded-lg group ${isLatest ? 'bg-white border-primary-200 shadow-sm' : 'bg-gray-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500 overflow-hidden">
                                                        {asset.fileType.startsWith('image/') ? (
                                                            <SecureImage url={previewUrl} alt={asset.fileName} className="w-full h-full object-cover" />
                                                        ) : '📄'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-900">{asset.fileName}</p>
                                                            {isLatest && <span className="text-[8px] font-black bg-primary-500 text-white px-1 rounded">LATEST</span>}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 uppercase">v{asset.version} • {new Date(asset.uploadedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleSecureDownload(asset.id, asset.fileName)}
                                                    className="px-3 py-1 bg-white border text-xs font-bold rounded hover:bg-gray-50 transition-colors"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 bg-gray-50 border-2 border-dashed rounded-lg text-center">
                                    <p className="text-xs text-gray-500">No design files uploaded yet.</p>
                                </div>
                            )}
                        </section>

                        {/* Review Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="font-bold text-gray-900">3. Review & Approval</h4>
                            </div>

                            {loadingReview ? (
                                <div className="py-4 text-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mx-auto"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {review && (
                                        <div className={`p-4 rounded-lg border ${review.status === 'APPROVED' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${review.status === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                                    }`}>
                                                    {review.status?.replace('_', ' ') || 'UNKNOWN'}
                                                </span>
                                                <span className="text-[10px] text-gray-500 italic">
                                                    on {new Date(review.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-gray-800 font-medium">&quot;{review.comment}&quot;</p>
                                            )}
                                        </div>
                                    )}

                                    {post.status !== 'APPROVED' && (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Submit Evaluation</p>
                                            <textarea
                                                className="w-full p-3 text-sm border rounded-lg mb-3 focus:ring-primary-500 focus:border-primary-500"
                                                placeholder="Add changes request comment here..."
                                                rows={2}
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleReview('CHANGES_REQUESTED')}
                                                    disabled={reviewing || !reviewComment}
                                                    className="btn-secondary py-2 font-bold text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Request Changes
                                                </button>
                                                <button
                                                    onClick={() => handleReview('APPROVED')}
                                                    disabled={reviewing}
                                                    className="btn-primary py-2 font-bold bg-green-600 hover:bg-green-700 border-green-700"
                                                >
                                                    Approve Post
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
