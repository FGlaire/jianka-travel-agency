<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { supabase } from '$lib/supabaseClient';
  import { SmartTemplateMatcher, type EnhancedTemplate, processRuntimeFields } from '$lib/smartTemplateMatcher';

  // File upload state
  let fileInput: HTMLInputElement;
  let uploadedFiles: Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: Date;
    data: any[];
    columns: string[];
    rawText?: string; // Store original CSV text for re-parsing
    templateId?: string; // Track which template was used for parsing
    columnValidation?: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
    dbId?: string; // Database ID for deletion
  }> = [];
  
  // Re-parsing state
  let isReparsing = false;
  let showTemplateFilter = false;
  
  // Filtered files list
  let filteredFiles: typeof uploadedFiles = [];
  
  // Reactive filtered files list - ensure it's always initialized
  $: {
    filteredFiles = getCompatibleFiles(selectedTemplate) || uploadedFiles || [];
    console.log('🔄 Filtered files updated:', {
      filteredCount: filteredFiles.length,
      uploadedCount: uploadedFiles.length,
      hasTemplate: !!selectedTemplate,
      filterEnabled: showTemplateFilter
    });
  }

  // Template state
  let templates: EnhancedTemplate[] = [];
  let enhancedTemplates: EnhancedTemplate[] = [];
  let templateMatcher: SmartTemplateMatcher | null = null;
  let selectedTemplate: EnhancedTemplate | null = null;
  let showTemplateSelector = false;
  let templateMatches: any[] = [];
  let showSmartMatching = false;

  // Extraction state
  let selectedFile: any = null;
  let extractedData: any[] = [];
  let successData: any[] = [];
  let failedData: any[] = [];
  let activeTab: 'success' | 'failed' = 'success';
  let isExtracting = false;
  let extractionProgress = 0;

  // UI state
  let isUploading = false;
  let uploadProgress = 0;
  let showUploadArea = true;

  // Drag scrolling state
  let dragState = {
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    container: null as HTMLElement | null,
    lastX: 0,
    velocity: 0
  };

  function handleMouseDown(e: MouseEvent, container: HTMLElement) {
    e.preventDefault();
    dragState.isDown = true;
    dragState.container = container;
    dragState.startX = e.pageX;
    dragState.scrollLeft = container.scrollLeft;
    dragState.lastX = e.pageX;
    dragState.velocity = 0;
    container.classList.add('active');
    container.style.cursor = 'grabbing';
    console.log('Mouse down on container, scrollLeft:', container.scrollLeft);
  }

  function handleMouseUp(container: HTMLElement) {
    dragState.isDown = false;
    dragState.container = null;
    container.classList.remove('active');
    container.style.cursor = 'grab';
  }

  function handleMouseLeave(container: HTMLElement) {
    dragState.isDown = false;
    dragState.container = null;
    container.classList.remove('active');
    container.style.cursor = 'grab';
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragState.isDown || !dragState.container) return;
    
    e.preventDefault();
    
    const currentX = e.pageX;
    const deltaX = currentX - dragState.startX;
    
    // Much more responsive scrolling - almost 1:1 ratio
    const scrollSensitivity = 0.9; // Much more responsive
    dragState.container.scrollLeft = dragState.scrollLeft - (deltaX * scrollSensitivity);
    
    console.log('Mouse move - deltaX:', deltaX, 'scrollLeft:', dragState.container.scrollLeft);
  }

  function handleTouchStart(e: TouchEvent, container: HTMLElement) {
    const touch = e.touches[0];
    dragState.isDown = true;
    dragState.container = container;
    dragState.startX = touch.pageX - container.getBoundingClientRect().left;
    dragState.scrollLeft = container.scrollLeft;
    dragState.lastX = touch.pageX;
    dragState.velocity = 0;
    container.classList.add('active');
    console.log('Touch start on container');
  }

  function handleTouchMove(e: TouchEvent) {
    if (!dragState.isDown || !dragState.container) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentX = touch.pageX;
    const deltaX = currentX - dragState.startX;
    
    // Much more responsive scrolling - almost 1:1 ratio
    const scrollSensitivity = 0.9;
    dragState.container.scrollLeft = dragState.scrollLeft - (deltaX * scrollSensitivity);
  }

  function handleTouchEnd(container: HTMLElement) {
    dragState.isDown = false;
    dragState.container = null;
    container.classList.remove('active');
  }

  // Travel field definitions for validation
  const travelFields = [
    { key: 'id', name: 'ID', required: true, type: 'id' },
    { key: 'lastName', name: 'Last Name', required: true, type: 'name' },
    { key: 'firstName', name: 'First Name', required: true, type: 'name' },
    { key: 'email', name: 'Email', required: true, type: 'email' },
    { key: 'phone', name: 'Phone', required: false, type: 'phone' },
    { key: 'dateOfBirth', name: 'Date of Birth', required: false, type: 'date' },
    { key: 'passportNumber', name: 'Passport Number', required: false, type: 'passport' },
    { key: 'nationality', name: 'Nationality', required: false, type: 'name' },
    { key: 'address', name: 'Address', required: false, type: 'address' },
    { key: 'city', name: 'City', required: false, type: 'name' },
    { key: 'country', name: 'Country', required: false, type: 'name' },
    { key: 'postalCode', name: 'Postal Code', required: false, type: 'postal' },
    { key: 'emergencyContact', name: 'Emergency Contact', required: false, type: 'name' },
    { key: 'emergencyPhone', name: 'Emergency Phone', required: false, type: 'phone' },
    { key: 'dietaryRequirements', name: 'Dietary Requirements', required: false, type: 'text' },
    { key: 'medicalConditions', name: 'Medical Conditions', required: false, type: 'text' },
    { key: 'travelInsurance', name: 'Travel Insurance', required: false, type: 'insurance' },
    { key: 'preferredLanguage', name: 'Preferred Language', required: false, type: 'language' },
    { key: 'specialRequests', name: 'Special Requests', required: false, type: 'text' },
    { key: 'travelExperience', name: 'Travel Experience', required: false, type: 'text' },
    { key: 'budget', name: 'Budget', required: false, type: 'number' },
    { key: 'travelDates', name: 'Travel Dates', required: false, type: 'dateRange' },
    { key: 'destination', name: 'Destination', required: false, type: 'name' },
    { key: 'accommodationType', name: 'Accommodation Type', required: false, type: 'text' },
    { key: 'transportation', name: 'Transportation', required: false, type: 'text' }
  ];

  // Expected column order for validation
  const expectedColumns = travelFields.map(field => field.key);

  // Function to map CSV headers to expected field keys
  function mapHeaderToFieldKey(header: string): string {
    if (selectedTemplate && selectedTemplate.field_mappings) {
      // Use template field mappings
      const templateMappings = selectedTemplate.field_mappings;
      
      for (const [fieldKey, fieldMapping] of Object.entries(templateMappings)) {
        // Check if the CSV header matches the mapped column name
        if (fieldMapping.headerName && fieldMapping.headerName === header) {
          return fieldKey;
        }
        // Also check if the CSV header matches the field key name (for backward compatibility)
        if (fieldKey === header) {
          return fieldKey;
        }
      }
    }
    
    // Fallback to default mapping
    const headerMap: { [key: string]: string } = {
      'ID': 'id',
      'Last Name': 'lastName',
      'First Name': 'firstName',
      'Email': 'email',
      'Phone': 'phone',
      'Date of Birth': 'dateOfBirth',
      'Passport Number': 'passportNumber',
      'Nationality': 'nationality',
      'Address': 'address',
      'City': 'city',
      'Country': 'country',
      'Postal Code': 'postalCode',
      'Emergency Contact': 'emergencyContact',
      'Emergency Phone': 'emergencyPhone',
      'Dietary Requirements': 'dietaryRequirements',
      'Medical Conditions': 'medicalConditions',
      'Travel Insurance': 'travelInsurance',
      'Preferred Language': 'preferredLanguage',
      'Special Requests': 'specialRequests',
      'Travel Experience': 'travelExperience',
      'Budget': 'budget',
      'Travel Dates': 'travelDates',
      'Destination': 'destination',
      'Accommodation Type': 'accommodationType',
      'Transportation': 'transportation'
    };
    
    return headerMap[header] || header.toLowerCase().replace(/\s+/g, '');
  }

  onMount(() => {
    // Load templates and CSV files from database
    loadTemplates();
    loadCsvFiles();
    
    // Initialize with some sample data for demonstration
    // loadSampleData();
    
    // Add global mouse move listener for drag scrolling
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e);
    };

    const handleGlobalMouseUp = () => {
      if (dragState.container) {
        handleMouseUp(dragState.container);
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      handleTouchMove(e);
    };

    const handleGlobalTouchEnd = () => {
      if (dragState.container) {
        handleTouchEnd(dragState.container);
      }
    };

    // Add event listeners with passive: false for better control
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);

    // Cleanup on component destroy
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  });

  async function loadTemplates() {
    try {
      console.log('🔄 Loading templates...');
      const response = await fetch('/api/templates');
      const data = await response.json();
      
      if (data.templates) {
        templates = data.templates;
        console.log('📦 Loaded templates:', templates.length);
        console.log('📋 Template names:', templates.map(t => t.template_name));
        
        // Enhance templates with smart matching capabilities
        enhancedTemplates = templates.map(template => SmartTemplateMatcher.enhanceTemplate(template));
        templateMatcher = new SmartTemplateMatcher(enhancedTemplates);
        
        // Set default template as selected
        selectedTemplate = enhancedTemplates.find(t => t.is_default) || enhancedTemplates[0];
        console.log('✅ Selected template:', selectedTemplate?.template_name);
        console.log('📋 Selected template mappings:', selectedTemplate?.field_mappings);
      } else {
        console.warn('⚠️ No templates found in response');
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error);
    }
  }

  async function loadCsvFiles() {
    try {
      console.log('Loading CSV files from database...');
      const response = await fetch('/api/csv-files');
      const data = await response.json();
      
      console.log('CSV files API response:', data);
      
      if (data.csvFiles) {
        console.log('Found CSV files:', data.csvFiles.length);
        uploadedFiles = data.csvFiles.map((file: any) => ({
          id: file.id,
          name: file.file_name,
          size: file.file_size,
          uploadDate: new Date(file.upload_date),
          data: file.file_data || [],
          columns: file.columns || [],
          rawText: file.raw_text || undefined, // Load raw text if available
          templateId: file.template_id || undefined, // Load template ID if available
          columnValidation: file.column_validation,
          dbId: file.id
        }));
        console.log('Mapped uploaded files:', uploadedFiles);
        console.log('Files with columns:', uploadedFiles.filter(f => f.columns && f.columns.length > 0).length);
        console.log('Files with rawText:', uploadedFiles.filter(f => f.rawText).length);
        console.log('📊 Uploaded files array length:', uploadedFiles.length);
        console.log('📊 Filtered files will be computed by reactive statement');
      } else {
        console.log('No CSV files found in response');
      }
    } catch (error) {
      console.error('Error loading CSV files:', error);
    }
  }

  async function saveCsvFile(fileObj: any) {
    try {
      console.log('Saving CSV file to database:', fileObj.name);
      const response = await fetch('/api/csv-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: fileObj.name,
          fileSize: fileObj.size,
          fileData: fileObj.data,
          columns: fileObj.columns,
          rawText: fileObj.rawText, // Save raw CSV text for re-parsing
          templateId: fileObj.templateId, // Save template ID
          columnValidation: fileObj.columnValidation,
          extractionResults: {
            successData,
            failedData,
            extractedData
          }
        })
      });

      const data = await response.json();
      console.log('Save CSV file response:', data);
      
      if (data.csvFile) {
        // Update the file object with database ID
        fileObj.dbId = data.csvFile.id;
        // Update the uploadedFiles array to trigger reactivity
        uploadedFiles = uploadedFiles.map(file => 
          file.id === fileObj.id ? { ...file, dbId: data.csvFile.id } : file
        );
        console.log('CSV file saved with ID:', data.csvFile.id);
        return data.csvFile;
      } else {
        console.error('Failed to save CSV file:', data);
      }
    } catch (error) {
      console.error('Error saving CSV file:', error);
    }
    return null;
  }

  async function deleteCsvFile(fileId: string) {
    try {
      // If it's a database ID, delete from database
      if (uploadedFiles.find(f => f.dbId === fileId)) {
        const response = await fetch('/api/csv-files', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fileId })
        });

        const data = await response.json();
        
        if (data.success) {
          // Remove from local array
          uploadedFiles = uploadedFiles.filter(file => file.dbId !== fileId);
          if (selectedFile?.dbId === fileId) {
            selectedFile = null;
          }
          return true;
        }
      } else {
        // If it's a local file ID, just remove from local array
        uploadedFiles = uploadedFiles.filter(file => file.id !== fileId);
        if (selectedFile?.id === fileId) {
          selectedFile = null;
        }
        return true;
      }
    } catch (error) {
      console.error('Error deleting CSV file:', error);
    }
    return false;
  }

  function loadSampleData() {
    // Add a sample file for demonstration
    uploadedFiles = [
      {
        id: '1',
        name: 'sample_travel_data.csv',
        size: 24576,
        uploadDate: new Date(),
        data: [],
        columns: travelFields.map(field => field.key)
      }
    ];
  }

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        uploadFile(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  }

  async function uploadFile(file: File) {
    isUploading = true;
    uploadProgress = 0;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      uploadProgress += Math.random() * 20;
      if (uploadProgress >= 100) {
        uploadProgress = 100;
        clearInterval(progressInterval);
      }
    }, 100);

    try {
      // Parse CSV file
      const text = await file.text();
      const rawText = text; // Store raw CSV text for re-parsing
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Smart template matching
      if (templateMatcher && headers.length > 0) {
        const sampleData = lines.slice(1, 3).map(line => 
          line.split(',').map(v => v.trim().replace(/"/g, ''))
        );
        templateMatches = templateMatcher.analyzeCSVHeaders(headers, sampleData);
        
        // Auto-select best matching template if confidence is high
        if (templateMatches.length > 0 && templateMatches[0].confidence === 'high') {
          selectedTemplate = templateMatches[0].template;
          showSmartMatching = true;
        }
      }
      
      // Log which template is being used
      console.log('📄 File upload - Using template:', selectedTemplate?.template_name || 'None');
      console.log('📋 Selected template mappings:', selectedTemplate?.field_mappings);
      console.log('📊 CSV Headers from file:', headers);
      
      // Validate column order and structure
      const columnValidation = validateColumns(headers);
      console.log('Column validation:', columnValidation);
      
      // Parse CSV data using template mappings
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        // Check if template has custom column position mappings (Column X or numbers)
        // vs default header name mappings (actual header names like "ID", "Last Name")
        let hasCustomColumnMappings = false;
        if (selectedTemplate && selectedTemplate.field_mappings) {
          for (const [fieldKey, fieldMapping] of Object.entries(selectedTemplate.field_mappings)) {
            if (fieldMapping && fieldMapping.headerName && fieldMapping.headerName.trim()) {
              const headerName = fieldMapping.headerName.trim();
              // Check if it's a column position (Column X or number), not a header name
              if (headerName.match(/^Column\s+(\d+)$/i) || /^\d+$/.test(headerName)) {
                hasCustomColumnMappings = true;
                break;
              }
            }
          }
        }
        
        // If we have custom column position mappings, use column positions
        if (hasCustomColumnMappings && selectedTemplate && selectedTemplate.field_mappings) {
          // Build a reverse mapping: column position -> field key
          const columnToFieldMap = new Map<number, string>();
          
          // Only log mappings once per file (on first row)
          const shouldLogMappings = index === 0;
          
          for (const [fieldKey, fieldMapping] of Object.entries(selectedTemplate.field_mappings)) {
            try {
              // Skip if no headerName or if it's empty
              if (!fieldMapping || !fieldMapping.headerName || !fieldMapping.headerName.trim()) {
                continue;
              }
              
              const headerName = fieldMapping.headerName.trim();
              
              // Check if it's a "Column X" format (e.g., "Column 1", "Column 2")
              const columnMatch = headerName.match(/^Column\s+(\d+)$/i);
              if (columnMatch) {
                const columnNumber = parseInt(columnMatch[1]);
                const columnIndex = columnNumber - 1; // Convert to 0-indexed
                if (columnIndex >= 0 && columnIndex < values.length) {
                  columnToFieldMap.set(columnIndex, fieldKey);
                  if (shouldLogMappings) {
                    console.log(`📌 Mapping column ${columnNumber} (index ${columnIndex}) → ${fieldKey}`);
                  }
                }
              } 
              // Check if it's just a number (e.g., "1", "2")
              else if (/^\d+$/.test(headerName)) {
                const columnNumber = parseInt(headerName);
                const columnIndex = columnNumber - 1; // Convert to 0-indexed
                if (columnIndex >= 0 && columnIndex < values.length) {
                  columnToFieldMap.set(columnIndex, fieldKey);
                  if (shouldLogMappings) {
                    console.log(`📌 Mapping column ${columnNumber} (index ${columnIndex}) → ${fieldKey}`);
                  }
                }
              }
            } catch (error) {
              console.warn(`⚠️ Error processing field mapping for ${fieldKey}:`, error);
              // Continue with other fields
            }
          }
          
          // Map values using column positions from template
          columnToFieldMap.forEach((fieldKey, columnIndex) => {
            row[fieldKey] = values[columnIndex] || '';
          });
          
          // Also map any remaining headers using default logic
          headers.forEach((header, colIndex) => {
            if (!columnToFieldMap.has(colIndex)) {
              const mappedKey = mapHeaderToFieldKey(header);
              if (mappedKey && !row[mappedKey]) {
                row[mappedKey] = values[colIndex] || '';
              }
            }
          });
        } else {
          // No template or no custom mappings - use default header mapping
          headers.forEach((header, colIndex) => {
            const mappedKey = mapHeaderToFieldKey(header);
            row[mappedKey] = values[colIndex] || '';
          });
        }
        
        row._originalRowIndex = index + 2; // +2 because we skip header and 0-indexed
        return row;
      });

      console.log('CSV Headers:', headers);
      console.log('Expected field keys:', travelFields.map(f => f.key));
      console.log('Sample parsed row:', data[0]);

      // Create file object
      const fileObj = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        uploadDate: new Date(),
        data: data,
        columns: headers,
        rawText: rawText, // Store raw CSV for re-parsing
        templateId: selectedTemplate?.id, // Track which template was used
        columnValidation: columnValidation
      };

      uploadedFiles = [...uploadedFiles, fileObj];
      
      // Save to database
      await saveCsvFile(fileObj);

      // Don't hide upload area - allow multiple file uploads
      // showUploadArea = false;

      // Re-initialize drag scrolling for new tables
      setTimeout(() => {
        const tableContainers = document.querySelectorAll('.table-container');
        tableContainers.forEach(container => {
          if (!container.hasAttribute('data-drag-initialized')) {
            let isDown = false;
            let startX: number;
            let scrollLeft: number;

            const handleMouseDown = (e: Event) => {
              const mouseEvent = e as MouseEvent;
              isDown = true;
              container.classList.add('active');
              startX = mouseEvent.pageX - container.getBoundingClientRect().left;
              scrollLeft = container.scrollLeft;
            };

            const handleMouseLeave = () => {
              isDown = false;
              container.classList.remove('active');
            };

            const handleMouseUp = () => {
              isDown = false;
              container.classList.remove('active');
            };

            const handleMouseMove = (e: Event) => {
              if (!isDown) return;
              const mouseEvent = e as MouseEvent;
              mouseEvent.preventDefault();
              const x = mouseEvent.pageX - container.getBoundingClientRect().left;
              const walk = (x - startX) * 2;
              container.scrollLeft = scrollLeft - walk;
            };

            container.addEventListener('mousedown', handleMouseDown);
            container.addEventListener('mouseleave', handleMouseLeave);
            container.addEventListener('mouseup', handleMouseUp);
            container.addEventListener('mousemove', handleMouseMove);
            container.setAttribute('data-drag-initialized', 'true');
          }
        });
      }, 100);

      setTimeout(() => {
        isUploading = false;
        uploadProgress = 0;
      }, 1000);

    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file');
      isUploading = false;
      uploadProgress = 0;
    }
  }

  function selectFile(file: any) {
    selectedFile = file;
  }

  async function extractData() {
    if (!selectedFile) return;

    isExtracting = true;
    extractionProgress = 0;

    // Simulate extraction progress
    const progressInterval = setInterval(() => {
      extractionProgress += Math.random() * 15;
      if (extractionProgress >= 100) {
        extractionProgress = 100;
        clearInterval(progressInterval);
      }
    }, 150);

    try {
      // First, detect duplicates based on ID, email, passport number, and phone
      const duplicateFields = ['id', 'email', 'passportNumber', 'phone'];
      console.log('Checking for duplicates with fields:', duplicateFields);
      console.log('Sample data:', selectedFile.data.slice(0, 2));
      const { duplicates, uniqueData } = detectDuplicates(selectedFile.data, duplicateFields);
      console.log('Duplicates found:', duplicates.length);
      console.log('Unique data:', uniqueData.length);
      console.log('Sample duplicate:', duplicates[0]);
      console.log('Sample unique:', uniqueData[0]);
      
      // Debug: Log all duplicates to see what's being detected
      if (duplicates.length > 0) {
        console.log('All duplicates detected:');
        duplicates.forEach((dup, index) => {
          console.log(`Duplicate ${index + 1}:`, {
            row: dup._duplicateIndex + 1,
            reason: dup._duplicateReason,
            email: dup.email,
            id: dup.id,
            passport: dup.passportNumber,
            phone: dup.phone
          });
        });
      }
      
      // Debug: Check for email duplicates specifically
      console.log('Email duplicate check:');
      const emailMap = new Map();
      selectedFile.data.forEach((row: any, index: number) => {
        if (row.email) {
          const normalizedEmail = row.email.toString().trim().toLowerCase();
          if (emailMap.has(normalizedEmail)) {
            console.log(`Email duplicate found: "${row.email}" (row ${index + 1}) matches "${emailMap.get(normalizedEmail).email}" (row ${emailMap.get(normalizedEmail).row + 1})`);
          } else {
            emailMap.set(normalizedEmail, { email: row.email, row: index });
          }
        }
      });
      
      // Process and validate data
      const processedData = uniqueData.map((row: any, index: number) => {
        const validatedRow = { ...row, _rowIndex: index + 1 };
        const errors: string[] = [];

        // Add column validation errors if any (but don't fail individual records for column structure issues)
        if (selectedFile.columnValidation && !selectedFile.columnValidation.isValid) {
          // Only add warnings, not errors, for column structure issues
          console.log('Column validation warnings:', selectedFile.columnValidation.warnings);
          // Don't add column errors to individual row validation
        }

        // Validate each field
        travelFields.forEach(field => {
          const value = row[field.key];
          
          if (field.required && (!value || value.trim() === '')) {
            errors.push(`${field.name} is required`);
          }

          if (value && field.type === 'email' && !isValidEmail(value)) {
            errors.push(`${field.name} must be a valid email`);
          }

          if (value && field.type === 'date' && !isValidDate(value)) {
            errors.push(`${field.name} must be a valid date`);
          }

          if (value && field.type === 'number' && isNaN(Number(value))) {
            errors.push(`${field.name} must be a valid number`);
          }

          if (value && field.type === 'id' && !isValidId(value)) {
            errors.push(`${field.name} must be numeric only (no letters)`);
          }

          if (value && field.type === 'phone' && !isValidPhone(value)) {
            errors.push(`${field.name} must be a valid phone number`);
          }

          if (value && field.type === 'passport' && !isValidPassportNumber(value)) {
            errors.push(`${field.name} must be 6-12 alphanumeric characters`);
          }

          if (value && field.type === 'postal' && !isValidPostalCode(value)) {
            errors.push(`${field.name} must be numeric only`);
          }

          if (value && field.type === 'insurance' && !isValidTravelInsurance(value)) {
            errors.push(`${field.name} must be 'yes' or 'no'`);
          }

          // New stricter validations
          if (value && field.type === 'name' && !isValidName(value)) {
            errors.push(`${field.name} must contain only letters, spaces, hyphens, and apostrophes (no emojis, numbers, or special characters)`);
          }

          if (value && field.type === 'language' && !isValidLanguage(value)) {
            errors.push(`${field.name} must contain only letters, spaces, hyphens, and apostrophes (no emojis, numbers, or special characters)`);
          }

          if (value && field.type === 'text' && !isValidText(value, false)) {
            errors.push(`${field.name} must contain only letters, spaces, and basic punctuation (no emojis or special characters)`);
          }

          if (value && field.type === 'address' && !isValidAddress(value)) {
            errors.push(`${field.name} must contain only letters, numbers, spaces, and basic address characters (no emojis or special characters)`);
          }

          if (value && field.type === 'dateRange' && !isValidDateRange(value)) {
            errors.push(`${field.name} must contain only letters, numbers, spaces, and date separators (no emojis or special characters)`);
          }
        });

        validatedRow._errors = errors;
        validatedRow._isValid = errors.length === 0;
        
        // Log first few validation results for debugging
        if (index < 3) {
          console.log(`Row ${index + 1} validation:`, {
            id: row.id,
            email: row.email,
            errors: errors,
            isValid: errors.length === 0
          });
          console.log(`Row ${index + 1} detailed errors:`, errors);
        }
        
        return validatedRow;
      });

      // Debug: Check processedData before filtering
      console.log('ProcessedData before filtering:');
      console.log('Total processed:', processedData.length);
      console.log('Valid records:', processedData.filter(r => r._isValid).length);
      console.log('Invalid records:', processedData.filter(r => !r._isValid).length);
      console.log('Sample processed record:', processedData[0]);

      // Add duplicates to failed data
      const duplicateData = duplicates.map(dup => ({
        ...dup,
        _rowIndex: dup._duplicateIndex + 1,
        _errors: [`Duplicate entry - ${dup._duplicateReason}`],
        _isValid: false,
        _isDuplicate: true
      }));

      extractedData = [...processedData, ...duplicateData];
      successData = processedData.filter(row => row._isValid);
      failedData = [...processedData.filter(row => !row._isValid), ...duplicateData];

      console.log('Final results:');
      console.log('Processed data length:', processedData.length);
      console.log('Success data length:', successData.length);
      console.log('Failed data length:', failedData.length);
      console.log('Duplicate data length:', duplicateData.length);
      console.log('Sample success:', successData[0]);
      console.log('Sample failed:', failedData[0]);
      
      // Debug: Check if processedData has validation issues
      console.log('Processed data validation check:');
      processedData.slice(0, 3).forEach((row, index) => {
        console.log(`Processed row ${index + 1}:`, {
          id: row.id,
          isValid: row._isValid,
          errors: row._errors,
          hasErrors: row._errors && row._errors.length > 0
        });
      });

      // FIX: Ensure we're not accidentally corrupting the data
      // Reset the arrays to make sure they're clean
      successData = [];
      failedData = [];
      
      // Re-process the data to ensure clean state
      processedData.forEach(row => {
        if (row._isValid) {
          successData.push(row);
        } else {
          failedData.push(row);
        }
      });
      
      // Add duplicates to failed data
      duplicateData.forEach(dup => {
        failedData.push(dup);
      });
      
      console.log('After fix - Success:', successData.length, 'Failed:', failedData.length);

      setTimeout(() => {
        isExtracting = false;
        extractionProgress = 0;
      }, 1500);

    } catch (error) {
      console.error('Error extracting data:', error);
      alert('Error extracting data');
      isExtracting = false;
      extractionProgress = 0;
    }
  }

  /**
   * Re-parse a file with a different template
   */
  function reparseFileWithTemplate(file: any, template: EnhancedTemplate): any {
    if (!file.rawText) {
      console.warn('⚠️ Cannot re-parse file: raw CSV text not available');
      return file;
    }

    try {
      const lines = file.rawText.split('\n').filter((line: string) => line.trim() !== '');
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
      
      // Parse CSV data using template mappings (same logic as upload)
      const data = lines.slice(1).map((line: string, index: number) => {
        const values = line.split(',').map((v: string) => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        // Check if template has custom column position mappings (Column X or numbers)
        // vs default header name mappings (actual header names like "ID", "Last Name")
        let hasCustomColumnMappings = false;
        if (template && template.field_mappings) {
          for (const [fieldKey, fieldMapping] of Object.entries(template.field_mappings)) {
            if (fieldMapping && fieldMapping.headerName && fieldMapping.headerName.trim()) {
              const headerName = fieldMapping.headerName.trim();
              // Check if it's a column position (Column X or number), not a header name
              if (headerName.match(/^Column\s+(\d+)$/i) || /^\d+$/.test(headerName)) {
                hasCustomColumnMappings = true;
                break;
              }
            }
          }
        }
        
        // If we have custom column position mappings, use column positions
        if (hasCustomColumnMappings && template && template.field_mappings) {
          const columnToFieldMap = new Map<number, string>();
          
          for (const [fieldKey, fieldMapping] of Object.entries(template.field_mappings)) {
            try {
              if (!fieldMapping || !fieldMapping.headerName || !fieldMapping.headerName.trim()) {
                continue;
              }
              
              const headerName = fieldMapping.headerName.trim();
              
              // Check if it's a "Column X" format
              const columnMatch = headerName.match(/^Column\s+(\d+)$/i);
              if (columnMatch) {
                const columnNumber = parseInt(columnMatch[1]);
                const columnIndex = columnNumber - 1;
                if (columnIndex >= 0 && columnIndex < values.length) {
                  columnToFieldMap.set(columnIndex, fieldKey);
                }
              } 
              // Check if it's just a number
              else if (/^\d+$/.test(headerName)) {
                const columnNumber = parseInt(headerName);
                const columnIndex = columnNumber - 1;
                if (columnIndex >= 0 && columnIndex < values.length) {
                  columnToFieldMap.set(columnIndex, fieldKey);
                }
              }
            } catch (error) {
              console.warn(`⚠️ Error processing field mapping for ${fieldKey}:`, error);
            }
          }
          
          // Map values using column positions from template
          columnToFieldMap.forEach((fieldKey, columnIndex) => {
            row[fieldKey] = values[columnIndex] || '';
          });
          
          // Also map any remaining headers using default logic
          headers.forEach((header: string, colIndex: number) => {
            if (!columnToFieldMap.has(colIndex)) {
              const mappedKey = mapHeaderToFieldKey(header);
              if (mappedKey && !row[mappedKey]) {
                row[mappedKey] = values[colIndex] || '';
              }
            }
          });
        } else {
          // No template or no custom mappings - use default header mapping
          headers.forEach((header: string, colIndex: number) => {
            const mappedKey = mapHeaderToFieldKey(header);
            row[mappedKey] = values[colIndex] || '';
          });
        }
        
        row._originalRowIndex = index + 2;
        return row;
      });

      // Validate columns with new template
      const columnValidation = validateColumns(headers);
      
      // Update file object
      return {
        ...file,
        data: data,
        columns: headers,
        templateId: template.id,
        columnValidation: columnValidation
      };
    } catch (error) {
      console.error('Error re-parsing file:', error);
      return file;
    }
  }

  /**
   * Re-parse all uploaded files with the current template
   */
  async function reparseAllFilesWithTemplate(template: EnhancedTemplate) {
    if (!template) return;
    
    isReparsing = true;
    console.log('🔄 Re-parsing all files with template:', template.template_name);
    
    try {
      let filesReparsed = 0;
      let filesSkipped = 0;
      
      uploadedFiles = uploadedFiles.map(file => {
        if (file.rawText) {
          filesReparsed++;
          return reparseFileWithTemplate(file, template);
        } else {
          filesSkipped++;
          console.warn(`⚠️ File "${file.name}" cannot be re-parsed: raw CSV text not available. Please re-upload this file to use a different template.`);
          return file;
        }
      });
      
      // Show user-friendly message if some files couldn't be re-parsed
      if (filesSkipped > 0) {
        alert(`${filesSkipped} file(s) could not be re-parsed because they don't have raw CSV data stored.\n\nPlease re-upload these files to use them with different templates.\n\nFiles re-parsed: ${filesReparsed}\nFiles skipped: ${filesSkipped}`);
      } else if (filesReparsed > 0) {
        console.log(`✅ Re-parsed ${filesReparsed} file(s) with template: ${template.template_name}`);
      }
      
      // Clear extraction results since data has changed
      if (selectedFile) {
        // Find the updated file
        const updatedFile = uploadedFiles.find(f => f.id === selectedFile.id);
        if (updatedFile) {
          selectedFile = updatedFile;
        }
      }
      
      successData = [];
      failedData = [];
      extractedData = [];
      
      console.log('✅ Re-parsing complete');
    } catch (error) {
      console.error('❌ Error re-parsing files:', error);
      alert('Error re-parsing files with new template');
    } finally {
      isReparsing = false;
    }
  }

  /**
   * Get files compatible with the selected template
   */
  function getCompatibleFiles(template: EnhancedTemplate | null): typeof uploadedFiles {
    // Always return uploadedFiles if it's empty or undefined
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return uploadedFiles || [];
    }
    
    // If filter is off, show all files
    if (!showTemplateFilter) {
      return uploadedFiles;
    }
    
    // If no template or templateMatcher not ready, show all files
    if (!template || !templateMatcher) {
      return uploadedFiles;
    }
    
    // Filter files by compatibility
    const filtered = uploadedFiles.filter(file => {
      // If file doesn't have columns, include it (can't check compatibility)
      if (!file.columns || file.columns.length === 0) {
        return true; // Show files without columns
      }
      
      try {
        if (templateMatcher) {
          const matches = templateMatcher.analyzeCSVHeaders(file.columns);
          if (matches.length > 0) {
            const bestMatch = matches.find(m => m.template.id === template.id);
            return bestMatch && bestMatch.score > 0.5; // 50% compatibility threshold
          }
        }
      } catch (error) {
        console.warn('Error checking file compatibility:', error);
        // On error, include the file to be safe
        return true;
      }
      
      // If no matches found, exclude from filtered view
      return false;
    });
    
    console.log('🔍 Filtered files:', { 
      total: uploadedFiles.length, 
      filtered: filtered.length, 
      filterEnabled: showTemplateFilter,
      hasTemplate: !!template,
      hasMatcher: !!templateMatcher
    });
    
    return filtered;
  }

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidDate(dateString: string): boolean {
    if (!dateString || dateString.trim() === '') return false;
    
    // Handle DD/MM/YYYY format (common in many countries)
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        // Check if it's a valid date
        const date = new Date(year, month - 1, day);
        return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
      }
    }
    
    // Handle YYYY-MM-DD format
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  function isValidId(id: string): boolean {
    if (!id || id.trim() === '') return false;
    
    // ID must be numeric only (no letters) - allow leading zeros
    return /^\d+$/.test(id.trim());
  }

  function isValidPhone(phone: string): boolean {
    if (!phone || phone.trim() === '') return true; // Phone is optional
    
    let cleanPhone = phone.trim();
    
    // Handle Excel-corrupted phone numbers (negative numbers)
    // Convert negative numbers to positive and add country code
    if (cleanPhone.startsWith('-') && !cleanPhone.includes('+')) {
      // Remove the negative sign and treat as a valid phone number
      cleanPhone = '+' + cleanPhone.substring(1);
    }
    
    // Basic phone validation - allows various formats
    // Must have at least 7 digits and can include +, spaces, hyphens, parentheses
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
    return phoneRegex.test(cleanPhone);
  }

  function isValidPassportNumber(passport: string): boolean {
    // Passport number validation - alphanumeric, 6-12 characters, case insensitive
    return /^[A-Z0-9]{6,12}$/i.test(passport.trim());
  }

  function isValidPostalCode(postalCode: string): boolean {
    // Postal code must be numeric only
    return /^\d+$/.test(postalCode.trim());
  }

  function isValidTravelInsurance(insurance: string): boolean {
    // Travel insurance must be yes or no (case insensitive)
    const normalized = insurance.trim().toLowerCase();
    return normalized === 'yes' || normalized === 'no';
  }

  // New validation functions for stricter validation
  function containsEmojis(text: string): boolean {
    // Check for emoji characters (Unicode ranges for emojis)
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(text);
  }

  function isValidLanguage(language: string): boolean {
    if (!language || language.trim() === '') return true; // Language is optional
    
    const cleanLanguage = language.trim();
    
    // Check for emojis
    if (containsEmojis(cleanLanguage)) return false;
    
    // Check for numbers
    if (/\d/.test(cleanLanguage)) return false;
    
    // Check for special characters (allow spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(cleanLanguage)) return false;
    
    // Must be at least 2 characters
    return cleanLanguage.length >= 2;
  }

  function isValidText(text: string, allowNumbers: boolean = false): boolean {
    if (!text || text.trim() === '') return true; // Text fields are optional
    
    const cleanText = text.trim();
    
    // Check for emojis
    if (containsEmojis(cleanText)) return false;
    
    // Check for special characters (allow basic punctuation)
    const allowedChars = allowNumbers ? /^[a-zA-Z0-9\s\-'.,!?]+$/ : /^[a-zA-Z\s\-'.,!?]+$/;
    if (!allowedChars.test(cleanText)) return false;
    
    // Must be at least 1 character
    return cleanText.length >= 1;
  }

  function isValidName(name: string): boolean {
    if (!name || name.trim() === '') return true; // Names are optional
    
    const cleanName = name.trim();
    
    // Check for emojis
    if (containsEmojis(cleanName)) return false;
    
    // Check for numbers and special characters (allow spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(cleanName)) return false;
    
    // Must be at least 1 character
    return cleanName.length >= 1;
  }

  function isValidAddress(address: string): boolean {
    if (!address || address.trim() === '') return true; // Address is optional
    
    const cleanAddress = address.trim();
    
    // Check for emojis
    if (containsEmojis(cleanAddress)) return false;
    
    // Allow letters, numbers, spaces, hyphens, apostrophes, periods, commas, and common address characters
    if (!/^[a-zA-Z0-9\s\-'.,#/]+$/.test(cleanAddress)) return false;
    
    // Must be at least 1 character
    return cleanAddress.length >= 1;
  }

  function isValidDateRange(dateRange: string): boolean {
    if (!dateRange || dateRange.trim() === '') return true; // Date range is optional
    
    const cleanDateRange = dateRange.trim();
    
    // Check for emojis
    if (containsEmojis(cleanDateRange)) return false;
    
    // Allow letters, numbers, spaces, hyphens, forward slashes, and common date separators
    if (!/^[a-zA-Z0-9\s\-\/.,:]+$/.test(cleanDateRange)) return false;
    
    // Must be at least 1 character
    return cleanDateRange.length >= 1;
  }

  function validateColumns(headers: string[]): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Map CSV headers to expected field keys for validation
    const mappedHeaders = headers.map(header => mapHeaderToFieldKey(header));
    
    // Check for missing required columns
    const requiredColumns = travelFields.filter(field => field.required).map(field => field.key);
    const missingColumns = requiredColumns.filter(col => !mappedHeaders.includes(col));
    
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    // Check for unexpected columns
    const unexpectedColumns = mappedHeaders.filter(header => !expectedColumns.includes(header));
    if (unexpectedColumns.length > 0) {
      warnings.push(`Unexpected columns found: ${unexpectedColumns.join(', ')}`);
    }
    
    // Check column order (warn if different)
    const isOrderCorrect = JSON.stringify(mappedHeaders) === JSON.stringify(expectedColumns);
    if (!isOrderCorrect) {
      warnings.push('Column order differs from expected format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  function detectDuplicates(data: any[], keyFields: string[]): { duplicates: any[]; uniqueData: any[] } {
    const seen = new Map<string, number[]>();
    const duplicates: any[] = [];
    const uniqueData: any[] = [];
    
    data.forEach((row, index) => {
      let isDuplicate = false;
      let duplicateReason = '';
      
      // Check each field individually for uniqueness, but be more selective
      for (const field of keyFields) {
        const value = row[field];
        if (value && value.toString().trim() !== '') {
          let normalizedValue: string;
          
          // Special handling for email - normalize but preserve case for display
          if (field === 'email') {
            normalizedValue = value.toString().trim().toLowerCase();
          } else {
            normalizedValue = value.toString().toLowerCase().trim();
          }
          
          const fieldKey = `${field}:${normalizedValue}`;
          
          if (seen.has(fieldKey)) {
            // This is a duplicate based on this field
            const originalIndex = seen.get(fieldKey)![0];
            isDuplicate = true;
            duplicateReason = `${field} matches row ${originalIndex + 1}`;
            break;
          } else {
            // Mark this value as seen
            seen.set(fieldKey, [index]);
          }
        }
      }
      
      if (isDuplicate) {
        // This is a duplicate
        duplicates.push({
          ...row,
          _isDuplicate: true,
          _duplicateReason: duplicateReason,
          _duplicateIndex: index
        });
      } else {
        // This is unique
        const uniqueRow = {
          ...row,
          _isDuplicate: false,
          _originalIndex: index
        };
        uniqueData.push(uniqueRow);
      }
    });
    
    return { duplicates, uniqueData };
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function resetUpload() {
    showUploadArea = true;
    selectedFile = null;
    extractedData = [];
    successData = [];
    failedData = [];
    uploadedFiles = [];
  }
</script>

<svelte:head>
  <title>File Extraction - JIANKA Travel Agency</title>
</svelte:head>

<div class="file-extraction-container">
  <div class="header" transition:fade={{ duration: 600, delay: 200 }}>
    <h1>File Extraction</h1>
    <p>Upload CSV files and extract travel data with validation</p>
  </div>

  <!-- File Upload Section -->
  <div class="upload-section" transition:fly={{ y: 30, duration: 600, delay: 400, easing: quintOut }}>
    <div class="upload-card">
      <h2>Upload CSV File</h2>
      
      <!-- Template Selector -->
      {#if templates.length > 0}
        <div class="template-selector">
          <div class="template-selector-row">
            <label for="template-select">Select Template:</label>
            {#if isReparsing}
              <span class="reparsing-indicator">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                Re-parsing files...
              </span>
            {/if}
          </div>
          <select id="template-select" on:change={async (e) => {
            const target = e.target as HTMLSelectElement;
            if (!target) return;
            const selectedId = target.value;
            const template = enhancedTemplates.find(t => t.id === selectedId);
            if (template) {
              const previousTemplate = selectedTemplate;
              selectedTemplate = template;
              console.log('✅ Template selected:', template.template_name);
              console.log('📋 Template field mappings:', template.field_mappings);
              
              // Check if template has custom mappings
              const hasCustomMappings = Object.values(template.field_mappings || {}).some(
                (m: any) => m && m.headerName && m.headerName.trim()
              );
              if (hasCustomMappings) {
                console.log('📌 This template uses custom column mappings');
              } else {
                console.log('📌 This template uses default column mappings');
              }
              
              // Re-parse all files with new template if files are already uploaded
              if (uploadedFiles.length > 0 && previousTemplate && previousTemplate.id !== template.id) {
                console.log('🔄 Template changed - re-parsing all files...');
                await reparseAllFilesWithTemplate(template);
              } else if (uploadedFiles.length > 0 && !previousTemplate) {
                // First template selection with existing files
                await reparseAllFilesWithTemplate(template);
              }
            }
            showTemplateSelector = false;
          }}>
            {#each enhancedTemplates as template}
              <option value={template.id} selected={selectedTemplate?.id === template.id}>
                {template.template_name}
              </option>
            {/each}
          </select>
          <button class="template-info-btn" on:click={() => showTemplateSelector = !showTemplateSelector} aria-label="Show template information">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </button>
          {#if uploadedFiles.length > 0}
            <button 
              class="filter-toggle-btn" 
              class:active={showTemplateFilter}
              on:click={() => showTemplateFilter = !showTemplateFilter}
              title="Filter files by template compatibility"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {showTemplateFilter ? 'Show All' : 'Filter Compatible'}
            </button>
          {/if}
        </div>
        
        {#if showTemplateSelector}
          <div class="template-info">
            <h4>{selectedTemplate?.template_name}</h4>
            <p>{selectedTemplate?.description || 'No description available'}</p>
            <div class="template-mappings">
              <h5>Field Mappings:</h5>
              <div class="mapping-grid">
                {#each Object.entries(selectedTemplate?.field_mappings || {}) as [fieldKey, fieldMapping]}
                  <div class="mapping-item">
                    <span class="field-key">{fieldKey}</span>
                    <span class="field-type">{fieldMapping.type}</span>
                    <span class="arrow">→</span>
                    <span class="header-name">{fieldMapping.required ? '*' : ''}{fieldMapping.headerName || fieldKey}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Smart Template Matching Results -->
        {#if showSmartMatching && templateMatches.length > 0}
          <div class="smart-matching-section">
            <h4>Smart Template Matching</h4>
            <p>We found {templateMatches.length} template(s) that match your CSV structure:</p>
            <div class="template-matches">
              {#each templateMatches.slice(0, 3) as match}
                <div class="template-match" class:selected={selectedTemplate?.id === match.template.id}>
                  <div class="match-header">
                    <h5>{match.template.template_name}</h5>
                    <div class="match-score">
                      <span class="score-badge" class:high={match.confidence === 'high'} class:medium={match.confidence === 'medium'} class:low={match.confidence === 'low'}>
                        {Math.round(match.score * 100)}% match
                      </span>
                    </div>
                  </div>
                  <p class="match-description">{match.template.description}</p>
                  <div class="matched-fields">
                    <strong>Matched fields:</strong> {match.matchedFields.join(', ')}
                  </div>
                  <button class="use-template-btn" on:click={() => selectedTemplate = match.template}>
                    {selectedTemplate?.id === match.template.id ? 'Selected' : 'Use This Template'}
                  </button>
                </div>
              {/each}
            </div>
            <button class="dismiss-smart-btn" on:click={() => showSmartMatching = false}>
              Dismiss
            </button>
          </div>
        {/if}
      {/if}
      
      {#if showUploadArea}
        <div class="upload-area" class:uploading={isUploading}>
          <input
            bind:this={fileInput}
            type="file"
            accept=".csv"
            on:change={handleFileUpload}
            style="display: none;"
          />
          
          <div 
            class="upload-content" 
            role="button"
            tabindex="0"
            on:click={() => fileInput?.click()}
            on:keydown={(e) => e.key === 'Enter' && fileInput?.click()}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <h3>Click to upload CSV file</h3>
            <p>Supports files up to 10MB with 25 travel data columns</p>
          </div>

          {#if isUploading}
            <div class="upload-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: {uploadProgress}%"></div>
              </div>
              <p>Uploading... {Math.round(uploadProgress)}%</p>
            </div>
          {/if}
        </div>
      {/if}

      {#if uploadedFiles.length > 0}
        <div class="uploaded-files">
          <div class="uploaded-files-header">
            <h3>Uploaded Files ({showTemplateFilter ? filteredFiles.length : uploadedFiles.length} of {uploadedFiles.length})</h3>
            <button class="add-more-btn" on:click={() => fileInput?.click()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add More Files
            </button>
          </div>
          <div class="file-list">
            {#each filteredFiles as file (file.id)}
              <div 
                class="file-item" 
                class:selected={selectedFile?.id === file.id} 
                role="button"
                tabindex="0"
                on:click={() => selectFile(file)}
                on:keydown={(e) => e.key === 'Enter' && selectFile(file)}
              >
                <div class="file-info">
                  <div class="file-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </div>
                  <div class="file-details">
                    <h4>{file.name}</h4>
                    <p>{formatFileSize(file.size)} • {file.uploadDate.toLocaleDateString()}</p>
                    {#if file.templateId}
                      <p class="template-badge">
                        Template: {enhancedTemplates.find(t => t.id === file.templateId)?.template_name || 'Unknown'}
                      </p>
                    {/if}
                  </div>
                </div>
                <div class="file-actions">
                  <button class="extract-btn" on:click={() => selectFile(file)} disabled={isExtracting}>
                    {selectedFile?.id === file.id ? 'Selected' : 'Select'}
                  </button>
                  <button class="delete-btn" on:click={() => deleteCsvFile(file.dbId || file.id)} disabled={isExtracting} aria-label="Delete file">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Files Table -->
  {#if uploadedFiles.length > 0}
    <div class="files-table-section" transition:fly={{ y: 30, duration: 600, delay: 600, easing: quintOut }}>
      <div class="table-card">
        <h2>Uploaded Files</h2>
        <div 
          class="table-container" 
          title="Click and drag to scroll horizontally"
          role="button"
          tabindex="0"
          on:mousedown={(e) => handleMouseDown(e, e.currentTarget)}
          on:mouseleave={(e) => handleMouseLeave(e.currentTarget)}
          on:touchstart={(e) => handleTouchStart(e, e.currentTarget)}
        >
          <table class="files-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Upload Date</th>
                <th>Rows</th>
                <th>Columns</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredFiles as file (file.id)}
                <tr class:selected={selectedFile?.id === file.id} on:click={() => selectFile(file)}>
                  <td>
                    <div class="file-name">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                      {file.name}
                      {#if file.templateId}
                        <span class="template-badge-small">
                          ({enhancedTemplates.find(t => t.id === file.templateId)?.template_name || 'Unknown'})
                        </span>
                      {/if}
                    </div>
                  </td>
                  <td>{formatFileSize(file.size)}</td>
                  <td>{file.uploadDate.toLocaleDateString()}</td>
                  <td>{file.data.length}</td>
                  <td>{file.columns.length}</td>
                  <td>
                    {#if file.columnValidation}
                      {#if file.columnValidation.isValid}
                        <span class="status-badge ready">Ready</span>
                      {:else}
                        <span class="status-badge error">Column Error</span>
                      {/if}
                    {:else}
                      <span class="status-badge ready">Ready</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- Extract Button -->
  {#if selectedFile}
    <div class="extract-section" transition:fly={{ y: 30, duration: 600, delay: 800, easing: quintOut }}>
      <div class="extract-card">
        <div class="extract-info">
          <h3>Selected: {selectedFile.name}</h3>
          <p>{selectedFile.data.length} rows • {selectedFile.columns.length} columns</p>
        </div>
        <button class="extract-button" on:click={extractData} disabled={isExtracting}>
          {#if isExtracting}
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
            </svg>
            Extracting... {Math.round(extractionProgress)}%
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            Extract Data
          {/if}
        </button>
      </div>
    </div>
  {/if}

  <!-- Extraction Results -->
  {#if extractedData.length > 0}
    <div class="results-section" transition:fly={{ y: 30, duration: 600, delay: 1000, easing: quintOut }}>
      <div class="results-card">
        <div class="results-header">
          <h2>Extraction Results</h2>
          <div class="results-stats">
            <div class="stat">
              <span class="stat-number">{successData.length}</span>
              <span class="stat-label">Success</span>
            </div>
            <div class="stat">
              <span class="stat-number">{failedData.length}</span>
              <span class="stat-label">Failed</span>
            </div>
            <div class="stat">
              <span class="stat-number">{extractedData.length}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab" class:active={activeTab === 'success'} on:click={() => activeTab = 'success'}>
            Success ({successData.length})
          </button>
          <button class="tab" class:active={activeTab === 'failed'} on:click={() => activeTab = 'failed'}>
            Failed ({failedData.length})
          </button>
        </div>

        <div 
          class="table-container" 
          title="Click and drag to scroll horizontally"
          role="button"
          tabindex="0"
          on:mousedown={(e) => handleMouseDown(e, e.currentTarget)}
          on:mouseleave={(e) => handleMouseLeave(e.currentTarget)}
          on:touchstart={(e) => handleTouchStart(e, e.currentTarget)}
        >
          <table class="results-table">
            <thead>
              <tr>
                <th>Row</th>
                {#each travelFields as field}
                  <th>{field.name}</th>
                {/each}
                {#if activeTab === 'failed'}
                  <th>Errors</th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each (activeTab === 'success' ? successData : failedData) as row (row._rowIndex)}
                <tr class:duplicate={row._isDuplicate}>
                  <td>
                    {row._rowIndex}
                    {#if row._isDuplicate}
                      <span class="duplicate-badge">DUP</span>
                    {/if}
                  </td>
                  {#each travelFields as field}
                    <td>{row[field.key] || '-'}</td>
                  {/each}
                  {#if activeTab === 'failed'}
                    <td>
                      <div class="errors">
                        {#each row._errors as error}
                          <span class="error">{error}</span>
                        {/each}
                      </div>
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- Reset Button -->
  {#if uploadedFiles.length > 0}
    <div class="reset-section" transition:fly={{ y: 30, duration: 600, delay: 1200, easing: quintOut }}>
      <button class="reset-button" on:click={resetUpload}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1,4 1,10 7,10"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
        Reset & Upload New File
      </button>
    </div>
  {/if}
</div>

<style>
  .file-extraction-container {
    min-height: 100vh;
    padding: 2rem;
    background: #000000;
    color: #ffffff;
    font-family: var(--font-satoshi);
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 300;
    letter-spacing: 0.1em;
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, #ffffff 0%, #9a9a9a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header p {
    font-size: 1.2rem;
    color: #9a9a9a;
    margin: 0;
  }

  .upload-section,
  .files-table-section,
  .extract-section,
  .results-section,
  .reset-section {
    margin-bottom: 2rem;
  }

  .upload-card,
  .table-card,
  .extract-card,
  .results-card {
    background: #1a1a1a;
    border-radius: 12px;
    padding: 2rem;
    border: 1px solid #333333;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .upload-card h2,
  .table-card h2,
  .results-card h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    color: #ffffff;
  }

  .upload-area {
    border: 2px dashed #333333;
    border-radius: 8px;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #0f0f0f;
  }

  .upload-area:hover {
    border-color: #cb9f4d;
    background: #1a1a1a;
  }

  .upload-area.uploading {
    border-color: #cb9f4d;
    background: #1a1a1a;
  }

  .upload-content {
    outline: none;
  }

  .upload-content:focus {
    outline: 2px solid #cb9f4d;
    outline-offset: 2px;
  }

  .upload-content svg {
    color: #9a9a9a;
    margin-bottom: 1rem;
  }

  .upload-content h3 {
    font-size: 1.2rem;
    margin: 0 0 0.5rem 0;
    color: #ffffff;
  }

  .upload-content p {
    color: #9a9a9a;
    margin: 0;
  }

  .upload-progress {
    margin-top: 1rem;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: #333333;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #cb9f4d 0%, #f4d03f 100%);
    transition: width 0.3s ease;
  }

  .uploaded-files {
    margin-top: 2rem;
  }

  .uploaded-files-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .uploaded-files h3 {
    font-size: 1.2rem;
    margin: 0;
    color: #ffffff;
  }

  .add-more-btn {
    background: #333333;
    color: #ffffff;
    border: 1px solid #555555;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .add-more-btn:hover {
    background: #555555;
    border-color: #777777;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: #0f0f0f;
    border-radius: 8px;
    border: 1px solid #333333;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .file-item:hover {
    border-color: #cb9f4d;
    background: #1a1a1a;
  }

  .file-item.selected {
    border-color: #cb9f4d;
    background: #1a1a1a;
  }

  .file-item:focus {
    outline: 2px solid #cb9f4d;
    outline-offset: 2px;
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .file-icon {
    color: #cb9f4d;
  }

  .file-details h4 {
    margin: 0 0 0.25rem 0;
    color: #ffffff;
    font-size: 1rem;
  }

  .file-details p {
    margin: 0;
    color: #9a9a9a;
    font-size: 0.9rem;
  }

  .extract-btn {
    background: #cb9f4d;
    color: #000000;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .extract-btn:hover {
    background: #f4d03f;
  }

  .extract-btn:disabled {
    background: #333333;
    color: #9a9a9a;
    cursor: not-allowed;
  }

  .table-container {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #333333;
    max-width: 100%;
    cursor: grab;
    user-select: none;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: #cb9f4d #333333;
  }

  .table-container:active {
    cursor: grabbing;
  }

  .table-container::-webkit-scrollbar {
    height: 8px;
  }

  .table-container::-webkit-scrollbar-track {
    background: #333333;
    border-radius: 4px;
  }

  .table-container::-webkit-scrollbar-thumb {
    background: #cb9f4d;
    border-radius: 4px;
  }

  .table-container::-webkit-scrollbar-thumb:hover {
    background: #f4d03f;
  }

  .files-table,
  .results-table {
    width: 100%;
    min-width: 1200px;
    border-collapse: collapse;
    background: #0f0f0f;
  }

  .files-table th,
  .results-table th {
    background: #1a1a1a;
    color: #ffffff;
    padding: 0.75rem 0.5rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid #333333;
    white-space: nowrap;
    font-size: 0.9rem;
  }

  .files-table td,
  .results-table td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #333333;
    color: #ffffff;
    white-space: nowrap;
    font-size: 0.9rem;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .results-table td:last-child {
    white-space: normal;
    max-width: 350px;
    overflow: visible;
    text-overflow: unset;
  }

  .files-table tr:hover,
  .results-table tr:hover {
    background: #1a1a1a;
  }

  .files-table tr.selected {
    background: #1a1a1a;
    border-left: 3px solid #cb9f4d;
  }

  .file-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .file-name svg {
    color: #cb9f4d;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .status-badge.ready {
    background: #1a4d1a;
    color: #4ade80;
  }

  .status-badge.error {
    background: #4a1a1a;
    color: #ff6b6b;
  }

  .extract-section {
    text-align: center;
  }

  .extract-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .extract-info h3 {
    margin: 0 0 0.5rem 0;
    color: #ffffff;
    font-size: 1.2rem;
  }

  .extract-info p {
    margin: 0;
    color: #9a9a9a;
  }

  .extract-button {
    background: linear-gradient(135deg, #cb9f4d 0%, #f4d03f 100%);
    color: #000000;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .extract-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(203, 159, 77, 0.3);
  }

  .extract-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .results-stats {
    display: flex;
    gap: 2rem;
  }

  .stat {
    text-align: center;
  }

  .stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: #cb9f4d;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #9a9a9a;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .tab {
    background: #0f0f0f;
    color: #9a9a9a;
    border: 1px solid #333333;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
  }

  .tab:hover {
    background: #1a1a1a;
    color: #ffffff;
  }

  .tab.active {
    background: #cb9f4d;
    color: #000000;
    border-color: #cb9f4d;
  }

  .errors {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-width: 300px;
    min-width: 200px;
  }

  .error {
    background: #4a1a1a;
    color: #ff6b6b;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    line-height: 1.3;
  }

  .duplicate-badge {
    background: #ff6b6b;
    color: #ffffff;
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
    margin-left: 0.5rem;
  }

  .duplicate {
    background: #2a1a1a !important;
    border-left: 3px solid #ff6b6b;
  }

  .reset-section {
    text-align: center;
  }

  .reset-button {
    background: #333333;
    color: #ffffff;
    border: 1px solid #555555;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .reset-button:hover {
    background: #555555;
    border-color: #777777;
  }

  @media (max-width: 768px) {
    .file-extraction-container {
      padding: 1rem;
    }

    .upload-card,
    .table-card,
    .extract-card,
    .results-card {
      padding: 1.5rem;
    }

    .extract-card {
      flex-direction: column;
      text-align: center;
    }

    .results-header {
      flex-direction: column;
      text-align: center;
    }

    .results-stats {
      justify-content: center;
    }

    .table-container {
      font-size: 0.8rem;
    }

    .files-table,
    .results-table {
      min-width: 1000px;
    }

    .files-table th,
    .results-table th,
    .files-table td,
    .results-table td {
      padding: 0.5rem 0.25rem;
      font-size: 0.8rem;
    }
  }

  /* Template Selector Styles */
  .template-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #0f0f0f;
    border-radius: 8px;
    border: 1px solid #333333;
  }

  .template-selector label {
    color: #ffffff;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .template-selector select {
    background: #1a1a1a;
    color: #ffffff;
    border: 1px solid #555555;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    min-width: 200px;
  }

  .template-selector select:focus {
    outline: 2px solid #cb9f4d;
    outline-offset: 2px;
  }

  .template-info-btn {
    background: #333333;
    color: #ffffff;
    border: 1px solid #555555;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .template-info-btn:hover {
    background: #555555;
    border-color: #777777;
  }

  .template-selector-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .reparsing-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #cb9f4d;
    font-size: 0.85rem;
    margin-left: auto;
  }

  .reparsing-indicator .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .filter-toggle-btn {
    background: #333333;
    color: #ffffff;
    border: 1px solid #555555;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    margin-left: auto;
  }

  .filter-toggle-btn:hover {
    background: #555555;
    border-color: #777777;
  }

  .filter-toggle-btn.active {
    background: #cb9f4d;
    color: #000000;
    border-color: #cb9f4d;
  }

  .template-badge {
    font-size: 0.75rem;
    color: #cb9f4d;
    margin-top: 0.25rem;
  }

  .template-badge-small {
    font-size: 0.7rem;
    color: #999999;
    margin-left: 0.5rem;
    font-style: italic;
  }

  .template-info {
    background: #0f0f0f;
    border: 1px solid #333333;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .template-info h4 {
    color: #cb9f4d;
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .template-info p {
    color: #9a9a9a;
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
  }

  .template-mappings h5 {
    color: #ffffff;
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
  }

  .mapping-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.5rem;
  }

  .mapping-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #1a1a1a;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .field-key {
    color: #cb9f4d;
    font-weight: 600;
    min-width: 80px;
  }

  .arrow {
    color: #9a9a9a;
  }

  .header-name {
    color: #ffffff;
    flex: 1;
  }

  /* File Actions Styles */
  .file-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .delete-btn {
    background: #4a1a1a;
    color: #ff6b6b;
    border: 1px solid #ff6b6b;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-btn:hover {
    background: #ff6b6b;
    color: #ffffff;
  }

  .delete-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Smart Template Matching Styles */
  .smart-matching-section {
    background: #0f0f0f;
    border: 1px solid #333333;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .smart-matching-section h4 {
    color: #cb9f4d;
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .smart-matching-section p {
    color: #9a9a9a;
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
  }

  .template-matches {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .template-match {
    background: #1a1a1a;
    border: 1px solid #333333;
    border-radius: 6px;
    padding: 1rem;
    transition: all 0.3s ease;
  }

  .template-match:hover {
    border-color: #cb9f4d;
  }

  .template-match.selected {
    border-color: #cb9f4d;
    background: #2a2a2a;
  }

  .match-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .match-header h5 {
    color: #ffffff;
    margin: 0;
    font-size: 1rem;
  }

  .score-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .score-badge.high {
    background: #1a4d1a;
    color: #4ade80;
  }

  .score-badge.medium {
    background: #4a3a1a;
    color: #fbbf24;
  }

  .score-badge.low {
    background: #4a1a1a;
    color: #ff6b6b;
  }

  .match-description {
    color: #9a9a9a;
    font-size: 0.9rem;
    margin: 0 0 0.75rem 0;
  }

  .matched-fields {
    color: #ffffff;
    font-size: 0.8rem;
    margin-bottom: 1rem;
  }

  .use-template-btn {
    background: #cb9f4d;
    color: #000000;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.8rem;
  }

  .use-template-btn:hover {
    background: #f4d03f;
  }

  .dismiss-smart-btn {
    background: #333333;
    color: #ffffff;
    border: 1px solid #555555;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.8rem;
  }

  .dismiss-smart-btn:hover {
    background: #555555;
  }
</style>