"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  CreditCard,
  FileBarChart,
  Landmark,
  Bell,
  Settings,
  Menu,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Debtors", href: "/customers", icon: Users },
  { name: "Creditors", href: "/suppliers", icon: Building2 },
  { name: "Products", href: "/products", icon: Package },
  { name: "Inventory", href: "/inventory", icon: Boxes },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Purchases", href: "/purchases", icon: ShoppingBag },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "GST & Tax", href: "/tax", icon: Landmark },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function TopNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden mr-2" />}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-white">
            <SheetHeader>
              <SheetTitle className="text-left font-bold text-xl flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">A</div>
                Accountra
              </SheetTitle>
            </SheetHeader>
            <div className="grid gap-2 py-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-slate-100",
                      isActive ? "bg-slate-100 text-blue-600" : "text-slate-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <Button className="w-full justify-start" variant="outline" onClick={() => setIsMobileMenuOpen(false)}>
                <Plus className="mr-2 h-4 w-4" /> New Invoice
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => setIsMobileMenuOpen(false)}>
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="hidden lg:flex font-bold text-xl text-slate-900 tracking-tight">
            Accountra
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar mask-edges pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            // Dashboard special case
            const isExactActive = item.href === "/" ? pathname === "/" : isActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-row items-center justify-center gap-2 px-3 h-10 rounded-full transition-all hover:bg-slate-100 whitespace-nowrap",
                  isExactActive ? "text-blue-700 bg-blue-50 shadow-sm border border-blue-100" : "text-slate-700 hover:text-slate-900"
                )}
              >
                <Icon strokeWidth={isExactActive ? 2.5 : 2} className={cn("h-4 w-4", isExactActive && "fill-blue-100 stroke-blue-700")} />
                <span className="text-sm font-bold">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2 ml-auto pl-4 border-l">
          <Button variant="ghost" size="icon" className="hidden sm:flex text-slate-500 hover:text-slate-900">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Link href="/settings" className="hidden sm:flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Link>
          <div onClick={() => signOut()} title="Sign Out">
            <Avatar className="h-8 w-8 ml-2 border cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-red-100 text-red-700 font-medium">Out</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
