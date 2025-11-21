import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Monitor, Moon, Sun } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import logo from "@/assets/conforma-pro-logo.png";
import { useTheme } from "@/hooks/useTheme";

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { mode, setMode } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [language, setLanguage] = useState("fr");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const themeIcon = useMemo(() => {
    if (mode === "system") return Monitor;
    return mode === "light" ? Sun : Moon;
  }, [mode]);

  const handleToggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : prev === "dark" ? "system" : "light"));
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    const { error } = await signIn(values.email, values.password);
    if (!error) {
      navigate("/");
    }
    setIsLoading(false);
  };

  const ThemeIcon = themeIcon;

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-[#050c13] dark:via-[#0b2540] dark:to-[#091a2b]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-[#2FB200]/10 blur-3xl" />
        <div className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-[#1F3C6D]/10 blur-3xl" />
        <img
          src={logo}
          alt="ConformaPro watermark"
          className="absolute inset-0 m-auto h-[420px] w-[420px] opacity-5 dark:opacity-[0.05]"
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col p-6 md:p-12">
        <header className="flex items-center justify-end gap-3">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="hidden w-32 bg-white/70 text-sm shadow-sm backdrop-blur dark:bg-white/10 md:flex">
              <SelectValue placeholder="Langue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">FR - Français</SelectItem>
              <SelectItem value="en">EN - English</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Basculer le thème"
            onClick={handleToggleTheme}
            className="h-10 w-10 rounded-full bg-white/70 text-[#0B2540] shadow-sm backdrop-blur transition hover:bg-white/90 hover:text-[#2FB200] dark:bg-white/10 dark:text-white"
          >
            <ThemeIcon className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex flex-1 items-center justify-center">
          <div className="grid w-full max-w-5xl gap-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-[#0B2540]/10 backdrop-blur-xl transition duration-500 ease-out animate-in fade-in slide-in-from-bottom-4 dark:border-white/10 dark:bg-[#0b2540]/70 dark:shadow-black/40 md:grid-cols-2 md:p-10">
            <div className="flex flex-col justify-between gap-8 border-b border-slate-200/60 pb-8 text-[#0B2540] dark:border-white/10 dark:text-white md:border-b-0 md:border-r md:pb-0 md:pr-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                 <img
  src={logo}
  alt="ConformaPro"
  className="h-20 w-40  object-contain"
/>

                  <div>
                    <p className="text-lg font-semibold tracking-tight">ConformaPro</p>
                    <p className="text-sm text-[#1F3C6D] dark:text-white/70">Votre conformité simplifiée</p>
                  </div>
                </div>
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                  ConformaPRO Restez toujours réglo
                </h1>
                <p className="max-w-md text-sm text-[#1F3C6D]/80 dark:text-white/70">
                  Connectez-vous pour piloter vos obligations réglementaires, suivre vos plans d'action et collaborer avec vos équipes en toute sérénité.
                </p>
              </div>
              <div className="hidden items-center gap-4 text-xs text-[#1F3C6D]/70 dark:text-white/60 md:flex">
                <span className="flex items-center gap-2 font-medium text-[#2FB200]">
                  <span className="h-2 w-2 rounded-full bg-[#2FB200]" />
                  Sécurisé & multi-tenant
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1F3C6D]" />
                  Support 24/7
                </span>
              </div>
            </div>

            <Card className="relative overflow-hidden border-0 bg-transparent shadow-none">
              <div className="absolute -inset-[1px] rounded-[30px] bg-gradient-to-br from-[#2FB200]/80 via-[#1F3C6D]/60 to-transparent opacity-60 blur-2xl" aria-hidden="true" />
              <CardContent className="relative rounded-[28px] border border-white/60 bg-white/90 p-8 shadow-xl shadow-[#0B2540]/10 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b2540]/80 dark:shadow-black/40">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#0B2540] dark:text-white">Connexion</h2>
                    <p className="text-sm text-[#1F3C6D]/80 dark:text-white/60">Accédez à votre espace sécurisé</p>
                  </div>
                  <span className="rounded-full border border-[#2FB200]/40 bg-[#2FB200]/10 px-3 py-1 text-xs font-semibold text-[#2FB200]">
                    HSE Pro
                  </span>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-[#0B2540] dark:text-white">
                              Email professionnel
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="vous@entreprise.com"
                                disabled={isLoading}
                                className="h-11 rounded-lg border-[#1F3C6D]/20 bg-white/80 px-4 text-sm text-[#0B2540] shadow-sm transition focus:border-[#2FB200] focus-visible:ring-[#2FB200] dark:border-white/10 dark:bg-[#091a2b]/80 dark:text-white"
                                aria-label="Adresse email"
                                autoComplete="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-[#0B2540] dark:text-white">
                              Mot de passe
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                disabled={isLoading}
                                className="h-11 rounded-lg border-[#1F3C6D]/20 bg-white/80 px-4 text-sm text-[#0B2540] shadow-sm transition focus:border-[#2FB200] focus-visible:ring-[#2FB200] dark:border-white/10 dark:bg-[#091a2b]/80 dark:text-white"
                                aria-label="Mot de passe"
                                autoComplete={rememberMe ? "current-password" : "off"}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col gap-3 text-sm text-[#1F3C6D]/80 dark:text-white/70 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={rememberMe}
                          onCheckedChange={(value) => setRememberMe(Boolean(value))}
                          className="border-[#1F3C6D]/40 data-[state=checked]:bg-[#2FB200] data-[state=checked]:text-white"
                        />
                        <span>Se souvenir de moi</span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="font-medium text-[#1F3C6D] transition hover:text-[#2FB200]"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-11 w-full rounded-lg bg-[#2FB200] text-sm font-semibold text-white shadow-lg shadow-[#2FB200]/30 transition hover:bg-[#29a300] focus-visible:ring-[#1F3C6D]"
                      >
                        {isLoading ? "Connexion..." : "Se connecter"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        className="h-11 w-full rounded-lg border-[#1F3C6D]/30 bg-white/60 text-sm font-semibold text-[#1F3C6D] transition hover:border-[#1F3C6D] hover:text-[#2FB200] dark:border-white/20 dark:bg-transparent dark:text-white"
                        asChild
                      >
                        <Link to="/register">Créer un compte</Link>
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="mt-8 text-center text-xs text-[#1F3C6D]/70 dark:text-white/60">
          © 2025 ConformaPro – Tous droits réservés.
        </footer>
      </div>
    </div>
  );
}

