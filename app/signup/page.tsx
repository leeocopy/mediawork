'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/safeFetch';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        agreeToTerms: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        // Check terms agreement
        if (!formData.agreeToTerms) {
            setErrors({ terms: 'Please accept terms and conditions' });
            setLoading(false);
            return;
        }

        try {
            const { res, data } = await apiPost('/api/auth/signup', {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
            });

            if (!res.ok) {
                setErrors(data?.details || { general: data?.error || 'Signup failed' });
                return;
            }

            // Secure token extraction according to API shape
            const token = data?.data?.token;

            if (!token) {
                console.error('Signup succeeded but token missing in response:', data);
                setErrors({ general: 'Signup succeeded but token is missing. Please login.' });
                return;
            }

            // Store token
            localStorage.setItem('token', token);

            // Redirect to companies
            router.push('/companies');
        } catch (err: any) {
            setErrors({ general: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-[440px]">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-primary-500">Social Media Manager</h1>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Account</h2>
                        <p className="text-gray-600">Get started with your free account</p>
                    </div>

                    {/* Error Message */}
                    {errors.general && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Full Name */}
                        <div className="mb-5">
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                className={`input ${errors.fullName ? 'error' : ''}`}
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                disabled={loading}
                                required
                            />
                            {errors.fullName && (
                                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="mb-5">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className={`input ${errors.email ? 'error' : ''}`}
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={loading}
                                required
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="mb-5">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className={`input ${errors.password ? 'error' : ''}`}
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={loading}
                                required
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                            <ul className="mt-2 text-xs text-gray-500 space-y-1">
                                <li>• At least 8 characters</li>
                                <li>• Mix of uppercase, lowercase, numbers, and special characters</li>
                            </ul>
                        </div>

                        {/* Terms Checkbox */}
                        <div className="mb-6">
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                                    checked={formData.agreeToTerms}
                                    onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                                />
                                <span className="text-sm text-gray-600">
                                    I agree to the{' '}
                                    <a href="#" className="text-primary-500 hover:text-primary-600">
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a href="#" className="text-primary-500 hover:text-primary-600">
                                        Privacy Policy
                                    </a>
                                </span>
                            </label>
                            {errors.terms && (
                                <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-sm text-gray-400">OR</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Social Buttons */}
                    <div className="space-y-3">
                        <button className="btn-social w-full justify-center" disabled>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign up with Google
                        </button>
                        <button className="btn-social w-full justify-center" disabled>
                            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Sign up with Facebook
                        </button>
                    </div>

                    {/* Sign In Link */}
                    <p className="mt-8 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-primary-500 hover:text-primary-600">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
