// backend/scripts/test-dashboard.js (Enhanced with Auto-Open)
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('🎯 Starting ClinicQueue Test Dashboard...\n');
console.log('═'.repeat(60));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorText(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function runCommand(command, description) {
  console.log(`\n${colorText('🔄', 'yellow')} ${colorText(description, 'bright')}`);
  console.log(colorText(`   Command: ${command}`, 'cyan'));
  
  try {
    const startTime = Date.now();
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(colorText(`   ✅ Completed in ${duration}s`, 'green'));
    return true;
  } catch (error) {
    console.log(colorText(`   ❌ Failed`, 'red'));
    return false;
  }
}

async function openInBrowser(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const absolutePath = path.resolve(filePath);
  let command;

  try {
    if (process.platform === 'win32') {
      command = `start "" "${absolutePath}"`;
    } else if (process.platform === 'darwin') {
      command = `open "${absolutePath}"`;
    } else {
      command = `xdg-open "${absolutePath}"`;
    }
    
    await execAsync(command);
    return true;
  } catch (error) {
    return false;
  }
}

async function displayReportLinks() {
  console.log('\n' + '═'.repeat(60));
  console.log(colorText('📊 TEST REPORTS GENERATED', 'bright'));
  console.log('═'.repeat(60));
  
  const reports = [
    {
      path: path.join(__dirname, '../coverage/lcov-report/index.html'),
      name: '📈 HTML Coverage Report',
      description: 'Line-by-line code coverage analysis',
      priority: 1
    },
    {
      path: path.join(__dirname, '../coverage/html-report/test-report.html'),
      name: '🧪 HTML Test Report', 
      description: 'Detailed test results and failures',
      priority: 2
    }
  ];
  
  let hasReports = false;
  
  for (const report of reports.sort((a, b) => a.priority - b.priority)) {
    if (fs.existsSync(report.path)) {
      const absolutePath = path.resolve(report.path);
      console.log(`\n${colorText(report.name, 'green')}`);
      console.log(`   📁 ${colorText(absolutePath, 'cyan')}`);
      console.log(`   📝 ${report.description}`);
      
      // Try to auto-open the coverage report
      if (report.priority === 1) {
        console.log(colorText('\n   🚀 Attempting to open in browser...', 'yellow'));
        const opened = await openInBrowser(report.path);
        if (opened) {
          console.log(colorText('   ✅ Successfully opened in browser!', 'green'));
        } else {
          console.log(colorText('   ⚠️  Could not auto-open. Copy the path above into your browser.', 'yellow'));
        }
      }
      
      // Provide open command
      if (process.platform === 'win32') {
        console.log(`   🖥️  Manual open: ${colorText(`start "" "${absolutePath}"`, 'yellow')}`);
      } else if (process.platform === 'darwin') {
        console.log(`   🖥️  Manual open: ${colorText(`open "${absolutePath}"`, 'yellow')}`);
      } else {
        console.log(`   🖥️  Manual open: ${colorText(`xdg-open "${absolutePath}"`, 'yellow')}`);
      }
      
      hasReports = true;
    }
  }
  
  if (!hasReports) {
    console.log(colorText('\n   ⚠️  No test reports were generated', 'yellow'));
  }
}

function displayTestSummary() {
  const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
  
  if (fs.existsSync(coveragePath)) {
    try {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverageData.total;
      
      console.log('\n' + '═'.repeat(60));
      console.log(colorText('📈 COVERAGE SUMMARY', 'bright'));
      console.log('═'.repeat(60));
      
      const metrics = [
        { name: 'Lines', value: total.lines.pct, key: 'lines' },
        { name: 'Statements', value: total.statements.pct, key: 'statements' },
        { name: 'Functions', value: total.functions.pct, key: 'functions' },
        { name: 'Branches', value: total.branches.pct, key: 'branches' }
      ];
      
      metrics.forEach(metric => {
        const percentage = metric.value;
        const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red';
        const bars = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
        
        console.log(`\n   ${metric.name}:`);
        console.log(`   ${colorText(bars, color)} ${colorText(percentage.toFixed(1) + '%', color)}`);
        console.log(`   📊 Covered: ${total[metric.key].covered}/${total[metric.key].total} lines`);
      });
      
    } catch (error) {
      console.log(colorText('\n   ⚠️  Could not read coverage summary', 'yellow'));
    }
  }
}

async function main() {
  try {
    // Step 1: Run tests with basic reporting
    console.log(colorText('\n📋 STEP 1: Running Tests', 'bright'));
    const testsPassed = runCommand(
      'cross-env NODE_ENV=test jest --config jest.config.js --verbose --colors --passWithNoTests',
      'Executing test suite with verbose output'
    );
    
    if (!testsPassed) {
      console.log(colorText('\n⚠️  Tests failed, but continuing with report generation...', 'yellow'));
    }
    
    // Step 2: Generate coverage report
    console.log(colorText('\n📋 STEP 2: Generating Coverage Reports', 'bright'));
    runCommand(
      'cross-env NODE_ENV=test jest --config jest.config.js --coverage --coverageReporters=html,json,text,lcov --silent',
      'Generating comprehensive coverage reports'
    );
    
    // Step 3: Display results and open browser
    console.log(colorText('\n📋 STEP 3: Opening Browser Reports', 'bright'));
    await displayReportLinks();
    displayTestSummary();
    
    console.log('\n' + '═'.repeat(60));
    console.log(colorText('🎉 TEST DASHBOARD COMPLETED!', 'bright'));
    console.log('═'.repeat(60));
    
    if (testsPassed) {
      console.log(colorText('\n✅ All tests completed successfully!', 'green'));
    } else {
      console.log(colorText('\n⚠️  Some tests failed. Check the reports above for details.', 'yellow'));
    }
    
    console.log(colorText('\n💡 Tip: The coverage report should open automatically in your browser!', 'cyan'));
    
  } catch (error) {
    console.log(colorText('\n❌ Test dashboard failed:', 'red'));
    console.log(colorText(`   ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Run the dashboard
main();