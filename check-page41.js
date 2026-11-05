const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Check for console.error in the page
    const consoleError = data.match(/console\.error/gi);
    console.log('console.error:', consoleError ? consoleError.length : 0);
    
    // Check for console.warn
    const consoleWarn = data.match(/console\.warn/gi);
    console.log('console.warn:', consoleWarn ? consoleWarn.length : 0);
    
    // Check for the actual error in the page
    const errorDivs = data.match(/<div[^>]*class="[^"]*error[^"]*"[^>]*>/gi);
    console.log('Error divs:', errorDivs ? errorDivs.length : 0);
    
    // Check for any error messages
    const errorText = data.match(/error|Error|failed|Failed/gi);
    console.log('Error text mentions:', errorText ? errorText.length : 0);
    
    // Check for the actual error message in the page
    const errorMsg = data.match(/Failed to load|failed to load|could not load|could not find/gi);
    console.log('Load failures:', errorMsg ? errorMsg.length : 0);
    
    // Check for react error boundary
    const reactError = data.match(/react.*error|error.*react/gi);
    console.log('React errors:', reactError ? reactError.length : 0);
    
    // Check for actual JS errors
    const jsError = data.match(/TypeError|ReferenceError|SyntaxError/gi);
    console.log('JS Errors:', jsError ? jsError.length : 0);
    
    // Check for chunk load errors
    const chunkError = data.match(/chunk.*fail|chunk.*error/gi);
    console.log('Chunk errors:', chunkError ? chunkError.length : 0);
    
    // Check for module errors
    const moduleError = data.match(/Module.*fail|Module.*error/gi);
    console.log('Module errors:', moduleError ? moduleError.length : 0);
    
    // Check for the actual converter component rendering
    const converterComp = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace text:', converterComp ? converterComp.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp2 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp2 ? converterComp2.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp3 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', converterComp3 ? converterComp3.length : 0);
    
    // Check for the actual workspace component
    const ws = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws ? ws.length : 0);
    
    // Check for the actual workspace component
    const ws2 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws2 ? ws2.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp3 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp3 ? converterComp3.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp4 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', converterComp4 ? converterComp4.length : 0);
    
    // Check for the actual workspace component
    const ws = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws ? ws.length : 0);
    
    // Check for the actual workspace component
    const ws2 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws2 ? ws2.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp3 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp3 ? converterComp3.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp4 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', converterComp4 ? converterComp4.length : 0);
    
    // Check for the actual workspace component
    const ws3 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws3 ? ws3.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp5 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp5 ? converterComp5.length : 0);
    
    // Check for the actual converter component in the DOM
    const wsComp = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', wsComp ? wsComp.length : 0);
  });
}).on('error', console.error);