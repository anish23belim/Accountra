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
  Banknote,
  LogOut,
  ChevronRight
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
  { name: "Sale Returns", href: "/sales/returns", icon: ShoppingCart },
  { name: "Purchases", href: "/purchases", icon: ShoppingBag },
  { name: "Purchase Returns", href: "/purchases/returns", icon: ShoppingBag },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Cash Book", href: "/cashbook", icon: Banknote },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "GST & Tax", href: "/tax", icon: Landmark },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function TopNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === '/login' || pathname === '/onboarding' || pathname === '/companies') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center px-4 md:px-6 max-w-7xl mx-auto">
        
        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger className="md:hidden mr-2 p-2 hover:bg-slate-100 rounded-xl inline-flex items-center justify-center">
              <Menu className="h-6 w-6 text-slate-700" />
              <span className="sr-only">Toggle menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] bg-white border-r-0 p-0 shadow-2xl flex flex-col">
            <SheetHeader className="p-6 text-left border-b border-slate-100 bg-slate-50/50">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <span className="font-bold text-xl">A</span>
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">Accountra</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-all",
                      isActive 
                        ? "bg-blue-50 text-blue-700 shadow-sm" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-md transition-colors", isActive ? "bg-blue-100/50 text-blue-700" : "text-slate-400 group-hover:text-slate-700")}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {item.name}
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-blue-500" />}
                  </Link>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 rounded-xl h-12"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Logo */}
        <Link href="/" className="flex items-center gap-3 mr-8 group">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105">
            <span className="font-bold text-xl">A</span>
          </div>
          <span className="hidden lg:flex font-extrabold text-2xl text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
            Accountra
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar mask-edges pb-1 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExactActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 h-10 rounded-full transition-all duration-200 whitespace-nowrap outline-none",
                  isExactActive 
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 font-medium" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                )}
              >
                <Icon strokeWidth={isExactActive ? 2.5 : 2} className={cn("h-4 w-4", isExactActive ? "text-blue-300" : "text-slate-400")} />
                <span className="text-[13px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3 ml-auto pl-6 border-l border-slate-200">
          <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </Button>
          <Link href="/companies">
            <Button variant="outline" size="sm" className="hidden sm:flex rounded-full h-9 text-xs font-semibold px-4 border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Switch Company
            </Button>
          </Link>
          <div onClick={() => signOut()} title="Sign Out" className="cursor-pointer group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-0 group-hover:opacity-40 transition duration-300"></div>
            <Avatar className="h-9 w-9 border-2 border-white shadow-sm relative">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-xs">AD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
