#!/usr/bin/env node

/**
 * Logging Migration Validation Script
 * Checks that Pino is properly configured and Winston is completely removed
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

class LoggingValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(type, message) {
    const colors = {
      error: RED,
      warning: YELLOW,
      success: GREEN,
      info: BLUE
    };
    console.log(`${colors[type]}${message}${RESET}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log('error', `❌ ${message}`);
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log('warning', `⚠️  ${message}`);
  }

  addSuccess(message) {
    this.successes.push(message);
    this.log('success', `✅ ${message}`);
  }

  addInfo(message) {
    this.log('info', `ℹ️  ${message}`);
  }

  // Check package.json for dependencies
  validateDependencies() {
    this.addInfo('Checking dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for Winston (should be removed)
      if (deps.winston) {
        this.addError('Winston dependency still present in package.json');
      } else {
        this.addSuccess('Winston dependency removed');
      }

      if (deps['nest-winston']) {
        this.addError('nest-winston dependency still present in package.json');
      } else {
        this.addSuccess('nest-winston dependency removed');
      }

      // Check for Pino (should be present)
      if (deps['nestjs-pino']) {
        this.addSuccess('nestjs-pino dependency present');
      } else {
        this.addError('nestjs-pino dependency missing');
      }

      if (deps['pino-pretty']) {
        this.addSuccess('pino-pretty dependency present');
      } else {
        this.addWarning('pino-pretty dependency missing (optional for development)');
      }
    } catch (error) {
      this.addError(`Failed to read package.json: ${error.message}`);
    }
  }

  // Recursively search for files
  findFiles(dir, extensions = ['.ts', '.js'], exclude = ['node_modules', 'dist', '.git']) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !exclude.includes(item)) {
          files.push(...this.findFiles(fullPath, extensions, exclude));
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
    
    return files;
  }

  // Check for console.* usage
  validateConsoleUsage() {
    this.addInfo('Checking for console.* usage...');
    
    const files = this.findFiles('./src');
    let consoleUsageFound = false;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.match(/console\.(log|error|warn|info|debug)/)) {
            this.addError(`console.* usage found in ${file}:${index + 1}`);
            consoleUsageFound = true;
          }
        });
      } catch (error) {
        // Ignore read errors
      }
    }
    
    if (!consoleUsageFound) {
      this.addSuccess('No console.* usage found in source code');
    }
  }

  // Check for Winston imports
  validateWinstonImports() {
    this.addInfo('Checking for Winston imports...');
    
    const files = this.findFiles('./src');
    let winstonImportsFound = false;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('winston') || content.includes('nest-winston')) {
          this.addError(`Winston import found in ${file}`);
          winstonImportsFound = true;
        }
      } catch (error) {
        // Ignore read errors
      }
    }
    
    if (!winstonImportsFound) {
      this.addSuccess('No Winston imports found');
    }
  }

  // Check for proper Pino usage
  validatePinoUsage() {
    this.addInfo('Checking Pino usage patterns...');
    
    const files = this.findFiles('./src');
    let pinoUsageFound = false;
    let improperLogMethodFound = false;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('PinoLogger')) {
          pinoUsageFound = true;
        }
        
        // Check for incorrect .log() usage (should be .info())
        if (content.match(/logger\.log\(/)) {
          this.addError(`Incorrect logger.log() usage found in ${file} (should be logger.info())`);
          improperLogMethodFound = true;
        }
      } catch (error) {
        // Ignore read errors
      }
    }
    
    if (pinoUsageFound) {
      this.addSuccess('PinoLogger usage found');
    } else {
      this.addWarning('No PinoLogger usage found - check if logging is properly configured');
    }
    
    if (!improperLogMethodFound) {
      this.addSuccess('No incorrect logger.log() usage found');
    }
  }

  // Check for logging module
  validateLoggingModule() {
    this.addInfo('Checking logging module structure...');
    
    const requiredFiles = [
      'src/modules/infrastructure/logging/index.ts',
      'src/modules/infrastructure/logging/logging.module.ts',
      'src/modules/infrastructure/logging/config/pino.config.ts',
      'src/modules/infrastructure/logging/utils/graceful-shutdown.util.ts'
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.addSuccess(`Logging module file exists: ${file}`);
      } else {
        this.addError(`Missing logging module file: ${file}`);
      }
    }
  }

  // Check infrastructure modules integration
  validateInfrastructureIntegration() {
    this.addInfo('Checking infrastructure modules integration...');
    
    try {
      const indexFile = 'src/modules/infrastructure/index.ts';
      if (fs.existsSync(indexFile)) {
        const content = fs.readFileSync(indexFile, 'utf8');
        
        if (content.includes('LoggingModule')) {
          this.addSuccess('LoggingModule integrated in infrastructure modules');
        } else {
          this.addError('LoggingModule not integrated in infrastructure modules');
        }
        
        if (content.includes('LoggingModule, // Must be first')) {
          this.addSuccess('LoggingModule properly positioned first in modules array');
        } else {
          this.addWarning('LoggingModule should be first in INFRASTRUCTURE_MODULES array');
        }
      } else {
        this.addError('Infrastructure modules index file not found');
      }
    } catch (error) {
      this.addError(`Failed to check infrastructure integration: ${error.message}`);
    }
  }

  // Run all validations
  validate() {
    console.log(`${BLUE}🔍 Validating Pino Logging Migration...${RESET}\n`);
    
    this.validateDependencies();
    this.validateConsoleUsage();
    this.validateWinstonImports();
    this.validatePinoUsage();
    this.validateLoggingModule();
    this.validateInfrastructureIntegration();
    
    // Summary
    console.log(`\n${BLUE}📊 Validation Summary:${RESET}`);
    console.log(`${GREEN}✅ Successes: ${this.successes.length}${RESET}`);
    console.log(`${YELLOW}⚠️  Warnings: ${this.warnings.length}${RESET}`);
    console.log(`${RED}❌ Errors: ${this.errors.length}${RESET}`);
    
    if (this.errors.length === 0) {
      console.log(`\n${GREEN}🎉 All validations passed! Pino migration is complete.${RESET}`);
      return true;
    } else {
      console.log(`\n${RED}❌ Migration validation failed. Please fix the errors above.${RESET}`);
      return false;
    }
  }
}

// Run validation
const validator = new LoggingValidator();
const success = validator.validate();
process.exit(success ? 0 : 1);