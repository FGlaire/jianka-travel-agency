# Template Functionality Review

## Current Implementation

### How Templates Work Now:

1. **Template Selection**
   - User selects a template from dropdown
   - Template is stored in `selectedTemplate` state
   - Template is used ONLY during CSV file upload/parsing

2. **CSV Upload & Parsing**
   - When CSV is uploaded, it's parsed using the currently selected template
   - Parsed data is stored in `uploadedFiles` array
   - Each file object contains:
     - `data`: Already parsed rows (using template mappings)
     - `columns`: CSV headers
     - `columnValidation`: Validation results

3. **Data Extraction**
   - User selects a file from uploaded files
   - Extraction uses the **already-parsed data** from the file object
   - Results are displayed in success/failed tables
   - **Template is NOT used again during extraction**

### Current Limitations:

❌ **Templates do NOT filter CSV files**
- All uploaded files are shown regardless of template
- No compatibility checking between files and templates

❌ **Extraction results do NOT vary by template**
- Files are parsed once during upload
- Changing template after upload doesn't affect already-parsed files
- Results table shows data from the original parsing, not current template

❌ **No re-parsing capability**
- Once a file is uploaded with Template A, it can't be re-parsed with Template B
- User must delete and re-upload to use a different template

---

## Proposed Improvements

### Option 1: Template-Based Filtering + Re-parsing (Recommended)

**Features:**
1. **Template Filtering**
   - Show only CSV files that are compatible with selected template
   - Display match percentage for each file
   - Allow filtering by template compatibility

2. **Dynamic Re-parsing**
   - When template changes, re-parse all uploaded files
   - Store raw CSV data (not just parsed data)
   - Update extraction results based on current template

3. **Template-Specific Results**
   - Extraction results table varies based on selected template
   - Show which template was used for each extraction
   - Allow switching templates and seeing different results

**Implementation:**
- Store raw CSV text in file objects
- Add `templateId` to track which template was used
- Re-parse files when template changes
- Filter files by template compatibility

### Option 2: Template Selection Per File

**Features:**
1. Each file can have its own template
2. Files are parsed with their assigned template
3. Template selector appears per file, not globally

**Implementation:**
- Add `templateId` to each file object
- Show template selector in file card
- Parse/re-parse file when its template changes

### Option 3: Template as View Filter Only

**Features:**
1. Templates filter which files are displayed
2. Files keep their original parsing
3. Results don't change, but only compatible files are shown

**Implementation:**
- Add template compatibility checking
- Filter `uploadedFiles` array based on selected template
- No re-parsing, just filtering

---

## Recommended Approach: Option 1

### Benefits:
✅ Users can switch templates and see different results
✅ Files are filtered by compatibility
✅ No need to re-upload files to try different templates
✅ Better user experience

### Implementation Steps:

1. **Store Raw CSV Data**
   ```typescript
   uploadedFiles: Array<{
     id: string;
     name: string;
     rawText?: string; // Store original CSV text
     data: any[]; // Parsed data
     templateId?: string; // Which template was used
     // ... other fields
   }>
   ```

2. **Add Re-parse Function**
   ```typescript
   function reparseFileWithTemplate(file: any, template: EnhancedTemplate) {
     // Parse raw CSV text with new template
     // Update file.data
     // Update file.templateId
   }
   ```

3. **Template Change Handler**
   ```typescript
   function onTemplateChange(newTemplate: EnhancedTemplate) {
     // Re-parse all files with new template
     uploadedFiles.forEach(file => {
       if (file.rawText) {
         reparseFileWithTemplate(file, newTemplate);
       }
     });
     // Clear extraction results
     successData = [];
     failedData = [];
   }
   ```

4. **Template Filtering**
   ```typescript
   function getCompatibleFiles(template: EnhancedTemplate) {
     return uploadedFiles.filter(file => {
       // Check if file is compatible with template
       const match = templateMatcher?.analyzeCSVHeaders(file.columns);
       return match && match[0]?.score > 0.5;
     });
   }
   ```

5. **Update UI**
   - Show template selector affects all files
   - Display "Re-parsing..." indicator
   - Show which template each file was parsed with
   - Filter files by compatibility

---

## Questions to Consider:

1. **Should templates filter files or just re-parse them?**
   - Filter: Only show compatible files
   - Re-parse: Show all files, but parse with current template

2. **Should re-parsing happen automatically or on-demand?**
   - Automatic: When template changes, re-parse immediately
   - On-demand: Show "Apply Template" button

3. **Should files remember their original template?**
   - Yes: Show "Original: Template A, Current: Template B"
   - No: Always use current template

4. **Should extraction results be cleared when template changes?**
   - Yes: Clear results, require re-extraction
   - No: Keep results, but mark as "from previous template"

---

## Next Steps:

1. Review this document
2. Decide on approach (Option 1, 2, or 3)
3. Implement chosen solution
4. Test with multiple templates and files

