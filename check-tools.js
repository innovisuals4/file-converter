const https = require('https');

https.get('https://transmute-theta.vercel.app/tools', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const searchInput = data.match(/placeholder="[^"]*[Ss]earch[^"]*"/gi);
    console.log('Search input:', searchInput ? searchInput.length : 0);
    if (searchInput) {
      searchInput.forEach((s, i) => console.log('  Search ' + i + ':', s));
    }
    
    const tabs = data.match(/Documents|Images|Video|Audio|Spreadsheets|Presentations|Archives|Other/gi);
    console.log('Tabs mentions:', tabs ? tabs.length : 0);
    
    const tabButtons = data.match(/role="button"[^>]*aria-pressed/gi);
    console.log('Tab buttons:', tabButtons ? tabButtons.length : 0);
    
    const searchInput2 = data.match(/placeholder="Search formats or conversions/gi);
    console.log('Search input placeholder:', searchInput2 ? searchInput2.length : 0);
    
    const tabButtons2 = data.match(/aria-pressed/gi);
    console.log('aria-pressed:', tabButtons2 ? tabButtons2.length : 0);
    
    const categories = data.match(/Documents|Images|Video|Audio|Spreadsheets|Presentations|Archives|Other/gi);
    console.log('Category tabs:', categories ? categories.length : 0);
  });
}).on('error', console.error);