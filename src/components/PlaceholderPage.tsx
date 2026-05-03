import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";

type PlaceholderPageProps = {
  title: string;
  active: string;
  description: string;
  currentWorkaround: string;
};

export default function PlaceholderPage({
  title,
  active,
  description,
  currentWorkaround,
}: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <AppSidebar active={active} />

        <section className="min-h-screen flex-1 p-6 lg:ml-64">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
              <p className="mt-2 text-lg text-slate-600">
                This section is not active yet.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                In progress
              </div>

              <h2 className="mt-6 text-2xl font-bold text-slate-900">
                Planned Section
              </h2>

              <p className="mt-3 text-slate-700">{description}</p>

              <h3 className="mt-8 text-sm font-black uppercase tracking-wide text-slate-800">
                Current Workflow
              </h3>

              <p className="mt-2 text-slate-700">{currentWorkaround}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back to Dashboard
                </Link>

                <Link
                  href="/estimates"
                  className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white hover:bg-blue-700"
                >
                  Go to Estimates
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}