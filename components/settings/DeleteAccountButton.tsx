'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle, User, Shield, Settings } from 'lucide-react'
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

export function DeleteAccountButton() {
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
    )
}
