import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Layers,
  Plus,
  Upload,
  FolderOpen,
  ClipboardList,
  Search,
  Clock,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const firstName = user.firstName || "there";

  return (
    <div className="earth-linen-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e2d5c3] bg-[#faf7f2]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#c2410c]">
              <Layers className="size-5 text-white" />
            </div>
            <span className="earth-serif text-xl font-bold text-[#292018]">
              Layerwise
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/takeoff"
              className="text-sm text-[#78716c] transition-colors hover:opacity-70"
            >
              Takeoff
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Greeting */}
        <div className="earth-fade-up mb-10">
          <h1 className="earth-serif text-3xl font-bold text-[#292018]">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-base text-[#78716c]">
            Ready to start your next takeoff?
          </p>
        </div>

        {/* Start New Takeoff Card */}
        <div className="earth-fade-up earth-fade-up-delay-1 mb-10">
          <div className="earth-shadow-lg earth-parchment earth-hover-lift overflow-hidden rounded-3xl border border-[#e2d5c3] p-10">
            <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[rgba(194,65,12,0.1)]">
                  <Plus className="size-7 text-[#c2410c]" />
                </div>
                <div>
                  <h2 className="earth-serif text-2xl font-semibold text-[#292018]">
                    Start a new takeoff
                  </h2>
                  <p className="mt-1 max-w-md leading-relaxed text-[#78716c]">
                    Upload a blueprint PDF and let our AI extract precise
                    quantities, measurements, and material counts.
                  </p>
                </div>
              </div>
              <Link href="/takeoff">
                <span className="earth-btn-primary flex items-center gap-2 whitespace-nowrap">
                  <Upload className="size-4" />
                  Upload Blueprint
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="earth-fade-up earth-fade-up-delay-2 mb-10 grid gap-6 sm:grid-cols-3">
          {statCards.map((stat, i) => (
            <div
              key={i}
              className="earth-shadow-sm earth-hover-lift rounded-2xl border border-[#e2d5c3] bg-white p-6"
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex size-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: stat.bgColor }}
                >
                  <stat.icon className="size-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#78716c]">
                    {stat.label}
                  </p>
                  <p className="earth-serif text-2xl font-bold text-[#292018]">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative Divider */}
        <div className="earth-fade-up earth-fade-up-delay-2 mb-10">
          <div className="earth-divider">
            <div className="earth-divider-diamond" />
          </div>
        </div>

        {/* Recent Work */}
        <div className="earth-fade-up earth-fade-up-delay-3">
          <h2 className="earth-serif mb-6 text-xl font-semibold text-[#292018]">
            Recent Work
          </h2>
          <div className="earth-shadow rounded-2xl border border-[#e2d5c3] bg-white">
            <div className="flex flex-col items-center justify-center px-6 py-20">
              <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-[rgba(194,65,12,0.06)]">
                <FolderOpen className="size-10 text-[#c2410c]" />
              </div>
              <p className="earth-serif text-xl italic text-[#78716c]">
                Your work will appear here
              </p>
              <p className="mt-2 max-w-sm text-center text-sm text-[#a8a29e]">
                Once you complete your first takeoff, your projects and results
                will be listed in this section.
              </p>
              <Link href="/takeoff">
                <span className="earth-btn-primary mt-8 inline-flex items-center gap-2 text-sm !px-6 !py-2.5">
                  Start Your First Takeoff
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#e2d5c3]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-[#c2410c]">
              <Layers className="size-3 text-white" />
            </div>
            <span className="earth-serif text-sm font-semibold text-[#292018]">
              Layerwise
            </span>
          </div>
          <p className="text-xs text-[#a8a29e]">
            &copy; {new Date().getFullYear()} Layerwise
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Data ── */

const statCards = [
  {
    icon: ClipboardList,
    label: "Projects",
    value: "0",
    color: "#c2410c",
    bgColor: "rgba(194, 65, 12, 0.08)",
  },
  {
    icon: Search,
    label: "Items Found",
    value: "0",
    color: "#166534",
    bgColor: "rgba(22, 101, 52, 0.08)",
  },
  {
    icon: Clock,
    label: "Hours Saved",
    value: "0",
    color: "#92400e",
    bgColor: "rgba(146, 64, 14, 0.08)",
  },
];
