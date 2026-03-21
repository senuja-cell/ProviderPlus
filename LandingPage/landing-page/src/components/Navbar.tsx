'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, QrCode } from "lucide-react";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeSection, setActiveSection] = useState('home');

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setScrolled(scrollY > 50);

            // Calculate scroll progress
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (totalHeight > 0) {
                setScrollProgress((scrollY / totalHeight) * 100);
            }

            // Determine active section
            const sections = ['home', 'how-it-works', 'features', 'our-team', 'contact'];
            for (const section of [...sections].reverse()) {
                const el = document.getElementById(section);
                if (el && scrollY >= el.offsetTop - 120) {
                    setActiveSection(section);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '#home', label: 'Home', id: 'home' },
        { href: '#how-it-works', label: 'How it Works', id: 'how-it-works' },
        { href: '#features', label: 'Features', id: 'features' },
        { href: '#our-team', label: 'Our Team', id: 'our-team' },
        { href: '#contact', label: 'Contact Us', id: 'contact' },
    ];

    const getLinkClass = (id: string) => {
        const base = "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300";
        return activeSection === id
            ? `${base} text-[#D96C06] bg-[#D96C06]/10`
            : `${base} text-[#0C2B4E] hover:text-[#D96C06] hover:bg-[#D96C06]/5`;
    };

    const getMobileLinkClass = (id: string) => {
        const base = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200";
        return activeSection === id
            ? `${base} text-[#D96C06] bg-[#D96C06]/10`
            : `${base} text-[#0C2B4E] hover:text-[#D96C06] hover:bg-[#D96C06]/5`;
    };

    return (
        <>
            {/* Scroll Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-0.5 z-[200]">
                <div
                    className="h-full bg-gradient-to-r from-[#D96C06] to-[#19579F] transition-all duration-100"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            <nav className={scrolled
                ? "fixed top-3 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-[100] transition-all duration-500 py-2 bg-white/80 backdrop-blur-xl shadow-xl border border-[#0C2B4E]/10 rounded-full"
                : "fixed top-3 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-[100] transition-all duration-500 py-3 bg-[#F5EFED]/95 shadow-lg border border-[#0C2B4E]/10 rounded-full"
            }>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

                    {/* Logo */}
                    <a href="#home" className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-110">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <span className="font-bold text-xl text-[#0C2B4E] tracking-tight group-hover:text-[#19579F] transition-all duration-300">
                            Provider<span className="text-[#D96C06]">+</span>
                        </span>
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <a key={link.id} href={link.href} className={getLinkClass(link.id)}>
                                {link.label}
                                {activeSection === link.id && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D96C06]" />
                                )}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTA & Mobile Toggle */}
                    <div className="flex items-center gap-3">
                        <a
                            href="/under-construction"
                            className="hidden md:flex items-center gap-2 bg-[#D96C06] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#19579F] transition-all duration-300 shadow-lg hover:-translate-y-0.5"
                        >
                            <QrCode className="w-4 h-4" />
                            <span>Get the App</span>
                        </a>
                        <button
                            className="md:hidden p-2 rounded-full text-[#0C2B4E] hover:bg-[#D96C06]/10 transition"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white/95 backdrop-blur-xl border-t border-[#0C2B4E]/10 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-6 py-4 space-y-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.id}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={getMobileLinkClass(link.id)}
                            >
                                {activeSection === link.id && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D96C06] flex-shrink-0" />
                                )}
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-2">
                            <a
                                href="/under-construction"
                                className="flex items-center justify-center gap-2 bg-[#D96C06] text-white px-5 py-3 rounded-full text-sm font-bold hover:bg-[#19579F] transition w-full"
                            >
                                <QrCode className="w-4 h-4" />
                                Get the App
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Spacer for fixed nav */}
            <div className="h-16" />
        </>
    );
};

export default Navbar;