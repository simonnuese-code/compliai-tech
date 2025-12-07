import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GlassCard } from '@/components/ui/glass-card'
import { User, Building, Mail, Lock, Trash2, AlertTriangle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DeleteAccountButton } from '@/components/settings/DeleteAccountButton'
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm'
import { ChangeEmailForm } from '@/components/settings/ChangeEmailForm'

export default async function EinstellungenPage() {
    const session = await getSession()
    if (!session.user?.id) return redirect('/login')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!user) return redirect('/login')

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Einstellungen
                </h1>
                <p className="text-slate-500">
                    Verwalten Sie Ihre Konto- und Systemeinstellungen
                </p>
            </div>

            {/* Profile Section */}
            <GlassCard padding="lg">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Profil</h2>
                        <p className="text-sm text-slate-500">Ihre persönlichen Daten</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input disabled value={user.name || ''} className="pl-9 bg-slate-50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>E-Mail</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input disabled value={user.email} className="pl-9 bg-slate-50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Unternehmen</Label>
                        <div className="relative">
                            <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input disabled value={user.company || ''} className="pl-9 bg-slate-50" />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Security Section */}
            <GlassCard padding="lg">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Sicherheit</h2>
                        <p className="text-sm text-slate-500">Passwort und Zugangsdaten verwalten</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <ChangePasswordForm />
                    <Separator />
                    <ChangeEmailForm currentEmail={user.email} />
                </div>
            </GlassCard>

            {/* Account Management */}
            <GlassCard padding="lg">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-slate-100 text-slate-600">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Account-Verwaltung</h2>
                        <p className="text-sm text-slate-500">Kontostatus und Löschung</p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                Account löschen
                            </h3>
                            <p className="text-slate-500 text-sm max-w-xl">
                                Wenn Sie Ihren Account löschen, werden alle Ihre Daten unwiderruflich entfernt.
                                Dies beinhaltet Ihr Profil, alle durchgeführten Compliance-Checks, gespeicherte Dokumente und Exporte.
                            </p>
                        </div>
                        <div className="flex-shrink-0 w-full md:w-auto">
                            <DeleteAccountButton />
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}
