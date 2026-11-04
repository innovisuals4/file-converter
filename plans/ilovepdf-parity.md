# ILovePDF Parity — Construction Plan

**Project:** transmute (Next.js 16.4.4 file converter)
**Objective:** Add all ILovePDF-style PDF manipulation, OCR, Office→PDF fidelity, and security features to match ILovePDF's feature set.
**Scope:** 12 one-PR steps across 4 workstreams. Estimated 8–10 PRs with parallel execution.

---

## Current State (Baseline)

| Feature | Status | Notes |
|---------|--------|-------|
| **PDF → DOCX/MD/HTML/TXT** | ✅ Working | Text extraction via pdf.js |
| **DOCX/MD/HTML/TXT → PDF** | ✅ Working | Basic rendering via pdf-lib |
| **Image conversions** | ✅ Working | Sharp + custom BMP/ICO |
| **Video/Audio (FFmpeg)** | ✅ Working | Server + browser fallback |
| **Spreadsheets** | ✅ Working | SheetJS (XLSX) |
| **Archives (ZIP/TAR/GZ)** | ✅ Working | JSZip + custom TAR |
| **Fonts (TTF/OTF/WOFF/WOFF2)** | ✅ Working | Custom + wawoff2 |
| **Subtitles (SRT/VTT)** | ✅ Working | Custom parser |
| **Data (JSON/YAML/XML)** | ✅ Working | Custom |

**Missing ILovePDF Features:**

| Category | Missing Features |
|----------|-----------------|
| **PDF Manipulation** | Merge, Split, Compress, Rotate, Delete pages, Reorder, Extract pages, Organize |
| **OCR** | Scanned PDF → Searchable PDF, Image → Text |
| **Office → PDF (fidelity)** | PPTX → PDF (slides as pages), XLSX → PDF (worksheets), DOCX → PDF (better layout) |
| **PDF Security** | Password protect, Unlock, Permissions |
| **Watermark/Annotation** | Text/image watermark, Page numbers, Bates numbering |
| **PDF Optimize** | Advanced compression, Linearization (fast web view) |
| **Convert TO PDF** | JPG/HEIC/PNG → PDF (multi-page), HTML → PDF (better), EPUB → PDF |

---

## Workstream Architecture

```
WS1: PDF Manipulation Engine (core)
    ├── Step 1: PDF Page Model + Rotation
    ├── Step 2: Merge / Concatenate
    ├── Step 3: Split (by range / every N / by bookmark)
    ├── Step 4: Delete / Reorder / Extract Pages
    └── Step 5: Compress (image downsampling, font subsetting)

WS2: OCR Engine
    ├── Step 6: Tesseract Integration (server + WASM fallback)
    └── Step 7: OCR Pipeline (Image → Text, PDF → Searchable PDF)

WS3: Office → PDF Fidelity
    ├── Step 8: PPTX → PDF (slide rendering)
    ├── Step 9: XLSX → PDF (worksheet pagination)
    └── Step 10: DOCX → PDF (improved layout via docx-preview / LibreOffice headless)

WS4: PDF Security & Enhancement
    ├── Step 11: Password Protect / Unlock / Permissions
    ├── Step 12: Watermark (text/image), Page Numbers, Bates, Linearization
```

---

## Dependency Graph

```
Step 1 (Page Model)
    ├── Step 2 (Merge) ──┐
    ├── Step 3 (Split) ──┤
    ├── Step 4 (Delete/Reorder) ──► Step 5 (Compress)
    └── Step 5 (Compress) ◄────────┘

Step 6 (Tesseract Setup)
    └── Step 7 (OCR Pipeline)

Step 8 (PPTX→PDF) ──► Step 10 (DOCX→PDF improved)
Step 9 (XLSX→PDF)

Step 11 (Security) ──► Step 12 (Watermark/Linearize)
```

**Parallelizable Groups:**
- Group A: Steps 2, 3, 4 (after Step 1) — can run in parallel
- Group B: Steps 8, 9 — independent
- Group C: Steps 6, 11 — independent infrastructure

---

## Step Specifications

### Step 1: PDF Page Model + Rotation
**Branch:** `feat/pdf-page-model`
**Model Tier:** Default
**Files:** `src/lib/server/adapters/pdf-pages.ts` (new), `src/lib/registry.ts`, `src/app/api/convert/route.ts`

**Context Brief:**
- Create `PdfPage` interface (width, height, rotation, content stream refs)
- Use `pdf-lib` to load PDF, expose page metadata
- Add `rotatePages` function (90/180/270 per page or all)
- Register `engine: "pdf-pages"` in registry
- Add `/api/pdf/rotate` route (or reuse `/api/convert` with `operation=rotate`)

**Tasks:**
- [ ] Create `pdf-pages.ts` with `loadPdfPages`, `rotatePages`, `getPageMetadata`
- [ ] Handle rotation by updating `/Rotate` in page dict
- [ ] Preserve annotations, form fields, links during rotation
- [ ] Add registry routes: `pdf→pdf` with `operation: "rotate"`, `angle` option
- [ ] Unit tests: rotate 90/180/270, multi-page, preserve content

**Verification:**
```bash
npm run build && npm run lint
# Test via API
curl -X POST -F 'file=@test.pdf' -F 'target=pdf' -F 'options={"operation":"rotate","angle":90}' http://localhost:3000/api/convert
```

**Exit Criteria:** Rotate works for all pages, preserves content, no corruption.

---

### Step 2: PDF Merge / Concatenate
**Branch:** `feat/pdf-merge`
**Model Tier:** Default
**Depends on:** Step 1
**Files:** `src/lib/server/adapters/pdf-merge.ts` (new), `src/lib/registry.ts`

**Context Brief:**
- Accept multiple PDF inputs (multipart: `files[]` array)
- Concatenate pages in order, preserve metadata (title, author from first)
- Handle mixed page sizes/orientations
- Optimize: reuse font subsets across input PDFs where possible

**Tasks:**
- [ ] Create `pdf-merge.ts` with `mergePdfs(inputs: Buffer[])`
- [ ] Handle multipart upload: `files[]` + `target=pdf` + `operation=merge`
- [ ] Preserve bookmarks/outlines (merge with offset)
- [ ] Add registry: `merge` pseudo-format or multi-file endpoint
- [ ] Test: 2+ PDFs, different page sizes, encrypted inputs (reject gracefully)

**Verification:**
```bash
# Test via API (multipart with multiple files)
curl -X POST -F 'files=@a.pdf' -F 'files=@b.pdf' -F 'target=pdf' -F 'operation=merge' http://localhost:3000/api/convert
```

**Exit Criteria:** Merged PDF renders correctly, page count = sum, bookmarks preserved.

---

### Step 3: PDF Split
**Branch:** `feat/pdf-split`
**Model Tier:** Default
**Depends on:** Step 1
**Files:** `src/lib/server/adapters/pdf-split.ts` (new), `src/lib/registry.ts`

**Context Brief:**
- Split modes: by page range (`1-5`), every N pages, by bookmark level, extract specific pages
- Output: ZIP of multiple PDFs or single PDF (for range extract)
- Preserve metadata per split

**Tasks:**
- [ ] Create `pdf-split.ts` with `splitPdf(input, options)`
- [ ] Options: `mode: "range" | "every-n" | "bookmark" | "pages"`, `ranges: string`, `everyN: number`, `pages: number[]`
- [ ] Output handling: return ZIP for multi-file, single PDF for range
- [ ] Add registry routes for each mode
- [ ] Test: range, every-2, bookmark (if present), page array

**Verification:**
```bash
curl -X POST -F 'file=@big.pdf' -F 'target=zip' -F 'operation=split' -F 'options={"mode":"range","ranges":"1-3,4-6"}' http://localhost:3000/api/convert
```

**Exit Criteria:** Splits produce valid PDFs, correct page counts, ZIP structure correct.

---

### Step 4: Delete / Reorder / Extract Pages
**Branch:** `feat/pdf-pages-advanced`
**Model Tier:** Default
**Depends on:** Step 1
**Files:** `src/lib/server/adapters/pdf-pages.ts` (extend), `src/lib/registry.ts`

**Context Brief:**
- Extend Step 1's page model with `deletePages`, `reorderPages`, `extractPages`
- Operations are page-index based (0-indexed or 1-indexed)
- Reorder accepts array of page indices
- Extract returns new PDF with only specified pages

**Tasks:**
- [ ] Add `deletePages(pdf, indices)`, `reorderPages(pdf, newOrder)`, `extractPages(pdf, indices)`
- [ ] Handle index validation (bounds, duplicates)
- [ ] Update bookmarks/outlines to match new page numbers
- [ ] Add registry options for each operation
- [ ] Test: delete middle pages, reverse order, extract non-contiguous

**Verification:** All operations produce valid PDFs with correct content.

---

### Step 5: PDF Compress (Image Downsampling + Font Subsetting)
**Branch:** `feat/pdf-compress`
**Model Tier:** Strongest (complex optimization)
**Depends on:** Step 1
**Files:** `src/lib/server/adapters/pdf-compress.ts` (new), `src/lib/registry.ts`

**Context Brief:**
- Quality levels: Low (150 DPI, JPEG q=50), Medium (200 DPI, q=70), High (300 DPI, q=85)
- Downsample images > target DPI using `sharp` via pdf-lib image extraction
- Subset embedded fonts (remove unused glyphs)
- Remove duplicate objects, linearize for fast web view
- Option: `compressLevel: "low" | "medium" | "high"`

**Tasks:**
- [ ] Create `pdf-compress.ts` with `compressPdf(input, level)`
- [ ] Iterate pages, extract images (pdf-lib `page.drawImage` + `pdf.getImages`?), downsample, re-embed
- [ ] Font subsetting via `pdf-lib` subset API or external tool
- [ ] Linearize output (pdf-lib `save({ useObjectStreams: true })`)
- [ ] Add registry: `pdf→pdf` with `operation: "compress"`, `quality` option
- [ ] Benchmark: measure size reduction vs quality loss

**Verification:**
```bash
# 10MB PDF → expect 2-5MB at medium
curl -X POST -F 'file=@large.pdf' -F 'target=pdf' -F 'operation=compress' -F 'options={"quality":"medium"}' http://localhost:3000/api/convert
```

**Exit Criteria:** 50-80% size reduction at medium, visual quality acceptable, text selectable.

---

### Step 6: Tesseract Integration (Server + WASM)
**Branch:** `feat/ocr-tesseract`
**Model Tier:** Strongest (native binary + WASM)
**Files:** `src/lib/server/adapters/ocr.ts` (new), `src/lib/client/ocr.ts` (new), `package.json`, `src/app/api/engines/route.ts`

**Context Brief:**
- Server: `tesseract.js` with native binary (if available) or WASM
- Client: `tesseract.js` WASM (auto-download ~10MB)
- Language packs: eng, spa, fra, deu, chi_sim, jpn, kor, ara, hin, por, rus, ita, etc.
- Detect Tesseract binary at runtime (like FFmpeg)

**Tasks:**
- [ ] Add `tesseract.js` to dependencies
- [ ] Create `ocr.ts` (server) with `ocrImage(buffer, lang)` and `ocrPdf(buffer, lang)`
- [ ] Create client-side `ocr.ts` using `tesseract.js` WASM
- [ ] Add `/api/engines` detection for Tesseract
- [ ] Language pack management (download on demand, cache in `/tmp` or IndexedDB)
- [ ] Handle rotated images (auto-orient via EXIF or Tesseract OSD)

**Verification:**
```bash
# Server OCR
curl -X POST -F 'file=@scanned.png' -F 'target=txt' -F 'operation=ocr' -F 'options={"lang":"eng"}' http://localhost:3000/api/convert
```

**Exit Criteria:** OCR extracts text from clean scans (>95% accuracy), handles multi-page PDFs.

---

### Step 7: OCR Pipeline (Image → Text, PDF → Searchable PDF)
**Branch:** `feat/ocr-pipeline`
**Model Tier:** Default
**Depends on:** Step 6
**Files:** `src/lib/server/adapters/ocr.ts` (extend), `src/lib/registry.ts`, `src/app/api/convert/route.ts`

**Context Brief:**
- Input: image (PNG/JPG/TIFF) or PDF (scanned)
- Output modes: `txt` (plain text), `pdf` (searchable PDF with invisible text layer), `docx` (editable)
- For PDF: rasterize each page → OCR → rebuild PDF with image + invisible text
- Progress reporting for multi-page

**Tasks:**
- [ ] Add `ocrToSearchablePdf(input, lang)` — render page to image, OCR, create PDF with text layer
- [ ] Add `ocrToText(input, lang)` — return plain text
- [ ] Multi-language support (`lang: "eng+fra"`)
- [ ] Registry routes: `png→txt`, `pdf→txt`, `pdf→pdf` (with `operation: "ocr"`)
- [ ] Options: `lang`, `outputFormat`, `dpi` (for rasterization)
- [ ] Test: scanned PDF → searchable PDF, text selectable

**Verification:** Searchable PDF passes `pdftotext` round-trip, text highlights in viewer.

---

### Step 8: PPTX → PDF (Slide Rendering)
**Branch:** `feat/pptx-to-pdf-fidelity`
**Model Tier:** Strongest (rendering fidelity)
**Files:** `src/lib/server/adapters/pptx-pdf.ts` (new), `src/lib/registry.ts`, `src/lib/server/adapters/docs.ts` (extend)

**Context Brief:**
- Current: text extraction only (1 PDF page per slide, no graphics)
- Target: Full fidelity — shapes, images, text positions, animations (static), backgrounds
- Approach: Use `pptxgenjs` in reverse? No — need rendering. Options:
  1. LibreOffice headless (best fidelity, heavy dependency)
  2. `pptx2html` + `puppeteer` (lighter, good fidelity)
  3. Custom via `pptxgenjs` parsing + `pdf-lib` drawing (most control, most work)
- Recommend: Option 2 for v1 (pptx2html → puppeteer → PDF), upgrade to LibreOffice later

**Tasks:**
- [ ] Add `pptx2html` + `puppeteer` (or `@puppeteer/browser`) as optional deps
- [ ] Create `pptx-pdf.ts` with `pptxToPdf(input, options)`
- [ ] Convert PPTX → HTML (one file per slide or combined)
- [ ] Render via headless Chrome (Puppeteer) to PDF
- [ ] Options: `slidesPerPage: 1 | 2 | 4 | 6 | 9`, `includeNotes`, `handoutMode`
- [ ] Handle fonts (embed via `@font-face` or substitute)
- [ ] Register: `pptx→pdf` with enhanced options

**Verification:** Complex slides (SmartArt, charts, gradients, transparency) render correctly.

---

### Step 9: XLSX → PDF (Worksheet Pagination)
**Branch:** `feat/xlsx-to-pdf-fidelity`
**Model Tier:** Default
**Files:** `src/lib/server/adapters/xlsx-pdf.ts` (new), `src/lib/registry.ts`, `src/lib/server/adapters/sheets.ts` (extend)

**Context Brief:**
- Current: CSV/TSV/JSON export only
- Target: Print-ready PDF with pagination, headers/footers, fit-to-page
- Use SheetJS to read, then render via `pdf-lib` or HTML → Puppeteer

**Tasks:**
- [ ] Create `xlsx-pdf.ts` with `xlsxToPdf(input, options)`
- [ ] Options: `orientation: "portrait" | "landscape"`, `fitToPage: true | false`, `margins`, `printGridlines`, `repeatHeaders`
- [ ] Paginate large sheets across pages
- [ ] Support multiple worksheets (one PDF or ZIP of PDFs)
- [ ] Register: `xlsx→pdf`, `ods→pdf`, `csv→pdf` with options

**Verification:** 1000-row sheet paginates correctly, headers repeat, fits page width.

---

### Step 10: DOCX → PDF (Improved Layout)
**Branch:** `feat/docx-to-pdf-fidelity`
**Model Tier:** Strongest
**Depends on:** Step 8 (shared rendering approach)
**Files:** `src/lib/server/adapters/docx-pdf.ts` (new), `src/lib/server/adapters/docs.ts` (extend)

**Context Brief:**
- Current: Text extraction → reflow (loses columns, tables, floats)
- Target: High-fidelity layout preservation
- Approach: Same as PPTX — `docx2html`/`mammoth` → HTML → Puppeteer
- Or: LibreOffice headless (best for complex docs)

**Tasks:**
- [ ] Evaluate `mammoth` HTML output quality for complex docs
- [ ] Create `docx-pdf.ts` with `docxToPdf(input, options)`
- [ ] Handle: tables, columns, headers/footers, page breaks, floats, TOC
- [ ] Font mapping (substitute missing fonts)
- [ ] Register: `docx→pdf` (enhanced), `doc→pdf`, `odt→pdf` with options
- [ ] Fallback to text-extraction for unsupported features

**Verification:** Business documents (contracts, reports) render with correct layout.

---

### Step 11: PDF Security (Password, Permissions, Unlock)
**Branch:** `feat/pdf-security`
**Model Tier:** Default
**Files:** `src/lib/server/adapters/pdf-security.ts` (new), `src/lib/registry.ts`

**Context Brief:**
- `pdf-lib` supports encryption (AES-256), user/owner passwords, permissions
- Operations: `encrypt` (add password), `decrypt` (remove password), `permissions` (set)
- Permissions: print, modify, copy, annotate, form-fill, accessibility, assemble, print-high-res

**Tasks:**
- [ ] Create `pdf-security.ts` with `encryptPdf(input, userPass, ownerPass, permissions)`, `decryptPdf(input, password)`, `setPermissions(input, ownerPass, permissions)`
- [ ] Handle: empty passwords, metadata preservation
- [ ] Registry routes: `pdf→pdf` with `operation: "encrypt" | "decrypt" | "permissions"`
- [ ] Options: `userPassword`, `ownerPassword`, `permissions: string[]`
- [ ] Test: encrypted PDF opens in Adobe/Chrome, permissions enforced

**Verification:** Encrypted PDF requires password, permissions block actions correctly.

---

### Step 12: Watermark, Page Numbers, Bates, Linearization
**Branch:** `feat/pdf-enhance`
**Model Tier:** Default
**Depends on:** Step 1, Step 5, Step 11
**Files:** `src/lib/server/adapters/pdf-enhance.ts` (new), `src/lib/registry.ts`

**Context Brief:**
- Watermark: text (opacity, rotation, font, size, position) or image (position, scale)
- Page numbers: format, position, start number, prefix/suffix, skip first N
- Bates numbering: prefix, suffix, digits, start, position
- Linearization: Fast Web View (already in Step 5, expose as standalone)

**Tasks:**
- [ ] Create `pdf-enhance.ts` with `addWatermark`, `addPageNumbers`, `addBatesNumbering`, `linearize`
- [ ] Watermark options: `type: "text" | "image"`, `text`, `fontSize`, `opacity`, `rotation`, `position`
- [ ] Page numbers: `format: "1" | "1/10" | "Page 1"`, `position`, `start`, `skipFirst`
- [ ] Bates: `prefix`, `suffix`, `digits`, `start`, `position`
- [ ] Chain operations: watermark + page numbers in one pass
- [ ] Register routes for each enhancement

**Verification:** All enhancements produce valid PDFs, text searchable, no corruption.

---

## Cross-Cutting Concerns

### API Design
- All operations under `/api/convert` with `operation` field
- Multi-file endpoints: `/api/convert/batch` for merge/split
- Progress via existing XHR + `X-Transmute-Result` header
- Consistent error format: `{ error, validTargets?, code }`

### Registry Updates
Each step adds routes to `src/lib/registry.ts`:
```typescript
// Example for merge
add({ from: "merge", to: "pdf", engine: "pdf-merge", options: [] });
// For operations on existing formats
add({ from: "pdf", to: "pdf", engine: "pdf-pages", options: [
  { id: "operation", type: "select", choices: ["rotate", "delete", "reorder", "extract"], def: "rotate" },
  { id: "angle", type: "select", choices: [90, 180, 270], onlyForTargets: ["pdf"], def: 90 },
  // ...
] });
```

### Client UI (ConverterWorkspace)
- New "PDF Tools" tab in format selector
- Operation-specific option panels (merge: file reordering; split: range input; watermark: text/image upload)
- Reuse existing `FormatSelect`, `OptionsPanel`, `Dropzone`

### Testing Strategy
- Unit tests per adapter (`*.test.ts`)
- Integration tests via `test/api.test.ts` (if exists)
- Visual regression for rendering steps (PPTX, DOCX, XLSX → PDF)
- Performance benchmarks for compress/OCR

### Deployment Notes
- Tesseract WASM: ~10MB download (client), native binary optional (server)
- Puppeteer: ~150MB (if used for PPTX/DOCX) — consider `@puppeteer/browser` or cloud function
- LibreOffice headless: ~500MB — document as optional "premium" engine
- FFmpeg: already detected, used for media

---

## Rollout Order (Recommended)

| Phase | Steps | Parallelism | Est. PRs |
|-------|-------|-------------|----------|
| **1: Core PDF Manipulation** | 1, (2,3,4), 5 | 3 parallel after 1 | 4 |
| **2: OCR** | 6, 7 | Sequential | 2 |
| **3: Office Fidelity** | 8, 9, 10 | 8,9 parallel; 10 after 8 | 3 |
| **4: Security & Enhance** | 11, 12 | Sequential | 2 |

**Total: ~11 PRs over 4 phases**

---

## Anti-Patterns to Avoid

1. **Don't** add `pdf-lib` image extraction without testing — it's limited
2. **Don't** bundle Puppeteer in serverless without size check
3. **Don't** assume all PDFs have bookmarks/outlines
4. **Don't** hardcode font paths — use font subsetting APIs
5. **Don't** skip corrupted file handling — test with malformed PDFs
6. **Don't** forget to update `targetsFor("pdf")` in registry for new operations

---

## Verification Commands (Per Step)

```bash
# Universal
npm run build && npm run lint && npm run typecheck

# API test template
curl -X POST \
  -F 'file=@test.pdf' \
  -F 'target=pdf' \
  -F 'operation=rotate' \
  -F 'options={"angle":90}' \
  http://localhost:3000/api/convert \
  -o output.pdf && file output.pdf

# Multi-file
curl -X POST \
  -F 'files=@a.pdf' -F 'files=@b.pdf' \
  -F 'target=pdf' \
  -F 'operation=merge' \
  http://localhost:3000/api/convert \
  -o merged.pdf
```

---

## Memory Index Update

After each phase, update `MEMORY.md` with:
- Completed steps
- New dependencies added
- API changes
- Known limitations
- Next phase priorities

---

**Plan Status:** DRAFT — Ready for adversarial review
**Next Action:** Run adversarial review (strongest model) against this plan, then finalize and begin Step 1.