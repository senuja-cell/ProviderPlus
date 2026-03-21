'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Linkedin, Github, Calendar, CheckCircle } from "lucide-react";

const teamMembers = [
    {
        id: 1,
        name: "Dineth Kaluarachchi",
        role: "Project Manager & Analyst",
        image: "/team/dineth.jpg",
        quote: "Identified key user groups and planned resources. Analyzed features for scope definition.",
        linkedin: "https://www.linkedin.com/in/dineth-kaluarachchi",
        github: "https://github.com/Dineth-San"
    },
    {
        id: 2,
        name: "Dinura Munasinghe",
        role: "UI/UX Lead & Planner",
        image: "/team/dinura.png",
        quote: "Led UI architecture and high-fidelity prototyping. Developed the WBS and conducted competitor analysis.",
        linkedin: "https://www.linkedin.com/in/dinura-munasinghe",
        github: "https://github.com/dinura-munasinghe"
    },
    {
        id: 3,
        name: "Senura Damhiru",
        role: "Risk and Market Researcher",
        image: "/team/senura.jpg",
        quote: "Created the Risk Mitigation Matrix and validated the Trust Dilemma through literature review.",
        linkedin: "https://www.linkedin.com/in/senura-damhiru",
        github: "https://github.com/Senura730"
    },
    {
        id: 4,
        name: "Banuka Senadheera",
        role: "System Architect",
        image: "/team/banuka.jpg",
        quote: "Justified Agile Scrum and OOAD methodologies. Refined technical specifications and integrated design systems.",
        linkedin: "https://www.linkedin.com/in/banuka-senadheera-578b61312",
        github: "https://github.com/banuka04"
    },
    {
        id: 5,
        name: "Senuja Ranmith",
        role: "Requirements and Business Analyst",
        image: "/team/senuja.png",
        quote: "Developed the Business Model Canvas and led requirement gathering. Ensured visual consistency.",
        linkedin: "https://www.linkedin.com/in/senuja-ranmith-047a05369",
        github: "https://github.com/senuja-cell"
    },
    {
        id: 6,
        name: "Sehandu Abeyratne",
        role: "Systems Analyst",
        image: "/team/sehandu.jpeg",
        quote: "Created the Rich Picture Diagram and prioritized requirements. Collaborated on risk mitigation strategies.",
        linkedin: "https://www.linkedin.com/in/your-profile",
        github: "https://github.com/your-username"
    }
];

const journeyMilestones = [
    {
        date: "Sep 2025",
        title: "Team Formed",
        description: "Team CS76 came together for the first time, discussing ideas and setting the foundation for Provider+.",
        image: "/meeting.jpeg",
        color: "#D96C06",
        icon: "🤝",
        position: "below",
    },
    {
        date: "Oct 2025",
        title: "Idea Approved",
        description: "Our proposed solution was officially approved by our supervisor Mr. Jiehfeng Hsu.",
        image: null,
        color: "#19579F",
        icon: "✅",
        position: "above",
    },
    {
        date: "Dec 2025",
        title: "Dev Started",
        description: "We began building the Provider+ platform, diving into system architecture and UI/UX design.",
        image: null,
        color: "#10B981",
        icon: "💻",
        position: "above",
    },
    {
        date: "Jan 2026",
        title: "Launched & Viva",
        description: "Landing page launched and project presented at the viva.",
        image: "/viva.jpeg",
        color: "#8B5CF6",
        icon: "🚀",
        position: "below",
    },
];

const OurTeam = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const journeyRef = useRef(null);
    const journeyInView = useInView(journeyRef, { once: true });

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % teamMembers.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const getPositionStyles = (index: number) => {
        const total = teamMembers.length;
        const relativePos = (index - activeIndex + total) % total;
        const positions = [
            { x: 0, y: 0, scale: 1.3, zIndex: 20, opacity: 1, blur: 0 },
            { x: 160, y: -80, scale: 0.8, zIndex: 10, opacity: 0.7, blur: 2 },
            { x: 180, y: 60, scale: 0.6, zIndex: 5, opacity: 0.5, blur: 4 },
            { x: 0, y: 120, scale: 0.5, zIndex: 4, opacity: 0.4, blur: 5 },
            { x: -180, y: 60, scale: 0.6, zIndex: 5, opacity: 0.5, blur: 4 },
            { x: -160, y: -80, scale: 0.8, zIndex: 10, opacity: 0.7, blur: 2 },
        ];
        return positions[relativePos] || positions[0];
    };

    return (
        <>
            {/* Our Team Section */}
            <section id="our-team" className="w-full py-24 bg-white overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8 relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#0C2B4E]">Our Team</h2>
                        <p className="text-[#0C2B4E]/70 text-lg leading-relaxed max-w-md">
                            We are Group CS 76 — a collective of tech enthusiasts and problem solvers working to modernize how daily services are accessed across Sri Lanka. Guided by the expertise of our supervisor, Mr. Jiehfeng Hsu, we are building the future of the local gig economy.
                        </p>
                        <div className="pt-4 h-48">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.4 }}
                                    className="bg-[#F5EFED] p-6 rounded-2xl border-l-4 border-[#D96C06]"
                                >
                                    <h3 className="text-xl font-bold text-[#0C2B4E]">{teamMembers[activeIndex].name}</h3>
                                    <p className="text-[#19579F] font-medium text-sm mb-4">{teamMembers[activeIndex].role}</p>
                                    <div className="flex gap-3 opacity-60">
                                        <a href={teamMembers[activeIndex].linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#0C2B4E] transition-colors">
                                            <Linkedin className="w-5 h-5" />
                                        </a>
                                        <a href={teamMembers[activeIndex].github} target="_blank" rel="noopener noreferrer" className="hover:text-[#0C2B4E] transition-colors">
                                            <Github className="w-5 h-5" />
                                        </a>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="relative h-[500px] flex items-center justify-center">
                        <div className="absolute w-[500px] h-[500px] bg-gradient-to-br from-[#19579F]/5 to-[#2B7FDE]/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute w-[400px] h-[400px] bg-[#F5EFED] rounded-[40%] blur-2xl opacity-80"></div>
                        <div className="relative w-full h-full flex items-center justify-center">
                            {teamMembers.map((member, index) => {
                                const style = getPositionStyles(index);
                                const isActive = index === activeIndex;
                                return (
                                    <motion.div
                                        key={member.id}
                                        className="absolute rounded-full shadow-xl overflow-hidden border-4 border-white cursor-pointer bg-white"
                                        animate={{ x: style.x, y: style.y, scale: style.scale, zIndex: style.zIndex, opacity: style.opacity, filter: `blur(${style.blur}px)` }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                        onClick={() => setActiveIndex(index)}
                                    >
                                        <img src={member.image} alt={member.name} className="w-32 h-32 object-cover" />
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeRing"
                                                className="absolute inset-0 border-4 border-[#D96C06] rounded-full"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Journey Section */}
            <section className="w-full py-20 bg-white" ref={journeyRef}>
                <div className="max-w-6xl mx-auto px-6">

                    {/* Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={journeyInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 bg-[#0C2B4E]/5 rounded-full px-4 py-1.5 mb-3">
                            <span className="text-xs font-bold text-[#0C2B4E]/60 uppercase tracking-widest">Our Story</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0C2B4E] mb-2">
                            Our <span className="text-[#D96C06]">Journey</span>
                        </h2>
                        <p className="text-[#0C2B4E]/50 text-sm">From an idea to a fully working platform.</p>
                    </motion.div>

                    {/* Timeline Container */}
                    <div className="relative" style={{ height: '420px' }}>

                        {/* Horizontal Line — perfectly centered */}
                        <div className="absolute left-0 right-0 z-0" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                            <motion.div
                                className="h-0.5"
                                style={{ background: 'linear-gradient(90deg, #D96C06, #19579F, #10B981, #8B5CF6)' }}
                                initial={{ scaleX: 0, originX: 0 }}
                                animate={journeyInView ? { scaleX: 1 } : {}}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                        </div>

                        {/* 4 columns */}
                        <div className="grid grid-cols-4 gap-4 h-full">
                            {journeyMilestones.map((milestone, index) => {
                                const isAbove = milestone.position === "above";
                                return (
                                    <div key={index} className="relative flex flex-col items-center justify-center">

                                        {/* ABOVE cards (Oct, Dec) */}
                                        {isAbove && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -40 }}
                                                animate={journeyInView ? { opacity: 1, y: 0 } : {}}
                                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                                whileHover={{ y: -6, scale: 1.02 }}
                                                className="absolute w-full group"
                                                style={{ bottom: '52%', paddingBottom: '16px' }}
                                            >
                                                <div
                                                    className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full group-hover:shadow-2xl transition-all duration-300"
                                                    style={{ borderTop: `3px solid ${milestone.color}` }}
                                                >
                                                    {!milestone.image && (
                                                        <div className="w-full h-14 flex items-center justify-center text-2xl" style={{ background: `${milestone.color}10` }}>
                                                            {milestone.icon}
                                                        </div>
                                                    )}
                                                    <div className="p-3">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <Calendar className="w-3 h-3" style={{ color: milestone.color }} />
                                                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: milestone.color }}>{milestone.date}</span>
                                                        </div>
                                                        <h3 className="text-sm font-extrabold text-[#0C2B4E] mb-1">{milestone.title}</h3>
                                                        <p className="text-[#0C2B4E]/60 text-xs leading-relaxed">{milestone.description}</p>
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <CheckCircle className="w-3 h-3" style={{ color: milestone.color }} />
                                                            <span className="text-xs font-semibold" style={{ color: milestone.color }}>Done</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Dot — always at center */}
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={journeyInView ? { scale: 1, opacity: 1 } : {}}
                                            transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
                                            className="absolute z-10"
                                            style={{ top: '50%', transform: 'translateY(-50%)' }}
                                        >
                                            <motion.div
                                                className="absolute inset-0 rounded-full"
                                                style={{ background: milestone.color }}
                                                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
                                            />
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg relative z-10 border-4 border-white"
                                                style={{ background: `linear-gradient(135deg, ${milestone.color}, ${milestone.color}99)` }}
                                            >
                                                <span className="text-base">{milestone.icon}</span>
                                            </div>
                                        </motion.div>

                                        {/* BELOW cards (Sep, Jan) */}
                                        {!isAbove && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 40 }}
                                                animate={journeyInView ? { opacity: 1, y: 0 } : {}}
                                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                                whileHover={{ y: -6, scale: 1.02 }}
                                                className="absolute w-full group"
                                                style={{ top: '52%', paddingTop: '16px' }}
                                            >
                                                <div
                                                    className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full group-hover:shadow-2xl transition-all duration-300"
                                                    style={{ borderTop: `3px solid ${milestone.color}` }}
                                                >
                                                    {milestone.image && (
                                                        <div className="w-full h-28 overflow-hidden">
                                                            <img src={milestone.image} alt={milestone.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"/>
                                                        </div>
                                                    )}
                                                    <div className="p-3">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <Calendar className="w-3 h-3" style={{ color: milestone.color }} />
                                                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: milestone.color }}>{milestone.date}</span>
                                                        </div>
                                                        <h3 className="text-sm font-extrabold text-[#0C2B4E] mb-1">{milestone.title}</h3>
                                                        <p className="text-[#0C2B4E]/60 text-xs leading-relaxed">{milestone.description}</p>
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <CheckCircle className="w-3 h-3" style={{ color: milestone.color }} />
                                                            <span className="text-xs font-semibold" style={{ color: milestone.color }}>Done</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={journeyInView ? { opacity: 1, y: 80 } : {}}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="flex justify-center mt-10"
                    >
                        <div className="inline-flex items-center gap-3 rounded-2xl px-6 py-3 border border-[#0C2B4E]/10 shadow-lg" style={{ background: 'linear-gradient(135deg, #0C2B4E08, #19579F08)' }}>
                            <span className="text-xl">🚀</span>
                            <div>
                                <p className="text-[#0C2B4E] font-bold text-sm">And the journey continues...</p>
                                <p className="text-[#0C2B4E]/50 text-xs">Provider+ is just getting started!</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </>
    );
};

export default OurTeam;