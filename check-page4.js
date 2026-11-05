const https = require('https');

https.get('https://transmute-theta.vercel.app/convert/png-to-webp', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Check for script tags with src
    const scripts = data.match(/<script[^>]*src="([^"]+)"[^>]*>/gi);
    console.log('Script tags with src:', scripts ? scripts.length : 0);
    if (scripts) {
      scripts.slice(0, 10).forEach(s => console.log('  ', s.substring(0, 120)));
    }
    
    // Check for modulepreload
    const preloads = data.match(/<link[^>]*rel="modulepreload"[^>]*>/gi);
    console.log('Module preloads:', preloads ? preloads.length : 0);
    
    // Check for webpack runtime
    const webpack = data.match(/webpack/gi);
    console.log('Webpack mentions:', webpack ? webpack.length : 0);
    
    // Check for next.js specific
    const next = data.match(/next\.js|__next/gi);
    console.log('Next.js mentions:', next ? next.length : 0);
    
    // Check for hydration error
    const hydrationError = data.match(/Hydration|hydration/gi);
    console.log('Hydration error mentions:', hydrationError ? hydrationError.length : 0);
    
    // Check for error boundary
    const errorBoundary = data.match(/ErrorBoundary|error-boundary/gi);
    console.log('Error boundary:', errorBoundary ? errorBoundary.length : 0);
    
    // Check for react-dom
    const reactDom = data.match(/react-dom/gi);
    console.log('react-dom:', reactDom ? reactDom.length : 0);
    
    // Check for react
    const react = data.match(/react/gi);
    console.log('React mentions:', react ? react.length : 0);
  });
}).on('error', console.error);