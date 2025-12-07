'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Settings,
    User,
    Shield,
    Trash2,
    AlertTriangle,
    LogOut,
    Mail,
    Building
} from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'

export default function EinstellungenPage() {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        try {
            const response = await fetch('/api/user/delete', {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Fehler beim Löschen des Accounts')
            }

            toast.success('Account erfolgreich gelöscht')
            router.push('/login')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Fehler beim Löschen des Accounts. Bitte versuchen Sie es später erneut.')
            setIsDeleting(false)
        }
    }

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

            {/* Profile Section (Visual only for now) */}
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
                            <Input disabled placeholder="Ihr Name" className="pl-9 bg-slate-50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>E-Mail</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input disabled placeholder="ihre.email@beispiel.de" className="pl-9 bg-slate-50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Unternehmen</Label>
                        <div className="relative">
                            <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input disabled placeholder="Ihr Unternehmen" className="pl-9 bg-slate-50" />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Danger Zone */}
            <GlassCard padding="lg" className="border-red-100 bg-red-50/30">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-red-100 text-red-600">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-red-900">Gefahrenzone</h2>
                        <p className="text-sm text-red-700">Irreversible Aktionen für Ihren Account</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-red-100 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                Account löschen
                            </h3>
                            <p className="text-slate-500 text-sm max-w-xl">
                                Wenn Sie Ihren Account löschen, werden alle Ihre Daten unwiderruflich entfernt.
                                Dies beinhaltet Ihr Profil, alle durchgeführten Compliance-Checks, gespeicherte Dokumente und Exporte.
                                <span className="font-semibold text-red-600"> Diese Aktion kann nicht rückgängig gemacht werden.</span>
                            </p>
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="shrink-0 gap-2 bg-red-600 hover:bg-red-700">
                                    <Trash2 className="w-4 h-4" />
                                    Account löschen
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-red-200">
                                <AlertDialogHeader>
                                    <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <AlertDialogTitle className="text-center text-xl text-red-900">
                                        Sind Sie absolut sicher?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-center text-slate-600 mt-2">
                                        Diese Aktion ist <strong>unwiderruflich</strong>. Ihr Account wird dauerhaft gelöscht und alle damit verbundenen Daten werden entfernt:
                                        <ul className="mt-4 mb-4 text-left bg-red-50 p-4 rounded-lg space-y-2 text-sm text-red-800">
                                            <li className="flex items-center gap-2">
                                                <User className="w-4 h-4" /> Persönliche Profildaten & Login
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Shield className="w-4 h-4" /> Alle Compliance-Checks & Scores
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Settings className="w-4 h-4" /> Generierte Dokumente & PDF-Exporte
                                            </li>
                                        </ul>
                                        Es gibt keine Möglichkeit, diese Daten wiederherzustellen.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
                                    <AlertDialogCancel className="w-full sm:w-auto">Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-red-600"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Wird gelöscht...' : 'Ja, Account unwiderruflich löschen'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}
