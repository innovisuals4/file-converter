import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs';

async function createTestFiles() {
  // Create test PDF (3 pages)
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([200, 200]);
  pdfDoc.addPage([200, 200]);
  pdfDoc.addPage([200, 200]);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test.pdf', pdfBytes);
  console.log('Created test.pdf:', pdfBytes.length, 'bytes');
  
  // Create test image
  await sharp({ create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } } })
    .png()
    .toFile('test-image.png');
  console.log('Created test-image.png');
  
  // Create text files
  fs.writeFileSync('test.txt', 'Hello world\nThis is a test document.');
  console.log('Created test.txt');
  
  fs.writeFileSync('test.csv', 'name,age\nJohn,30\nJane,25');
  console.log('Created test.csv');
  
  fs.writeFileSync('test.json', JSON.stringify({ name: 'John', age: 30 }));
  console.log('Created test.json');
  
  fs.writeFileSync('test.srt', '1\n00:00:01,000 --> 00:00:04,000\nHello world');
  console.log('Created test.srt');
}
createTestFiles().catch(console.error);