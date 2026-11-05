const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');

function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const types = {
    png: 'image/png',
    pdf: 'application/pdf',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    srt: 'application/x-subrip'
  };
  return types[ext] || 'application/octet-stream';
}

async function testConversion(from, to, filename, options = {}) {
  return new Promise((resolve) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(filename), { filename, contentType: getContentType(filename) });
    form.append('target', to);
    if (Object.keys(options).length > 0) form.append('options', JSON.stringify(options));
    
    const req = https.request({
      hostname: 'transmute-theta.vercel.app',
      path: '/api/convert',
      method: 'POST',
      headers: form.getHeaders()
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ ' + from + ' -> ' + to + ': OK (' + res.headers['content-type'] + ')');
        } else {
          console.log('❌ ' + from + ' -> ' + to + ': ' + res.statusCode + ' - ' + data.substring(0, 200));
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ ' + from + ' -> ' + to + ': ' + e.message);
      resolve();
    });
    
    form.pipe(req);
  });
}

async function runTests() {
  // Create test files
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([200, 200]);
  pdfDoc.addPage([200, 200]);
  pdfDoc.addPage([200, 200]);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test.pdf', pdfBytes);
  console.log('Created test.pdf:', pdfBytes.length, 'bytes');
  
  await sharp({ create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } } })
    .png()
    .toFile('test-image.png');
  console.log('Created test-image.png');
  
  fs.writeFileSync('test.txt', 'Hello world\nThis is a test document.');
  fs.writeFileSync('test.csv', 'name,age\nJohn,30\nJane,25');
  fs.writeFileSync('test.json', JSON.stringify({ name: 'John', age: 30 }));
  fs.writeFileSync('test.srt', '1\n00:00:01,000 --> 00:00:04,000\nHello world');
  
  console.log('Test files created. Running tests...\n');
  
  // Image conversions
  await testConversion('png', 'webp', 'test-image.png', 'PNG->WebP');
  await testConversion('png', 'jpg', 'test-image.png', 'PNG->JPG');
  await testConversion('png', 'avif', 'test-image.png', 'PNG->AVIF');
  await testConversion('png', 'tif', 'test-image.png', 'PNG->TIF');
  await testConversion('png', 'gif', 'test-image.png', 'PNG->GIF');
  await testConversion('png', 'ico', 'test-image.png', 'PNG->ICO');
  await testConversion('png', 'bmp', 'test-image.png', 'PNG->BMP');
  await testConversion('png', 'zip', 'test-image.png', 'PNG->ZIP');
  
  // Document conversions
  await testConversion('txt', 'pdf', 'test.txt', 'TXT->PDF');
  await testConversion('txt', 'md', 'test.txt', 'TXT->MD');
  await testConversion('txt', 'html', 'test.txt', 'TXT->HTML');
  await testConversion('csv', 'xlsx', 'test.csv', 'CSV->XLSX');
  await testConversion('csv', 'json', 'test.csv', 'CSV->JSON');
  await testConversion('csv', 'tsv', 'test.csv', 'CSV->TSV');
  await testConversion('json', 'yaml', 'test.json', 'JSON->YAML');
  await testConversion('json', 'xml', 'test.json', 'JSON->XML');
  await testConversion('srt', 'vtt', 'test.srt', 'SRT->VTT');
  await testConversion('srt', 'txt', 'test.srt', 'SRT->TXT');
  
  // PDF operations
  await testConversion('pdf', 'pdf', 'test.pdf', 'PDF Rotate', { operation: 'rotate', angle: 90 });
  await testConversion('pdf', 'pdf', 'test.pdf', 'PDF Delete', { operation: 'delete', pages: '1' });
  await testConversion('pdf', 'pdf', 'test.pdf', 'PDF Extract', { operation: 'extract', pages: '1,3' });
  await testConversion('pdf', 'pdf', 'test.pdf', 'PDF Reorder', { operation: 'reorder', pages: '3,1,2' });
  await testConversion('pdf', 'pdf', 'test.pdf', 'PDF Page Numbers', { operation: 'pagenumbers', format: '1/10' });
  await testConversion('pdf', 'pdf', 'test.pdf', 'PDF Watermark', { operation: 'watermark', text: 'TEST' });
  await testConversion('pdf', 'pdf', 'test.pdf', 'PDF Bates', { operation: 'bates', prefix: 'DOC-' });
  await testConversion('pdf', 'pdf', 'test.pdf', 'PDF Compress', { operation: 'compress', compressLevel: 'medium' });
  
  console.log('\nAll tests completed!');
}

async function testConversion(from, to, filename, name, options = {}) {
  return new Promise((resolve) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(filename), { filename, contentType: getContentType(filename) });
    form.append('target', to);
    if (Object.keys(options).length > 0) form.append('options', JSON.stringify(options));
    
    const req = https.request({
      hostname: 'transmute-theta.vercel.app',
      path: '/api/convert',
      method: 'POST',
      headers: form.getHeaders()
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ ' + name + ': OK (' + res.headers['content-type'] + ')');
        } else {
          console.log('❌ ' + name + ': ' + res.statusCode + ' - ' + data.substring(0, 200));
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ ' + name + ': ' + err.message);
      resolve();
    });
    
    form.pipe(req);
  });
}

runTests().catch(console.error);