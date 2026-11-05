const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const cw1 = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace text:', cw1 ? cw1.length : 0);
    
    const cw2 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', cw2 ? cw2.length : 0);
    
    const cw3 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', cw3 ? cw3.length : 0);
    
    const ws1 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws1 ? ws1.length : 0);
    
    const ws2 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws2 ? ws2.length : 0);
    
    const cw3 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', cw3 ? cw3.length : 0);
    
    const cw4 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', cw4 ? cw4.length : 0);
    
    const ws3 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws3 ? ws3.length : 0);
    
    const cw5 = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace text:', cw5 ? cw5.length : 0);
    
    const cw6 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', cw6 ? cw6.length : 0);
    
    const ws7 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws7 ? ws7.length : 0);
    
    const cw7 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', cw7 ? cw7.length : 0);
    
    const ws8 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws8 ? ws8.length : 0);
    
    const cw8 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', cw8 ? cw8.length : 0);
    
    const ws9 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws9 ? ws9.length : 0);
  });
}).on('error', console.error);