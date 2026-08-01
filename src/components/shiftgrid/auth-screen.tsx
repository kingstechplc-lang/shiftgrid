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
import { HeartPulse, Stethoscope, Building2, ShieldCheck, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AuthScreen() {
  const { setUser } = useApp()
  const { toast } = useToast()
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
      const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      setUser(res as any)
      toast({ title: 'Welcome back', description: (res as any).name })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sign in failed', description: e.message })
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await api('/api/auth/signup', {
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
      setUser(res as any)
      toast({ title: 'Account created', description: (res as any).name })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sign up failed', description: e.message })
    }
  }

  function fillDemo(role: 'admin' | 'staff') {
    if (role === 'admin') { setEmail('sarah.chen@stmarys.test'); setPassword('password123') }
    else { setEmail('james.morrison@staff.test'); setPassword('password123') }
    setMode('login')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
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
          <FeatureCard icon={<ShieldCheck className="size-5" />} title="Credential tracking" body="License expiry alerts" />
          <FeatureCard icon={<Clock className="size-5" />} title="Urgent shifts" body="Fill ASAP openings fast" />
        </div>
      </div>

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

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Sign in to your ShiftGrid account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Sign in</Button>
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

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create your account</CardTitle>
                  <CardDescription>Join ShiftGrid as a healthcare professional or hospital.</CardDescription>
                </CardHeader>
                <CardContent>
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
                      <Input id="suEmail" type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required />
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

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Create account</Button>
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
