const fs = require('fs');

const collectionPath = 'postman/Smart-Space-Booking.postman_collection.json';
const rootCollectionPath = 'UKK_Paket_B_Coworking_Space.postman_collection.json';
const envPath = 'postman/Smart-Space-Booking-Local.postman_environment.json';

const col = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Helper to set both collection and environment variables
function setVarScript(varName, valueExpression) {
  return [
    `if (${valueExpression}) {`,
    `    pm.collectionVariables.set("${varName}", String(${valueExpression}));`,
    `    if (pm.environment) pm.environment.set("${varName}", String(${valueExpression}));`,
    `    console.log("${varName} updated:", String(${valueExpression}));`,
    `}`
  ];
}

// 1. Traverse all items and configure tests, auth headers, and url variables
function processItems(items, folderName = '') {
  for (const item of items) {
    if (item.item) {
      processItems(item.item, item.name);
      continue;
    }

    const req = item.request;
    if (!req) continue;

    // Remove any x-maker-key
    if (req.header) {
      req.header = req.header.filter(h => h.key.toLowerCase() !== 'x-maker-key');
    }

    // Clean description
    if (req.description) {
      req.description = req.description.replace(/\nHeader: x-maker-key:.*$/gm, '').trim();
    }

    // Set proper auth headers
    const isAdmin = folderName.includes('Panel Admin');
    const isMemberAuth = folderName.includes('Reservasi Member') || item.name.includes('profile') || item.name.includes('logout');

    if (isAdmin) {
      // Ensure Authorization Bearer {{token_admin}}
      req.header = req.header.filter(h => h.key.toLowerCase() !== 'authorization');
      req.header.push({
        key: 'Authorization',
        value: 'Bearer {{token_admin}}',
        description: 'Token JWT Admin Coworking Space'
      });
    } else if (isMemberAuth) {
      // Ensure Authorization Bearer {{token_member}}
      req.header = req.header.filter(h => h.key.toLowerCase() !== 'authorization');
      req.header.push({
        key: 'Authorization',
        value: 'Bearer {{token_member}}',
        description: 'Token JWT Member Coworking Space'
      });
    }

    // Fix availability query
    if (item.name.includes('/api/spaces/availability')) {
      req.url.raw = '{{baseUrl}}/api/spaces/availability?id_space={{space_id}}&tanggal=2026-10-15&jam_mulai=09:00&durasi_jam=3';
      req.url.query = [
        { key: 'id_space', value: '{{space_id}}' },
        { key: 'tanggal', value: '2026-10-15' },
        { key: 'jam_mulai', value: '09:00' },
        { key: 'durasi_jam', value: '3' }
      ];
    }

    // Fix PUT /api/admin/profile body
    if (item.name.includes('PUT /api/admin/profile')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          nama_coworking: 'Moklet Hub Coworking Space (Updated)',
          nama_pemilik: 'Ahmad Bidin, S.Kom',
          telp: '081298765432',
          alamat: 'Jl. Danau Ranau No. 1, Sawojajar, Malang',
          deskripsi: 'Coworking space modern diperbarui dengan koneksi gigabit dan workstation ergonomis.'
        }, null, 2)
      };
    }

    // Update url.variable bindings to dynamic variables
    if (req.url && req.url.variable) {
      req.url.variable = req.url.variable.map(v => {
        if (v.key === 'id') {
          let varName = 'space_id';
          const raw = req.url.raw || '';
          if (raw.includes('/spaces/')) varName = 'space_id';
          else if (raw.includes('/members/')) varName = 'member_id';
          else if (raw.includes('/diskon/')) varName = 'diskon_id';
          else if (raw.includes('/reservasi/')) varName = 'reservasi_id';
          return {
            ...v,
            value: `{{${varName}}}`
          };
        }
        return v;
      });
    }

    // Configure Test Scripts
    if (!item.event) item.event = [];
    let testEvent = item.event.find(e => e.listen === 'test');
    if (!testEvent) {
      testEvent = { listen: 'test', script: { type: 'text/javascript', exec: [] } };
      item.event.push(testEvent);
    }

    const testLines = [
      `pm.test("${item.name.replace(/"/g, '')} - Status 200/201", function () {`,
      `    pm.expect([200, 201]).to.include(pm.response.code);`,
      `});`
    ];

    // Specific extra logic for key endpoints
    if (item.name.includes('register/member')) {
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.access_token) {`,
        `        pm.collectionVariables.set("token_member", res.data.access_token);`,
        `        if (pm.environment) pm.environment.set("token_member", res.data.access_token);`,
        `    }`,
        `    if (res.data && res.data.member && res.data.member.id) {`,
        `        pm.collectionVariables.set("member_id", String(res.data.member.id));`,
        `        if (pm.environment) pm.environment.set("member_id", String(res.data.member.id));`,
        `    }`,
        `}`
      );
    } else if (item.name.includes('register/admin-space')) {
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.access_token) {`,
        `        pm.collectionVariables.set("token_admin", res.data.access_token);`,
        `        if (pm.environment) pm.environment.set("token_admin", res.data.access_token);`,
        `    }`,
        `}`
      );
    } else if (item.name.includes('Login Akun Member') || item.name.includes('Login Member')) {
      testLines.push(
        `if (pm.response.code === 200) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.access_token) {`,
        `        pm.collectionVariables.set("token_member", res.data.access_token);`,
        `        if (pm.environment) pm.environment.set("token_member", res.data.access_token);`,
        `    }`,
        `    if (res.data && res.data.member && res.data.member.id) {`,
        `        pm.collectionVariables.set("member_id", String(res.data.member.id));`,
        `        if (pm.environment) pm.environment.set("member_id", String(res.data.member.id));`,
        `    }`,
        `}`
      );
    } else if (item.name.includes('Login Admin')) {
      testLines.push(
        `if (pm.response.code === 200) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.access_token) {`,
        `        pm.collectionVariables.set("token_admin", res.data.access_token);`,
        `        if (pm.environment) pm.environment.set("token_admin", res.data.access_token);`,
        `    }`,
        `}`
      );
    } else if (item.name.includes('POST /api/admin/spaces')) {
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.id) {`,
        `        pm.collectionVariables.set("space_id", String(res.data.id));`,
        `        if (pm.environment) pm.environment.set("space_id", String(res.data.id));`,
        `    }`,
        `}`
      );
    } else if (item.name.includes('POST /api/admin/members')) {
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.id) {`,
        `        pm.collectionVariables.set("member_id", String(res.data.id));`,
        `        if (pm.environment) pm.environment.set("member_id", String(res.data.id));`,
        `    }`,
        `}`
      );
    } else if (item.name.includes('POST /api/admin/diskon')) {
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.id) {`,
        `        pm.collectionVariables.set("diskon_id", String(res.data.id));`,
        `        if (pm.environment) pm.environment.set("diskon_id", String(res.data.id));`,
        `    }`,
        `}`
      );
    } else if (item.name.includes('POST /api/reservasi')) {
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.id) {`,
        `        pm.collectionVariables.set("reservasi_id", String(res.data.id));`,
        `        if (pm.environment) pm.environment.set("reservasi_id", String(res.data.id));`,
        `    }`,
        `}`
      );
    }

    testEvent.script.exec = testLines;
  }
}

processItems(col.item);

// Write refined collection to both files
fs.writeFileSync(collectionPath, JSON.stringify(col, null, 2));
fs.writeFileSync(rootCollectionPath, JSON.stringify(col, null, 2));
console.log('Collection files successfully refined and synced!');
