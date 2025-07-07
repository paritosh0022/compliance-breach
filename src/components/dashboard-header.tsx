
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/contexts/DashboardContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function DashboardHeader() {
  const router = useRouter();
  const { complianceStatus, setComplianceStatus, setIsComplianceModalOpen } = useDashboard();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/login');
  };
  
  const handleChipClick = () => {
    setIsComplianceModalOpen(true);
  }

  const getStatusContent = () => {
    switch (complianceStatus) {
      case 'running':
        return {
          text: 'Compliance Running',
          icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
          variant: 'default',
        };
      case 'completed':
        return {
          text: 'Completed',
          icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
          variant: 'default',
          className: 'bg-green-500 hover:bg-green-600 text-white',
        };
      case 'failed':
        return {
          text: 'Failed',
          icon: <XCircle className="mr-2 h-4 w-4" />,
          variant: 'destructive',
        };
      default:
        return null;
    }
  };

  const statusContent = getStatusContent();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger />
      <div className="flex-1">
        {/* Can add breadcrumbs or title here later */}
      </div>
      <div className="flex items-center gap-4">
        {statusContent && (
          <Badge 
            variant={statusContent.variant} 
            className={cn("cursor-pointer transition-all", statusContent.className)}
            onClick={handleChipClick}
          >
            {statusContent.icon}
            {statusContent.text}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="profile avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  user@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
