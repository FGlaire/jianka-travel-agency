# JIANKA Travel Agency - CSV Extraction System
## Demonstration Script

---

## 📋 Table of Contents
1. [Introduction](#introduction)
2. [Technologies Used](#technologies-used)
3. [System Overview](#system-overview)
4. [Key Features](#key-features)
5. [Step-by-Step Demonstration](#step-by-step-demonstration)
6. [Limitations & Known Issues](#limitations--known-issues)
7. [Future Improvements](#future-improvements)

---

## 🎯 Introduction

**Welcome to the JIANKA Travel Agency CSV Extraction System!**

This system is designed to help travel agencies process customer data from CSV files with intelligent field mapping, validation, and template-based extraction. The system handles various CSV formats and allows users to create custom templates for different data structures.

**What we'll demonstrate today:**
- Homepage flight time display (interactive hover feature)
- CSV file upload and parsing
- Custom template creation with drag-and-drop field mapping
- Smart template matching
- Data validation and extraction
- Template switching and re-parsing
- Duplicate detection

---

## 🛠️ Technologies Used

### Frontend
- **SvelteKit** - Full-stack framework for reactive UI
- **TypeScript** - Type-safe JavaScript
- **Svelte Transitions** - Smooth animations and UI effects

### Backend
- **SvelteKit API Routes** - Server-side endpoints:
  - `/api/templates` - Template CRUD operations
  - `/api/csv-files` - CSV file management
  - `/api/flights` - Flight time data (homepage feature)
- **Supabase** - Database and authentication
  - PostgreSQL database
  - Row Level Security (RLS) for data protection
  - User authentication

### Key Libraries & Features
- **Smart Template Matcher** - Custom algorithm for template compatibility scoring
- **Drag & Drop API** - For intuitive field mapping
- **CSV Parsing** - Custom parsing logic with position-based and name-based mapping
- **GSAP Animations** - Smooth transitions and scroll-triggered animations
- **Flight Time API** - Real-time flight duration display on homepage

### Database Schema
- `csv_files` table - Stores uploaded CSV data, raw text, and extraction results
- `templates` table - Stores custom field mapping templates
- `auth.users` - Supabase authentication

---

## 🏗️ System Overview

### Architecture
```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SvelteKit App  │
│  (Frontend +    │
│   API Routes)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Supabase     │
│  (Database +    │
│   Auth)         │
└─────────────────┘
```

### Data Flow
1. **Upload** → CSV file uploaded via drag-and-drop or file picker
2. **Parse** → Raw CSV text stored + parsed data created using selected template
3. **Validate** → Column structure and data types validated
4. **Extract** → Data extracted with field-level validation
5. **Store** → Results saved to Supabase database
6. **Display** → Success/failed records shown in tables

---

## ✨ Key Features

### 0. **Homepage Flight Time Display** (Bonus Feature)
- **Interactive City Hover**: Hover over cities (Berlin, London, New York, Tokyo, Seoul) to see flight durations
- **Real-time Updates**: Flight times update every 30 seconds via API
- **Smooth Animations**: GSAP-powered slide animations when hovering
- **API Integration**: `/api/flights` endpoint provides flight duration data
- **Visual Feedback**: City name slides up, flight time slides in with golden color

### 1. **CSV File Upload**
- Drag-and-drop interface
- File size validation (up to 10MB)
- Support for 25 travel data columns
- Automatic persistence to database

### 2. **Custom Template Creation**
- **Drag-and-Drop Field Mapping**: Drag CSV column names onto input fields
- **Column Number Support**: Use numbers 1-25 instead of column names
- **Validation**: Prevents duplicate mappings and out-of-range values
- **Field Types**: Supports 25 different field types (text, email, phone, date, etc.)
- **Runtime Fields**: Computed fields that are generated automatically

### 3. **Smart Template Matching**
- Analyzes CSV headers and suggests compatible templates
- Scores templates based on:
  - Field name matching
  - Column position matching
  - Data type compatibility
- Shows matched fields for each template

### 4. **Template Switching & Re-parsing**
- Switch templates without re-uploading files
- Automatic re-parsing when template changes
- Stores raw CSV text for re-parsing capability
- Warning system for files that can't be re-parsed

### 5. **Data Validation**
- **Field-level validation**: Email format, phone numbers, dates, etc.
- **Required field checking**: Ensures mandatory fields are present
- **Duplicate detection**: Identifies duplicate records based on key fields (ID, email, passport, phone)
- **Column structure validation**: Checks CSV structure matches expected format

### 6. **Extraction Results**
- **Success Tab**: Shows valid records that passed all validation
- **Failed Tab**: Shows records with validation errors and reasons
- **Duplicate Tab**: Shows duplicate records and which fields matched
- **Export capability**: Results can be exported (future feature)

### 7. **Template Filtering**
- Filter uploaded files by template compatibility
- Shows only files that match the selected template
- Displays template badge on each file

---

## 🎬 Step-by-Step Demonstration

### **Part 0: Homepage Flight Time Feature** (Optional Demo)

**Step 1: Navigate to Homepage**
- Open the homepage (root route `/`)
- You'll see a hero section with city names displayed

**Step 2: Hover Over Cities**
- Hover your mouse over any city (Berlin, London, New York, Tokyo, Seoul)
- Watch the smooth animation:
  - City name slides up and fades out
  - Flight duration slides in from below with golden color (#cb9f4d)
  - Example: "Berlin" → "2h 45m"

**Step 3: Observe Real-time Updates**
- Flight times are fetched from `/api/flights` API endpoint
- Updates automatically every 30 seconds
- Each city shows its flight duration from your location
- API returns both `flightTime` (duration) and `nextFlight` (timestamp)

**Step 4: Check API Endpoint**
- Open browser DevTools → Network tab
- See requests to `/api/flights?city=Berlin` etc.
- Response includes city, flightTime, and nextFlight timestamp

**What to Highlight:**
- ✅ Interactive UI element adds engagement to homepage
- ✅ API integration for dynamic content (currently mock data, ready for real API)
- ✅ Smooth GSAP animations for professional feel
- ✅ Real-time updates without page refresh
- ✅ Hover interaction provides immediate feedback

**Technical Details:**
- Uses SvelteKit API route: `/api/flights/+server.ts`
- Currently returns mock flight duration data
- In production, would connect to real flight API (e.g., Amadeus, Skyscanner)
- API endpoint supports query parameter: `?city=Berlin`
- Returns JSON: `{ city, flightTime, nextFlight }`

---

### **Part 1: Creating a Custom Template**

**Step 1: Navigate to Field Mapping**
- Click on "Field Mapping" in the navigation
- You'll see the templates list (initially empty or with default template)

**Step 2: Create New Template**
- Click "Create New Template" button
- Form appears with smooth scroll animation

**Step 3: Fill Template Details**
- **Template Name**: Enter a descriptive name (e.g., "Swapped Columns Template")
- **Description**: Add a description of what this template is for
- **Public/Private**: Choose if template should be visible to other users

**Step 4: Set Up CSV Columns**
- Option A: Enter column names manually (comma-separated)
- Option B: Click "Use Numbers 1-25" to generate numbered columns
- Columns appear as draggable tags

**Step 5: Map Fields Using Drag & Drop**
- **Drag** a column tag (e.g., "Column 1") onto an input field (e.g., "id")
- The input field updates automatically
- Continue mapping all required fields
- **Validation**: System prevents duplicate mappings

**Step 6: Validate and Create**
- System validates:
  - No duplicate column mappings
  - Column numbers are within range (1-25)
  - All required fields are mapped
- Click "Create Template"
- Template is saved to database

**What to Highlight:**
- ✅ Drag-and-drop is intuitive and visual
- ✅ Validation prevents errors before creation
- ✅ Template is immediately available for use

---

### **Part 2: Uploading and Processing CSV Files**

**Step 1: Navigate to File Extraction**
- Click on "File Extraction" in the navigation
- Upload area is displayed

**Step 2: Select Template**
- Template dropdown shows all available templates
- Select the template you want to use (or use default)
- Template info can be viewed by clicking the info button

**Step 3: Upload CSV File**
- **Method 1**: Drag and drop CSV file onto upload area
- **Method 2**: Click upload area to open file picker
- File is automatically parsed using selected template

**Step 4: View Uploaded Files**
- File appears in "Uploaded Files" list
- Shows file name, size, upload date
- Template badge shows which template was used
- "Select" button to choose file for extraction

**What to Highlight:**
- ✅ Files persist after page refresh
- ✅ Raw CSV text is stored for re-parsing
- ✅ Multiple files can be uploaded

---

### **Part 3: Template Switching (Re-parsing)**

**Step 1: Upload Files with Default Template**
- Upload a CSV file with standard column order (ID, Last Name, First Name...)
- File is parsed and shows 100% success

**Step 2: Create Custom Template with Swapped Columns**
- Go to Field Mapping
- Create template where Column 1 → Last Name, Column 2 → ID
- Save template

**Step 3: Switch Template**
- Go back to File Extraction
- Change template dropdown to your custom template
- **Automatic re-parsing happens!**
- Files are re-parsed with new template
- Results update automatically

**Step 4: Verify Results**
- Select the file and click "Extract"
- Results now show validation errors (because columns are swapped)
- Failed records show why they failed

**What to Highlight:**
- ✅ No need to re-upload files
- ✅ Automatic re-parsing when template changes
- ✅ Results update in real-time
- ⚠️ Files uploaded before template switching feature need re-upload (warning shown)

---

### **Part 4: Data Extraction and Validation**

**Step 1: Select File**
- Click "Select" button on an uploaded file
- File is highlighted

**Step 2: Extract Data**
- Click "Extract Data" button
- Progress bar shows extraction progress
- System processes each row:
  - Validates field types
  - Checks required fields
  - Detects duplicates
  - Applies field-level validation rules

**Step 3: View Results**
- **Success Tab**: Shows records that passed all validation
  - Green checkmarks
  - All fields displayed
  - Can scroll horizontally to see all columns
- **Failed Tab**: Shows records with errors
  - Red X marks
  - Error messages explain what's wrong
  - Highlights which fields failed validation
- **Duplicate Tab**: Shows duplicate records
  - Explains which fields matched
  - Shows original row numbers

**Step 4: Analyze Results**
- Check success rate
- Review failed records to understand data quality issues
- Identify duplicate entries

**What to Highlight:**
- ✅ Comprehensive validation catches data quality issues
- ✅ Clear error messages help identify problems
- ✅ Duplicate detection prevents data redundancy
- ✅ Results are ordered by template field order

---

### **Part 5: Smart Template Matching**

**Step 1: Upload CSV with Unknown Format**
- Upload a CSV file with non-standard column names
- System analyzes headers automatically

**Step 2: View Smart Matching Results**
- "Smart Template Matching" section appears
- Shows all templates with compatibility scores
- Lists which fields matched for each template

**Step 3: Choose Template**
- Review matched fields for each template
- Select the best matching template
- Files are automatically re-parsed

**What to Highlight:**
- ✅ Intelligent matching helps find the right template
- ✅ Shows confidence level and matched fields
- ✅ User has final control over template selection

---

### **Part 6: Template Filtering**

**Step 1: Upload Multiple Files**
- Upload files with different formats
- Some match default template, some match custom templates

**Step 2: Enable Filter**
- Click "Filter Compatible" button
- Only files compatible with selected template are shown
- File count shows "X of Y" format

**Step 3: Switch Templates**
- Change template in dropdown
- Filtered list updates automatically
- Shows only files compatible with new template

**What to Highlight:**
- ✅ Helps manage multiple file formats
- ✅ Reduces clutter by showing only relevant files
- ✅ Works seamlessly with template switching

---

## ⚠️ Limitations & Known Issues

### **1. Files Without Raw Text Storage**
- **Issue**: Files uploaded before the template switching feature was implemented don't have `rawText` stored
- **Impact**: These files cannot be re-parsed with different templates
- **Workaround**: Re-upload the files to enable template switching
- **User Feedback**: Warning message appears when attempting to switch templates with these files

### **2. CSV Format Requirements**
- **Limitation**: System expects CSV files with comma-separated values
- **Not Supported**: 
  - Tab-separated values (TSV)
  - Semicolon-separated values
  - Excel files (.xlsx, .xls) - must be converted to CSV first
- **Workaround**: Convert files to CSV format before upload

### **3. File Size Limit**
- **Limit**: 10MB maximum file size
- **Reason**: Prevents browser memory issues and ensures good performance
- **Workaround**: Split large files into smaller chunks

### **4. Column Count**
- **Limit**: System designed for 25 travel data columns
- **Reason**: Matches the predefined field structure
- **Workaround**: Additional columns beyond 25 are ignored

### **5. Template Matching Accuracy**
- **Limitation**: Smart matching is heuristic-based, not 100% accurate
- **Impact**: May suggest incorrect templates for ambiguous CSV formats
- **Mitigation**: 
  - User has final control over template selection
  - Shows matched fields so user can verify
  - Manual template selection always available

### **6. Duplicate Detection**
- **Limitation**: Duplicate detection only checks specific key fields (ID, email, passport, phone)
- **Impact**: Records with different IDs but same other data won't be flagged as duplicates
- **Future**: Could add more sophisticated duplicate detection algorithms

### **7. Real-time Collaboration**
- **Not Supported**: Multiple users cannot work on the same file simultaneously
- **Reason**: System is designed for single-user workflows
- **Future**: Could add real-time collaboration features

### **8. Export Functionality**
- **Current State**: Results are displayed but not exportable
- **Future**: Export to CSV, Excel, or PDF formats

### **9. Batch Processing**
- **Limitation**: Files are processed one at a time
- **Impact**: Large batches take longer to process
- **Future**: Could add parallel processing for multiple files

### **10. Error Recovery**
- **Limitation**: If extraction fails mid-process, partial results are not saved
- **Impact**: Must restart extraction if error occurs
- **Future**: Could add checkpoint system for large files

---

## 🚀 Future Improvements

### **Short-term (Next Release)**
1. **Export Functionality**
   - Export success/failed/duplicate records to CSV
   - Export to Excel format
   - PDF report generation

2. **Enhanced Validation**
   - Custom validation rules per template
   - Regex pattern validation
   - Cross-field validation (e.g., end date after start date)

3. **Better Error Messages**
   - More specific error descriptions
   - Suggestions for fixing errors
   - Error categorization

### **Medium-term (Future Releases)**
1. **Batch Operations**
   - Process multiple files simultaneously
   - Bulk template application
   - Batch export

2. **Template Sharing**
   - Share templates with team members
   - Template marketplace
   - Import/export templates

3. **Advanced Duplicate Detection**
   - Fuzzy matching for similar records
   - Configurable duplicate detection rules
   - Merge duplicate records

4. **Data Transformation**
   - Field value transformations
   - Data normalization
   - Calculated fields

### **Long-term (Roadmap)**
1. **Real-time Collaboration**
   - Multiple users working on same files
   - Live updates
   - Comment and annotation system

2. **API Integration**
   - REST API for programmatic access
   - Webhook support
   - Third-party integrations

3. **Analytics Dashboard**
   - Processing statistics
   - Success rate trends
   - Template usage analytics

4. **Machine Learning**
   - Auto-detect CSV structure
   - Suggest field mappings
   - Predict data quality issues

---

## 📝 Demonstration Tips

### **Before Starting**
1. Have sample CSV files ready:
   - Standard format (ID, Last Name, First Name...)
   - Swapped columns format
   - Files with validation errors
   - Files with duplicates

2. Prepare custom templates:
   - Create at least one custom template with swapped columns
   - Test template with different column numbers

3. Test the flow:
   - Practice the demonstration once before presenting
   - Know where each feature is located
   - Be ready to explain any errors that might occur

### **During Demonstration**
1. **Start with the problem**: Explain why this system is needed
2. **Show the solution**: Demonstrate how templates solve the problem
3. **Highlight key features**: Emphasize drag-and-drop, smart matching, re-parsing
4. **Address limitations**: Be transparent about what the system can't do
5. **Show the future**: Mention upcoming improvements

### **Common Questions & Answers**

**Q: Can I use Excel files directly?**
A: No, files must be converted to CSV format first. This is a limitation we're aware of and may address in future releases.

**Q: What happens if I upload a file with the wrong template?**
A: You can switch templates without re-uploading! The system will automatically re-parse the file with the new template.

**Q: How accurate is the smart template matching?**
A: It's heuristic-based and works well for standard formats, but you should always verify the matched fields. You have full control to select a different template.

**Q: Can multiple users work on the same file?**
A: Not currently. Each user has their own files and templates. This is a feature we're considering for future releases.

**Q: What if my CSV has more than 25 columns?**
A: The system will process the first 25 columns. Additional columns are ignored. This matches our predefined travel data structure.

---

## 🎯 Key Takeaways

### **What Makes This System Special:**
1. ✅ **Flexible Template System** - Handle any CSV format with custom mappings
2. ✅ **No Re-upload Required** - Switch templates and re-parse files instantly
3. ✅ **Smart Matching** - System suggests the best template automatically
4. ✅ **Comprehensive Validation** - Catches data quality issues before they become problems
5. ✅ **User-Friendly Interface** - Drag-and-drop makes template creation intuitive
6. ✅ **Persistent Storage** - Files and templates are saved and persist across sessions

### **Best Use Cases:**
- Processing customer data from multiple sources
- Handling CSV files with different column orders
- Validating data quality before importing to main system
- Detecting duplicate customer records
- Standardizing data from various formats

---

## 📞 Support & Documentation

- **GitHub Repository**: [Link to repo]
- **Documentation**: See `README.md` and other `.md` files in the project
- **Issues**: Report bugs and feature requests via GitHub Issues

---

**End of Demonstration Script**

*Last Updated: [Current Date]*
*Version: 1.0*

