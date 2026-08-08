import { Hero5 } from "@/components/ui/hero-5"

export default function Hero() {
  return (
    <div className="flex w-full flex-col justify-center bg-black">
      <Hero5
        titleLine1="Business Clarity for"
        titleLine2Accent="Every Procurement"
        description="Bringing integrity, neutrality, and accountability to procurement and asset management through transparent, tamper-resistant blockchain workflows."
        primaryCtaText="Login"
        primaryCtaHref="/login"
        secondaryCtaText="Sign Up"
        secondaryCtaHref="/signup"
        backgroundImage="https://assets.watermelon.sh/hero-5-bg.avif"
      />
    </div>
  )
}
