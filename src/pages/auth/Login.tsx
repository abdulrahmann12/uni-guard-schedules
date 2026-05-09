import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { API_TARGET_URL, ApiError } from "@/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBranding } from "@/lib/branding/BrandingProvider";
import { useAuth } from "@/state/auth";
import { getErrorMessage } from "@/utils/error";
import { toast } from "sonner";

export default function Login() {
  const { appName, appTagline } = useBranding();
  const { isLoggingIn, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const backendTarget = (() => {
    try {
      return new URL(API_TARGET_URL).host;
    } catch {
      return API_TARGET_URL;
    }
  })();
  const normalizedBackendTarget = backendTarget.toLowerCase();
  const isLocalBackend = normalizedBackendTarget.startsWith("localhost") || normalizedBackendTarget.startsWith("127.0.0.1");

  const invalidCredentialsHint =
    loginError === "Invalid email or password."
      ? isLocalBackend
        ? `This app is currently signing in against ${backendTarget}. Verify the local bootstrap admin email and password for that backend. If you deleted the admin user, restart the backend so it can recreate the bootstrap account before signing in again.`
        : `This app is currently signing in against ${backendTarget}. If local login works but this one fails, verify the deployed admin email and password for that backend and restart the service after updating its bootstrap auth configuration.`
      : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);

    try {
      await login({ email: email.trim(), password });
      toast.success("Signed in successfully.");
    } catch (error) {
      const message = getErrorMessage(error);
      setLoginError(message);

      if (error instanceof ApiError) {
        return;
      }

      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-soft px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden rounded-3xl border border-border bg-card/70 p-10 shadow-card backdrop-blur lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-elevated">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="mt-8 text-display text-4xl font-bold tracking-tight">{appName}</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{appTagline}</p>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Exam invigilation scheduling with protected access, reusable staff directories, and assignment management wired to the backend.</p>
              <p>Use your administrator credentials to continue.</p>
            </div>
          </section>

          <Card className="border-border bg-card/90 shadow-card backdrop-blur">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Authenticate with your administrator account.</CardDescription>
              <p className="text-xs text-muted-foreground">Active backend: {backendTarget}</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {loginError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Sign-in failed</AlertTitle>
                    <AlertDescription>
                      <p>{loginError}</p>
                      {invalidCredentialsHint ? <p className="mt-2">{invalidCredentialsHint}</p> : null}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@uniguard.local"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (loginError) {
                        setLoginError(null);
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (loginError) {
                        setLoginError(null);
                      }
                    }}
                    required
                  />
                </div>
                <Button className="w-full" disabled={isLoggingIn} type="submit">
                  {isLoggingIn ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}