'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteAccount } from '@/lib/hooks/use-user';
import { deleteAccountSchema } from '@/lib/validations/user';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';

export function DeleteAccountDialog() {
  const deleteAccount = useDeleteAccount();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setPassword('');
    setConfirmation('');
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const result = deleteAccountSchema.safeParse({ password, confirmation });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    try {
      await deleteAccount.mutateAsync(result.data);
      // After successful deletion, user will be signed out and redirected
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="h-4 w-4 mr-2" />
          Hesabı Sil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Hesabı Kalıcı Olarak Sil
          </DialogTitle>
          <DialogDescription className="text-left">
            Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz (notlar,
            klasörler, etiketler, görevler) kalıcı olarak silinecektir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-password">Şifrenizi Doğrulayın</Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              disabled={deleteAccount.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">
              Onaylamak için <span className="font-bold text-destructive">SİL</span> yazın
            </Label>
            <Input
              id="delete-confirmation"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="SİL"
              disabled={deleteAccount.isPending}
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={deleteAccount.isPending}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={deleteAccount.isPending || confirmation !== 'SİL'}
            >
              {deleteAccount.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                'Hesabı Sil'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
