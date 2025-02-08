export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E6EEF5] via-[#F0F5F9] to-[#E6EEF5] dark:from-[#1A2A3A] dark:via-[#223344] dark:to-[#1A2A3A]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,160,255,0.1),rgba(255,255,255,0)_50%)] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(30,40,80,0.2),rgba(0,0,0,0)_50%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full border border-[#B8D1E5]/30 dark:border-[#5A7A99]/30"></div>
          <div
            className="absolute inset-0 rounded-full border border-[#2B4C6F]/30 dark:border-white/30 animate-spin"
            style={{ borderTopColor: "transparent", animationDuration: "2s" }}
          ></div>
        </div>
        <h2 className="mt-8 text-2xl tracking-[0.2em] uppercase text-[#2B4C6F]/80 dark:text-white/80">
          Loading your story...
        </h2>
        <p className="mt-4 text-xl tracking-[0.15em] uppercase text-[#5A7A99] dark:text-white/60">
          What do you think will happen?
        </p>
      </div>
    </div>
  )
}

