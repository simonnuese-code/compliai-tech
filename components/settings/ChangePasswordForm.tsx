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

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Bitte geben Sie Ihr aktuelles Passwort ein'),
    newPassword: z.string().min(10, 'Das neue Passwort muss mindestens 10 Zeichen lang sein'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
})

type PasswordValues = z.infer<typeof passwordSchema>

export function ChangePasswordForm() {
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PasswordValues>({
        resolver: zodResolver(passwordSchema),
    })

    const onSubmit = async (data: PasswordValues) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/user/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Fehler beim Ändern des Passworts')
            }

            toast.success('Passwort erfolgreich geändert')
            reset()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Passwort ändern</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                    <Input
                        id="currentPassword"
                        type="password"
                        {...register('currentPassword')}
                    />
                    {errors.currentPassword && (
                        <p className="text-sm text-rose-500">{errors.currentPassword.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newPassword">Neues Passwort</Label>
                    <Input
                        id="newPassword"
                        type="password"
                        {...register('newPassword')}
                    />
                    {errors.newPassword && (
                        <p className="text-sm text-rose-500">{errors.newPassword.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                        <p className="text-sm text-rose-500">{errors.confirmPassword.message}</p>
                    )}
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Passwort ändern
                </Button>
            </form>
        </div>
    )
}
