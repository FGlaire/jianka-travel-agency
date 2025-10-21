-- Database schema for JIANKA Travel Agency CSV files and templates

-- Create CSV Files table
CREATE TABLE IF NOT EXISTS csv_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_data JSONB NOT NULL, -- Store the parsed CSV data
    columns TEXT[] NOT NULL, -- Array of column names
    column_validation JSONB, -- Store validation results
    extraction_results JSONB, -- Store success/failed data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    description TEXT,
    field_mappings JSONB NOT NULL, -- Store field mappings
    is_public BOOLEAN DEFAULT false, -- Whether template is visible to other users
    is_default BOOLEAN DEFAULT false, -- Whether this is the default template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_name) -- Prevent duplicate template names per user
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_csv_files_user_id ON csv_files(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_files_upload_date ON csv_files(upload_date);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public);

-- Enable Row Level Security
ALTER TABLE csv_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for csv_files
CREATE POLICY "Users can view their own CSV files" ON csv_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CSV files" ON csv_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CSV files" ON csv_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CSV files" ON csv_files
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for templates
CREATE POLICY "Users can view their own templates and public templates" ON templates
    FOR SELECT USING (
        auth.uid() = user_id OR is_public = true
    );

CREATE POLICY "Users can insert their own templates" ON templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON templates
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_csv_files_updated_at BEFORE UPDATE ON csv_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default template
INSERT INTO templates (user_id, template_name, description, field_mappings, is_default, is_public)
VALUES (
    NULL, -- NULL means it's a system-wide default
    'Default Travel Template',
    'Default template for travel data with standard field mappings',
    '{
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
    }'::jsonb,
    true,
    true
) ON CONFLICT DO NOTHING;
