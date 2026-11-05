const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Check for console errors in the HTML
    const errorMatches = data.match(/console\.error|console\.warn|Error|error/gi);
    console.log('Error mentions:', errorMatches ? errorMatches.length : 0);
    
    // Look for React error boundaries or error messages
    const reactErrors = data.match(/react|hydrat|mount|hydrat/gi);
    console.log('React/hydration mentions:', reactErrors ? reactErrors.length : 0);
    
    // Check for actual error elements
    const errorDivs = data.match(/class="[^"]*error[^"]*"|id="[^"]*error[^"]*"/gi);
    console.log('Error divs:', errorDivs ? errorDivs.length : 0);
    
    // Check for ConverterWorkspace in page
    const wsMatch = data.match(/ConverterWorkspace|converter-workspace/gi);
    console.log('Workspace mentions:', wsMatch ? wsMatch.length : 0);
    
    // Check for ConverterWorkspace component
    const wsComp = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace component:', wsComp ? wsComp.length : 0);
    
    // Look for error boundary
    const errorBoundary = data.match(/ErrorBoundary|error boundary|componentDidCatch/gi);
    console.log('Error boundary:', errorBoundary ? errorBoundary.length : 0);
    
    // Check for JavaScript errors in script tags
    const scripts = data.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
    console.log('Script tags:', scripts ? scripts.length : 0);
    
    // Look for specific error patterns
    const errors = data.match(/Uncaught|TypeError|ReferenceError|SyntaxError|Error:/gi);
    console.log('JS Errors:', errors ? errors.length : 0);
    
    // Check for actual converter content
    const converterDiv = data.match(/converter|workspace/gi);
    console.log('Converter/workspace mentions:', converterDiv ? converterDiv.length : 0);
    
    // Look for the actual main content
    const mainStart = data.indexOf('<main');
    if (mainStart >= 0) {
      const mainEnd = data.indexOf('</main>', mainStart);
      const mainContent = data.substring(mainStart, mainEnd >= 0 ? mainEnd : mainStart + 5000);
      console.log('\n=== MAIN CONTENT ===');
      console.log(mainContent.substring(0, 2000));
    }
  });
}).on('error', console.error);