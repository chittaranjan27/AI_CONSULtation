import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AnalyticsSection from "@/components/landing/AnalyticsSection";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import MultiLanguageSection from "@/components/landing/MultiLanguageSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="relative z-10 overflow-hidden">
      <Navbar />
      <HeroSection />
      <div className="section-divider" />
      <FeaturesSection />
      <div className="section-divider" />
      <AnalyticsSection />
      <div className="section-divider" />
      <IntegrationsSection />
      <div className="section-divider" />
      <MultiLanguageSection />
      <div className="section-divider" />
      <PricingSection />
      <div className="section-divider" />
      <TestimonialsSection />
      <div className="section-divider" />
      <FAQSection />
      <div className="section-divider" />
      <CTASection />
      <Footer />
    </main>
  );
}

