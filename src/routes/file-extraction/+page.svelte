<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // File upload state
  let fileInput: HTMLInputElement;
  let uploadedFiles: Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: Date;
    data: any[];
    columns: string[];
    columnValidation?: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
  }> = [];

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

  // Travel field definitions for validation
  const travelFields = [
    { key: 'id', name: 'ID', required: true, type: 'string' },
    { key: 'lastName', name: 'Last Name', required: true, type: 'string' },
    { key: 'firstName', name: 'First Name', required: true, type: 'string' },
    { key: 'email', name: 'Email', required: true, type: 'email' },
    { key: 'phone', name: 'Phone', required: false, type: 'string' },
    { key: 'dateOfBirth', name: 'Date of Birth', required: false, type: 'date' },
    { key: 'passportNumber', name: 'Passport Number', required: false, type: 'string' },
    { key: 'nationality', name: 'Nationality', required: false, type: 'string' },
    { key: 'address', name: 'Address', required: false, type: 'string' },
    { key: 'city', name: 'City', required: false, type: 'string' },
    { key: 'country', name: 'Country', required: false, type: 'string' },
    { key: 'postalCode', name: 'Postal Code', required: false, type: 'string' },
    { key: 'emergencyContact', name: 'Emergency Contact', required: false, type: 'string' },
    { key: 'emergencyPhone', name: 'Emergency Phone', required: false, type: 'string' },
    { key: 'dietaryRequirements', name: 'Dietary Requirements', required: false, type: 'string' },
    { key: 'medicalConditions', name: 'Medical Conditions', required: false, type: 'string' },
    { key: 'travelInsurance', name: 'Travel Insurance', required: false, type: 'string' },
    { key: 'preferredLanguage', name: 'Preferred Language', required: false, type: 'string' },
    { key: 'specialRequests', name: 'Special Requests', required: false, type: 'string' },
    { key: 'travelExperience', name: 'Travel Experience', required: false, type: 'string' },
    { key: 'budget', name: 'Budget', required: false, type: 'number' },
    { key: 'travelDates', name: 'Travel Dates', required: false, type: 'string' },
    { key: 'destination', name: 'Destination', required: false, type: 'string' },
    { key: 'accommodationType', name: 'Accommodation Type', required: false, type: 'string' },
    { key: 'transportation', name: 'Transportation', required: false, type: 'string' }
  ];

  // Expected column order for validation
  const expectedColumns = travelFields.map(field => field.key);

  onMount(() => {
    // Initialize with some sample data for demonstration
    loadSampleData();
  });

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
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Validate column order and structure
      const columnValidation = validateColumns(headers);
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, colIndex) => {
          row[header] = values[colIndex] || '';
        });
        row._originalRowIndex = index + 2; // +2 because we skip header and 0-indexed
        return row;
      });

      // Create file object
      const fileObj = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        uploadDate: new Date(),
        data: data,
        columns: headers,
        columnValidation: columnValidation
      };

      uploadedFiles = [...uploadedFiles, fileObj];
      // Don't hide upload area - allow multiple file uploads
      // showUploadArea = false;

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
      // First, detect duplicates based on ID, email, and passport number
      const duplicateFields = ['id', 'email', 'passportNumber'];
      console.log('Checking for duplicates with fields:', duplicateFields);
      console.log('Sample data:', selectedFile.data.slice(0, 2));
      const { duplicates, uniqueData } = detectDuplicates(selectedFile.data, duplicateFields);
      console.log('Duplicates found:', duplicates.length);
      console.log('Unique data:', uniqueData.length);
      
      // Process and validate data
      const processedData = uniqueData.map((row: any, index: number) => {
        const validatedRow = { ...row, _rowIndex: index + 1 };
        const errors: string[] = [];

        // Add column validation errors if any
        if (selectedFile.columnValidation && !selectedFile.columnValidation.isValid) {
          errors.push(...selectedFile.columnValidation.errors);
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
        });

        validatedRow._errors = errors;
        validatedRow._isValid = errors.length === 0;
        
        return validatedRow;
      });

      // Add duplicates to failed data
      const duplicateData = duplicates.map(dup => ({
        ...dup,
        _rowIndex: dup._duplicateIndex + 1,
        _errors: [`Duplicate entry - matches row ${dup._duplicateOf + 1}`],
        _isValid: false,
        _isDuplicate: true
      }));

      extractedData = [...processedData, ...duplicateData];
      successData = processedData.filter(row => row._isValid);
      failedData = [...processedData.filter(row => !row._isValid), ...duplicateData];

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

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  function validateColumns(headers: string[]): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for missing required columns
    const requiredColumns = travelFields.filter(field => field.required).map(field => field.key);
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    // Check for unexpected columns
    const unexpectedColumns = headers.filter(header => !expectedColumns.includes(header));
    if (unexpectedColumns.length > 0) {
      warnings.push(`Unexpected columns found: ${unexpectedColumns.join(', ')}`);
    }
    
    // Check column order (warn if different)
    const isOrderCorrect = JSON.stringify(headers) === JSON.stringify(expectedColumns);
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
      // Create a composite key from specified fields, filtering out empty values
      const compositeKey = keyFields
        .map(field => {
          const value = row[field];
          // Only include non-empty values in the composite key
          return value && value.toString().trim() !== '' ? value.toString().toLowerCase().trim() : '';
        })
        .filter(val => val !== '') // Remove empty values
        .join('|');
      
      // Skip rows where all key fields are empty
      if (compositeKey === '') {
        const uniqueRow = {
          ...row,
          _isDuplicate: false,
          _originalIndex: index
        };
        uniqueData.push(uniqueRow);
        return;
      }
      
      if (seen.has(compositeKey)) {
        // This is a duplicate
        const originalIndex = seen.get(compositeKey)![0];
        duplicates.push({
          ...row,
          _isDuplicate: true,
          _duplicateOf: originalIndex,
          _duplicateIndex: index
        });
        
        // Also mark the original as having duplicates
        const originalRow = uniqueData.find(r => r._originalIndex === originalIndex);
        if (originalRow) {
          originalRow._hasDuplicates = true;
          originalRow._duplicateCount = (originalRow._duplicateCount || 0) + 1;
        }
      } else {
        // This is unique
        const uniqueRow = {
          ...row,
          _isDuplicate: false,
          _originalIndex: index
        };
        uniqueData.push(uniqueRow);
        seen.set(compositeKey, [index]);
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
            <h3>Uploaded Files ({uploadedFiles.length})</h3>
            <button class="add-more-btn" on:click={() => fileInput?.click()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add More Files
            </button>
          </div>
          <div class="file-list">
            {#each uploadedFiles as file (file.id)}
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
                  </div>
                </div>
                <div class="file-actions">
                  <button class="extract-btn" on:click={() => selectFile(file)} disabled={isExtracting}>
                    {selectedFile?.id === file.id ? 'Selected' : 'Select'}
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
        <div class="table-container">
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
              {#each uploadedFiles as file (file.id)}
                <tr class:selected={selectedFile?.id === file.id} on:click={() => selectFile(file)}>
                  <td>
                    <div class="file-name">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                      {file.name}
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

        <div class="table-container">
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
  }

  .error {
    background: #4a1a1a;
    color: #ff6b6b;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
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
</style>