const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Check for hydration issues
    const hydration = data.match(/hydrat/gi);
    console.log('Hydration mentions:', hydration ? hydration.length : 0);
    
    const suppress = data.match(/suppressHydrationWarning/gi);
    console.log('suppressHydrationWarning:', suppress ? suppress.length : 0);
    
    // Check for the actual converter workspace
    const workspace = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', workspace ? workspace.length : 0);
    
    // Check for the actual converter component
    const converter = data.match(/class="[^"]*converter[^"]*"/gi);
    console.log('Converter class:', converter ? converter.length : 0);
    
    // Check for the actual workspace component
    const ws = data.match(/class="[^"]*workspace[^"]*"/gi);
    console.log('Workspace class:', workspace ? workspace.length : 0);
    
    // Check for the actual converter component rendering
    const converterDiv = data.match(/<div[^>]*class="[^"]*converter[^"]*"[^>]*>/gi);
    console.log('Converter div:', converterDiv ? converterDiv.length : 0);
    
    // Check for the actual workspace component rendering
    const wsDiv = data.match(/<div[^>]*class="[^"]*converter-workspace[^"]*"[^>]*>/gi);
    console.log('Converter workspace div:', wsDiv ? wsDiv.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', converterComp ? converterComp.length : 0);
    
    // Check for the actual converter workspace component
    const wsComp = data.match(/<[^>]*converter-workspace[^>]*>/gi);
    console.log('Converter workspace component:', wsComp ? wsComp.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp2 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp2 ? converterComp2.length : 0);
    
    // Check for the actual converter workspace component
    const wsComp2 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component2:', wsComp2 ? wsComp2.length : 0);
    
    // Check for the actual converter component in the DOM
    const converterComp3 = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace text:', converterComp3 ? converterComp3.length : 0);
  });
}).on('error', console.error);