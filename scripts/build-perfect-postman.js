const fs = require('fs');

const collectionPath = 'postman/Smart-Space-Booking.postman_collection.json';
const rootCollectionPath = 'UKK_Paket_B_Coworking_Space.postman_collection.json';
const envPath = 'postman/Smart-Space-Booking-Local.postman_environment.json';

const col = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// 1. Ensure collection variables are complete
col.variable = [
  { key: "baseUrl", value: "http://localhost:3000", type: "string", description: "Base URL server" },
  { key: "token_member", value: "", type: "string", description: "JWT Bearer Member" },
  { key: "token_admin", value: "", type: "string", description: "JWT Bearer Admin" },
  { key: "space_id", value: "1", type: "string", description: "ID Ruangan / Meja Space" },
  { key: "member_id", value: "1", type: "string", description: "ID Member" },
  { key: "diskon_id", value: "1", type: "string", description: "ID Kode Promo" },
  { key: "reservasi_id", value: "1", type: "string", description: "ID Reservasi" },
  { key: "cancel_reservasi_id", value: "1", type: "string", description: "ID Reservasi untuk Dibatalkan" }
];

// 2. Adjust folders and items
col.item.forEach((folder) => {
  const folderName = folder.name;

  folder.item.forEach((item) => {
    const req = item.request;
    if (!req) return;

    // Filter out x-maker-key
    if (req.header) {
      req.header = req.header.filter(h => h.key.toLowerCase() !== 'x-maker-key');
    }

    // Set correct Auth header
    const isAdmin = folderName.includes('Panel Admin');
    const isMember = folderName.includes('Reservasi Member') || item.name.includes('profile') || item.name.includes('logout');

    if (isAdmin) {
      req.header = req.header.filter(h => h.key.toLowerCase() !== 'authorization');
      req.header.push({
        key: 'Authorization',
        value: 'Bearer {{token_admin}}',
        description: 'Token JWT Admin'
      });
    } else if (isMember) {
      req.header = req.header.filter(h => h.key.toLowerCase() !== 'authorization');
      req.header.push({
        key: 'Authorization',
        value: 'Bearer {{token_member}}',
        description: 'Token JWT Member'
      });
    }

    // Ensure test event exists
    if (!item.event) item.event = [];
    let testEv = item.event.find(e => e.listen === 'test');
    if (!testEv) {
      testEv = { listen: 'test', script: { type: 'text/javascript', exec: [] } };
      item.event.push(testEv);
    }

    const testLines = [
      `pm.test("${item.name.replace(/"/g, '')} - Status 200/201", function () {`,
      `    pm.expect([200, 201]).to.include(pm.response.code);`,
      `});`
    ];

    // Specific handler logic
    if (item.name.includes('register/member')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          username: 'member_{{$timestamp}}',
          password: 'Secret123!',
          nama_member: 'User Member Test',
          instansi: 'SMK Telkom Malang',
          alamat: 'Jl. Danau Ranau No. 1, Malang',
          telp: '081234567890'
        }, null, 2)
      };
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.access_token) {`,
        `        pm.collectionVariables.set("token_member", res.data.access_token);`,
        `        if (pm.environment) pm.environment.set("token_member", res.data.access_token);`,
        `    }`,
        `}`
      );
    }

    if (item.name.includes('register/admin-space')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          username: 'admin_{{$timestamp}}',
          password: 'Admin123!',
          nama_coworking: 'Moklet Hub Test {{$timestamp}}',
          nama_pemilik: 'Ahmad Bidin, S.Kom',
          telp: '081298765432'
        }, null, 2)
      };
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.access_token) {`,
        `        pm.collectionVariables.set("token_admin", res.data.access_token);`,
        `        if (pm.environment) pm.environment.set("token_admin", res.data.access_token);`,
        `    }`,
        `}`
      );
    }

    if (item.name.includes('login') && item.name.includes('(Member)')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          username: 'johndoe',
          password: 'Secret123!'
        }, null, 2)
      };
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
    }

    if (item.name.includes('login') && item.name.includes('(Admin)')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          username: 'admin_space1',
          password: 'Admin123!'
        }, null, 2)
      };
      testLines.push(
        `if (pm.response.code === 200) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.access_token) {`,
        `        pm.collectionVariables.set("token_admin", res.data.access_token);`,
        `        if (pm.environment) pm.environment.set("token_admin", res.data.access_token);`,
        `    }`,
        `}`
      );
    }

    if (item.name.includes('/api/spaces/availability')) {
      req.url.raw = '{{baseUrl}}/api/spaces/availability?id_space={{space_id}}&tanggal=2027-06-15&jam_mulai=10:00&durasi_jam=2';
      req.url.query = [
        { key: 'id_space', value: '{{space_id}}' },
        { key: 'tanggal', value: '2027-06-15' },
        { key: 'jam_mulai', value: '10:00' },
        { key: 'durasi_jam', value: '2' }
      ];
    }

    if (item.name.includes('POST /api/reservasi') && !item.name.includes('Dibatalkan')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          id_space: 1,
          tanggal_reservasi: '2027-06-15',
          jam_mulai: '10:00',
          durasi_jam: 2,
          id_diskon: 1
        }, null, 2)
      };
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

    if (item.name.includes('/cancel')) {
      // Set url variable to cancel_reservasi_id or reservasi_id
      if (req.url && req.url.variable) {
        req.url.variable = [{ key: 'id', value: '{{cancel_reservasi_id}}' }];
      }
    }

    if (item.name.includes('POST /api/admin/spaces')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          nama_space: 'Personal Desk Alpha {{$timestamp}}',
          harga_per_jam: 25000,
          tipe: 'desk',
          kapasitas: 1,
          deskripsi: 'Meja kerja dengan colokan listrik dan WiFi 100Mbps.'
        }, null, 2)
      };
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.id) {`,
        `        pm.collectionVariables.set("space_id", String(res.data.id));`,
        `        if (pm.environment) pm.environment.set("space_id", String(res.data.id));`,
        `    }`,
        `}`
      );
    }

    if (item.name.includes('POST /api/admin/members')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          username: 'member_adm_{{$timestamp}}',
          password: 'Secret123!',
          nama_member: 'Budi Raharjo',
          instansi: 'SMK Telkom Malang',
          alamat: 'Jl. Danau Ranau No. 1, Malang',
          telp: '085712345678'
        }, null, 2)
      };
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.id) {`,
        `        pm.collectionVariables.set("member_id", String(res.data.id));`,
        `        if (pm.environment) pm.environment.set("member_id", String(res.data.id));`,
        `    }`,
        `}`
      );
    }

    if (item.name.includes('POST /api/admin/diskon')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          nama_diskon: 'PROMO_{{$timestamp}}',
          persentase_diskon: 20,
          tanggal_awal: '2027-01-01T00:00:00.000Z',
          tanggal_akhir: '2027-12-31T23:59:59.000Z'
        }, null, 2)
      };
      testLines.push(
        `if (pm.response.code === 201) {`,
        `    var res = pm.response.json();`,
        `    if (res.data && res.data.id) {`,
        `        pm.collectionVariables.set("diskon_id", String(res.data.id));`,
        `        if (pm.environment) pm.environment.set("diskon_id", String(res.data.id));`,
        `    }`,
        `}`
      );
    }

    if (item.name.includes('PUT /api/admin/profile')) {
      req.body = {
        mode: 'raw',
        raw: JSON.stringify({
          nama_coworking: 'Moklet Hub Coworking Space (Updated)',
          nama_pemilik: 'Ahmad Bidin, S.Kom',
          telp: '081298765432',
          alamat: 'Jl. Danau Ranau No. 1, Sawojajar, Malang',
          deskripsi: 'Coworking modern premium updated.'
        }, null, 2)
      };
    }

    // Set variable url values
    if (req.url && req.url.variable) {
      req.url.variable = req.url.variable.map(v => {
        if (v.key === 'id') {
          let varName = 'space_id';
          const raw = req.url.raw || '';
          if (raw.includes('/spaces/')) varName = 'space_id';
          else if (raw.includes('/members/')) varName = 'member_id';
          else if (raw.includes('/diskon/')) varName = 'diskon_id';
          else if (raw.includes('/cancel')) varName = 'cancel_reservasi_id';
          else if (raw.includes('/reservasi/')) varName = 'reservasi_id';
          return { ...v, value: `{{${varName}}}` };
        }
        return v;
      });
    }

    testEv.script.exec = testLines;
  });
});

// Add dedicated cancel setup request to Reservasi folder so cancellation doesn't invalidate reservasi_id
const resFolder = col.item.find(f => f.name.includes('Reservasi Member'));
if (resFolder) {
  const cancelReqIdx = resFolder.item.findIndex(i => i.name.includes('/cancel'));
  if (cancelReqIdx !== -1) {
    const cancelSetupReq = {
      name: "POST /api/reservasi (Pemesanan untuk Dibatalkan) - Buat Reservasi Khusus Uji Pembatalan",
      event: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "pm.test(\"Status code is 201\", function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "if (pm.response.code === 201) {",
              "    var res = pm.response.json();",
              "    if (res.data && res.data.id) {",
              "        pm.collectionVariables.set(\"cancel_reservasi_id\", String(res.data.id));",
              "        if (pm.environment) pm.environment.set(\"cancel_reservasi_id\", String(res.data.id));",
              "    }",
              "}"
            ]
          }
        }
      ],
      request: {
        method: "POST",
        header: [
          { key: "Accept", value: "application/json" },
          { key: "Content-Type", value: "application/json" },
          { key: "Authorization", value: "Bearer {{token_member}}", description: "Token JWT Member" }
        ],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            id_space: 1,
            tanggal_reservasi: "2027-07-20",
            jam_mulai: "08:00",
            durasi_jam: 1
          }, null, 2)
        },
        url: {
          raw: "{{baseUrl}}/api/reservasi",
          host: ["{{baseUrl}}"],
          path: ["api", "reservasi"]
        },
        description: "Membuat reservasi terpisah yang nantinya langsung dibatalkan pada endpoint cancel reservasi."
      },
      response: []
    };

    // Insert right before cancel request
    resFolder.item.splice(cancelReqIdx, 0, cancelSetupReq);
  }
}

// Renumber all requests consecutively
let counter = 1;
function renumber(items) {
  for (const it of items) {
    if (it.item) {
      renumber(it.item);
    } else {
      it.name = it.name.replace(/^\d+\.\s*/, '');
      it.name = `${counter}. ${it.name}`;
      counter++;
    }
  }
}
renumber(col.item);

// Sync environment
const env = {
  id: "smart-space-local-env",
  name: "Smart Space Booking - Local Dev",
  values: [
    { key: "baseUrl", value: "http://localhost:3000", type: "default", enabled: true },
    { key: "token_member", value: "", type: "secret", enabled: true },
    { key: "token_admin", value: "", type: "secret", enabled: true },
    { key: "space_id", value: "1", type: "default", enabled: true },
    { key: "member_id", value: "1", type: "default", enabled: true },
    { key: "diskon_id", value: "1", type: "default", enabled: true },
    { key: "reservasi_id", value: "1", type: "default", enabled: true },
    { key: "cancel_reservasi_id", value: "1", type: "default", enabled: true }
  ],
  _postman_variable_scope: "environment",
  _postman_exported_at: new Date().toISOString(),
  _postman_exported_using: "Postman/11.0.0"
};

fs.writeFileSync(collectionPath, JSON.stringify(col, null, 2));
fs.writeFileSync(rootCollectionPath, JSON.stringify(col, null, 2));
fs.writeFileSync(envPath, JSON.stringify(env, null, 2));
console.log(`Successfully generated perfect collection with ${counter - 1} endpoints!`);
