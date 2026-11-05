const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Check for hydration issues
    const hydration = data.match(/hydrat/gi);
    console.log('Hydration mentions:', hydration ? hydration.length : 0);
    
    // Check for suppressHydrationWarning
    const suppress = data.match(/suppressHydrationWarning/gi);
    console.log('suppressHydrationWarning:', suppress ? suppress.length : 0);
    
    // Check for data-reactroot
    const reactRoot = data.match(/data-reactroot/gi);
    console.log('data-reactroot:', reactRoot ? reactRoot.length : 0);
    
    // Check for __NEXT_DATA__
    const nextData = data.match(/__NEXT_DATA__/gi);
    console.log('__NEXT_DATA__:', nextData ? nextData.length : 0);
    
    // Check for module chunks loading
    const chunks = data.match(/_next\/static\/chunks/gi);
    console.log('Chunk loads:', chunks ? chunks.length : 0);
    
    // Check for _next/static/media
    const media = data.match(/_next\/static\/media/gi);
    console.log('Static media:', media ? media.length : 0);
    
    // Check for console.error
    const consoleError = data.match(/console\.error/gi);
    console.log('console.error:', consoleError ? consoleError.length : 0);
    
    // Check for __NEXT_DATA__ content
    const nextDataMatch = data.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
    if (nextDataMatch) {
      try {
        const json = JSON.parse(nextDataMatch[1]);
        console.log('\n__NEXT_DATA__ keys:', Object.keys(json));
        console.log('page:', json.page);
        console.log('query:', json.query);
        console.log('buildId:', json.buildId);
      } catch(e) {
        console.log('Failed to parse __NEXT_DATA__');
      }
    }
  });
}).on('error', console.error);