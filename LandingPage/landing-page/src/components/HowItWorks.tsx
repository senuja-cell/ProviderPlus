'use client';
import {useRef, useState, useEffect} from "react";
import {Search, Bot, User, Star, MousePointer2, BadgeCheck, Check, Shield, Zap, Users, TrendingUp} from "lucide-react";
import {motion, useScroll, useMotionValueEvent, AnimatePresence} from "framer-motion";

const TypingText = ({text}: { text: string }) => {
    const [displayedText, setDisplayedText] = useState("");
    useEffect(() => {
        let currentIndex = 0;
        const intervalId = setInterval(() => {
            setDisplayedText(text.slice(0, currentIndex));
            currentIndex++;
            if (currentIndex > text.length) clearInterval(intervalId);
        }, 50);
        return () => clearInterval(intervalId);
    }, [text]);
    return (
        <p className="text-white text-sm font-medium text-left leading-snug">
            {displayedText}
            <motion.span
                initial={{opacity: 0}}
                animate={{opacity: [0, 1, 0]}}
                transition={{repeat: Infinity, duration: 0.8, ease: "linear"}}
                className="inline-block w-0.5 h-4 bg-white align-middle ml-0.5 -translate-y-0.5"
            />
        </p>
    );
};

const TrackAndRelaxContent = () => {
    const [status, setStatus] = useState<'tracking' | 'completed'>('tracking');
    useEffect(() => {
        const timer = setTimeout(() => setStatus('completed'), 2200);
        return () => clearTimeout(timer);
    }, []);
    return (
        <div className="w-full h-full relative overflow-hidden bg-[#F3F5F8]">
            <motion.div
                className="absolute inset-0 w-full h-full"
                animate={{filter: status === 'completed' ? "blur(4px)" : "blur(0px)"}}
                transition={{duration: 0.5}}
            >
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute left-[20%] h-full w-4 bg-white border-x border-gray-300"></div>
                    <div className="absolute left-[60%] h-full w-6 bg-white border-x border-gray-300"></div>
                    <div className="absolute left-[85%] h-full w-2 bg-white border-x border-gray-300"></div>
                    <div className="absolute top-[30%] w-full h-5 bg-white border-y border-gray-300"></div>
                    <div className="absolute top-[65%] w-full h-8 bg-white border-y border-gray-300"></div>
                </div>
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <path d="M 53 31 L 53 150 Q 55 160 75 160 L 140 160 Q 155 166 155 180 L 155 270"
                          stroke="#2B7FDE" strokeWidth="5" fill="none" strokeDasharray="8 6" strokeLinecap="round"/>
                    <circle cx="21.6%" cy="6.8%" r="5" fill="#19579F" stroke="white" strokeWidth="2"/>
                    <circle cx="63.5%" cy="54%" r="6" fill="#D96C06"/>
                </svg>
                {status === 'tracking' && (
                    <motion.div
                        className="absolute z-20 flex items-center justify-center"
                        initial={{left: '20%', top: '7%'}}
                        animate={{left: ['16.5%', '16.5%', '57.5%', '57.5%'], top: ['6.8%', '29%', '29%', '52%']}}
                        transition={{duration: 2.2, ease: 'linear'}}
                        style={{width: 28, height: 28}}
                    >
                        <div className="absolute w-6 h-6 bg-[#0C2B4E] border-2 border-white rounded-full shadow-md z-10 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-white rotate-180"></div>
                        </div>
                    </motion.div>
                )}
                <motion.div
                    className="absolute left-4 right-4 bottom-6 bg-white rounded-xl shadow-xl p-4 z-20 border border-gray-100/50"
                    initial={{y: 120, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{duration: 0.6, ease: 'easeOut', delay: 0.1}}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-end justify-center shrink-0">
                            <svg className="w-9 h-9 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-[#0C2B4E] text-sm">Shehan</h3>
                                <div className="flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-[#0C2B4E]">
                                    <span>4.9</span>
                                    <Star className="w-2.5 h-2.5 fill-[#D96C06] text-[#D96C06]"/>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Electrician</p>
                            <p className="text-[10px] text-[#19579F] font-semibold mt-1">
                                {status === 'tracking' ? 'Arriving in 1 min' : 'Arrived!'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
            <AnimatePresence>
                {status === 'completed' && (
                    <motion.div
                        initial={{scale: 0.5, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        className="absolute inset-0 flex flex-col items-center justify-center z-30 mb-16"
                    >
                        <div className="w-24 h-24 bg-[#10B981] rounded-full flex items-center justify-center shadow-2xl mb-3">
                            <Check className="w-12 h-12 text-white stroke-[4]"/>
                        </div>
                        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}} className="backdrop-blur px-8 py-3 rounded-2xl">
                            <p className="text-[#0C2B4E] font-bold text-lg">Job Completed!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({icon: Icon, value, suffix, label, color, delay}: {icon: any, value: number, suffix: string, label: string, color: string, delay: number}) => {
    const [count, setCount] = useState(0);
    const [hovered, setHovered] = useState(false);
    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) { setCount(value); clearInterval(timer); }
            else setCount(Math.floor(current));
        }, duration / steps);
        return () => clearInterval(timer);
    }, [value]);
    return (
        <motion.div
            initial={{opacity: 0, y: 30}}
            animate={{opacity: 1, y: 0}}
            transition={{delay, duration: 0.5}}
            whileHover={{scale: 1.08, y: -4}}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col items-center text-center overflow-hidden cursor-default"
        >
            <motion.div className="absolute inset-0 opacity-0 rounded-2xl" animate={{opacity: hovered ? 0.08 : 0}} style={{backgroundColor: color}} transition={{duration: 0.3}}/>
            <motion.div animate={{rotate: hovered ? [0, -10, 10, 0] : 0, scale: hovered ? 1.2 : 1}} transition={{duration: 0.4}} className="mb-2 p-2 rounded-full" style={{backgroundColor: color + '15'}}>
                <Icon className="w-5 h-5" style={{color}}/>
            </motion.div>
            <p className="text-2xl font-extrabold text-[#0C2B4E]">{count}{suffix}</p>
            <p className="text-xs text-[#0C2B4E]/50 mt-0.5 font-medium">{label}</p>
        </motion.div>
    );
};

const HowItWorks = () => {
    const containerRef = useRef(null);
    const [activeStep, setActiveStep] = useState(0);
    const {scrollYProgress} = useScroll({target: containerRef, offset: ["start start", "end end"]});
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest < 0.15) setActiveStep(0);
        else if (latest < 0.6) setActiveStep(1);
        else setActiveStep(2);
    });

    const steps = [
        {
            id: 1, title: "Search Service", desc: "Find verified professionals near you instantly.",
            color: "bg-[#19579F]", hex: "#19579F",
            testimonial: { name: "Kamal Perera", role: "Homeowner, Colombo", text: "Found a great electrician in under 2 minutes. The AI understood exactly what I needed!" },
            phoneContent: (
                <div className="flex flex-col items-center justify-center h-full gap-6 p-6 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full"></div>
                        <Bot className="w-28 h-28 text-white relative z-10 drop-shadow-lg"/>
                    </div>
                    <div className="w-full bg-white/10 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md border border-white/20 shadow-inner">
                        <Search className="w-5 h-5 text-white/70 shrink-0"/>
                        <TypingText text="I need an electrician that can fix my AC"/>
                    </div>
                </div>
            )
        },
        {
            id: 2, title: "Chat & Book", desc: "Discuss a time slot and book your service.",
            color: "bg-[#2B7FDE]", hex: "#2B7FDE",
            testimonial: { name: "Nimasha Silva", role: "Business Owner, Kandy", text: "Chatting with the provider before booking gave me so much confidence. Totally transparent!" },
            phoneContent: (
                <div className="w-full h-full flex flex-col relative overflow-hidden">
                    <motion.div className="absolute z-50 drop-shadow-xl" initial={{top: "15%", left: "50%", opacity: 0}} animate={{top: ["15%", "85%"], left: ["70%", "50%"], opacity: [0, 1, 1, 1], scale: [1, 1, 0.8, 1]}} transition={{duration: 2.2, ease: "easeInOut", times: [0, 0.7, 0.85, 1], repeatDelay: 1.5}}>
                        <MousePointer2 className="w-8 h-8 text-black fill-white"/>
                    </motion.div>
                    <div className="h-[35%] w-full relative"></div>
                    <div className="h-[65%] w-full bg-white rounded-t-[2rem] px-6 py-8 flex flex-col justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative z-10">
                        <div className="flex flex-col items-center gap-4 mt-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                                <User className="w-10 h-10 text-gray-400"/>
                            </div>
                            <div className="text-center">
                                <div className="flex justify-center gap-1.5 mb-1">
                                    <h4 className="text-[#0C2B4E] font-bold text-xl">Shehan</h4>
                                    <BadgeCheck className="w-5 h-5 fill-[#2B7FDE] text-white mt-1"/>
                                </div>
                                <p className="text-gray-500 text-sm font-medium">Electrician</p>
                                <div className="flex items-center justify-center gap-1.5 mt-2 bg-gray-50 py-1 px-3 rounded-full mx-auto w-fit">
                                    <Star className="w-3.5 h-3.5 text-[#D96C06] fill-[#D96C06]"/>
                                    <span className="text-xs text-gray-700 font-bold">4.9 (120 Reviews)</span>
                                </div>
                            </div>
                        </div>
                        <motion.button className="w-40 bg-[#10B981] text-white font-bold py-2.5 rounded-xl shadow-lg text-base mt-auto mb-4 mx-auto" animate={{scale: [1, 1, 0.95, 1]}} transition={{duration: 2.2, times: [0, 0.7, 0.85, 1], repeat: 5, repeatDelay: 1.5}}>
                            Book Now
                        </motion.button>
                    </div>
                </div>
            )
        },
        {
            id: 3, title: "Track & Relax", desc: "Track your service provider and consider job done!",
            color: "bg-[#D96C06]", hex: "#D96C06",
            testimonial: { name: "Ravi Kumar", role: "Customer, Galle", text: "Watching my provider on the map in real time was incredible. Arrived exactly on time!" },
            phoneContent: <TrackAndRelaxContent/>
        }
    ];

    const stats = [
        {icon: Users, value: 500, suffix: "+", label: "Service Providers", color: "#19579F"},
        {icon: Star, value: 49, suffix: "★", label: "Average Rating", color: "#D96C06"},
        {icon: Zap, value: 10, suffix: "min", label: "Avg Response", color: "#10B981"},
        {icon: Shield, value: 100, suffix: "%", label: "Verified Pros", color: "#8B5CF6"},
    ];

    const badges = [
        {icon: Shield, label: "Verified", color: "#19579F"},
        {icon: Star, label: "Top Rated", color: "#D96C06"},
        {icon: Zap, label: "Fast", color: "#10B981"},
        {icon: TrendingUp, label: "Trusted", color: "#8B5CF6"},
    ];

    return (
        <section ref={containerRef} id="how-it-works" className="relative h-[300vh] bg-gray-100">
            <div className="sticky top-0 flex h-[100dvh] flex-col items-center justify-center overflow-hidden py-4">

                {/* HEADER */}
                <div className="w-full max-w-7xl px-6 text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#0C2B4E]">How It Works</h1>
                </div>

                {/* MAIN 3 COLUMN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 items-center w-full max-w-7xl px-6 gap-6">

                    {/* LEFT */}
                    <div className="hidden lg:flex flex-col gap-3 items-start">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep} initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}} transition={{duration: 0.5}} className="space-y-2">
                                <h3 className="text-4xl font-bold" style={{color: steps[activeStep].hex}}>{steps[activeStep].title}</h3>
                                <p className="text-lg text-[#0C2B4E]/70 leading-relaxed">{steps[activeStep].desc}</p>
                            </motion.div>
                        </AnimatePresence>
                        <div className="flex gap-1">
                            {steps.map((_, idx) => (
                                <div key={idx} className={`h-2 rounded-full transition-all duration-500 ${idx === activeStep ? 'w-8 ' + steps[activeStep].color : 'w-2 bg-gray-300'}`}></div>
                            ))}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep + "-t"} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} transition={{duration: 0.5}} className="w-full bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                                <div className="flex gap-0.5 mb-2">
                                    {[...Array(5)].map((_, i) => (<Star key={i} className="w-3.5 h-3.5 fill-[#D96C06] text-[#D96C06]"/>))}
                                </div>
                                <p className="text-[#0C2B4E]/70 text-sm leading-relaxed mb-2 italic">"{steps[activeStep].testimonial.text}"</p>
                                <p className="text-[#0C2B4E] font-bold text-xs">{steps[activeStep].testimonial.name}</p>
                                <p className="text-[#0C2B4E]/50 text-xs">{steps[activeStep].testimonial.role}</p>
                            </motion.div>
                        </AnimatePresence>
                        <div className="w-full bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                            <p className="text-xs font-bold text-[#0C2B4E]/50 uppercase tracking-wider mb-2">Progress</p>
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-3 mb-2">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300" style={{backgroundColor: idx <= activeStep ? step.hex : '#e5e7eb', color: idx <= activeStep ? 'white' : '#9ca3af'}}>
                                        {idx < activeStep ? <Check className="w-3 h-3"/> : idx + 1}
                                    </div>
                                    <p className={`text-xs font-medium transition-all duration-300 ${idx === activeStep ? 'text-[#0C2B4E] font-bold' : 'text-[#0C2B4E]/40'}`}>{step.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CENTER: Phone */}
                    <div className="relative z-30 flex justify-center w-full">
                        <div className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-500" style={{background: steps[activeStep].hex, transform: 'scale(0.7)'}}/>
                        <div className="transform scale-90 sm:scale-95 md:scale-100 origin-center transition-transform duration-300">
                            <div
                                className="w-[300px] h-[600px] bg-[#0C2B4E] rounded-[3rem] shadow-2xl border-[10px] border-[#0C2B4E] overflow-hidden relative mx-auto"
                                style={{boxShadow: `0 40px 80px ${steps[activeStep].hex}40, 0 0 0 1px ${steps[activeStep].hex}20`}}
                            >
                                {/* Notch */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0C2B4E] rounded-full z-50"/>
                                <motion.div className="w-full h-full relative" animate={{backgroundColor: steps[activeStep].hex}} transition={{duration: 0.5}}>
                                    <AnimatePresence mode="wait">
                                        <motion.div key={activeStep} initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.8}} transition={{duration: 0.4}} className="w-full h-full">
                                            {steps[activeStep].phoneContent}
                                        </motion.div>
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="hidden lg:flex flex-col gap-3 items-start">
                        <div className="grid grid-cols-2 gap-3 w-full">
                            {stats.map((stat, idx) => (
                                <StatCard key={idx} icon={stat.icon} value={stat.value} suffix={stat.suffix} label={stat.label} color={stat.color} delay={idx * 0.1}/>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {badges.map((badge, idx) => (
                                <motion.div key={idx} initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{delay: 0.4 + idx * 0.1}} whileHover={{scale: 1.1, y: -3}} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-md border border-gray-100 cursor-default">
                                    <badge.icon className="w-3.5 h-3.5" style={{color: badge.color}}/>
                                    <span className="text-xs font-semibold text-[#0C2B4E]">{badge.label}</span>
                                </motion.div>
                            ))}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep + "-info"} initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} transition={{duration: 0.5}} className="w-full rounded-2xl p-5 text-white shadow-xl" style={{background: `linear-gradient(135deg, ${steps[activeStep].hex}, ${steps[activeStep].hex}99)`}}>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Step {activeStep + 1} of 3</p>
                                <h4 className="text-xl font-extrabold mb-1">{steps[activeStep].title}</h4>
                                <p className="text-sm opacity-80">{steps[activeStep].desc}</p>
                                <div className="flex gap-1 mt-3">
                                    {steps.map((_, idx) => (
                                        <div key={idx} className="h-1 rounded-full bg-white transition-all duration-500" style={{width: idx === activeStep ? 24 : 6, opacity: idx === activeStep ? 1 : 0.4}}/>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* MOBILE TEXT */}
                    <div className="flex flex-col items-center lg:hidden text-center px-2 w-full mb-4">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.3}}>
                                <h3 className="text-2xl font-bold" style={{color: steps[activeStep].hex}}>{steps[activeStep].title}</h3>
                                <p className="text-sm text-[#0C2B4E]/70 max-w-sm mx-auto leading-tight mt-1">{steps[activeStep].desc}</p>
                            </motion.div>
                        </AnimatePresence>
                        <div className="flex gap-1 justify-center mt-2">
                            {steps.map((_, idx) => (
                                <div key={idx} className={`h-2 rounded-full transition-all duration-500 ${idx === activeStep ? 'w-8 ' + steps[activeStep].color : 'w-2 bg-gray-300'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;