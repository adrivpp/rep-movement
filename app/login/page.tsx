import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f7f3ec] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="w-full max-w-md">
          <p className="micro-label">PRODUCT BUILDER</p>
          <h1 className="mt-5 text-5xl font-medium tracking-normal text-[#1f1b17] sm:text-6xl">
            Client product studio.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-[#746d64]">
            A calm workspace for collecting Shopify-ready product details,
            imagery, variants, pricing, SEO, and review feedback.
          </p>
          <AuthForm />
          <p className="mt-8 text-sm text-[#746d64]">
            Need a reset?{" "}
            <Link className="text-[#1f1b17] underline underline-offset-4" href="/reset-password">
              Send password reset
            </Link>
          </p>
        </div>
      </section>
      <section className="hidden min-h-screen bg-[url('https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center lg:block" />
    </main>
  );
}
