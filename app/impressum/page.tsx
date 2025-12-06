import fs from 'fs'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export default async function ImpressumPage() {
    const filePath = path.join(process.cwd(), 'content', 'impressum.md')
    const content = fs.readFileSync(filePath, 'utf8')

    return (
        <LegalPageLayout title="Impressum">
            <ReactMarkdown>{content}</ReactMarkdown>
        </LegalPageLayout>
    )
}
