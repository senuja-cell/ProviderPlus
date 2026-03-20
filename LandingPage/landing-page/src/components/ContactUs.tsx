'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import emailjs from '@emailjs/browser';

const ContactUs = () => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setError('');

        try {
            await emailjs.send(
                'service_hfildxo',
                'template_nbbggmr',
                {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    message: formData.message,
                },
                'EMpwen8xidpPQDDPH'
            );
            setSent(true);
            setFormData({ firstName: '', lastName: '', email: '', message: '' });
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <section id="contact" className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6">

                {/* Main Card */}
                <div className="rounded-3xl shadow-xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">

                        {/* Left Side - Light Blue */}
                        <div className="md:w-2/5 bg-[#EEF4FB] p-10 md:p-14 flex flex-col justify-between">
                            <div>
                                <h2 className="text-4xl font-bold text-[#0C2B4E] mb-4 leading-tight">
                                    Get in Touch
                                </h2>
                                <p className="text-[#D96C06] font-medium mb-3">
                                    We would love to hear from you!
                                </p>
                                <p className="text-[#0C2B4E]/60 text-sm leading-relaxed mb-10">
                                    If you have any inquiries or just want to say hi, please use the contact form.
                                </p>

                                {/* Email */}
                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                                            <Mail className="w-4 h-4 text-[#19579F]" />
                                        </div>
                                        <span className="text-sm text-[#0C2B4E] font-medium">providerplus76@gmail.com</span>
                                    </div>
                                </div>

                                {/* Social Icons */}
                                <div className="flex items-center gap-3">

                                    {/* LinkedIn */}
                                    <a href="https://www.linkedin.com/company/providerplus76/" target="_blank" rel="noopener noreferrer"
                                       className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-[#0077B5] group transition">
                                        <svg className="w-4 h-4 fill-[#0077B5] group-hover:fill-white transition" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                    </a>

                                    {/* Instagram */}
                                    <a href="https://www.instagram.com/_.providerplus._?igsh=MWFqaDF2MHd0anNycA==" target="_blank" rel="noopener noreferrer"
                                       className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-[#E1306C] group transition">
                                        <svg className="w-4 h-4 fill-[#E1306C] group-hover:fill-white transition" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                                        </svg>
                                    </a>

                                    {/* Facebook */}
                                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                       className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-[#1877F2] group transition">
                                        <svg className="w-4 h-4 fill-[#1877F2] group-hover:fill-white transition" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                    </a>

                                </div>
                            </div>
                        </div>

                        {/* Right Side - Light Blue Form */}
                        <div className="md:w-3/5 bg-[#EEF4FB] p-10 md:p-14">

                            {sent && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium text-center">
                                    Message sent! We will get back to you soon.
                                </div>
                            )}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-center">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* First + Last Name */}
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-[#0C2B4E] mb-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-[#0C2B4E] focus:outline-none focus:ring-2 focus:ring-[#19579F]"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-[#0C2B4E] mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-[#0C2B4E] focus:outline-none focus:ring-2 focus:ring-[#19579F]"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0C2B4E] mb-1">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-[#0C2B4E] focus:outline-none focus:ring-2 focus:ring-[#19579F]"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0C2B4E] mb-1">Message</label>
                                    <textarea
                                        rows={5}
                                        required
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-[#0C2B4E] focus:outline-none focus:ring-2 focus:ring-[#19579F] resize-none"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="bg-[#D96C06] text-white px-10 py-3 rounded-full font-bold hover:bg-[#19579F] transition shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {sending ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactUs;