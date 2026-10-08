const fs = require('fs');

async function run() {
  const formData = new FormData();
  formData.append('file', new Blob(['dummy pdf content'], { type: 'application/pdf' }), 'test.pdf');
  
  const res = await fetch('http://localhost:3000/api/admin/parse-pdf', {
    method: 'POST',
    body: formData
  });
  
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
run();
