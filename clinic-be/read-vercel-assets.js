const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const homepage = 'https://clinic-stride-aid.vercel.app';

async function main() {
  console.log(`Fetching homepage ${homepage}...`);
  const res = await fetch(homepage);
  const html = await res.text();
  console.log('Homepage fetched.');

  // Find all js script tags (e.g. /assets/index-*.js)
  const scriptRegex = /src="([^"]+\.js)"/g;
  let match;
  const scriptUrls = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    let src = match[1];
    if (src.startsWith('/')) {
      src = homepage + src;
    } else if (!src.startsWith('http')) {
      src = homepage + '/' + src;
    }
    scriptUrls.push(src);
  }

  console.log('Found script URLs:', scriptUrls);

  for (const url of scriptUrls) {
    console.log(`\nFetching script: ${url}...`);
    const scriptRes = await fetch(url);
    const code = await scriptRes.text();
    console.log(`Fetched ${code.length} bytes.`);

    // Let's search for baseURL or api/v1 or URLs
    const urlMatches = code.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}[a-zA-Z0-9./_-]*/g) || [];
    const filteredUrls = urlMatches.filter(u => !u.includes('vercel.app') && !u.includes('w3.org') && !u.includes('vitejs.dev') && !u.includes('react.dev'));
    if (filteredUrls.length > 0) {
      console.log('Found potential backend URLs in script:');
      console.log([...new Set(filteredUrls)]);
    }

    // Search for base URL configuration context
    const apiIndex = code.indexOf('/api/v1');
    if (apiIndex !== -1) {
      console.log('Found "/api/v1" at index:', apiIndex);
      const surrounding = code.substring(Math.max(0, apiIndex - 100), Math.min(code.length, apiIndex + 100));
      console.log('Surrounding code snippet:', surrounding);
    }
  }
}

main().catch(console.error);
