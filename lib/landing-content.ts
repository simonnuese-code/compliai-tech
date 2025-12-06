import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDirectory = path.join(process.cwd(), 'content/landing')

function parseMarkdownContent(content: string) {
  const lines = content.split('\n')
  const result: any = {
    headline: '',
    subheadline: '',
    items: [],
    features: [],
    ctaPrimary: '',
    ctaSecondary: '',
  }

  let currentSection: 'intro' | 'items' = 'intro'
  let currentItem: any = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) continue

    // Parse H1 as Headline
    if (line.startsWith('# ')) {
      result.headline = line.replace('# ', '').trim()
      continue
    }

    // Parse H2 as Item Title
    if (line.startsWith('## ')) {
      if (currentItem) {
        result.items.push(currentItem)
      }
      currentItem = {
        title: line.replace('## ', '').trim(),
        description: ''
      }
      currentSection = 'items'
      continue
    }

    // Parse CTAs
    if (line.includes('[CTA_PRIMARY]')) {
      const match = line.match(/\[CTA_PRIMARY\](.*?)\[\/CTA_PRIMARY\]/)
      if (match) result.ctaPrimary = match[1]
      continue
    }

    if (line.includes('[CTA_SECONDARY]')) {
      const match = line.match(/\[CTA_SECONDARY\](.*?)\[\/CTA_SECONDARY\]/)
      if (match) result.ctaSecondary = match[1]
      continue
    }

    // Parse Lists
    if (line.startsWith('- ')) {
      const item = line.replace('- ', '').trim()
      if (currentSection === 'intro') {
        result.features.push(item)
      } else if (currentItem) {
        // Add list item to description with a newline if needed
        currentItem.description += (currentItem.description ? '\n' : '') + '• ' + item
      }
      continue
    }

    // Parse Paragraphs
    if (currentSection === 'intro') {
      result.subheadline += (result.subheadline ? '\n' : '') + line
    } else if (currentItem) {
      currentItem.description += (currentItem.description ? '\n' : '') + line
    }
  }

  // Push last item
  if (currentItem) {
    result.items.push(currentItem)
  }

  return result
}

export async function getLandingContent(slug: string) {
  const fullPath = path.join(contentDirectory, `${slug}.md`)
  
  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { content } = matter(fileContents)
  
  return parseMarkdownContent(content)
}
