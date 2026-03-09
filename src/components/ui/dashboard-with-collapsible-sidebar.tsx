"use client";

import React, { useEffect, useState } from "react";
import {
  Home,
  ChevronDown,
  ChevronsRight,
  Settings,
  HelpCircle,
  MessageCircle,
  FilePlus2,
  ListChecks,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

// Layout wrapper: keep existing page content via children
export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Force dark mode only
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Responsive: auto-collapse sidebar on small screens and handle resizes
  useEffect(() => {
    const applyResponsive = () => {
      const isSmall = window.innerWidth < 768; // md breakpoint
      setSidebarOpen(!isSmall);
    };
    applyResponsive();
    window.addEventListener("resize", applyResponsive);
    return () => window.removeEventListener("resize", applyResponsive);
  }, []);

  return (
    <div className="flex min-h-screen w-full dark">
      <div className="flex w-full bg-gray-950 text-gray-100">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 p-0 overflow-hidden bg-gray-950">
          <Header onLogoClick={() => setSidebarOpen(!sidebarOpen)} />
          {/* content container with smooth fade-in and subtle scale */}
          <div className="overflow-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-4 bg-gray-950">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Sidebar */
const Sidebar = ({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) => {
  const [selected, setSelected] = React.useState("Dashboard");
  const navigate = useNavigate();

  const options = [
    { icon: Home, title: "Dashboard" },
    { icon: FilePlus2, title: "New Report" },
    { icon: ListChecks, title: "My Reports" },
    { icon: MessageCircle, title: "Chat Assistant" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${
        open ? "w-64" : "w-16"
      } border-gray-800 bg-gray-900 p-2 shadow-sm flex flex-col`}
    >
      <TitleSection open={open} />
      <div className="space-y-1 mb-8">
        {options.map((opt) => (
          <Option
            key={opt.title}
            Icon={opt.icon}
            title={opt.title}
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
        ))}
      </div>

      {open && (
        <div className="border-t border-gray-800 pt-4 space-y-1">
          <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Account
          </div>
          <Option Icon={Settings} title="Settings" selected={selected} setSelected={setSelected} open={open} />
          <Option Icon={HelpCircle} title="Help & Support" selected={selected} setSelected={setSelected} open={open} />
        </div>
      )}

      {/* Sign Out Button - Always at bottom */}
      <div className="mt-auto border-t border-gray-800 pt-4">
        <button
          onClick={handleSignOut}
          className="relative flex h-11 w-full items-center rounded-md transition-all duration-200 text-gray-400 hover:bg-red-900/40 hover:text-red-300 hover:border-l-2 hover:border-red-500"
        >
          <div className="grid h-full w-12 place-content-center">
            <LogOut className="h-4 w-4" />
          </div>
          {open && (
            <span className="text-sm font-medium transition-opacity duration-200 opacity-100">
              Sign Out
            </span>
          )}
        </button>
      </div>

      <ToggleClose open={open} setOpen={setOpen} />
    </nav>
  );
};

const Option = ({ Icon, title, selected, setSelected, open }: any) => {
  const isSelected = selected === title;
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    setSelected(title);

    // Extract role from current URL path
    const pathMatch = location.pathname.match(/\/dashboard\/(\w+)/);
    const currentRole = pathMatch ? pathMatch[1] : "student";

    if (title === "Dashboard") {
      navigate(`/dashboard/${currentRole}`);
    } else if (title === "New Report") {
      navigate(`/dashboard/${currentRole}/report/new`);
    } else if (title === "My Reports") {
      navigate(`/dashboard/${currentRole}/myReport`);
    } else if (title === "Chat Assistant") {
      navigate(`/dashboard/${currentRole}/chat`);
    } else if (title === "Settings") {
      navigate(`/dashboard/${currentRole}/settings`);
    } else if (title === "Help & Support") {
      navigate(`/dashboard/${currentRole}/help`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
        isSelected
          ? "bg-cyan-900/40 text-cyan-300 shadow-sm border-l-2 border-cyan-500"
          : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
      }`}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
      </div>

      {open && (
        <span className={`text-sm font-medium transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}>
          {title}
        </span>
      )}
    </button>
  );
};

const TitleSection = ({ open }: { open: boolean }) => {
  return (
    <div className="mb-6 border-b border-gray-800 pb-4">
      <div className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-800">
        <div className="flex items-center gap-3">
          <Logo />
          {open && (
            <div className={`transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}>
              <div className="flex items-center gap-2">
                <div>
                  <span className="block text-sm font-semibold text-gray-100">Rakshak</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {open && <ChevronDown className="h-4 w-4 text-gray-500" />}
      </div>
    </div>
  );
};

const Logo = () => {
  return (
    <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 shadow-sm">
      <svg width="20" height="20" viewBox="0 0 50 39" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-white">
        <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" />
        <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" />
      </svg>
    </div>
  );
};

const ToggleClose = ({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) => {
  return (
    <button onClick={() => setOpen(!open)} className="border-t border-gray-800 transition-colors hover:bg-gray-800">
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight className={`h-4 w-4 transition-transform duration-300 text-gray-500 ${open ? "rotate-180" : ""}`} />
        </div>
        {open && (
          <span className={`text-sm font-medium text-gray-300 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}>
            Hide
          </span>
        )}
      </div>
    </button>
  );
};

/* Header */
const Header = ({ onLogoClick }: { onLogoClick: () => void }) => {
  const { user, profile } = useAuth();

  // FIX: Safely extract display name
  let displayName = "Welcome";

  if (profile?.display_name) {
    displayName = typeof profile.display_name === "string" ? profile.display_name : "Welcome";
  } else if (user?.user_metadata?.display_name) {
    displayName = typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name : "Welcome";
  } else if (user?.email) {
    displayName = user.email.split("@")[0];
  }

  return (
    <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="group cursor-pointer" onClick={onLogoClick}>
          <h1 className="text-2xl font-bold text-gray-100 hover:text-cyan-400 transition-colors">{displayName}</h1>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

/* Tailwind keyframes (add to tailwind.config.js if missing)
extend: {
  keyframes: {
    float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
    fadeIn: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
    pulse: { '0%,100%': { opacity: 0.85 }, '50%': { opacity: 1 } },
  },
  animation: {
    float: 'float 8s ease-in-out infinite',
    fadeIn: 'fadeIn 0.5s ease-out forwards',
    pulse: 'pulse 2s ease-in-out infinite',
  },
}
*/
