const API_BASE_URL = 'http://localhost:5000/api/v1/admin';

async function run() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fuelpoint.com', password: 'password' }) // try default
    });
    const json = await res.json();
    console.log("Login:", json);
    
    if (json.data && json.data.token) {
      const token = json.data.token;
      console.log("Got token.");
      
      const endpoints = ['/profile', '/customers', '/groups', '/notifications', '/workers', '/transactions'];
      
      for (const ep of endpoints) {
        const res2 = await fetch(`${API_BASE_URL}${ep}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data2 = await res2.json();
        console.log(`\nEndpoint: ${ep}`);
        console.log("Status:", res2.status);
        console.log("Has data property?", 'data' in data2);
        console.log("Is array?", Array.isArray(data2));
        if (data2.data) {
           console.log("Is data property an array?", Array.isArray(data2.data));
           console.log("Type of data property:", typeof data2.data);
           if (ep === '/transactions') {
               console.log("Transactions data length:", data2.data.length);
               console.log("Transactions keys if object:", Object.keys(data2.data));
           }
        }
      }
    } else {
        console.log("No token found. Login failed?", json);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
