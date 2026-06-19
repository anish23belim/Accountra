import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white relative overflow-hidden">
      
      {/* Left Column: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative z-10 bg-white shadow-2xl">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30 mb-8 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">Welcome to Accountra</h1>
            <p className="text-slate-500 text-lg">The easiest way to manage your business finances.</p>
          </div>
          
          <LoginForm />
          
          <p className="mt-10 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} Accountra Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Column: Decorative Banner */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
        
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-500/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-purple-600/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] left-[40%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>

        {/* Feature Display Card */}
        <div className="relative z-10 max-w-lg p-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl">
          <div className="flex gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-6 leading-snug">Everything you need to scale your business.</h2>
          <ul className="space-y-4">
            {[
              "Multi-Company Management",
              "Smart Inventory Tracking",
              "Automated GST & Taxation",
              "Real-time Cashbook & Reports"
            ].map((feature, i) => (
              <li key={i} className="flex items-center text-slate-200">
                <svg className="w-6 h-6 mr-3 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-lg">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
