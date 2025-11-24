import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  User as UserIcon,
  Home,
  Settings,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NotificationIndicator } from "@/components/notifications/NotificationIndicator";

const navigation = [
  { name: "Inicio", href: "/game", icon: Home },
  { name: "Perfil", href: "/game/profile", icon: UserIcon },
  { name: "Ajustes", href: "/game/settings", icon: Settings },
];

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1200px] px-4">
      <div className="bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg px-6 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Gamepad2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg hidden sm:block text-foreground">
            Paulownia
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Notifications & User */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          {user && <NotificationIndicator />}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-background">
              {user?.username?.charAt(0).toUpperCase() || (
                <UserIcon className="h-4 w-4" />
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
