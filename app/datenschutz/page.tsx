import fs from 'fs'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export default async function DatenschutzPage() {
    const filePath = path.join(process.cwd(), 'content', 'datenschutz.md')
    const content = fs.readFileSync(filePath, 'utf8')

    return (
        <LegalPageLayout title="Datenschutzerklärung">
            <ReactMarkdown>{content}</ReactMarkdown>
        </LegalPageLayout>
    )
}
