import { Search, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-fpv-blue to-fpv-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FPV</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-fpv-blue to-fpv-orange bg-clip-text text-transparent">
              FPV Groups Marketplace
            </h1>
          </Link>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search for FPV gear..."
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <Settings className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
