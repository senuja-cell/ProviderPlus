'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTop = () => {
    const [visible, setVisible] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setVisible(scrollY > 300);
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollY / totalHeight) * 100;
            setScrollProgress(progress);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Circle math
    const size = 52;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

    if (!visible) return null;

    return (
        <div className="fixed bottom-8 right-8 z-50 group">

            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                Scroll to top
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
            </div>

            {/* Button with progress ring */}
            <button
                onClick={scrollToTop}
                className="relative w-13 h-13 flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {/* Progress ring SVG */}
                <svg
                    className="absolute top-0 left-0 -rotate-90"
                    width={size}
                    height={size}
                >
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="black"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.1s ease' }}
                    />
                </svg>

                {/* Inner orange circle button */}
                <div className="w-10 h-10 bg-[#D96C06] rounded-full flex items-center justify-center hover:bg-[#19579F] transition-all duration-300 shadow-lg z-10">
                    <ChevronUp className="w-5 h-5 text-black" />
                </div>
            </button>
        </div>
    );
};

export default ScrollToTop;