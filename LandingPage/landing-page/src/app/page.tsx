'use client';

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import TopProviders from "@/components/TopProviders";
import OurTeam from "@/components/OurTeam";
import ContactUs from "@/components/ContactUs";
import ScrollToTop from "@/components/ScrollToTop";



export default function Home() {
    return (
        <main className="min-h-screen bg-offwhite text-navy font-sans selection:bg-accent/30">
            <Navbar />
            <Hero />
            <HowItWorks />
            <Features />
            <TopProviders />
            <OurTeam/>
            <ContactUs />
            <Footer />
            <ScrollToTop />
        </main>
    );
}