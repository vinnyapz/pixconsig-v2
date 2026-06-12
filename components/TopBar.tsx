"use client";
import React, { useEffect, useState } from "react";
import {
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ShieldCheck,
  Crown,
  Store,
} from "lucide-react";
import { Page, UserType } from "@/types";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "@/components/NotificationsPopover";

interface TopBarProps {
  userType: UserType;
  userEmail?: string;
  onLogout: () => void;
}

const getUserTypeLabel = (userType: UserType): string => {
  const labels = {
    admin: "Admin",
    master: "Master",
    franqueado: "Franqueado",
  };
  return labels[userType];
};

export function TopBar({ userType, userEmail, onLogout }: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Map URLs to pages for active state
  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  const NavButton = ({
    path,
    label,
    icon: Icon,
  }: {
    path: string;
    label: string;
    icon?: React.ElementType;
  }) => (
    <Button
      onClick={() => handleNavigation(path)}
      variant="ghost"
      className={cn(
        "rounded-none h-auto px-1 pt-1 pb-1 text-sm font-medium border-b-2 hover:bg-transparent transition-colors",
        isActive(path)
          ? "border-[#0066A1] text-gray-900"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
      )}
    >
      {label}
    </Button>
  );

  const MobileNavButton = ({
    path,
    label,
    icon: Icon,
  }: {
    path: string;
    label: string;
    icon?: React.ElementType;
  }) => (
    <Button
      onClick={() => handleNavigation(path)}
      variant="ghost"
      className={cn(
        "w-full justify-start px-3 py-2.5 text-base font-medium rounded-lg h-auto transition-colors",
        isActive(path)
          ? "bg-[#0066A1]/10 text-[#0066A1]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      )}
    >
      {Icon && <Icon className="mr-3 h-5 w-5" />}
      {label}
    </Button>
  );

  const getRoleIcon = (type: UserType) => {
    switch (type) {
      case "admin":
        return <ShieldCheck className="h-4 w-4 text-[#0066A1]" />;
      case "master":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "franqueado":
        return <Store className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="bg-[#0066A1] p-1.5 rounded-lg">
                <img
                  src="/image.png"
                  alt="Grupo Raman"
                  className="h-5 w-auto object-contain cursor-pointer rounded"
                  onClick={() => handleNavigation("/dashboard")}
                />
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                {userType === "admin" && (
                  <>
                    <NavButton path="/dashboard" label="Dashboard" />
                    <NavButton path="/masters" label="Masters" />
                    <NavButton
                      path="/prefeituras/gestao"
                      label="Gestão de Prefeituras"
                    />
                    <NavButton path="/reports" label="Relatórios" />
                    <NavButton path="/comissoes" label="Comissões" />
                    <NavButton path="/metas" label="Metas" />
                  </>
                )}

                {userType === "master" && (
                  <>
                    <NavButton path="/dashboard" label="Dashboard" />
                    <NavButton path="/franqueados" label="Franqueados" />
                    <NavButton path="/prefeituras" label="Prefeituras" />
                    <NavButton path="/comissoes" label="Comissões" />
                    <NavButton path="/metas" label="Metas" />
                  </>
                )}

                {userType === "franqueado" && (
                  <>
                    <NavButton path="/dashboard" label="Dashboard" />
                    <NavButton path="/prefeituras" label="Minhas Prefeituras" />
                    <NavButton path="/comissoes" label="Comissões" />
                  </>
                )}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <NotificationsPopover />
              <div className="flex items-center space-x-4 text-sm text-gray-500 mr-4 border-r border-gray-200 pr-4">
                {userEmail && (
                  <span className="text-gray-600 hidden lg:inline-block">
                    {userEmail}
                  </span>
                )}
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  {getRoleIcon(userType)}
                  <span className="font-medium text-gray-900">
                    {getUserTypeLabel(userType)}
                  </span>
                </div>
              </div>
              {userType === "admin" && (
                <Button
                  onClick={() => handleNavigation("/settings")}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-[#0066A1] hover:bg-gray-100"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              )}
              <Button
                onClick={onLogout}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <Button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden",
          isMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="bg-[#0066A1] p-1.5 rounded-lg">
            <img
              src="/image.png"
              alt="Grupo Raman"
              className="h-5 w-auto object-contain"
            />
          </div>
          <Button
            onClick={() => setIsMenuOpen(false)}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="ml-auto mr-4 md:hidden">
            <NotificationsPopover />
          </div>
        </div>

        <div className="flex flex-col h-[calc(100%-64px)] justify-between">
          <div className="px-2 py-4 space-y-1 overflow-y-auto">
            {userType === "admin" && (
              <>
                <MobileNavButton path="/dashboard" label="Dashboard" />
                <MobileNavButton path="/masters" label="Masters" icon={Users} />
                <MobileNavButton
                  path="/prefeituras/gestao"
                  label="Gestão de Prefeituras"
                  icon={Building2}
                />
                <MobileNavButton
                  path="/reports"
                  label="Relatórios"
                  icon={FileText}
                />
              </>
            )}

            {userType === "master" && (
              <>
                <MobileNavButton path="/dashboard" label="Dashboard" />
                <MobileNavButton
                  path="/franqueados"
                  label="Franqueados"
                  icon={Users}
                />
                <MobileNavButton path="/prefeituras" label="Prefeituras" />
              </>
            )}

            {userType === "franqueado" && (
              <>
                <MobileNavButton path="/dashboard" label="Dashboard" />
                <MobileNavButton
                  path="/prefeituras"
                  label="Minhas Prefeituras"
                />
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-[#0066A1]/10 flex items-center justify-center text-[#0066A1] font-bold text-lg">
                {userType.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {getUserTypeLabel(userType)}
                </p>
                {userEmail && (
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {userType === "admin" && (
                <Button
                  onClick={() => handleNavigation("/settings")}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2 p-2 text-gray-600 hover:text-[#0066A1] hover:bg-white border-gray-200"
                >
                  <Settings className="h-4 w-4" />
                  Config
                </Button>
              )}
              <Button
                onClick={onLogout}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 p-2 text-red-600 hover:bg-red-50 border-red-100 border"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
