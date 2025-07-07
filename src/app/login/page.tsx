
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem('masterPassword')) {
      router.replace('/setup');
    }
     // If already logged in, redirect to dashboard
    if (localStorage.getItem('isLoggedIn') === 'true') {
        router.replace('/dashboard');
    }
  }, [router]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const storedPassword = localStorage.getItem('masterPassword');
    
    if (!storedPassword) {
        router.push('/setup');
        return;
    }

    if (password === storedPassword) {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/dashboard');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleReset = () => {
    localStorage.removeItem('masterPassword');
    localStorage.removeItem('isLoggedIn');
    router.push('/setup');
  };

  if (!isClient) {
      return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                <KeyRound className="h-6 w-6" />
            </div>
          <CardTitle>Enter Master Password</CardTitle>
          <CardDescription>Enter the password you created to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your master password"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Button variant="link" className="px-0 font-normal h-auto" onClick={handleReset}>
              Forgot your password? Reset it.
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
