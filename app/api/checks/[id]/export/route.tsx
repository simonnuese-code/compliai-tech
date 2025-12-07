import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { renderToStream } from '@react-pdf/renderer'
import { ComplianceReportPDF } from '@/components/pdf/ComplianceReportPDF'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const check = await prisma.complianceCheck.findUnique({
    where: {
      id: id,
      userId: session.user.id
    }
  })

  if (!check) {
    return NextResponse.json({ error: 'Check not found' }, { status: 404 })
  }

  const user = await prisma.user.findUnique({
      where: { id: session.user.id }
  })

  // Create or Update Document Record
  const existingDoc = await prisma.document.findFirst({
      where: {
          checkId: check.id,
          type: 'COMPLIANCE_REPORT'
      }
  })

  if (!existingDoc) {
      await prisma.document.create({
          data: {
              userId: session.user.id,
              checkId: check.id,
              title: `Compliance Report - ${new Date(check.createdAt).toLocaleDateString('de-DE')}`,
              type: 'COMPLIANCE_REPORT',
              version: 1
          }
      })
  } else {
      await prisma.document.update({
          where: { id: existingDoc.id },
          data: { updatedAt: new Date() }
      })
  }

  try {
    const stream = await renderToStream(<ComplianceReportPDF check={check} user={user} />)
    
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CompliAI-Report-${check.id.slice(0, 8)}.pdf"`
      }
    })
  } catch (error) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
