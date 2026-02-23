import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Layers,
  ScanSearch,
  Ruler,
  Zap,
  Download,
  FileText,
  ShieldCheck,
  ArrowRight,
  Star,
  Award,
  Users,
  Clock,
} from "lucide-react";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="earth-linen-bg min-h-screen">
      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "#faf7f2", borderColor: "#e2d5c3" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#c2410c]">
              <Layers className="size-5 text-white" />
            </div>
            <span className="earth-serif text-xl font-bold text-[#292018]">
              Layerwise
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-[#78716c] transition-colors hover:opacity-70"
            >
              Sign In
            </Link>
            <Link href="/sign-up">
              <span className="earth-btn-primary inline-flex items-center gap-2 text-sm !px-6 !py-2.5">
                Get Started
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-20">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left Content */}
          <div className="earth-fade-up">
            <h1 className="earth-serif text-5xl font-bold leading-tight tracking-tight text-[#292018] lg:text-6xl">
              The{" "}
              <em className="not-italic text-[#c2410c]">
                <span className="earth-wavy-underline italic">craft</span>
              </em>{" "}
              of building deserves better tools.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#78716c]">
              Layerwise transforms architectural blueprints into precise
              quantity takeoffs using AI that understands construction the way
              you do. Upload a drawing, and watch your estimate build itself.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/sign-up">
                <span className="earth-btn-primary inline-flex items-center gap-2 text-base">
                  Start Your First Takeoff
                  <ArrowRight className="size-4" />
                </span>
              </Link>
              <Link href="#features">
                <span className="earth-btn-outline inline-block text-sm">
                  See Features
                </span>
              </Link>
            </div>
            {/* Testimonial Quote */}
            <div className="mt-12 border-l-2 border-[#e2d5c3] pl-6">
              <p className="earth-serif text-lg italic leading-relaxed text-[#78716c]">
                &ldquo;What took our team 4 hours now takes 4 minutes. Layerwise
                has changed how we approach every bid.&rdquo;
              </p>
              <p className="mt-3 text-sm font-medium text-[#a8a29e]">
                &mdash; Senior Estimator, Commercial Construction
              </p>
            </div>
          </div>

          {/* Right - Mock Data Card */}
          <div className="earth-fade-up earth-fade-up-delay-2 hidden lg:block">
            <div className="earth-shadow-lg earth-parchment overflow-hidden rounded-3xl border border-[#e2d5c3] p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="earth-serif text-lg font-semibold text-[#292018]">
                  Takeoff Summary
                </h3>
                <span className="earth-stamp text-xs text-[#166534]">
                  Complete
                </span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Interior Doors (3'-0\" x 7'-0\")", qty: "14 ea", cat: "count" },
                  { label: "Interior Partition Walls", qty: "847 LF", cat: "linear" },
                  { label: "Floor Area - Carpet", qty: "4,250 SF", cat: "area" },
                  { label: "Concrete Foundation", qty: "142 CY", cat: "volume" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.7)" : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`earth-badge-${item.cat} inline-flex rounded-full px-2 py-0.5 text-xs font-semibold`}
                      >
                        {item.cat}
                      </span>
                      <span className="text-sm font-medium text-[#292018]">
                        {item.label}
                      </span>
                    </div>
                    <span className="earth-serif text-sm font-bold text-[#292018]">
                      {item.qty}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 border-t border-[#e2d5c3] pt-4">
                <div className="size-2 rounded-full bg-[#166534]" />
                <span className="text-xs text-[#78716c]">
                  10 items identified across 4 categories
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="earth-divider">
          <div className="earth-divider-diamond" />
        </div>
      </div>

      {/* Capabilities Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="earth-serif text-4xl font-bold text-[#292018]">
            Built for the way you work
          </h2>
          <p className="mt-4 text-lg text-[#78716c]">
            Every feature designed with construction professionals in mind
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, i) => (
            <div
              key={i}
              className="earth-hover-lift earth-shadow earth-fade-up rounded-2xl border border-[#e2d5c3] bg-white p-8"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[#f3ece1]"
              >
                <feature.icon
                  className="size-6"
                  style={{ color: i % 2 === 0 ? "#c2410c" : "#166534" }}
                />
              </div>
              <h3 className="earth-serif text-xl font-semibold text-[#292018]">
                {feature.title}
              </h3>
              <p className="mt-2 leading-relaxed text-[#78716c]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="earth-divider">
          <div className="earth-divider-diamond" />
        </div>
      </div>

      {/* Process Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="earth-serif text-4xl font-bold text-[#292018]">
            From blueprint to estimate in three steps
          </h2>
          <p className="mt-4 text-lg text-[#78716c]">
            A process as straightforward as it should be
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="earth-shadow earth-parchment earth-hover-lift earth-fade-up rounded-3xl border border-[#e2d5c3] p-10"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <span className="earth-serif text-6xl font-thin leading-none text-[#e2d5c3]">
                {step.number}
              </span>
              <h3 className="earth-serif mt-6 text-2xl font-semibold text-[#292018]">
                {step.title}
              </h3>
              <p className="mt-3 leading-relaxed text-[#78716c]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="border-y border-[#e2d5c3] bg-[#f3ece1] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="earth-serif mb-10 text-center text-xl font-semibold italic text-[#78716c]">
            Trusted by construction professionals nationwide
          </p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="earth-fade-up flex flex-col items-center text-center"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="earth-stamp mb-3 text-[#c2410c]">
                  <stat.icon className="size-4" />
                </div>
                <span className="earth-serif text-3xl font-bold text-[#292018]">
                  {stat.value}
                </span>
                <span className="mt-1 text-sm text-[#78716c]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="earth-gradient earth-shadow-lg overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16">
            <h2 className="earth-serif text-3xl font-bold text-white sm:text-4xl">
              Built by estimators, for estimators.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Join thousands of professionals who trust Layerwise to deliver
              accurate, fast takeoffs on every project.
            </p>
            <Link href="/sign-up">
              <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#c2410c] transition-all hover:bg-white/90">
                Get Started Free
                <ArrowRight className="size-4" />
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/60">
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e2d5c3] bg-[#faf7f2]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#c2410c]">
              <Layers className="size-4 text-white" />
            </div>
            <span className="earth-serif text-base font-bold text-[#292018]">
              Layerwise
            </span>
          </div>
          <p className="text-sm text-[#78716c]">
            AI-powered blueprint takeoffs for construction professionals.
          </p>
          <p className="text-xs text-[#a8a29e]">
            &copy; {new Date().getFullYear()} Layerwise
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Data ── */

const features = [
  {
    icon: ScanSearch,
    title: "Blueprint Intelligence",
    description:
      "Our AI reads blueprints the way an experienced estimator would, identifying elements by context, not just symbols.",
  },
  {
    icon: Ruler,
    title: "Scale Recognition",
    description:
      "Automatic scale detection reads the drawing notation and applies measurements accurately.",
  },
  {
    icon: Zap,
    title: "Live Results",
    description:
      "Watch your takeoff build in real-time as items are identified and catalogued.",
  },
  {
    icon: Download,
    title: "One-Click Export",
    description:
      "Export your complete takeoff to CSV, ready for your estimating workflow.",
  },
  {
    icon: FileText,
    title: "PDF Processing",
    description:
      "Upload architectural PDFs directly. Multi-page documents handled with care.",
  },
  {
    icon: ShieldCheck,
    title: "Accuracy You Can Trust",
    description:
      "Every item includes a confidence score so you know exactly where to focus your review.",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload",
    description:
      "Drag your blueprint PDF into Layerwise. We accept architectural drawings of any scale or complexity.",
  },
  {
    number: "02",
    title: "Configure",
    description:
      "Set your scale preference or let our AI detect it automatically. Choose your trade focus if needed.",
  },
  {
    number: "03",
    title: "Extract",
    description:
      "Watch as quantities are identified and catalogued in real-time. Review, adjust, and export when ready.",
  },
];

const stats = [
  { icon: Star, label: "Accuracy Rate", value: "94%" },
  { icon: Clock, label: "Time Saved", value: "85%" },
  { icon: Users, label: "Professionals", value: "2,400+" },
  { icon: Award, label: "Blueprints Analyzed", value: "18,000+" },
];
