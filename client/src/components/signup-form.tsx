import { useState } from "react"
import { motion, type Variants } from "motion/react"
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react"
import signupBg from "@/assets/signup.avif"

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#050505] font-sans text-white antialiased selection:bg-red-500/30 selection:text-white lg:flex-row">
      {/* Left Image Panel */}
      <div className="relative flex min-h-[40vh] w-full flex-col justify-between overflow-hidden lg:min-h-screen lg:w-1/2">
        {/* Background Image */}
        <img
          src={signupBg}
          alt="Vibrant abstract background"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between p-10"></div>

        {/* Bottom Content */}
        <div className="relative z-10 p-10 pb-20">
          <h1 className="mb-6 text-5xl leading-[1.1] font-semibold tracking-tight text-white xl:text-6xl">
            Asset Management &
            <br />
            Procurement System
          </h1>
          <p className="max-w-lg text-lg text-white/90">
            LINAW empowers businesses to adopt blockchain-enabled procurement
            workflows
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md md:max-w-lg xl:max-w-xl"
        >
          {/* Form */}
          <form className="flex flex-col gap-5">
            {/* Username */}
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-neutral-200"
              >
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  className="w-full rounded-lg border border-transparent bg-[#111111] py-3.5 pr-4 pl-11 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-700 focus:bg-[#161616] focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-neutral-200"
              >
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-lg border border-transparent bg-[#111111] py-3.5 pr-4 pl-11 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-700 focus:bg-[#161616] focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-neutral-200"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full rounded-lg border border-transparent bg-[#111111] py-3.5 pr-11 pl-11 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-700 focus:bg-[#161616] focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-500 hover:text-neutral-300"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Minimum length is 8 characters.
              </p>
            </motion.div>

            {/* Sign Up Button */}
            <motion.div variants={itemVariants} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-lg bg-[#DC2626] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#b91c1c] active:scale-[0.98]"
              >
                Sign Up
              </button>
            </motion.div>
          </form>

          {/* Footer Terms */}
          <motion.div
            variants={itemVariants}
            className="mt-6 text-center text-[13px] leading-relaxed text-neutral-400"
          >
            By creating an account, you agree to the{" "}
            <a href="/privacy-policy" className="underline hover:text-white">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="/terms-of-service" className="underline hover:text-white">
              Terms of Service
            </a>
          </motion.div>

          {/* Bottom Login Link */}
          <motion.div
            variants={itemVariants}
            className="mt-12 text-center text-sm text-neutral-300"
          >
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-[#DC2626] hover:underline"
            >
              Login
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
