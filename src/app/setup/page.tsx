
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (localStorage.getItem('masterPassword')) {
      router.replace('/login');
    }
  }, [router]);

  const handleSetup = (e) => {
    e.preventDefault();
    setError('');
    if (!password || !confirmPassword) {
      setError('Both fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    // In a real app, this should be securely hashed.
    localStorage.setItem('masterPassword', password);
    toast({
      title: 'Password Set!',
      description: 'You can now log in with your new master password.',
    });
    router.push('/login');
  };
  
  if (!isClient) {
      return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-fit mb-4">
            <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1184.37 200.65" className="h-8 w-auto">
                <defs>
                    <style>
                    {`
                        .cls-1-logo { fill: #b38a2f; stroke-width: 0px; }
                        .cls-2-logo { fill: #c4223d; stroke-width: 0px; }
                    `}
                    </style>
                </defs>
                <g>
                    <path className="cls-2-logo" d="m444.11,195.64L297.45,31.45v163.64h-14.75V0l10.57,5.28,145.83,163.64V5.28h14.75v195.37l-9.74-5.01Z"/>
                    <path className="cls-2-logo" d="m497.27,195.09V7.24l14.75-5.57v193.42h-14.75Z"/>
                    <path className="cls-2-logo" d="m617.77,199.54l-5.85-4.73L534.27,6.95l13.36-5.57,68.75,164.48L684.83,1.39l13.08,5.57-80.14,192.58Z"/>
                    <path className="cls-2-logo" d="m721.02,195.09V5.28h103.53l-5.3,12.25h-83.49v75.97h80.16v12.25h-80.16v77.09h86.83l4.18,12.25h-105.75Z"/>
                    <path className="cls-2-logo" d="m989.58,17.53h-69.02v177.55h-14.74V17.53h-73.48l4.45-12.25h157.24l-4.45,12.25Z"/>
                    <path className="cls-2-logo" d="m1145.98,17.53h-69.03v177.55h-14.74V17.53h-73.48l4.45-12.25h157.25l-4.45,12.25Z"/>
                    <path className="cls-2-logo" d="m1169.63,195.09V7.24l14.74-5.57v193.42h-14.74Z"/>
                </g>
                <g>
                    <polygon className="cls-1-logo" points="217.74 194.55 0 73.76 0 2.11 217.74 123.77 217.74 194.55"/>
                    <polygon className="cls-2-logo" points="0 193.49 0 119.32 74.18 159.16 0 193.49"/>
                    <polygon className="cls-2-logo" points="217.74 76.29 217.74 2.11 143.56 41.95 217.74 76.29"/>
                </g>
            </svg>
          </div>
          <CardTitle>Create Master Password</CardTitle>
          <CardDescription>This is a one-time setup. This password will be used to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Set Password & Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
