"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_VERSION, BUILD_DATE } from "@/lib/version";
import {
  LayoutDashboard,
  Megaphone,
  Target,
  Image,
  BarChart3,
  Settings,
  FolderOpen,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Campanhas",
    href: "/dashboard/campaigns",
    icon: Megaphone,
  },
  {
    title: "Ad Sets",
    href: "/dashboard/ad-sets",
    icon: Target,
  },
  {
    title: "Criativos",
    href: "/dashboard/creatives",
    icon: FolderOpen,
  },
  {
    title: "Materiais",
    href: "/dashboard/materials",
    icon: Image,
  },
  {
    title: "Relatórios",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-blue-600">Kwai Dashboard</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex justify-between text-xs text-gray-400">
          <span>v{APP_VERSION}</span>
          <span>{BUILD_DATE}</span>
        </div>
      </div>
    </div>
  );
}

