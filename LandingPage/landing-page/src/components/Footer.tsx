'use client';

import { Instagram, Linkedin, Facebook, Mail, MapPin, Clock, Send } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-[#0C2B4E] text-[#F5EFED] flex flex-col">

            {/* Tagline Banner */}
            <div className="w-full bg-gradient-to-r from-[#19579F] via-[#0C2B4E] to-[#D96C06] py-10 px-6 text-center">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                    Your Trusted Service Partner Across Sri Lanka
                </h2>
                <p className="text-white/70 text-sm">Reliable. Fast. Secure. Available at your fingertips.</p>
            </div>

            {/* Main Footer */}
            <div className="w-full px-6 pt-14 pb-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">

                    {/* Brand */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden">
                                <img src="/logo.png" alt="Provider+ Logo" className="w-full h-full object-contain p-1" />
                            </div>
                            Provider+
                        </h3>
                        <p className="text-xs leading-relaxed opacity-80 max-w-xs">
                            Connecting you with the best services near you. Reliable, fast, and secure.
                        </p>

                        {/* Social Icons */}
                        <div className="flex gap-4 pt-2">
                            <a href="https://www.instagram.com/_.providerplus._?igsh=MWFqaDF2MHd0anNycA==" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#E1306C] hover:border-[#E1306C] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="https://www.linkedin.com/company/providerplus76/" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#0077B5] hover:border-[#0077B5] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#1877F2] hover:border-[#1877F2] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <Facebook className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Explore */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Explore</h4>
                        <ul className="space-y-3 opacity-80">
                            <li><a href="#home" className="hover:text-[#D96C06] hover:translate-x-1 transition-all duration-200 inline-block">Home</a></li>
                            <li><a href="#how-it-works" className="hover:text-[#D96C06] hover:translate-x-1 transition-all duration-200 inline-block">How it Works</a></li>
                            <li><a href="#features" className="hover:text-[#D96C06] hover:translate-x-1 transition-all duration-200 inline-block">Features</a></li>
                            <li><a href="#our-team" className="hover:text-[#D96C06] hover:translate-x-1 transition-all duration-200 inline-block">Our Team</a></li>
                            <li><a href="#contact" className="hover:text-[#D96C06] hover:translate-x-1 transition-all duration-200 inline-block">Contact Us</a></li>
                        </ul>
                    </div>

                    {/* Get the App */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Get the App</h4>
                        <p className="text-xs opacity-70 mb-4 leading-relaxed">
                            Available on Google Play. Download now and get started!
                        </p>
                        <a href="#" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2.5 transition-all duration-200 hover:-translate-y-0.5 w-fit">
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M3.18 23.76c.3.16.64.24.99.2l.1-.04L13.65 14l-3.1-3.1-7.37 12.86z"/>
                                <path fill="#FBBC05" d="M20.9 10.42L17.7 8.6l-3.44 3.03 3.44 3.44 3.22-1.84c.92-.52.92-1.84-.02-2.81z"/>
                                <path fill="#4285F4" d="M3.18.24C2.83.56 2.6 1.1 2.6 1.8v20.4c0 .7.23 1.24.58 1.56l.08.07L13.65 13V12L3.26.17l-.08.07z"/>
                                <path fill="#34A853" d="M13.65 12l3.44-3.44-9.38-5.32c-.32-.18-.67-.27-1.02-.27-.35 0-.69.09-.99.24L13.65 12z"/>
                            </svg>
                            <div>
                                <p className="text-white/60 text-xs">Get it on</p>
                                <p className="text-white font-semibold text-sm">Google Play</p>
                            </div>
                        </a>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Contact Us</h4>
                        <ul className="space-y-4 opacity-80 text-xs">
                            <li className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-3 h-3" />
                                </div>
                                <span>providerplus76@gmail.com</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-3 h-3" />
                                </div>
                                <span>Sri Lanka</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-3 h-3" />
                                </div>
                                <div>
                                    <p>Monday - Friday</p>
                                    <p>8:00 AM - 5:00 PM</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Gradient Divider */}
            <div className="w-full h-px bg-gradient-to-r from-[#D96C06] via-white/20 to-[#19579F]" />

            {/* Bottom Bar */}
            <div className="w-full bg-black py-6">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-white/40 gap-4">
                    <span>© 2025 Provider+ Inc. All rights reserved.</span>
                    <div className="flex gap-6">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Instagram</a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">LinkedIn</a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Facebook</a>
                    </div>
                </div>
            </div>

        </footer>
    );
};

export default Footer;