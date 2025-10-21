<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // Template state
  let templates: Array<{
    id: string;
    template_name: string;
    description: string;
    field_mappings: any;
    is_public: boolean;
    is_default: boolean;
    user_id: string;
  }> = [];

  let showCreateForm = false;
  let newTemplate = {
    templateName: '',
    description: '',
    isPublic: false,
    fieldMappings: {} as Record<string, string>
  };

  // Default field mappings
  const defaultFieldMappings = {
    "id": "ID",
    "lastName": "Last Name", 
    "firstName": "First Name",
    "email": "Email",
    "phone": "Phone",
    "dateOfBirth": "Date of Birth",
    "passportNumber": "Passport Number",
    "nationality": "Nationality",
    "address": "Address",
    "city": "City",
    "country": "Country",
    "postalCode": "Postal Code",
    "emergencyContact": "Emergency Contact",
    "emergencyPhone": "Emergency Phone",
    "dietaryRequirements": "Dietary Requirements",
    "medicalConditions": "Medical Conditions",
    "travelInsurance": "Travel Insurance",
    "preferredLanguage": "Preferred Language",
    "specialRequests": "Special Requests",
    "travelExperience": "Travel Experience",
    "budget": "Budget",
    "travelDates": "Travel Dates",
    "destination": "Destination",
    "accommodationType": "Accommodation Type",
    "transportation": "Transportation"
  };

  onMount(() => {
    loadTemplates();
  });

  async function loadTemplates() {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      
      if (data.templates) {
        templates = data.templates;
      }
    } catch (error) {
      console.error('Error loading templates:', error);
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
      fieldMappings: { ...defaultFieldMappings }
    };
  }

  function startCreateTemplate() {
    resetForm();
    showCreateForm = true;
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
									{#each Object.entries(template.field_mappings).slice(0, 5) as [fieldKey, headerName]}
										<div class="mapping-item">
											<span class="field-key">{fieldKey}</span>
											<span class="arrow">→</span>
											<span class="header-name">{headerName}</span>
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
							<label for="field-mappings">Field Mappings</label>
							<div class="mappings-editor" id="field-mappings">
								{#each Object.entries(defaultFieldMappings) as [fieldKey, defaultHeader]}
									<div class="mapping-row">
										<span class="field-key">{fieldKey}</span>
										<span class="arrow">→</span>
										<input 
											type="text" 
											bind:value={newTemplate.fieldMappings[fieldKey]}
											placeholder={defaultHeader}
											class="header-input"
										/>
									</div>
								{/each}
							</div>
						</div>

						<div class="form-actions">
							<button type="button" class="cancel-btn" on:click={() => showCreateForm = false}>
								Cancel
							</button>
							<button type="submit" class="submit-btn">
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

	.mapping-row .field-key {
		min-width: 120px;
		font-weight: 600;
		color: #cb9f4d;
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
