import { describe, it, expect } from 'vitest'
import { scanPatchForCodeCommentMentions, parseAddedLinesWithNumbers } from '../src/codeComments.js'

describe('code comment mentions', () => {
  it('parses added lines with numbers', () => {
    const patch = `@@ -1,2 +1,3 @@\n-const a = 1;\n+// @validator-agent: please review\n+const b = 2;\n context`;
    const added = parseAddedLinesWithNumbers(patch)
    expect(added[0]).toEqual({ line: 1, text: '// @validator-agent: please review' })
  })

  it('extracts mentions from js/ts comment lines', () => {
    const patch = `@@ -10,2 +10,4 @@ src/file.ts\n+// @validator-agent check this\n+/* @developer-agent: note */\n const x = 1;\n-const y = 2;`;
    const mentions = scanPatchForCodeCommentMentions('src/file.ts', patch, { })
    const targets = mentions.map((m) => m.normalized_target)
    expect(targets).toContain('validator-agent')
    expect(targets).toContain('developer-agent')
    // check location is set
    expect(mentions.some((m) => (m.location || '').startsWith('src/file.ts:'))).toBe(true)
  })
})

