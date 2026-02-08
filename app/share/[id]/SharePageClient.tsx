"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Clock,
  Users,
  FileText,
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  Copy,
  CheckCheck,
} from "lucide-react";

interface ShareData {
  run: {
    id: string;
    prompt: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
  };
  agents: {
    id: string;
    name: string;
    role: string;
    status: string;
  }[];
  artifacts: {
    id: string;
    name: string;
    content: string;
    contentType: string;
  }[];
  eventCount: number;
  duration: number | null;
}

function ArtifactSection({
  name,
  content,
  contentType,
  defaultExpanded,
}: {
  name: string;
  content: string;
  contentType: string;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isMarkdown =
    contentType?.includes("markdown") ||
    content.includes("## ") ||
    content.includes("# ");

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-900/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
        <FileText className="w-4 h-4 text-emerald-400" />
        <span className="font-medium text-slate-200 text-sm">{name}</span>
        <span className="text-xs text-slate-600 ml-auto font-mono">
          {content.split("\n").length} lines
        </span>
      </button>
      {expanded && (
        <div className="border-t border-white/5">
          {isMarkdown ? (
            <div className="p-6 md:p-8 text-sm text-slate-300 leading-relaxed prose-glassbox">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <pre className="p-6 text-xs text-slate-400 overflow-x-auto font-mono leading-relaxed">
              {content}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

const roleColors: Record<string, string> = {
  orchestrator: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  researcher: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  builder: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  auditor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function SharePageClient({
  run,
  agents,
  artifacts,
  eventCount,
  duration,
}: ShareData) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuccess = run.status === "completed";
  const createdDate = new Date(run.createdAt);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/8 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/8 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-sm tracking-tight hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png" alt="GlassBox" className="w-6 h-6 rounded-md" />
              GlassBox
            </Link>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-slate-400 hover:text-slate-200"
            >
              {copied ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  isSuccess
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {isSuccess ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                {isSuccess ? "Completed" : "Failed"}
              </span>
              {duration && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {duration}s
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="w-3 h-3" />
                {agents.length} agents
              </span>
              <span className="text-xs text-slate-600">
                {eventCount} events
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight mb-3">
              {run.prompt}
            </h1>

            <p className="text-sm text-slate-500">
              Generated on{" "}
              {createdDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {createdDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {agents.map((agent) => (
              <span
                key={agent.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  roleColors[agent.role] || roleColors.orchestrator
                }`}
              >
                {agent.name}
                <span className="opacity-50">·</span>
                <span className="opacity-70">{agent.status}</span>
              </span>
            ))}
          </div>

          {artifacts.length > 0 ? (
            <div className="space-y-4">
              {artifacts.map((artifact, i) => (
                <ArtifactSection
                  key={artifact.id}
                  name={artifact.name}
                  content={artifact.content}
                  contentType={artifact.contentType}
                  defaultExpanded={i === 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-600">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No artifacts were generated for this run.</p>
            </div>
          )}
        </main>

        <footer className="border-t border-white/5 mt-16">
          <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-slate-600">
            <span>
              Generated by{" "}
              <Link href="/" className="text-blue-400 hover:underline">
                GlassBox
              </Link>{" "}
              — AI Agent Swarm
            </span>
            <Link
              href="/dashboard"
              className="text-blue-400 hover:underline"
            >
              Create your own →
            </Link>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .prose-glassbox h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .prose-glassbox h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #cbd5e1;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .prose-glassbox h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #94a3b8;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .prose-glassbox p {
          margin-bottom: 0.75rem;
          color: #94a3b8;
        }
        .prose-glassbox ul,
        .prose-glassbox ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          color: #94a3b8;
        }
        .prose-glassbox ul {
          list-style-type: disc;
        }
        .prose-glassbox ol {
          list-style-type: decimal;
        }
        .prose-glassbox li {
          margin-bottom: 0.25rem;
        }
        .prose-glassbox strong {
          color: #e2e8f0;
          font-weight: 600;
        }
        .prose-glassbox blockquote {
          border-left: 2px solid rgba(59, 130, 246, 0.3);
          padding-left: 1rem;
          color: #64748b;
          font-style: italic;
          margin: 0.75rem 0;
        }
        .prose-glassbox code {
          background: #1e293b;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.8em;
          color: #93c5fd;
        }
        .prose-glassbox pre {
          background: #0f172a;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.75rem 0;
        }
        .prose-glassbox pre code {
          background: none;
          padding: 0;
        }
        .prose-glassbox table {
          width: 100%;
          font-size: 0.8rem;
          border-collapse: collapse;
          margin: 0.75rem 0;
        }
        .prose-glassbox th {
          text-align: left;
          color: #cbd5e1;
          border-bottom: 1px solid #334155;
          padding: 0.5rem 0.75rem;
          font-weight: 600;
        }
        .prose-glassbox td {
          color: #94a3b8;
          border-bottom: 1px solid #1e293b;
          padding: 0.5rem 0.75rem;
        }
        .prose-glassbox hr {
          border-color: #1e293b;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}
