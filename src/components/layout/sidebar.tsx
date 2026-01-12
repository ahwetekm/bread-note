'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  FileText,
  CheckSquare,
  Star,
  Trash2,
  Search,
  Settings,
  FolderClosed,
  Tag,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from 'next-auth';

interface SidebarProps {
  user: User;
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  { name: 'All Notes', href: '/dashboard', icon: FileText },
  { name: 'Favorites', href: '/favorites', icon: Star },
  { name: 'To-Do', href: '/todos', icon: CheckSquare },
  { name: 'Trash', href: '/trash', icon: Trash2 },
];

const secondaryNavigation = [
  { name: 'Folders', href: '/folders', icon: FolderClosed },
  { name: 'Tags', href: '/tags', icon: Tag },
  { name: 'Search', href: '/search', icon: Search },
];

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-card transition-transform duration-300 lg:translate-x-0 lg:flex',
          isOpen ? 'translate-x-0 flex' : '-translate-x-full hidden lg:flex'
        )}
      >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="text-2xl">🍞</span>
        <span className="font-semibold text-lg">Bread Note</span>
      </div>

      {/* New Note Button */}
      <div className="p-4">
        <Button asChild className="w-full">
          <Link href="/notes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Link>
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        <div className="py-4">
          <div className="h-px bg-border" />
        </div>

        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <Link
          href="/settings"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-3 flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{user.name || 'User'}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
