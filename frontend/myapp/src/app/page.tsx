

import Navbar from "src/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import CTA from "@/components/landing/CTA";
import CardCarouselParent from "@/components/homeCards/CardCarouselParent";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <CardCarouselParent/>
      <HowItWorks />
      {/* <Testimonials /> */}
      <CTA />
      <Footer />
    </>
  );
}