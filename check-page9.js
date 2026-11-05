const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Check for the actual chunk/module error context
    const chunkError = data.match(/chunk.*fail|chunk.*error/gi);
    console.log('Chunk errors:', chunkError ? chunkError.length : 0);
    if (chunkError) {
      chunkError.forEach((e, i) => {
        const idx = data.indexOf(e);
        console.log('  Chunk error ' + i + ':', data.substring(Math.max(0, idx - 100), idx + 100));
      });
    }
    
    const moduleError = data.match(/Module.*fail|Module.*error/gi);
    console.log('Module errors:', moduleError ? moduleError.length : 0);
    if (moduleError) {
      moduleError.forEach((e, i) => {
        const idx = data.indexOf(e);
        console.log('  Module error ' + i + ':', data.substring(Math.max(0, idx - 100), idx + 100));
      });
    }
    
    const reactError = data.match(/react.*error|error.*react/gi);
    console.log('React errors:', reactError ? reactError.length : 0);
    if (reactError) {
      reactError.forEach((e, i) => {
        const idx = data.indexOf(e);
        console.log('  React error ' + i + ':', data.substring(Math.max(0, idx - 100), idx + 100));
      });
    }
    
    // Check for the actual error in the page
    const errorDivs = data.match(/<div[^>]*class="[^"]*error[^"]*"[^>]*>/gi);
    console.log('Error divs:', errorDivs ? errorDivs.length : 0);
    if (errorDivs) {
      errorDivs.forEach((e, i) => console.log('  Error div ' + i + ':', e.substring(0, 200)));
    }
    
    // Check for any error messages in the page
    const errorText = data.match(/error|Error|failed|Failed/gi);
    console.log('Error text mentions:', errorText ? errorText.length : 0);
    
    // Check for the actual error message in the page
    const errorMsg = data.match(/Failed to load|failed to load|could not load|could not find/gi);
    console.log('Load failures:', errorMsg ? errorMsg.length : 0);
    if (errorMsg) {
      errorMsg.forEach((e, i) => {
        const idx = data.indexOf(e);
        console.log('  Load failure ' + i + ':', data.substring(Math.max(0, idx - 100), idx + 100));
      });
    }
    
    // Check for the actual error in the page
    const errorBoundary = data.match(/ErrorBoundary/gi);
    console.log('ErrorBoundary:', errorBoundary ? errorBoundary.length : 0);
    
    // Check for the actual error message in the page
    const errorMessage = data.match(/Something went wrong|Something went wrong|An error occurred/gi);
    console.log('Error messages:', errorMessage ? errorMessage.length : 0);
    
    // Check for the actual error in the page
    const reactError = data.match(/react.*error|error.*react/gi);
    console.log('React errors:', reactError ? reactError.length : 0);
    
    // Check for the actual error in the page
    const jsError = data.match(/TypeError|ReferenceError|SyntaxError/gi);
    console.log('JS Errors:', jsError ? jsError.length : 0);
    
    // Check for the actual error in the page
    const chunkError = data.match(/chunk.*fail|chunk.*error/gi);
    console.log('Chunk errors:', chunkError ? chunkError.length : 0);
    if (chunkError) {
      chunkError.forEach((e, i) => {
        const idx = data.indexOf(e);
        console.log('  Chunk error ' + i + ':', data.substring(Math.max(0, idx - 100), idx + 100));
      });
    }
    
    // Check for the actual error in the page
    const moduleError = data.match(/Module.*fail|Module.*error/gi);
    console.log('Module errors:', moduleError ? moduleError.length : 0);
    if (moduleError) {
      moduleError.forEach((e, i) => {
        const idx = data.indexOf(e);
        console.log('  Module error ' + i + ':', data.substring(Math.max(0, idx - 100), idx + 100));
      });
    }
  });
}).on('error', console.error);