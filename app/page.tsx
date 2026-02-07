import Link from "next/link";
import {
  ArrowRight,
  Box,
  Shield,
  Zap,
  Layout,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/primitives";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Box className="w-5 h-5 text-white" />
              </div>
              GlassBox
            </div>
            <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How it Works
              </a>
            </div>
            <Link href="/dashboard">
              <Button className="group">
                Generate a PRD
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </nav>

        <section className="pt-32 pb-24 px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Tambo Hackathon 2026
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 pb-2">
              The PRD Generator <br className="hidden md:block" /> You Can Trust
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Watch a team of AI agents research, write, and audit your Product Requirements Document in real-time.{" "}
              <span className="text-slate-100">Every section is traceable.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-lg shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]"
                >
                  Generate a PRD
                </Button>
              </Link>
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto h-14 px-8 bg-white/5 border-white/10 hover:bg-white/10"
              >
                Read the Docs
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 border-t border-white/5 bg-slate-900/20">
          <div className="max-w-7xl mx-auto px-6">
             <h2 className="text-3xl font-bold mb-12 text-center">Why GlassBox?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: GitBranch,
                  title: "Research Agent",
                  desc: "Analyzes your product idea, identifies target users, constraints, and market context.",
                },
                {
                  icon: Shield,
                  title: "PM Agent",
                  desc: "Writes comprehensive PRDs with user stories, requirements, and success metrics.",
                },
                {
                  icon: Layout,
                  title: "Audit Agent",
                  desc: "Reviews for completeness, catches missing edge cases, rates confidence.",
                },
                {
                  icon: Zap,
                  title: "Full Transparency",
                  desc: "See every decision, every edit, every approval in real-time.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-slate-100">
                    {f.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                PRD generation <br />
                made transparent.
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                GlassBox turns the black box of AI writing into a transparent,
                verifiable workflow. Watch agents research, write, and audit your PRD.
              </p>

              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Describe Your Product",
                    desc: "Enter your product idea. The Research agent analyzes it.",
                  },
                  {
                    step: "02",
                    title: "Agents Research & Write",
                    desc: "Research gathers context. PM agent writes the PRD. Auditor reviews.",
                  },
                  {
                    step: "03",
                    title: "Review & Approve",
                    desc: "See every section as it's written. Approve or request changes.",
                  },
                  {
                    step: "04",
                    title: "Get Your PRD",
                    desc: "Download a verified, comprehensive Product Requirements Document.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="font-mono text-blue-500 font-bold pt-1">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200">{item.title}</h3>
                      <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 p-2 shadow-2xl rotate-1 lg:rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="absolute inset-0 bg-blue-500/20 blur-[100px] -z-10" />
              <div className="bg-slate-950 rounded-xl overflow-hidden border border-white/5">
                <div className="h-8 bg-slate-900 border-b border-white/5 flex items-center gap-2 px-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="p-6 relative" style={{ height: 220 }}>
                  {/* SVG edges with animated pulses */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {/* Orchestrator → Research */}
                    <line x1="50%" y1="38" x2="18%" y2="120" stroke="#334155" strokeWidth="1.5" />
                    <line x1="50%" y1="38" x2="18%" y2="120" stroke="#3b82f6" strokeWidth="1.5" opacity="0">
                      <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="0s" />
                    </line>
                    <circle r="3" fill="#60a5fa">
                      <animateMotion dur="2s" repeatCount="indefinite" begin="0s" path="M 150,38 L 54,120" />
                    </circle>

                    {/* Orchestrator → Code */}
                    <line x1="50%" y1="38" x2="50%" y2="120" stroke="#334155" strokeWidth="1.5" />
                    <line x1="50%" y1="38" x2="50%" y2="120" stroke="#8b5cf6" strokeWidth="1.5" opacity="0">
                      <animate attributeName="opacity" values="0;0.8;0" dur="2.4s" repeatCount="indefinite" begin="0.4s" />
                    </line>
                    <circle r="3" fill="#a78bfa">
                      <animateMotion dur="2.4s" repeatCount="indefinite" begin="0.4s" path="M 150,38 L 150,120" />
                    </circle>

                    {/* Orchestrator → Audit */}
                    <line x1="50%" y1="38" x2="82%" y2="120" stroke="#334155" strokeWidth="1.5" />
                    <line x1="50%" y1="38" x2="82%" y2="120" stroke="#10b981" strokeWidth="1.5" opacity="0">
                      <animate attributeName="opacity" values="0;0.8;0" dur="2.8s" repeatCount="indefinite" begin="0.8s" />
                    </line>
                    <circle r="3" fill="#34d399">
                      <animateMotion dur="2.8s" repeatCount="indefinite" begin="0.8s" path="M 150,38 L 246,120" />
                    </circle>
                  </svg>

                  {/* Orchestrator node */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-3 w-24 text-center">
                    <div className="relative mx-auto w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center animate-status-pulse">
                      <Box className="w-5 h-5 text-blue-400" />
                      <div className="absolute inset-0 rounded-lg animate-pulse-ring" style={{ boxShadow: "0 0 0 0 rgba(59,130,246,0.3)" }} />
                    </div>
                    <span className="text-[10px] text-blue-300 mt-1 block font-medium">Orchestrator</span>
                  </div>

                  {/* Research node */}
                  <div className="absolute left-[18%] -translate-x-1/2 top-[100px] w-20 text-center">
                    <div className="mx-auto w-9 h-9 rounded-lg bg-blue-500/10 border border-slate-700 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Research</span>
                  </div>

                   {/* PM node */}
                   <div className="absolute left-1/2 -translate-x-1/2 top-[100px] w-20 text-center">
                     <div className="mx-auto w-9 h-9 rounded-lg bg-violet-500/10 border border-slate-700 flex items-center justify-center animate-status-pulse">
                       <Layout className="w-4 h-4 text-violet-400" />
                     </div>
                     <span className="text-[10px] text-slate-400 mt-1 block">PM Agent</span>
                   </div>

                   {/* Audit node */}
                   <div className="absolute right-[18%] translate-x-1/2 top-[100px] w-20 text-center">
                     <div className="mx-auto w-9 h-9 rounded-lg bg-emerald-500/10 border border-slate-700 flex items-center justify-center">
                       <Shield className="w-4 h-4 text-emerald-400" />
                     </div>
                     <span className="text-[10px] text-slate-400 mt-1 block">Auditor</span>
                   </div>

                  {/* Status legend */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[9px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Thinking</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" />Acting</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Done</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Waiting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm">
          <p>Built for Tambo Hackathon 2026. Powered by Generative UI.</p>
        </footer>
      </div>
    </div>
  );
}
