"use client";

import { useEffect, useState } from "react";
import { Overview } from "./overview";

export function OverviewWrapper({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div className="h-[350px] w-full animate-pulse bg-slate-100/50 rounded-xl"></div>;
  }
  
  return <Overview data={data} />;
}
