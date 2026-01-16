'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  Bell,
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import type { User } from 'next-auth';
import { SearchInput } from '@/components/search/search-input';
import { SyncStatusIndicator } from '@/components/sync/sync-status-indicator';

interface HeaderProps {
  user: User;
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ user, onMenuToggle, isSidebarOpen }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Logo for mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <span className="text-xl">🍞</span>
        <span className="font-semibold">Bread Note</span>
      </div>

      {/* Search */}
      <SearchInput />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Sync Status */}
        <SyncStatusIndicator showText className="hidden sm:flex" />
        <SyncStatusIndicator showText={false} className="sm:hidden" />

        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="rounded-full"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </div>
          </Button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-md border bg-card shadow-lg">
                <div className="p-3 border-b">
                  <p className="font-medium text-sm">{user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 w-full rounded px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-2 w-full rounded px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-2 w-full rounded px-3 py-2 text-sm text-red-500 hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
