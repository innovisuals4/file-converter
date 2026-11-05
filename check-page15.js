const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const r1 = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace text:', r1 ? r1.length : 0);
    
    const r2 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', r2 ? r2.length : 0);
    
    const r3 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', r3 ? r3.length : 0);
    
    const r4 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', r4 ? r4.length : 0);
    
    const r5 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', r5 ? r5.length : 0);
    
    const r6 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', r6 ? r6.length : 0);
    
    const r7 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', r7 ? r7.length : 0);
    
    const r8 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', r8 ? r8.length : 0);
    
    const r9 = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace text:', r9 ? r9.length : 0);
    
    const r10 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', r10 ? r10.length : 0);
    
    const r11 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', r11 ? r11.length : 0);
    
    const r12 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', r12 ? r12.length : 0);
    
    const r13 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', r13 ? r13.length : 0);
    
    const r14 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', r14 ? r14.length : 0);
    
    const r15 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', r15 ? r15.length : 0);
  });
}).on('error', console.error);