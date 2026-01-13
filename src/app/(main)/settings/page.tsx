'use client';

import { SettingsTabs } from '@/components/settings/settings-tabs';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';
import { ThemeSelector } from '@/components/settings/theme-selector';
import { DeleteAccountDialog } from '@/components/settings/delete-account-dialog';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">
          Hesap ayarlarınızı ve tercihlerinizi yönetin
        </p>
      </div>

      {/* Tabs */}
      <SettingsTabs
        profileContent={<ProfileForm />}
        securityContent={<PasswordForm />}
        appearanceContent={
          <div className="space-y-8">
            <ThemeSelector />

            {/* Danger Zone */}
            <div className="pt-6 border-t border-destructive/20">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-destructive">Tehlikeli Bölge</h3>
                  <p className="text-sm text-muted-foreground">
                    Aşağıdaki işlemler geri alınamaz
                  </p>
                </div>
                <DeleteAccountDialog />
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
