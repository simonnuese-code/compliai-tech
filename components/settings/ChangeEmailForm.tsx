'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const emailSchema = z.object({
    newEmail: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
    password: z.string().min(1, 'Bitte bestätigen Sie mit Ihrem Passwort'),
})

type EmailValues = z.infer<typeof emailSchema>

interface ChangeEmailFormProps {
    currentEmail: string
}

export function ChangeEmailForm({ currentEmail }: ChangeEmailFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EmailValues>({
        resolver: zodResolver(emailSchema),
    })

    const onSubmit = async (data: EmailValues) => {
        if (data.newEmail === currentEmail) {
            toast.error('Die neue E-Mail-Adresse muss sich von der aktuellen unterscheiden')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/user/update-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newEmail: data.newEmail,
                    password: data.password
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Fehler beim Ändern der E-Mail')
            }

            toast.success('E-Mail erfolgreich geändert')
            reset()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">E-Mail-Adresse ändern</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <div className="space-y-2">
                    <Label htmlFor="newEmail">Neue E-Mail-Adresse</Label>
                    <Input
                        id="newEmail"
                        type="email"
                        placeholder="neue.email@beispiel.de"
                        {...register('newEmail')}
                    />
                    {errors.newEmail && (
                        <p className="text-sm text-rose-500">{errors.newEmail.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="passwordConfirm">Passwort zur Bestätigung</Label>
                    <Input
                        id="passwordConfirm"
                        type="password"
                        placeholder="Ihr aktuelles Passwort"
                        {...register('password')}
                    />
                    {errors.password && (
                        <p className="text-sm text-rose-500">{errors.password.message}</p>
                    )}
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    E-Mail ändern
                </Button>
            </form>
        </div>
    )
}
