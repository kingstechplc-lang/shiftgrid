'use client'

import { useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { HeartPulse, Stethoscope, Building2, ShieldCheck, Clock, Mail, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { VerifyEmailScreen } from './verify-email-screen'

// Google "G" logo SVG (official colors)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export function AuthScreen() {
  const { setUser } = useApp()
  const { toast } = useToast()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [googleLoading, setGoogleLoading] = useState<'staff' | 'admin' | null>(null)

  // Verification state — when set, show the verify-email screen instead
  const [pendingVerification, setPendingVerification] = useState<{ email: string; name: string; userId: string; demoCode?: string } | null>(null)

  // Login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Signup form
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suRole, setSuRole] = useState<'staff' | 'hospital_admin'>('staff')
  const [suHospitalName, setSuHospitalName] = useState('')
  const [suHospitalAddress, setSuHospitalAddress] = useState('')
  const [suSpecialty, setSuSpecialty] = useState('')
  const [suExperience, setSuExperience] = useState('')
  const [suLocation, setSuLocation] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res: any = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      if (res.pendingVerification) {
        setPendingVerification({ email: res.email, name: res.name, userId: res.userId, demoCode: res.demoCode })
        toast({ title: 'Verify your email', description: 'We sent a code to your email.' })
      } else {
        setUser(res)
        toast({ title: 'Welcome back', description: res.name })
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sign in failed', description: e.message })
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res: any = await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: suName, email: suEmail, password: suPassword, role: suRole,
          hospitalName: suRole === 'hospital_admin' ? suHospitalName : undefined,
          hospitalAddress: suRole === 'hospital_admin' ? suHospitalAddress : undefined,
          specialty: suRole === 'staff' ? suSpecialty : undefined,
          experienceYears: suRole === 'staff' ? suExperience : undefined,
          location: suRole === 'staff' ? suLocation : undefined,
        }),
      })
      if (res.pendingVerification) {
        setPendingVerification({ email: res.email, name: res.name, userId: res.userId, demoCode: res.demoCode })
        toast({ title: 'Account created!', description: 'Check your email for a verification code.' })
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sign up failed', description: e.message })
    }
  }

  async function handleGoogleLogin(role: 'staff' | 'admin') {
    setGoogleLoading(role === 'staff' ? 'staff' : 'admin')
    try {
      // In production with real Google OAuth, this would redirect to:
      //   window.location.href = '/api/auth/signin/google'
      // For sandbox demo, we call the demo endpoint directly
      const res: any = await api('/api/auth/google-demo', {
        method: 'POST',
        body: JSON.stringify({ role: role === 'staff' ? 'staff' : 'hospital_admin' }),
      })
      setUser(res)
      toast({ title: 'Signed in with Google', description: res.name })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Google sign-in failed', description: e.message })
    } finally {
      setGoogleLoading(null)
    }
  }

  function fillDemo(role: 'admin' | 'staff') {
    if (role === 'admin') { setEmail('sarah.chen@stmarys.test'); setPassword('password123') }
    else { setEmail('james.morrison@staff.test'); setPassword('password123') }
    setMode('login')
  }

  // If pending verification, show the verify-email screen
  if (pendingVerification) {
    return (
      <VerifyEmailScreen
        email={pendingVerification.email}
        name={pendingVerification.name}
        userId={pendingVerification.userId}
        demoCode={pendingVerification.demoCode}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: brand/marketing panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-12">
            <div className="size-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <HeartPulse className="size-6" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">ShiftGrid</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            The marketplace connecting<br />hospitals with healthcare<br />professionals.
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Post locum shifts and permanent roles. Browse, filter, apply, and track — all in one place.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-4 mt-12">
          <FeatureCard icon={<Building2 className="size-5" />} title="Multi-hospital" body="One marketplace, many hospitals" />
          <FeatureCard icon={<Stethoscope className="size-5" />} title="Locum & permanent" body="Same search, same pipeline" />
          <FeatureCard icon={<ShieldCheck className="size-5" />} title="Email verified" body="Trusted, secure accounts" />
          <FeatureCard icon={<Clock className="size-5" />} title="Urgent shifts" body="Fill ASAP openings fast" />
        </div>
      </div>

      {/* Right: auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="size-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <HeartPulse className="size-6" />
            </div>
            <span className="text-2xl font-semibold">ShiftGrid</span>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            {/* ────────────── LOGIN ────────────── */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Sign in to your ShiftGrid account.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Google button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 mb-3 border-2 hover:bg-muted/50 font-medium"
                    onClick={() => handleGoogleLogin('staff')}
                    disabled={googleLoading !== null}
                  >
                    {googleLoading === 'staff' ? (
                      <Loader2 className="size-5 mr-2 animate-spin" />
                    ) : (
                      <GoogleIcon className="mr-2" />
                    )}
                    Continue with Google
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-11">Sign in</Button>
                  </form>

                  <div className="mt-6 pt-6 border-t">
                    <p className="text-xs text-muted-foreground mb-3 text-center">Try a demo account:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => fillDemo('admin')}>
                        <Building2 className="size-4 mr-1" /> Hospital Admin
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => fillDemo('staff')}>
                        <Stethoscope className="size-4 mr-1" /> Healthcare Staff
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ────────────── SIGNUP ────────────── */}
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create your account</CardTitle>
                  <CardDescription>Join ShiftGrid as a healthcare professional or hospital.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Google button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 mb-3 border-2 hover:bg-muted/50 font-medium"
                    onClick={() => handleGoogleLogin(suRole === 'staff' ? 'staff' : 'admin')}
                    disabled={googleLoading !== null}
                  >
                    {googleLoading === (suRole === 'staff' ? 'staff' : 'admin') ? (
                      <Loader2 className="size-5 mr-2 animate-spin" />
                    ) : (
                      <GoogleIcon className="mr-2" />
                    )}
                    Sign up with Google
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or sign up with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label>I am a...</Label>
                      <Select value={suRole} onValueChange={(v) => setSuRole(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Healthcare professional seeking work</SelectItem>
                          <SelectItem value="hospital_admin">Hospital administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suName">Full name</Label>
                      <Input id="suName" value={suName} onChange={(e) => setSuName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input id="suEmail" type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suPassword">Password</Label>
                      <Input id="suPassword" type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} required minLength={6} />
                    </div>

                    {suRole === 'hospital_admin' ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="suHospital">Hospital name</Label>
                          <Input id="suHospital" value={suHospitalName} onChange={(e) => setSuHospitalName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="suAddr">Hospital address</Label>
                          <Textarea id="suAddr" value={suHospitalAddress} onChange={(e) => setSuHospitalAddress(e.target.value)} rows={2} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="suSpec">Specialty / Role</Label>
                            <Input id="suSpec" value={suSpecialty} onChange={(e) => setSuSpecialty(e.target.value)} placeholder="e.g. Emergency Medicine" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="suExp">Years of experience</Label>
                            <Input id="suExp" type="number" min={0} value={suExperience} onChange={(e) => setSuExperience(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="suLoc">Location</Label>
                          <Input id="suLoc" value={suLocation} onChange={(e) => setSuLocation(e.target.value)} placeholder="City, Province" />
                        </div>
                      </>
                    )}

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <Mail className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        We&apos;ll send a 6-digit verification code to your email to confirm your account.
                      </p>
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-11">Create account</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-white/90">{icon}</div>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="text-xs text-white/70">{body}</p>
    </div>
  )
}
