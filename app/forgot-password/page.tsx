'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate sending reset email (no actual email functionality in Step 1)
        setTimeout(() => {
            setSuccess(true);
            setLoading(false);
        }, 1500);
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
                    {!success ? (
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Forgot Password?</h2>
                                <p className="text-gray-600">Enter your email and we&apos;ll send you a reset link</p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Email */}
                                <div className="mb-6">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        className="input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="btn-primary w-full mb-6"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>

                                {/* Back Link */}
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                        />
                                    </svg>
                                    Back to Sign In
                                </Link>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            {/* Success Icon */}
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-green-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>

                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h3>
                            <p className="text-gray-600 mb-6">
                                We&apos;ve sent a password reset link to <strong>{email}</strong>
                            </p>

                            <Link href="/login" className="btn-primary inline-block">
                                Back to Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
