import { useState } from "react";
import { AuthModals } from "@/components/auth-modals";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getNavLinks = () => {
    // Routes based on user role
    const routes = [
      { path: "/dashboard", label: "Dashboard", roles: ["student", "teacher", "admin"] },
      { path: "/exams", label: "Exams", roles: ["student", "teacher", "admin"] },
      { path: "/students", label: "Students", roles: ["teacher", "admin"] },
      { path: "/reports", label: "Reports", roles: ["teacher", "admin"] },
    ];

    // Filter routes based on user role
    if (!user) return [];
    return routes.filter(route => route.roles.includes(user.role));
  };

  return (
    <header className="border-b fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5" />
            <span>HellApp</span>
          </Link>
          
          {/* Only show navigation links if authenticated */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6 ml-6">
              {getNavLinks().map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm font-medium hover:underline underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <span className="sr-only">Profile</span>
                  <span>{user.first_name} {user.last_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">Role: {user.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => window.openLoginModal()}>
                Login
              </Button>
              <Button size="sm" onClick={() => window.openRegisterModal()}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
      <AuthModals />
    </header>
  );
}
