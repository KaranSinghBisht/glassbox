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
                Launch Mission Control
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
              Agent Swarm <br className="hidden md:block" /> Mission Control
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Watch AI agents collaborate in real-time with{" "}
              <span className="text-slate-100">transparent decision-making</span>.
              The first dashboard designed for Human-in-the-Loop orchestration.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-lg shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]"
                >
                  Start Simulation
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
                  title: "Graph Viz",
                  desc: "Visualize agent interactions and data flow in real-time.",
                },
                {
                  icon: Shield,
                  title: "Human Loop",
                  desc: "Intervene on high-risk actions before execution.",
                },
                {
                  icon: Layout,
                  title: "Generative UI",
                  desc: "Agents render React components to communicate results.",
                },
                {
                  icon: Zap,
                  title: "Event Timeline",
                  desc: "Millisecond-precision logging for full auditability.",
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
                Orchestration <br />
                made simple.
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                GlassBox turns the black box of LLM swarms into a transparent,
                manageable workflow.
              </p>

              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Define Objective",
                    desc: "Enter a high-level goal. The Orchestrator agent breaks it down.",
                  },
                  {
                    step: "02",
                    title: "Swarm Deploys",
                    desc: "Specialized agents (Research, Code, Audit) spawn instantly.",
                  },
                  {
                    step: "03",
                    title: "Review & Approve",
                    desc: "GlassBox pauses for approval on sensitive actions.",
                  },
                  {
                    step: "04",
                    title: "Artifact Delivery",
                    desc: "Receive code, plans, and reports in rich UI formats.",
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
                <div className="p-8 space-y-4 opacity-70">
                  <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-slate-800 rounded animate-pulse" />
                  <div className="h-32 w-full bg-slate-900 border border-slate-800 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20" />
                      <div className="h-3 w-24 bg-slate-800 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-slate-800 rounded" />
                      <div className="h-2 w-5/6 bg-slate-800 rounded" />
                    </div>
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
