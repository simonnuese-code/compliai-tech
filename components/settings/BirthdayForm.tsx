'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Cake, Check, X } from 'lucide-react'

interface BirthdayFormProps {
    currentBirthday: string | null // ISO date string or null
}

export function BirthdayForm({ currentBirthday }: BirthdayFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [birthday, setBirthday] = useState(currentBirthday || '')
    const [hasChanged, setHasChanged] = useState(false)

    const handleChange = (value: string) => {
        setBirthday(value)
        setHasChanged(value !== (currentBirthday || ''))
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/user/update-birthday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    birthday: birthday || null,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Fehler beim Speichern')
            }

            toast.success('Geburtstag erfolgreich gespeichert 🎂')
            setHasChanged(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemove = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/user/update-birthday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ birthday: null }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Fehler beim Entfernen')
            }

            toast.success('Geburtstag entfernt')
            setBirthday('')
            setHasChanged(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <Cake className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-medium text-slate-900">Geburtstag</h3>
            </div>
            <p className="text-sm text-slate-500">
                Gib deinen Geburtstag an und erhalte an deinem besonderen Tag eine nette Nachricht von uns! 🎉
            </p>
            <div className="flex items-end gap-3 max-w-md">
                <div className="space-y-2 flex-1">
                    <Label htmlFor="birthday">Geburtsdatum</Label>
                    <Input
                        id="birthday"
                        type="date"
                        value={birthday}
                        onChange={(e) => handleChange(e.target.value)}
                        className="bg-white"
                    />
                </div>
                <div className="flex gap-2">
                    {hasChanged && (
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            size="default"
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            <span className="ml-1.5">Speichern</span>
                        </Button>
                    )}
                    {currentBirthday && !hasChanged && (
                        <Button
                            onClick={handleRemove}
                            disabled={isLoading}
                            variant="outline"
                            size="default"
                            className="text-slate-500 hover:text-rose-500 hover:border-rose-300"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                            <span className="ml-1.5">Entfernen</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
