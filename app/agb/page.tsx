import fs from 'fs'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export default async function AGBPage() {
    const filePath = path.join(process.cwd(), 'content', 'agb.md')
    const content = fs.readFileSync(filePath, 'utf8')

    return (
        <LegalPageLayout title="Allgemeine Geschäftsbedingungen">
            <ReactMarkdown>{content}</ReactMarkdown>
        </LegalPageLayout>
    )
}
