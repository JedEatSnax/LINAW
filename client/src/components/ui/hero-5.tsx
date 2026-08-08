import { useState, type ReactNode } from "react"
import { motion, AnimatePresence, type Variants } from "motion/react"
import { ArrowRight, Menu, X } from "lucide-react"

export interface Hero5NavItem {
  label: string
  href: string
  hasDropdown?: boolean
}

export interface Hero5Props {
  /** Brand logo icon */
  logo?: ReactNode
  /** Headline line 1 (regular weight) */
  titleLine1?: string
  /** Headline line 2 (italic accent) */
  titleLine2Accent?: string
  /** Body description paragraph */
  description?: string
  /** Primary CTA text (outlined button) */
  primaryCtaText?: string
  /** Primary CTA URL */
  primaryCtaHref?: string
  /** Secondary CTA text (filled button with arrow) */
  secondaryCtaText?: string
  /** Secondary CTA URL */
  secondaryCtaHref?: string
  /** Background image URL */
  backgroundImage?: string
  /** NOTE: trustedTitle and trustedBrands removed */
}

const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.2,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
}

export function Hero5({
  titleLine1 = "Where Vision Shapes",
  titleLine2Accent = "Lasting Impressions",
  description = "Crafting digital experiences through bold innovation that captivates audiences, elevates brands, and drives meaningful results.",
  primaryCtaText = "Discover More",
  primaryCtaHref = "#",
  secondaryCtaText = "Begin Now",
  secondaryCtaHref = "#",
  backgroundImage = "hero.avif",
  // trusted brands removed
}: Hero5Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={backgroundImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none h-full w-full object-cover select-none"
          />
        </div>
      )}

      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-30 w-full"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-zinc-900 md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/95 p-6 backdrop-blur-md md:hidden"
          >
            <div className="flex items-center justify-between">
              <a
                href="#"
                className="flex items-center gap-2 text-white"
                onClick={() => setMobileMenuOpen(false)}
              ></a>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-zinc-900"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 mt-30 mb-40 flex min-h-full flex-col items-center justify-center px-6 text-center sm:px-10 lg:px-16"
      >
        <div className="flex flex-col items-center">
          <motion.h1 variants={item} className="mb-6 max-w-3xl">
            <span className="block bg-linear-to-r from-white to-indigo-200 bg-clip-text text-4xl leading-tight font-light tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
              {titleLine1}
            </span>
            <span className="block bg-linear-to-r from-white to-indigo-200 bg-clip-text font-serif text-4xl leading-tight font-light tracking-tight text-transparent italic sm:text-5xl md:text-6xl lg:text-7xl">
              {titleLine2Accent}
            </span>
          </motion.h1>

          {description && (
            <motion.p
              variants={item}
              className="mb-10 max-w-xl text-sm leading-relaxed font-light text-zinc-200 sm:text-base"
            >
              {description}
            </motion.p>
          )}

          <motion.div
            variants={item}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {primaryCtaText && (
              <a
                href={primaryCtaHref}
                className="rounded-lg border border-zinc-700 bg-white px-7 py-3 text-sm font-medium text-black transition-all duration-200"
              >
                {primaryCtaText}
              </a>
            )}
            {secondaryCtaText && (
              <a
                href={secondaryCtaHref}
                className="group inline-flex items-center gap-2.5 rounded-lg bg-white/10 px-7 py-3 text-sm font-medium text-white shadow-sm outline -outline-offset-1 outline-white/20 backdrop-blur-sm"
              >
                <span>{secondaryCtaText}</span>
                <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            )}
          </motion.div>
        </div>

        {/* Trusted brands removed */}
      </motion.div>
    </section>
  )
}
