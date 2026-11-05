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
  });
}).on('error', console.error);