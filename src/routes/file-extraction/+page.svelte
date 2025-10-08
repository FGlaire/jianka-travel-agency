<svelte:head>
	<title>File Extraction - JIANKA Travel Agency</title>
	<meta name="description" content="File Extraction tools for JIANKA Travel Agency" />
</svelte:head>

<div class="page-container">
	<div class="page-content">
		<h1>File Extraction</h1>
		
		<div class="feature-description">
			<p class="lead">
				Extract and process travel documents, itineraries, and booking information with our advanced file extraction tools.
			</p>
			
			<p>
				Our file extraction system helps you organize and process various travel-related documents, 
				from booking confirmations to travel itineraries, making it easier to manage your travel information.
			</p>
		</div>
		
		<div class="feature-grid">
			<div class="feature-card">
				<h3>Document Processing</h3>
				<p>Extract text and data from PDFs, images, and other document formats commonly used in travel.</p>
			</div>
			
			<div class="feature-card">
				<h3>Booking Extraction</h3>
				<p>Automatically extract booking details, confirmation numbers, and travel dates from various sources.</p>
			</div>
			
			<div class="feature-card">
				<h3>Itinerary Parsing</h3>
				<p>Parse travel itineraries and schedules to create organized, easy-to-read travel plans.</p>
			</div>
		</div>
		
		<div class="coming-soon">
			<p>🚧 This feature is coming soon! Stay tuned for updates.</p>
		</div>
	</div>
</div>

<style>
	.page-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f0e6 0%, #e8dcc0 100%);
	}
	
	.page-content {
		max-width: 800px;
		background: white;
		padding: 3rem;
		border-radius: 12px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid #e0e0e0;
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
	}
	
	.lead {
		font-size: 1.25rem;
		font-weight: 600;
		color: #cb9f4d;
		margin-bottom: 1.5rem;
		text-align: center;
		font-style: italic;
	}
	
	.feature-description p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 1rem;
		font-size: 1rem;
	}
	
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}
	
	.feature-card {
		text-align: center;
		padding: 1.5rem;
		background: #f9f9f9;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}
	
	.feature-card h3 {
		color: #2c2c2c;
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		letter-spacing: 0.05em;
	}
	
	.feature-card p {
		color: #666;
		line-height: 1.5;
		margin: 0;
		font-size: 0.95rem;
	}
	
	.coming-soon {
		text-align: center;
		padding: 2rem;
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 8px;
		color: #856404;
		font-weight: 500;
	}
	
	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}
		
		.page-content {
			padding: 2rem;
		}
		
		.page-content h1 {
			font-size: 2rem;
		}
		
		.lead {
			font-size: 1.1rem;
		}
	}
</style>
