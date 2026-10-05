import http from 'http';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      console.log('--- BROWSER ERROR ---');
      console.log(body);
      res.end('OK');
    });
  } else {
    res.end();
  }
});
server.listen(9999, () => console.log('Logger on 9999'));
