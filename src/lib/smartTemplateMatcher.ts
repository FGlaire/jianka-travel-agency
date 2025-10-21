// Enhanced Template System with Elasticsearch-inspired concepts
// Smart field detection and pattern-based template matching

export interface FieldMapping {
  type: 'text' | 'keyword' | 'date' | 'number' | 'boolean' | 'email' | 'phone' | 'passport' | 'postal';
  analyzer?: string;
  normalizer?: string;
  format?: string;
  validation?: ValidationRule[];
  required?: boolean;
  headerName?: string; // CSV header name for this field
}

export interface ValidationRule {
  type: 'regex' | 'range' | 'length' | 'format' | 'custom';
  value: any;
  message: string;
}

export interface Pattern {
  fieldNames?: string[];
  fieldTypes?: string[];
  dataPatterns?: RegExp[];
  weight: number;
}

export interface EnhancedTemplate {
  id: string;
  template_name: string;
  description: string;
  field_mappings: Record<string, FieldMapping>;
  patterns: Pattern[];
  priority: number;
  is_public: boolean;
  is_default: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateMatch {
  template: EnhancedTemplate;
  score: number;
  matchedFields: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface FieldAnalysis {
  name: string;
  detectedType: string;
  confidence: number;
  patterns: string[];
  sampleValues: string[];
}

// Field type detection patterns
const FIELD_PATTERNS = {
  email: {
    names: ['email', 'e-mail', 'mail', 'email_address'],
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    weight: 0.9
  },
  phone: {
    names: ['phone', 'telephone', 'mobile', 'cell', 'contact'],
    regex: /^[\+]?[\d\s\-\(\)]{7,}$/,
    weight: 0.8
  },
  date: {
    names: ['date', 'birth', 'dob', 'created', 'updated', 'time'],
    regex: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}-\d{2}-\d{4}$/,
    weight: 0.9
  },
  passport: {
    names: ['passport', 'passport_number', 'passport_no'],
    regex: /^[A-Z0-9]{6,12}$/i,
    weight: 0.8
  },
  postal: {
    names: ['postal', 'zip', 'postcode', 'postal_code'],
    regex: /^\d{3,10}$/,
    weight: 0.7
  },
  name: {
    names: ['name', 'first_name', 'last_name', 'firstname', 'lastname'],
    regex: /^[a-zA-Z\s\-']+$/,
    weight: 0.6
  },
  id: {
    names: ['id', 'user_id', 'customer_id', 'client_id'],
    regex: /^\d+$/,
    weight: 0.7
  },
  number: {
    names: ['number', 'count', 'quantity', 'amount', 'price', 'budget'],
    regex: /^\d+(\.\d+)?$/,
    weight: 0.5
  }
};

export class SmartTemplateMatcher {
  private templates: EnhancedTemplate[] = [];
  private fieldPatterns = FIELD_PATTERNS;

  constructor(templates: EnhancedTemplate[]) {
    this.templates = templates;
  }

  /**
   * Analyze CSV headers and find the best matching template
   */
  analyzeCSVHeaders(headers: string[], sampleData?: any[]): TemplateMatch[] {
    const fieldAnalysis = this.analyzeFields(headers, sampleData);
    const matches = this.findMatchingTemplates(fieldAnalysis);
    
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Analyze individual fields to detect their types and patterns
   */
  private analyzeFields(headers: string[], sampleData?: any[]): FieldAnalysis[] {
    return headers.map((header, index) => {
      const detectedType = this.detectFieldType(header, sampleData?.[index]);
      const patterns = this.extractPatterns(header);
      const confidence = this.calculateConfidence(header, detectedType, sampleData?.[index]);
      
      return {
        name: header,
        detectedType,
        confidence,
        patterns,
        sampleValues: sampleData?.[index] ? [sampleData[index]] : []
      };
    });
  }

  /**
   * Detect field type based on name patterns and sample data
   */
  private detectFieldType(header: string, sampleValue?: any): string {
    const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
    
    // Check against known patterns
    for (const [type, pattern] of Object.entries(this.fieldPatterns)) {
      const nameMatch = pattern.names.some(name => 
        normalizedHeader.includes(name.toLowerCase().replace(/[_\s-]/g, ''))
      );
      
      if (nameMatch) {
        // If we have sample data, validate with regex
        if (sampleValue && pattern.regex) {
          if (pattern.regex.test(sampleValue.toString())) {
            return type;
          }
        } else {
          return type;
        }
      }
    }

    // Fallback to generic text type
    return 'text';
  }

  /**
   * Extract patterns from field name
   */
  private extractPatterns(header: string): string[] {
    const patterns: string[] = [];
    const normalized = header.toLowerCase();
    
    // Check for common patterns
    if (normalized.includes('email')) patterns.push('email');
    if (normalized.includes('phone')) patterns.push('phone');
    if (normalized.includes('date') || normalized.includes('birth')) patterns.push('date');
    if (normalized.includes('passport')) patterns.push('passport');
    if (normalized.includes('postal') || normalized.includes('zip')) patterns.push('postal');
    if (normalized.includes('name')) patterns.push('name');
    if (normalized.includes('id')) patterns.push('id');
    if (normalized.includes('number') || normalized.includes('count')) patterns.push('number');
    
    return patterns;
  }

  /**
   * Calculate confidence score for field type detection
   */
  private calculateConfidence(header: string, detectedType: string, sampleValue?: any): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on name patterns
    const pattern = this.fieldPatterns[detectedType as keyof typeof FIELD_PATTERNS];
    if (pattern) {
      const nameMatch = pattern.names.some(name => 
        header.toLowerCase().includes(name.toLowerCase())
      );
      if (nameMatch) confidence += 0.3;
      
      // Boost confidence if sample data matches regex
      if (sampleValue && pattern.regex && pattern.regex.test(sampleValue.toString())) {
        confidence += 0.2;
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Find templates that match the analyzed fields
   */
  private findMatchingTemplates(fieldAnalysis: FieldAnalysis[]): TemplateMatch[] {
    const matches: TemplateMatch[] = [];
    
    for (const template of this.templates) {
      const score = this.calculateTemplateScore(template, fieldAnalysis);
      const matchedFields = this.getMatchedFields(template, fieldAnalysis);
      
      if (score > 0.3) { // Minimum threshold
        matches.push({
          template,
          score,
          matchedFields,
          confidence: this.getConfidenceLevel(score)
        });
      }
    }
    
    return matches;
  }

  /**
   * Calculate how well a template matches the analyzed fields
   */
  private calculateTemplateScore(template: EnhancedTemplate, fieldAnalysis: FieldAnalysis[]): number {
    let totalScore = 0;
    let fieldCount = 0;
    
    for (const analysis of fieldAnalysis) {
      const templateField = this.findTemplateField(template, analysis.name);
      
      if (templateField) {
        // Exact field match
        totalScore += 1.0;
        fieldCount++;
      } else {
        // Check for pattern-based matches
        const patternScore = this.calculatePatternScore(template, analysis);
        if (patternScore > 0) {
          totalScore += patternScore;
          fieldCount++;
        }
      }
    }
    
    return fieldCount > 0 ? totalScore / fieldCount : 0;
  }

  /**
   * Find corresponding field in template
   */
  private findTemplateField(template: EnhancedTemplate, fieldName: string): FieldMapping | null {
    const normalizedName = fieldName.toLowerCase().replace(/[_\s-]/g, '');
    
    for (const [key, mapping] of Object.entries(template.field_mappings)) {
      // Handle both old string format and new FieldMapping format
      const fieldMapping = typeof mapping === 'string' 
        ? { type: 'text' as const, headerName: mapping, required: false }
        : mapping as FieldMapping;
      
      const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, '');
      if (normalizedName === normalizedKey) {
        return fieldMapping;
      }
    }
    
    return null;
  }

  /**
   * Calculate pattern-based match score
   */
  private calculatePatternScore(template: EnhancedTemplate, analysis: FieldAnalysis): number {
    let score = 0;
    
    for (const pattern of template.patterns) {
      // Check field name patterns
      if (pattern.fieldNames) {
        const nameMatch = pattern.fieldNames.some(name => 
          analysis.name.toLowerCase().includes(name.toLowerCase())
        );
        if (nameMatch) score += pattern.weight * 0.5;
      }
      
      // Check field type patterns
      if (pattern.fieldTypes) {
        const typeMatch = pattern.fieldTypes.includes(analysis.detectedType);
        if (typeMatch) score += pattern.weight * 0.3;
      }
      
      // Check data patterns
      if (pattern.dataPatterns) {
        const dataMatch = pattern.dataPatterns.some(regex => 
          analysis.sampleValues.some(value => regex.test(value.toString()))
        );
        if (dataMatch) score += pattern.weight * 0.2;
      }
    }
    
    return score;
  }

  /**
   * Get fields that matched the template
   */
  private getMatchedFields(template: EnhancedTemplate, fieldAnalysis: FieldAnalysis[]): string[] {
    return fieldAnalysis
      .filter(analysis => this.findTemplateField(template, analysis.name) !== null)
      .map(analysis => analysis.name);
  }

  /**
   * Get confidence level based on score
   */
  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Create enhanced template from basic template
   */
  static enhanceTemplate(template: any): EnhancedTemplate {
    const patterns: Pattern[] = [];
    
    // Generate patterns from field mappings
    for (const [fieldKey, mapping] of Object.entries(template.field_mappings)) {
      // Handle both old string format and new FieldMapping format
      const fieldMapping = typeof mapping === 'string' 
        ? { type: 'text' as const, headerName: mapping, required: false }
        : mapping as FieldMapping;
      
      const fieldPattern: Pattern = {
        fieldNames: [fieldKey],
        fieldTypes: [fieldMapping.type],
        weight: fieldMapping.required ? 1.0 : 0.7
      };
      
      // Add data patterns based on field type
      if (fieldMapping.type === 'email') {
        fieldPattern.dataPatterns = [FIELD_PATTERNS.email.regex];
      } else if (fieldMapping.type === 'phone') {
        fieldPattern.dataPatterns = [FIELD_PATTERNS.phone.regex];
      } else if (fieldMapping.type === 'date') {
        fieldPattern.dataPatterns = [FIELD_PATTERNS.date.regex];
      }
      
      patterns.push(fieldPattern);
    }
    
    return {
      ...template,
      patterns,
      priority: template.is_default ? 1 : 0.5
    };
  }
}

// Runtime field definitions for common calculations
export const RUNTIME_FIELDS = {
  fullName: {
    name: 'fullName',
    script: 'firstName + " " + lastName',
    returnType: 'text',
    dependencies: ['firstName', 'lastName'],
    description: 'Combined first and last name'
  },
  age: {
    name: 'age',
    script: 'Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))',
    returnType: 'number',
    dependencies: ['dateOfBirth'],
    description: 'Calculated age from date of birth'
  },
  normalizedEmail: {
    name: 'normalizedEmail',
    script: 'email.toLowerCase().trim()',
    returnType: 'keyword',
    dependencies: ['email'],
    description: 'Normalized email address'
  },
  phoneCountryCode: {
    name: 'phoneCountryCode',
    script: 'phone.startsWith("+") ? phone.substring(0, 3) : "Unknown"',
    returnType: 'keyword',
    dependencies: ['phone'],
    description: 'Extracted country code from phone number'
  }
};

/**
 * Process runtime fields for a data row
 */
export function processRuntimeFields(row: any, runtimeFields: any[] = []): any {
  const processedRow = { ...row };
  
  for (const field of runtimeFields) {
    try {
      // Simple script evaluation (in production, use a proper script engine)
      let value = '';
      
      switch (field.name) {
        case 'fullName':
          value = `${row.firstName || ''} ${row.lastName || ''}`.trim();
          break;
        case 'normalizedEmail':
          value = (row.email || '').toLowerCase().trim();
          break;
        case 'phoneCountryCode':
          const phone = row.phone || '';
          value = phone.startsWith('+') ? phone.substring(0, 3) : 'Unknown';
          break;
        case 'age':
          if (row.dateOfBirth) {
            const birthDate = new Date(row.dateOfBirth);
            const now = new Date();
            value = Math.floor((now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toString();
          }
          break;
      }
      
      processedRow[field.name] = value;
    } catch (error) {
      console.warn(`Error processing runtime field ${field.name}:`, error);
      processedRow[field.name] = null;
    }
  }
  
  return processedRow;
}
