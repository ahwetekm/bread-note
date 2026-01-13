'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Shield, Palette } from 'lucide-react';

interface SettingsTabsProps {
  profileContent: React.ReactNode;
  securityContent: React.ReactNode;
  appearanceContent: React.ReactNode;
  defaultTab?: 'profile' | 'security' | 'appearance';
}

export function SettingsTabs({
  profileContent,
  securityContent,
  appearanceContent,
  defaultTab = 'profile',
}: SettingsTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="w-full justify-start mb-6 h-auto flex-wrap gap-1 bg-transparent p-0">
        <TabsTrigger
          value="profile"
          className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profil</span>
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
        >
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Güvenlik</span>
        </TabsTrigger>
        <TabsTrigger
          value="appearance"
          className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Görünüm & Hesap</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-0">
        {profileContent}
      </TabsContent>

      <TabsContent value="security" className="mt-0">
        {securityContent}
      </TabsContent>

      <TabsContent value="appearance" className="mt-0">
        {appearanceContent}
      </TabsContent>
    </Tabs>
  );
}
