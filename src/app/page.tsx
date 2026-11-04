import { Hero } from "@/components/home/hero";
import { PopularConverters } from "@/components/home/popular";
import { ToolsCategoryShortcuts } from "@/components/home/tools-directory";
import { HowItWorks } from "@/components/home/how-it-works";
import { Features } from "@/components/home/features";
import { Security } from "@/components/home/security";
import { FAQ } from "@/components/home/faq";
import { FinalCta } from "@/components/home/final-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <PopularConverters />
      <ToolsCategoryShortcuts />
      <HowItWorks />
      <Features />
      <Security />
      <FAQ />
      <FinalCta />
    </>
  );
}
