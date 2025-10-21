// Simple script to check if database tables exist
// Run this in your Supabase SQL editor to verify tables exist

console.log('Checking database tables...');

// Check if csv_files table exists
const checkCsvFilesTable = `
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'csv_files'
);
`;

// Check if templates table exists  
const checkTemplatesTable = `
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'templates'
);
`;

// Check RLS policies
const checkRLSPolicies = `
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('csv_files', 'templates');
`;

console.log('Run these queries in your Supabase SQL editor:');
console.log('1. Check csv_files table:', checkCsvFilesTable);
console.log('2. Check templates table:', checkTemplatesTable);
console.log('3. Check RLS policies:', checkRLSPolicies);
