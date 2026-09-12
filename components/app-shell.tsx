import Link from "next/link";
import { LogOut, Package, PanelsTopLeft, Settings } from "lucide-react";

const nav = [
  { label: "HOME", href: "/dashboard", icon: PanelsTopLeft },
  { label: "PRODUCTS", href: "/products", icon: Package },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f3ec] text-[#1e1b18]">
      <aside className="fixed inset-y-0 left-0 hidden w-[184px] border-r border-[#ded6ca] px-6 py-8 lg:flex lg:flex-col">
        <Link href="/dashboard" className="leading-none">
          <span className="block text-[0.67rem] font-semibold tracking-[0.22em] text-[#746d64]">
            STUDIO
          </span>
          <span className="mt-2 block text-lg font-semibold tracking-[0.08em]">
            PRODUCTS
          </span>
        </Link>
        <nav className="mt-16 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-md px-2 py-2 text-[0.72rem] font-semibold tracking-[0.14em] text-[#62594f] transition hover:bg-[#eee7db] hover:text-[#1e1b18]"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <Link
            className="flex items-center gap-3 px-2 py-2 text-[0.72rem] font-semibold tracking-[0.14em] text-[#62594f]"
            href="/settings"
          >
            <Settings className="h-4 w-4" />
            SETTINGS
          </Link>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-3 px-2 py-2 text-[0.72rem] font-semibold tracking-[0.14em] text-[#62594f]">
              <LogOut className="h-4 w-4" />
              ACCOUNT
            </button>
          </form>
        </div>
      </aside>
      <header className="sticky top-0 z-20 border-b border-[#ded6ca] bg-[#f7f3ec]/92 px-5 py-4 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-[0.16em]"
          >
            STUDIO PRODUCTS
          </Link>
          <Link
            href="/products/new"
            className="text-xs font-semibold tracking-[0.12em]"
          >
            NEW
          </Link>
        </div>
      </header>
      <main className="lg:pl-[184px]">{children}</main>
    </div>
  );
}
