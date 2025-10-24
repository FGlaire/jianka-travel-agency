<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { SmartTemplateMatcher, type EnhancedTemplate, type FieldMapping, RUNTIME_FIELDS, processRuntimeFields } from '$lib/smartTemplateMatcher';

  // Template state
  let templates: EnhancedTemplate[] = [];
  let enhancedTemplates: EnhancedTemplate[] = [];
  let templateMatcher: SmartTemplateMatcher | null = null;

  let showCreateForm = false;
  let newTemplate = {
    templateName: '',
    description: '',
    isPublic: false,
    fieldMappings: {} as Record<string, FieldMapping>,
    runtimeFields: [] as string[]
  };

  // Drag & Drop state
  let draggedColumn: string | null = null;
  let draggedOverInput: string | null = null;
  let csvColumns: string[] = [];
  let showColumnInput = false;
  let columnInput = '';
  let validationErrors: string[] = [];
  
  // Debug state
  let showDebugPanel = false;
  let debugInfo = {
    draggedColumn: null as string | null,
    draggedOverInput: null as string | null,
    csvColumns: [] as string[],
    fieldMappings: {} as Record<string, any>,
    validationErrors: [] as string[]
  };

  // Force reactivity for input fields
  let inputUpdateTrigger = 0;

  // Update debug info whenever state changes
  $: debugInfo = {
    draggedColumn,
    draggedOverInput,
    csvColumns,
    fieldMappings: newTemplate.fieldMappings,
    validationErrors
  };

  // Enhanced field mappings with types and validation
  const defaultFieldMappings: Record<string, FieldMapping> = {
    "id": { type: 'number', required: true, validation: [{ type: 'regex', value: /^\d+$/, message: 'ID must be numeric' }] },
    "lastName": { type: 'text', required: true, validation: [{ type: 'regex', value: /^[a-zA-Z\s\-']+$/, message: 'Last name must contain only letters' }] },
    "firstName": { type: 'text', required: true, validation: [{ type: 'regex', value: /^[a-zA-Z\s\-']+$/, message: 'First name must contain only letters' }] },
    "email": { type: 'email', required: true, validation: [{ type: 'regex', value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }] },
    "phone": { type: 'phone', required: false, validation: [{ type: 'regex', value: /^[\+]?[\d\s\-\(\)]{7,}$/, message: 'Invalid phone format' }] },
    "dateOfBirth": { type: 'date', required: false, format: 'yyyy-MM-dd', validation: [{ type: 'format', value: 'date', message: 'Invalid date format' }] },
    "passportNumber": { type: 'passport', required: false, validation: [{ type: 'regex', value: /^[A-Z0-9]{6,12}$/i, message: 'Passport must be 6-12 alphanumeric characters' }] },
    "nationality": { type: 'text', required: false, validation: [{ type: 'regex', value: /^[a-zA-Z\s\-']+$/, message: 'Nationality must contain only letters' }] },
    "address": { type: 'address', required: false },
    "city": { type: 'text', required: false, validation: [{ type: 'regex', value: /^[a-zA-Z\s\-']+$/, message: 'City must contain only letters' }] },
    "country": { type: 'text', required: false, validation: [{ type: 'regex', value: /^[a-zA-Z\s\-']+$/, message: 'Country must contain only letters' }] },
    "postalCode": { type: 'postal', required: false, validation: [{ type: 'regex', value: /^\d+$/, message: 'Postal code must be numeric' }] },
    "emergencyContact": { type: 'text', required: false, validation: [{ type: 'regex', value: /^[a-zA-Z\s\-']+$/, message: 'Emergency contact must contain only letters' }] },
    "emergencyPhone": { type: 'phone', required: false, validation: [{ type: 'regex', value: /^[\+]?[\d\s\-\(\)]{7,}$/, message: 'Invalid phone format' }] },
    "dietaryRequirements": { type: 'text', required: false },
    "medicalConditions": { type: 'text', required: false },
    "travelInsurance": { type: 'boolean', required: false },
    "preferredLanguage": { type: 'text', required: false, validation: [{ type: 'regex', value: /^[a-zA-Z\s\-']+$/, message: 'Language must contain only letters' }] },
    "specialRequests": { type: 'text', required: false },
    "travelExperience": { type: 'text', required: false },
    "budget": { type: 'number', required: false, validation: [{ type: 'range', value: { min: 0 }, message: 'Budget must be positive' }] },
    "travelDates": { type: 'dateRange', required: false },
    "destination": { type: 'text', required: false, validation: [{ type: 'regex', value: /^[a-zA-Z\s\-']+$/, message: 'Destination must contain only letters' }] },
    "accommodationType": { type: 'text', required: false },
    "transportation": { type: 'text', required: false }
  };

  onMount(() => {
    loadTemplates();
  });

  async function loadTemplates() {
    try {
      console.log('🔄 Loading templates...');
      const response = await fetch('/api/templates');
      console.log('📡 Templates API response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Templates API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
        return;
      }
      
      const data = await response.json();
      console.log('📊 Templates data:', data);
      
      if (data.templates) {
        templates = data.templates;
        console.log('✅ Templates loaded:', templates.length);
        // Enhance templates with smart matching capabilities
        enhancedTemplates = data.templates.map((template: any) => SmartTemplateMatcher.enhanceTemplate(template));
        templateMatcher = new SmartTemplateMatcher(enhancedTemplates);
      } else {
        console.log('⚠️ No templates in response');
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error);
    }
  }

  async function createTemplate() {
    if (!newTemplate.templateName.trim()) {
      alert('Template name is required');
      return;
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateName: newTemplate.templateName,
          description: newTemplate.description,
          fieldMappings: newTemplate.fieldMappings,
          runtimeFields: newTemplate.runtimeFields,
          isPublic: newTemplate.isPublic
        })
      });

      const data = await response.json();
      
      if (data.template) {
        templates = [...templates, data.template];
        resetForm();
        showCreateForm = false;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    }
  }

  async function deleteTemplate(templateId: string) {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateId })
      });

      const data = await response.json();
      
      if (data.success) {
        templates = templates.filter(t => t.id !== templateId);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  }

  function resetForm() {
    newTemplate = {
      templateName: '',
      description: '',
      isPublic: false,
      fieldMappings: { ...defaultFieldMappings },
      runtimeFields: []
    };
    csvColumns = [];
    columnInput = '';
    validationErrors = [];
    draggedColumn = null;
    draggedOverInput = null;
    inputUpdateTrigger = 0;
  }

  function startCreateTemplate() {
    resetForm();
    showCreateForm = true;
    
    // Scroll to the form after a short delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.querySelector('.create-form-section');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      } else {
        // Fallback: scroll to bottom of page
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 200);
  }

  // Drag & Drop functions for CSV columns to input fields
  function handleColumnDragStart(event: DragEvent, column: string) {
    console.log('COLUMN DRAG START:', { column, event });
    draggedColumn = column;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', column);
      console.log('DataTransfer set:', column);
    }
  }

  function handleInputDragOver(event: DragEvent, fieldKey: string) {
    event.preventDefault();
    console.log('INPUT DRAG OVER:', { fieldKey, draggedColumn, event });
    draggedOverInput = fieldKey;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
      console.log('DropEffect set to copy');
    }
  }

  function handleInputDragLeave(event: DragEvent) {
    console.log('INPUT DRAG LEAVE:', { draggedOverInput, event });
    draggedOverInput = null;
  }

  function handleInputDrop(event: DragEvent, fieldKey: string) {
    event.preventDefault();
    console.log('INPUT DROP EVENT:', { 
      fieldKey, 
      draggedColumn, 
      draggedOverInput, 
      event,
      dataTransfer: event.dataTransfer?.getData('text/plain')
    });
    
    if (draggedColumn) {
      console.log('Setting column to input:', { draggedColumn, fieldKey });
      
      // Initialize mapping if it doesn't exist
      if (!newTemplate.fieldMappings[fieldKey]) {
        newTemplate.fieldMappings[fieldKey] = { ...defaultFieldMappings[fieldKey] };
      }
      
      // Set the headerName to the dragged column
      newTemplate.fieldMappings[fieldKey].headerName = draggedColumn;
      
      // Force reactivity by creating a completely new object
      newTemplate.fieldMappings = { ...newTemplate.fieldMappings };
      
      // Trigger input field updates by incrementing the trigger
      inputUpdateTrigger++;
      console.log('Input update trigger:', inputUpdateTrigger);
      
      console.log('Field mapping updated:', { fieldKey, headerName: draggedColumn });
    } else {
      console.log('No column dragged');
    }
    
    draggedColumn = null;
    draggedOverInput = null;
    console.log('Reset drag state');
    validateMappings();
  }

  function handleColumnDragEnd() {
    console.log('COLUMN DRAG END:', { draggedColumn, draggedOverInput });
    draggedColumn = null;
    draggedOverInput = null;
  }

  // Column input functions
  function addCsvColumns() {
    if (!columnInput.trim()) return;
    
    const columns = columnInput.split(',').map(col => col.trim()).filter(col => col);
    csvColumns = [...csvColumns, ...columns];
    columnInput = '';
    validateMappings();
  }

  function removeCsvColumn(index: number) {
    csvColumns = csvColumns.filter((_, i) => i !== index);
    validateMappings();
  }

  function generateNumberedColumns() {
    csvColumns = Array.from({ length: 25 }, (_, i) => `Column ${i + 1}`);
    validateMappings();
  }

  // Validation functions
  function validateMappings() {
    console.log('VALIDATING MAPPINGS:', newTemplate.fieldMappings);
    validationErrors = [];
    const usedHeaders = new Set<string>();
    const usedNumbers = new Set<number>();
    
    Object.entries(newTemplate.fieldMappings).forEach(([fieldKey, mapping]) => {
      if (!mapping.headerName) return;
      
      const headerName = mapping.headerName.trim();
      
      // Check for empty values
      if (!headerName) {
        validationErrors.push(`Field "${fieldKey}" cannot be empty`);
        return;
      }
      
      // Check for duplicates
      if (usedHeaders.has(headerName)) {
        validationErrors.push(`Duplicate mapping: "${headerName}" is used multiple times`);
      } else {
        usedHeaders.add(headerName);
      }
      
      // Check if it's a number (1-25)
      const numberMatch = headerName.match(/^(\d+)$/);
      if (numberMatch) {
        const num = parseInt(numberMatch[1]);
        if (num < 1 || num > 25) {
          validationErrors.push(`Column number ${num} is out of range (must be 1-25)`);
        } else if (usedNumbers.has(num)) {
          validationErrors.push(`Duplicate column number: ${num} is used multiple times`);
        } else {
          usedNumbers.add(num);
        }
      }
      
      // Check if it matches a CSV column
      if (csvColumns.length > 0 && !csvColumns.includes(headerName) && !numberMatch) {
        validationErrors.push(`"${headerName}" is not in the CSV columns list. Available columns: ${csvColumns.join(', ')}`);
      }
      
      // Check for invalid characters in column names
      if (!numberMatch && !/^[a-zA-Z0-9\s\-_]+$/.test(headerName)) {
        validationErrors.push(`"${headerName}" contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed`);
      }
    });
    
    console.log('VALIDATION COMPLETE:', { 
      errors: validationErrors.length, 
      errorsList: validationErrors,
      usedHeaders: Array.from(usedHeaders),
      usedNumbers: Array.from(usedNumbers)
    });
  }

  function getFieldDisplayValue(fieldKey: string): string {
    // Force reactivity by referencing the trigger
    inputUpdateTrigger;
    const mapping = newTemplate.fieldMappings[fieldKey];
    if (!mapping || !mapping.headerName) {
      return fieldKey;
    }
    return mapping.headerName;
  }
</script>

<svelte:head>
	<title>Field Mapping - JIANKA Travel Agency</title>
	<meta name="description" content="Field Mapping tools for JIANKA Travel Agency" />
</svelte:head>

<div class="page-container">
	<div class="page-content">
		<h1>Field Mapping</h1>
		
		<div class="feature-description">
			<p class="lead">
				Create and manage custom field mapping templates for seamless CSV data processing.
			</p>
			
			<p>
				Design custom templates that define how CSV column headers map to our travel data fields. 
				Share templates with your team or keep them private for your specific use cases.
			</p>
		</div>
		
		<!-- Templates Section -->
		<div class="templates-section" transition:fade={{ duration: 600, delay: 200 }}>
			<div class="section-header">
				<h2>Your Templates</h2>
				<button class="create-btn" on:click={startCreateTemplate}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="12" y1="5" x2="12" y2="19"/>
						<line x1="5" y1="12" x2="19" y2="12"/>
					</svg>
					Create New Template
				</button>
			</div>
			
			{#if templates.length > 0}
				<div class="templates-grid">
					{#each templates as template, index}
						<div class="template-card" transition:fly={{ y: 20, duration: 400, delay: 100 * index }}>
							<div class="template-header">
								<h3>{template.template_name}</h3>
								<div class="template-badges">
									{#if template.is_default}
										<span class="badge default">Default</span>
									{/if}
									{#if template.is_public}
										<span class="badge public">Public</span>
									{/if}
								</div>
							</div>
							<p class="template-description">{template.description || 'No description'}</p>
							<div class="template-mappings">
								<h4>Field Mappings:</h4>
								<div class="mapping-preview">
									{#each Object.entries(template.field_mappings).slice(0, 5) as [fieldKey, fieldMapping]}
										<div class="mapping-item">
											<span class="field-key">{fieldKey}</span>
											<span class="field-type">{fieldMapping.type}</span>
											<span class="arrow">→</span>
											<span class="header-name">{fieldMapping.required ? '*' : ''}{fieldKey}</span>
										</div>
									{/each}
									{#if Object.keys(template.field_mappings).length > 5}
										<div class="more-mappings">+{Object.keys(template.field_mappings).length - 5} more fields</div>
									{/if}
								</div>
							</div>
							<div class="template-actions">
								{#if !template.is_default}
									<button class="delete-btn" on:click={() => deleteTemplate(template.id)}>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<polyline points="3,6 5,6 21,6"/>
											<path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
										</svg>
										Delete
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state" transition:fade={{ duration: 600, delay: 400 }}>
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14,2 14,8 20,8"/>
					</svg>
					<h3>No Templates Yet</h3>
					<p>Create your first template to get started with custom field mappings.</p>
					<button class="create-btn primary" on:click={startCreateTemplate}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="12" y1="5" x2="12" y2="19"/>
							<line x1="5" y1="12" x2="19" y2="12"/>
						</svg>
						Create Your First Template
					</button>
				</div>
			{/if}
		</div>

		<!-- Create Template Form -->
		{#if showCreateForm}
			<div class="create-form-section" transition:fly={{ y: 30, duration: 600, delay: 200 }}>
				<div class="form-card">
					<div class="form-header">
						<h2>Create New Template</h2>
						<button class="close-btn" on:click={() => showCreateForm = false} aria-label="Close form">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18"/>
								<line x1="6" y1="6" x2="18" y2="18"/>
							</svg>
						</button>
					</div>

					<form on:submit|preventDefault={createTemplate}>
						<div class="form-group">
							<label for="template-name">Template Name</label>
							<input 
								id="template-name"
								type="text" 
								bind:value={newTemplate.templateName}
								placeholder="e.g., My Custom Template"
								required
							/>
						</div>

						<div class="form-group">
							<label for="template-description">Description</label>
							<textarea 
								id="template-description"
								bind:value={newTemplate.description}
								placeholder="Describe what this template is for..."
								rows="3"
							></textarea>
						</div>

						<div class="form-group">
							<label class="checkbox-label">
								<input 
									type="checkbox" 
									bind:checked={newTemplate.isPublic}
								/>
								<span class="checkmark"></span>
								Make this template public (visible to other users)
							</label>
						</div>

						<div class="form-group">
							<label for="runtime-fields">Runtime Fields</label>
							<div class="runtime-fields-editor" id="runtime-fields">
								<p class="runtime-description">Select computed fields that will be generated automatically:</p>
								{#each Object.entries(RUNTIME_FIELDS) as [fieldKey, fieldDef]}
									<div class="runtime-field-row">
										<label class="runtime-checkbox-label">
											<input 
												type="checkbox" 
												bind:group={newTemplate.runtimeFields}
												value={fieldKey}
											/>
											<span class="checkmark"></span>
											<div class="runtime-field-info">
												<span class="runtime-field-name">{fieldDef.name}</span>
												<span class="runtime-field-desc">{fieldDef.description}</span>
											</div>
										</label>
									</div>
								{/each}
							</div>
						</div>

						<!-- Debug Panel -->
						<div class="debug-panel">
							<div class="debug-header">
								<h4>Debug Information</h4>
								<button class="debug-toggle-btn" on:click={() => showDebugPanel = !showDebugPanel}>
									{showDebugPanel ? 'Hide' : 'Show'} Debug
								</button>
							</div>
							
							{#if showDebugPanel}
								<div class="debug-info">
									<div><strong>Dragged Column:</strong> {debugInfo.draggedColumn || 'None'}</div>
									<div><strong>Drag Over Input:</strong> {debugInfo.draggedOverInput || 'None'}</div>
									<div><strong>CSV Columns:</strong> {debugInfo.csvColumns.length} ({debugInfo.csvColumns.join(', ')})</div>
									<div><strong>Field Mappings:</strong> {Object.keys(debugInfo.fieldMappings).length}</div>
									<div><strong>Validation Errors:</strong> {debugInfo.validationErrors.length}</div>
									<div><strong>Input Update Trigger:</strong> {inputUpdateTrigger}</div>
								</div>
								<div class="debug-actions">
									<button type="button" class="debug-btn" on:click={() => {
										console.log('=== FULL DEBUG STATE ===');
										console.log('Debug Info:', debugInfo);
										console.log('All Field Mappings:', newTemplate.fieldMappings);
										console.log('Validation Errors:', validationErrors);
										console.log('CSV Columns:', csvColumns);
										console.log('========================');
									}}>
										Log Full State to Console
									</button>
									<button type="button" class="debug-btn" on:click={() => {
										console.log('=== DRAG & DROP STATE ===');
										console.log('Dragged Column:', draggedColumn);
										console.log('Dragged Over Input:', draggedOverInput);
										console.log('CSV Columns Available:', csvColumns);
										console.log('========================');
									}}>
										Log Drag & Drop State
									</button>
								</div>
							{/if}
						</div>

						<!-- CSV Columns Setup -->
						<div class="form-group">
							<label for="csv-columns">CSV Columns Setup</label>
							<div class="csv-columns-section">
								<div class="column-input-row">
									<input 
										type="text" 
										bind:value={columnInput}
										placeholder="Enter column names separated by commas (e.g., ID, Name, Email)"
										class="column-input"
										on:keydown={(e) => e.key === 'Enter' && addCsvColumns()}
									/>
									<button type="button" class="add-column-btn" on:click={addCsvColumns}>
										Add Columns
									</button>
									<button type="button" class="generate-numbers-btn" on:click={generateNumberedColumns}>
										Use Numbers 1-25
									</button>
			</div>
			
								{#if csvColumns.length > 0}
									<div class="csv-columns-list">
										<h4>Available Columns (drag to field inputs):</h4>
										<div class="columns-grid">
											{#each csvColumns as column, index}
												<div 
													class="column-tag" 
													class:dragging={draggedColumn === column}
													draggable="true"
													role="button"
													tabindex="0"
													on:dragstart={(e) => handleColumnDragStart(e, column)}
													on:dragend={handleColumnDragEnd}
												>
													{column}
													<button type="button" class="remove-column-btn" on:click={() => removeCsvColumn(index)}>
														×
													</button>
												</div>
											{/each}
										</div>
									</div>
								{/if}
			</div>
		</div>
		
						<!-- Field Mappings with Drag & Drop -->
						<div class="form-group">
							<label for="field-mappings">Field Mappings</label>
							<div class="mappings-editor" id="field-mappings">
								{#each Object.entries(defaultFieldMappings) as [fieldKey, fieldMapping]}
									<div class="mapping-row">
										<div class="field-info">
											<span class="field-key">{fieldKey}</span>
											<span class="field-type">{fieldMapping.type}</span>
											{#if fieldMapping.required}
												<span class="required-badge">Required</span>
											{/if}
										</div>
										<span class="arrow">→</span>
										<input 
											type="text" 
											value={getFieldDisplayValue(fieldKey)}
											data-field={fieldKey}
											class="header-input"
											class:drag-over={draggedOverInput === fieldKey}
											on:input={(e) => {
												const target = e.target as HTMLInputElement;
												if (!newTemplate.fieldMappings[fieldKey]) {
													newTemplate.fieldMappings[fieldKey] = { ...fieldMapping };
												}
												newTemplate.fieldMappings[fieldKey].headerName = target.value;
												validateMappings();
											}}
											on:dragover={(e) => handleInputDragOver(e, fieldKey)}
											on:dragleave={handleInputDragLeave}
											on:drop={(e) => handleInputDrop(e, fieldKey)}
											placeholder="Enter column name or number (1-25)"
										/>
									</div>
								{/each}
							</div>
							
							<!-- Validation Errors -->
							{#if validationErrors.length > 0}
								<div class="validation-errors">
									<h4>Validation Errors:</h4>
									{#each validationErrors as error}
										<div class="error-item">
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<circle cx="12" cy="12" r="10"/>
												<line x1="15" y1="9" x2="9" y2="15"/>
												<line x1="9" y1="9" x2="15" y2="15"/>
											</svg>
											{error}
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<div class="form-actions">
							<button type="button" class="cancel-btn" on:click={() => showCreateForm = false}>
								Cancel
							</button>
							<button type="submit" class="submit-btn" disabled={validationErrors.length > 0}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
									<polyline points="17,21 17,13 7,13 7,21"/>
									<polyline points="7,3 7,8 15,8"/>
								</svg>
								Create Template
							</button>
						</div>
					</form>
				</div>
		</div>
		{/if}
	</div>
</div>

<style>
	.page-container {
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f0e6 0%, #e8dcc0 100%);
	}
	
	.page-content {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.page-content h1 {
		color: #2c2c2c;
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 2rem 0;
		letter-spacing: 0.05em;
		text-align: center;
	}
	
	.feature-description {
		margin-bottom: 3rem;
		text-align: center;
	}
	
	.lead {
		font-size: 1.25rem;
		font-weight: 600;
		color: #cb9f4d;
		margin-bottom: 1.5rem;
		font-style: italic;
	}
	
	.feature-description p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 1rem;
		font-size: 1rem;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	/* Templates Section */
	.templates-section {
		margin-bottom: 3rem;
	}
	
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.section-header h2 {
		color: #2c2c2c;
		font-size: 1.8rem;
		font-weight: 600;
		margin: 0;
	}

	.create-btn {
		background: #cb9f4d;
		color: #000000;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.create-btn:hover {
		background: #f4d03f;
		transform: translateY(-2px);
	}

	.create-btn.primary {
		background: #cb9f4d;
		color: #000000;
		font-size: 1rem;
		padding: 1rem 2rem;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		width: fit-content;
	}

	.templates-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.template-card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border: 1px solid #e0e0e0;
		transition: all 0.3s ease;
	}

	.template-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.template-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.template-header h3 {
		color: #2c2c2c;
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0;
		flex: 1;
	}

	.template-badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.badge.default {
		background: #e3f2fd;
		color: #1976d2;
	}

	.badge.public {
		background: #e8f5e8;
		color: #2e7d32;
	}

	.template-description {
		color: #666;
		font-size: 0.9rem;
		line-height: 1.5;
		margin: 0 0 1rem 0;
	}

	.template-mappings h4 {
		color: #2c2c2c;
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
	}

	.mapping-preview {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mapping-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 6px;
	}

	.field-key {
		color: #cb9f4d;
		font-weight: 600;
		min-width: 80px;
	}

	.field-type {
		background: #e3f2fd;
		color: #1976d2;
		padding: 0.2rem 0.5rem;
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.required-badge {
		background: #ffebee;
		color: #c62828;
		padding: 0.2rem 0.5rem;
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.arrow {
		color: #999;
	}

	.header-name {
		color: #2c2c2c;
		flex: 1;
	}

	.more-mappings {
		color: #999;
		font-size: 0.8rem;
		font-style: italic;
		text-align: center;
		padding: 0.5rem;
	}

	.template-actions {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e0e0e0;
	}

	.delete-btn {
		background: #ffebee;
		color: #c62828;
		border: 1px solid #ffcdd2;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.delete-btn:hover {
		background: #c62828;
		color: white;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border: 1px solid #e0e0e0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.empty-state svg {
		color: #cb9f4d;
		margin-bottom: 1.5rem;
	}

	.empty-state h3 {
		color: #2c2c2c;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
	}

	.empty-state p {
		color: #666;
		font-size: 1rem;
		margin: 0 0 2rem 0;
	}

	/* Create Form */
	.create-form-section {
		margin-top: 2rem;
	}

	.form-card {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		border: 1px solid #e0e0e0;
	}

	.form-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.form-header h2 {
		color: #2c2c2c;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: #999;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		transition: all 0.3s ease;
	}

	.close-btn:hover {
		background: #f5f5f5;
		color: #666;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		color: #2c2c2c;
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.9rem;
		transition: border-color 0.3s ease;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #cb9f4d;
	}

	.checkbox-label {
		display: flex !important;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: normal !important;
	}

	.checkbox-label input[type="checkbox"] {
		width: auto !important;
		margin: 0;
	}

	.mappings-editor {
		max-height: 400px;
		overflow-y: auto;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		padding: 1rem;
		background: #f8f9fa;
	}

	.mapping-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
		padding: 0.5rem;
		background: white;
		border-radius: 4px;
		border: 1px solid #e0e0e0;
	}

	.field-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 200px;
	}

	.mapping-row .field-key {
		min-width: 80px;
		font-weight: 600;
		color: #cb9f4d;
		font-size: 0.8rem;
	}

	/* Runtime Fields Styles */
	.runtime-fields-editor {
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		padding: 1rem;
		background: #f8f9fa;
	}

	.runtime-description {
		color: #666;
		font-size: 0.9rem;
		margin: 0 0 1rem 0;
	}

	.runtime-field-row {
		margin-bottom: 0.75rem;
		padding: 0.75rem;
		background: white;
		border-radius: 6px;
		border: 1px solid #e0e0e0;
	}

	.runtime-checkbox-label {
		display: flex !important;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: normal !important;
		margin: 0 !important;
	}

	.runtime-checkbox-label input[type="checkbox"] {
		width: auto !important;
		margin: 0;
	}

	.runtime-field-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.runtime-field-name {
		font-weight: 600;
		color: #2c2c2c;
		font-size: 0.9rem;
	}

	.runtime-field-desc {
		color: #666;
		font-size: 0.8rem;
	}

	.mapping-row .arrow {
		color: #999;
		font-size: 0.9rem;
	}

	.header-input {
		flex: 1;
		margin: 0 !important;
		padding: 0.5rem !important;
		font-size: 0.8rem !important;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #e0e0e0;
	}

	.cancel-btn {
		background: #f5f5f5;
		color: #666;
		border: 1px solid #ddd;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.cancel-btn:hover {
		background: #e0e0e0;
	}

	.submit-btn {
		background: #cb9f4d;
		color: #000000;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.submit-btn:hover {
		background: #f4d03f;
		transform: translateY(-2px);
	}

	.submit-btn:disabled {
		background: #ccc;
		color: #666;
		cursor: not-allowed;
		transform: none;
	}

	/* CSV Columns Section */
	.csv-columns-section {
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		padding: 1rem;
		background: #f8f9fa;
	}

	.column-input-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.column-input {
		flex: 1;
		min-width: 200px;
		margin: 0 !important;
		padding: 0.5rem !important;
		font-size: 0.9rem !important;
	}

	.add-column-btn,
	.generate-numbers-btn {
		background: #cb9f4d;
		color: #000000;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		white-space: nowrap;
	}

	.add-column-btn:hover,
	.generate-numbers-btn:hover {
		background: #f4d03f;
	}

	.csv-columns-list {
		margin-top: 1rem;
	}

	.csv-columns-list h4 {
		color: #2c2c2c;
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.columns-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.column-tag {
		background: #e3f2fd;
		color: #1976d2;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.remove-column-btn {
		background: none;
		border: none;
		color: #1976d2;
		cursor: pointer;
		font-size: 1.2rem;
		font-weight: bold;
		padding: 0;
		line-height: 1;
	}

	.remove-column-btn:hover {
		color: #c62828;
	}

	/* Drag & Drop Styles */
	.mapping-row {
		transition: all 0.3s ease;
	}

	.mapping-row:hover {
		background: #f0f8ff;
		border-color: #cb9f4d;
	}

	.header-input.drag-over {
		background: #e3f2fd;
		border-color: #1976d2;
		transform: scale(1.02);
		box-shadow: 0 0 10px rgba(25, 118, 210, 0.3);
	}

	.column-tag {
		cursor: grab;
		transition: all 0.3s ease;
		user-select: none;
	}

	.column-tag:hover {
		background: #1976d2;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.column-tag.dragging {
		opacity: 0.5;
		transform: rotate(2deg);
	}

	.column-tag:active {
		cursor: grabbing;
	}

	/* Validation Errors */
	.validation-errors {
		margin-top: 1rem;
		padding: 1rem;
		background: #ffebee;
		border: 1px solid #ffcdd2;
		border-radius: 6px;
	}

	.validation-errors h4 {
		color: #c62828;
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
	}

	.error-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #c62828;
		font-size: 0.8rem;
		margin-bottom: 0.5rem;
	}

	.error-item:last-child {
		margin-bottom: 0;
	}

	.error-item svg {
		flex-shrink: 0;
	}

	/* Debug Panel */
	.debug-panel {
		background: #f0f8ff;
		border: 2px solid #1976d2;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.debug-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.debug-header h4 {
		color: #1976d2;
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0;
	}

	.debug-toggle-btn {
		background: #1976d2;
		color: white;
		border: none;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.debug-toggle-btn:hover {
		background: #1565c0;
	}

	.debug-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.8rem;
	}

	.debug-info div {
		background: white;
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #e3f2fd;
	}

	.debug-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.debug-btn {
		background: #1976d2;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.debug-btn:hover {
		background: #1565c0;
	}
	
	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}
		
		.page-content h1 {
			font-size: 2rem;
		}
		
		.section-header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.templates-grid {
			grid-template-columns: 1fr;
		}
		
		.template-header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.mapping-row {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}
		
		.mapping-row .field-key {
			min-width: auto;
		}
		
		.form-actions {
			flex-direction: column;
		}
	}
</style>
