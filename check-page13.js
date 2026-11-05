const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const converterComp = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace text:', converterComp ? converterComp.length : 0);
    
    const converterComp2 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp2 ? converterComp2.length : 0);
    
    const converterComp3 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', converterComp3 ? converterComp3.length : 0);
    
    const ws = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws ? ws.length : 0);
    
    const ws2 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', ws2 ? ws2.length : 0);
    
    const converterComp3 = data.match(/<[^>]*converter[^>]*>/gi);
    console.log('Converter component:', converterComp3 ? converterComp3.length : 0);
    
    const converterComp4 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp4 ? converterComp4.length : 0);
    
    const wsComp = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', wsComp ? wsComp.length : 0);
    
    const converterComp5 = data.match(/ConverterWorkspace/gi);
    console.log('ConverterWorkspace text:', converterComp5 ? converterComp5.length : 0);
    
    const converterComp6 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp6 ? converterComp6.length : 0);
    
    const wsComp = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', wsComp ? wsComp.length : 0);
    
    const converterComp7 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp7 ? converterComp7.length : 0);
    
    const wsComp2 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', wsComp2 ? wsComp2.length : 0);
    
    const converterComp8 = data.match(/<[^>]*ConverterWorkspace[^>]*>/gi);
    console.log('ConverterWorkspace component:', converterComp8 ? converterComp8.length : 0);
    
    const wsComp3 = data.match(/converter-workspace/gi);
    console.log('Converter workspace class:', wsComp3 ? wsComp3.length : 0);
  });
}).on('error', console.error);