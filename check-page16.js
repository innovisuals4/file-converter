const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const ws = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws ? ws.length : 0);
    
    const cw = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace text:', cw ? cw.length : 0);
    
    const cw2 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', cw2 ? cw2.length : 0);
    
    const cw3 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', cw3 ? cw3.length : 0);
    
    // Check for the actual converter workspace div
    const ws2 = data.match(/class="[^"]*converter-workspace[^"]*"/gi);
    console.log('Converter workspace class attr:', ws2 ? ws2.length : 0);
    
    // Check for the actual converter component in the DOM
    const cw4 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', cw4 ? cw4.length : 0);
    
    // Check for the actual converter component in the DOM
    const ws3 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws3 ? ws3.length : 0);
  });
}).on('error', console.error);