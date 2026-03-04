/**
 * Reusable file buffers for E2E tests.
 *
 * These are the smallest files of each type that satisfy real format detection
 * (magic-byte checks via the `file-type` library used by the API server).
 *
 * The server allows three MIME types (validated via magic bytes, not headers):
 *   - application/pdf              → %PDF magic
 *   - application/msword           → OLE2 compound document magic (legacy .doc)
 *   - application/vnd.openxml...   → ZIP/PK magic (OOXML .docx)
 *
 * Import and pass directly to Playwright's `setInputFiles()` as the `buffer` field.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Valid formats — each one is the smallest buffer that passes server-side
// magic-byte detection for the corresponding MIME type.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal valid PDF 1.4 document.
 * Starts with the `%PDF` magic bytes → detected as `application/pdf` by both
 * browser MIME sniffing and the server-side `file-type` library.
 */
export const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n'
  + '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'
  + '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n'
  + '3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\n'
  + 'xref\n0 4\n0000000000 65535 f\n'
  + '0000000009 00000 n\n'
  + '0000000058 00000 n\n'
  + '0000000115 00000 n\n'
  + 'trailer<</Size 4/Root 1 0 R>>\nstartxref\n174\n%%EOF',
)

/**
 * Minimal OLE2 Compound Binary File (.doc).
 * Starts with the 8-byte OLE2 magic `D0 CF 11 E0 A1 B1 1A E1`.
 * The `file-type` library does NOT detect OLE2 natively, so the server has a
 * manual magic-byte fallback that matches these first 8 bytes and maps them to
 * `application/msword`.
 *
 * We pad to 512 bytes (one sector) to look a bit more realistic.
 */
export const MINIMAL_DOC = (() => {
  const buf = Buffer.alloc(512, 0)
  // OLE2 magic signature
  buf[0] = 0xD0
  buf[1] = 0xCF
  buf[2] = 0x11
  buf[3] = 0xE0
  buf[4] = 0xA1
  buf[5] = 0xB1
  buf[6] = 0x1A
  buf[7] = 0xE1
  // Minor version 0x003E, Major version 0x0003 (MS Word 97-2003)
  buf.writeUInt16LE(0x003E, 24)
  buf.writeUInt16LE(0x0003, 26)
  // Byte order mark (little-endian) 0xFFFE
  buf.writeUInt16LE(0xFFFE, 28)
  // Sector size power: 9 → 512 bytes
  buf.writeUInt16LE(9, 30)
  return buf
})()

/**
 * Minimal DOCX file (OOXML / ZIP-based).
 * A .docx is simply a ZIP archive containing `[Content_Types].xml` at its root.
 * The `file-type` library detects this as
 * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
 * by reading the ZIP entries and finding `[Content_Types].xml` with the OOXML
 * content type.
 *
 * This is the smallest valid ZIP that `file-type` recognises as DOCX.
 */
export const MINIMAL_DOCX = (() => {
  // Tiny content for [Content_Types].xml — must reference the word processing ML content type
  const xml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '</Types>'

  const rels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>'

  const doc =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:body><w:p><w:r><w:t>Test</w:t></w:r></w:p></w:body>'
    + '</w:document>'

  // Build a ZIP manually (no dependencies) using the basic local-file + central-dir format
  const files: { name: string, data: Buffer }[] = [
    { name: '[Content_Types].xml', data: Buffer.from(xml) },
    { name: '_rels/.rels', data: Buffer.from(rels) },
    { name: 'word/document.xml', data: Buffer.from(doc) },
  ]

  const localHeaders: Buffer[] = []
  const centralHeaders: Buffer[] = []
  let offset = 0

  for (const f of files) {
    const nameBuffer = Buffer.from(f.name)

    // Local file header (30 bytes + name + data)
    const local = Buffer.alloc(30 + nameBuffer.length + f.data.length)
    local.writeUInt32LE(0x04034B50, 0)    // Local file header signature
    local.writeUInt16LE(20, 4)            // Version needed to extract
    local.writeUInt16LE(0, 6)             // General purpose bit flag
    local.writeUInt16LE(0, 8)             // Compression method (stored)
    local.writeUInt16LE(0, 10)            // Last mod time
    local.writeUInt16LE(0, 12)            // Last mod date
    local.writeUInt32LE(0, 14)            // CRC-32 (skip for simplicity)
    local.writeUInt32LE(f.data.length, 18) // Compressed size
    local.writeUInt32LE(f.data.length, 22) // Uncompressed size
    local.writeUInt16LE(nameBuffer.length, 26) // File name length
    local.writeUInt16LE(0, 28)            // Extra field length
    nameBuffer.copy(local, 30)
    f.data.copy(local, 30 + nameBuffer.length)
    localHeaders.push(local)

    // Central directory header (46 bytes + name)
    const central = Buffer.alloc(46 + nameBuffer.length)
    central.writeUInt32LE(0x02014B50, 0)   // Central directory signature
    central.writeUInt16LE(20, 4)           // Version made by
    central.writeUInt16LE(20, 6)           // Version needed to extract
    central.writeUInt16LE(0, 8)            // Flags
    central.writeUInt16LE(0, 10)           // Compression
    central.writeUInt16LE(0, 12)           // Mod time
    central.writeUInt16LE(0, 14)           // Mod date
    central.writeUInt32LE(0, 16)           // CRC-32
    central.writeUInt32LE(f.data.length, 20) // Compressed size
    central.writeUInt32LE(f.data.length, 24) // Uncompressed size
    central.writeUInt16LE(nameBuffer.length, 28) // File name length
    central.writeUInt16LE(0, 30)           // Extra field length
    central.writeUInt16LE(0, 32)           // File comment length
    central.writeUInt16LE(0, 34)           // Disk number start
    central.writeUInt16LE(0, 36)           // Internal file attributes
    central.writeUInt32LE(0, 38)           // External file attributes
    central.writeUInt32LE(offset, 42)      // Relative offset of local header
    nameBuffer.copy(central, 46)
    centralHeaders.push(central)

    offset += local.length
  }

  const centralDirOffset = offset
  const centralDirSize = centralHeaders.reduce((sum, b) => sum + b.length, 0)

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054B50, 0) // EOCD signature
  eocd.writeUInt16LE(0, 4)          // Disk number
  eocd.writeUInt16LE(0, 6)          // Disk with central dir start
  eocd.writeUInt16LE(files.length, 8)  // Total entries on this disk
  eocd.writeUInt16LE(files.length, 10) // Total entries
  eocd.writeUInt32LE(centralDirSize, 12) // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16) // Offset of central directory
  eocd.writeUInt16LE(0, 20)         // Comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd])
})()

// ─────────────────────────────────────────────────────────────────────────────
// Invalid formats — the server should reject these with HTTP 400.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A plain-text "file" that looks like a resume to a human but has no valid
 * document magic bytes. The server will reject it with HTTP 400 because
 * `file-type` will not identify it as PDF, DOC, or DOCX.
 */
export const INVALID_PLAINTEXT = Buffer.from(
  'This is a plain text file pretending to be a resume.\n'
  + 'Name: Jane Doe\nEmail: jane@example.com\n',
)

/**
 * A PNG image — valid magic bytes but wrong format for document upload.
 * The server should reject it because `image/png` is not in ALLOWED_MIME_TYPES.
 */
export const INVALID_PNG = (() => {
  // Minimal 1×1 white PNG (smallest valid)
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  ])
  const ihdr = Buffer.from([
    0x00, 0x00, 0x00, 0x0D, // Chunk length: 13
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02,             // Bit depth: 8, Color type: RGB
    0x00, 0x00, 0x00,       // Compression, Filter, Interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
  ])
  const idat = Buffer.from([
    0x00, 0x00, 0x00, 0x0C, // Chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00,
    0x00, 0x02, 0x00, 0x01, // Compressed data
    0xE2, 0x21, 0xBC, 0x33, // CRC
  ])
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00, // Chunk length: 0
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82, // CRC
  ])
  return Buffer.concat([header, ihdr, idat, iend])
})()

// ─────────────────────────────────────────────────────────────────────────────
// Convenience export: all valid file configs ready for `setInputFiles()`
// ─────────────────────────────────────────────────────────────────────────────

export interface TestFileConfig {
  /** Human-readable label for test output */
  label: string
  /** File name including extension */
  filename: string
  /** MIME type to declare to the browser */
  mimeType: string
  /** Binary content with the correct magic bytes */
  buffer: Buffer
}

/** All three valid document formats accepted by the server */
export const VALID_FILE_CONFIGS: TestFileConfig[] = [
  {
    label: 'PDF',
    filename: 'resume.pdf',
    mimeType: 'application/pdf',
    buffer: MINIMAL_PDF,
  },
  {
    label: 'DOC (legacy Word)',
    filename: 'resume.doc',
    mimeType: 'application/msword',
    buffer: MINIMAL_DOC,
  },
  {
    label: 'DOCX (modern Word)',
    filename: 'resume.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: MINIMAL_DOCX,
  },
]

/** Invalid file configs that should be rejected by the server */
export const INVALID_FILE_CONFIGS: TestFileConfig[] = [
  {
    label: 'Plain text',
    filename: 'resume.txt',
    mimeType: 'text/plain',
    buffer: INVALID_PLAINTEXT,
  },
  {
    label: 'PNG image',
    filename: 'resume.png',
    mimeType: 'image/png',
    buffer: INVALID_PNG,
  },
]
