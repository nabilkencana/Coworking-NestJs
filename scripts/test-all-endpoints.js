const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

function request(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers }
    };

    let payload = null;
    if (body) {
      if (typeof body === 'object' && !Buffer.isBuffer(body)) {
        payload = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(payload);
      } else {
        payload = body;
      }
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function multipartRequest(urlPath, fieldName, filename, fileBuffer, mimeType, headers = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const url = new URL(urlPath, BASE_URL);

    let headerPart = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    let footerPart = Buffer.from(`\r\n--${boundary}--\r\n`);
    let payload = Buffer.concat([headerPart, fileBuffer, footerPart]);

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        ...headers,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`🚀 COMPREHENSIVE ENDPOINT TEST SUITE - LIVE SERVER (${BASE_URL})`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} -> ${details}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  let tokenMember = '';
  let tokenAdmin = '';
  let spaceId = 0;
  let diskonId = 0;
  let memberId = 0;
  let reservasiId = 0;

  try {
    // 01. ROOT & HEALTH
    console.log(`\n--- 01. Root & Health Check ---`);
    const r1 = await request('GET', '/');
    assert(r1.statusCode === 200 && r1.body?.status === true, '1. GET / - Root API Status', JSON.stringify(r1.body));

    const r2 = await request('GET', '/health');
    assert(r2.statusCode === 200 && r2.body?.data?.status === 'ok', '2. GET /health - Server Health Check', JSON.stringify(r2.body));

    // 02. AUTHENTICATION
    console.log(`\n--- 02. Autentikasi Pengguna ---`);
    const testMemberUsername = `member_${timestamp}`;
    const r3 = await request('POST', '/api/auth/register/member', {}, {
      username: testMemberUsername,
      password: 'Password123!',
      nama_member: 'User Live Test',
      instansi: 'SMK Test',
      alamat: 'Jl. Test No. 1',
      telp: '08123456789'
    });
    assert(r3.statusCode === 201 && r3.body?.data?.access_token, '3. POST /api/auth/register/member - Registrasi Member', JSON.stringify(r3.body));

    const testAdminUsername = `admin_${timestamp}`;
    const r4 = await request('POST', '/api/auth/register/admin-space', {}, {
      username: testAdminUsername,
      password: 'Password123!',
      nama_coworking: `Hub Live ${timestamp}`,
      nama_pemilik: 'Owner Live Test',
      telp: '08198765432'
    });
    assert(r4.statusCode === 201 && r4.body?.data?.access_token, '4. POST /api/auth/register/admin-space - Registrasi Admin', JSON.stringify(r4.body));

    const r5 = await request('POST', '/api/auth/login', {}, {
      username: 'johndoe',
      password: 'Secret123!'
    });
    assert(r5.statusCode === 200 && r5.body?.data?.access_token, '5. POST /api/auth/login (Member: johndoe) - Login Member', JSON.stringify(r5.body));
    tokenMember = r5.body?.data?.access_token;

    const r6 = await request('POST', '/api/auth/login', {}, {
      username: 'admin_space1',
      password: 'Admin123!'
    });
    assert(r6.statusCode === 200 && r6.body?.data?.access_token, '6. POST /api/auth/login (Admin: admin_space1) - Login Admin', JSON.stringify(r6.body));
    tokenAdmin = r6.body?.data?.access_token;

    const r7 = await request('GET', '/api/auth/profile', { Authorization: `Bearer ${tokenMember}` });
    assert(r7.statusCode === 200 && r7.body?.data?.username === 'johndoe', '7. GET /api/auth/profile - Profil Pengguna Member', JSON.stringify(r7.body));

    const r8 = await request('POST', '/api/auth/logout', { Authorization: `Bearer ${tokenMember}` });
    assert(r8.statusCode === 200 && r8.body?.message?.includes('Logout'), '8. POST /api/auth/logout - Logout Akun', JSON.stringify(r8.body));

    // Re-login member to get fresh token for remaining tests
    const rReLogin = await request('POST', '/api/auth/login', {}, { username: 'johndoe', password: 'Secret123!' });
    tokenMember = rReLogin.body?.data?.access_token;

    // 03. SPACES (KATALOG & KETERSEDIAAN)
    console.log(`\n--- 03. Space Coworking (Katalog & Ketersediaan) ---`);
    const r9 = await request('GET', '/api/spaces/types');
    assert(r9.statusCode === 200 && Array.isArray(r9.body?.data), '9. GET /api/spaces/types - Daftar Tipe Space', JSON.stringify(r9.body));

    const r10 = await request('GET', '/api/spaces');
    assert(r10.statusCode === 200 && Array.isArray(r10.body?.data), '10. GET /api/spaces - Katalog Semua Space', JSON.stringify(r10.body));
    if (r10.body?.data?.length > 0) {
      spaceId = r10.body.data[0].id;
    }

    const r11 = await request('GET', `/api/spaces/availability?id_space=${spaceId}&tanggal=2026-10-15&jam_mulai=10:00&durasi_jam=2`);
    assert(r11.statusCode === 200 && typeof r11.body?.data?.available === 'boolean', '11. GET /api/spaces/availability - Cek Ketersediaan Space', JSON.stringify(r11.body));

    const r12 = await request('GET', `/api/spaces/${spaceId}`);
    assert(r12.statusCode === 200 && r12.body?.data?.id === spaceId, `12. GET /api/spaces/:id - Detail Space (ID: ${spaceId})`, JSON.stringify(r12.body));

    // 04. DISKON & PROMO (KATALOG)
    console.log(`\n--- 04. Diskon & Promo ---`);
    const r13 = await request('GET', '/api/diskon/active');
    assert(r13.statusCode === 200 && Array.isArray(r13.body?.data), '13. GET /api/diskon/active - Daftar Diskon Aktif', JSON.stringify(r13.body));
    if (r13.body?.data?.length > 0) {
      diskonId = r13.body.data[0].id;
    }

    const r14 = await request('POST', '/api/diskon/check', {}, { nama_diskon: 'DISKONHEMAT20' });
    assert(r14.statusCode === 200 && r14.body?.data?.persentase_diskon > 0, '14. POST /api/diskon/check - Cek Validitas Kode Promo', JSON.stringify(r14.body));

    const r15 = await request('GET', `/api/diskon/${diskonId}`);
    assert(r15.statusCode === 200 && r15.body?.data?.id === diskonId, `15. GET /api/diskon/:id - Detail Diskon (ID: ${diskonId})`, JSON.stringify(r15.body));

    // 05. RESERVASI MEMBER
    console.log(`\n--- 05. Reservasi Member ---`);
    const randDay = String(Math.floor(Math.random() * 25) + 1).padStart(2, '0');
    const randHour = String(Math.floor(Math.random() * 10) + 8).padStart(2, '0');
    const resDate = `2027-02-${randDay}`;
    const resTime = `${randHour}:00`;

    const r16 = await request('POST', '/api/reservasi', { Authorization: `Bearer ${tokenMember}` }, {
      id_space: spaceId,
      tanggal_reservasi: resDate,
      jam_mulai: resTime,
      durasi_jam: 2,
      id_diskon: diskonId
    });
    assert(r16.statusCode === 201 && r16.body?.data?.id, '16. POST /api/reservasi - Buat Pemesanan Space Baru', JSON.stringify(r16.body));
    reservasiId = r16.body?.data?.id;

    const r17 = await request('GET', '/api/reservasi/my', { Authorization: `Bearer ${tokenMember}` });
    assert(r17.statusCode === 200 && Array.isArray(r17.body?.data), '17. GET /api/reservasi/my - Daftar Pemesanan Saya', JSON.stringify(r17.body));

    const r18 = await request('GET', `/api/reservasi/my/history?month=2&year=2027`, { Authorization: `Bearer ${tokenMember}` });
    assert(r18.statusCode === 200 && Array.isArray(r18.body?.data?.items), '18. GET /api/reservasi/my/history - Histori Pemesanan', JSON.stringify(r18.body));

    const r19 = await request('GET', `/api/reservasi/${reservasiId}/e-ticket`, { Authorization: `Bearer ${tokenMember}` });
    assert(r19.statusCode === 200 && r19.body?.data?.kode_booking, `19. GET /api/reservasi/:id/e-ticket - Cetak E-Ticket (ID: ${reservasiId})`, JSON.stringify(r19.body));

    const r20 = await request('GET', `/api/reservasi/${reservasiId}`, { Authorization: `Bearer ${tokenMember}` });
    assert(r20.statusCode === 200 && r20.body?.data?.id === reservasiId, `20. GET /api/reservasi/:id - Detail Reservasi (ID: ${reservasiId})`, JSON.stringify(r20.body));

    // Create a throwaway reservation to test member cancel
    const rCancelTest = await request('POST', '/api/reservasi', { Authorization: `Bearer ${tokenMember}` }, {
      id_space: spaceId,
      tanggal_reservasi: `2027-03-${randDay}`,
      jam_mulai: '08:00',
      durasi_jam: 1
    });
    const cancelResId = rCancelTest.body?.data?.id;
    const r21 = await request('PATCH', `/api/reservasi/${cancelResId}/cancel`, { Authorization: `Bearer ${tokenMember}` });
    assert(r21.statusCode === 200 && r21.body?.data?.status === 'dibatalkan', `21. PATCH /api/reservasi/:id/cancel - Batalkan Reservasi (ID: ${cancelResId})`, JSON.stringify(r21.body));

    // 06. PROFIL ADMIN
    console.log(`\n--- 06. Profil Lokasi Coworking Space (Admin) ---`);
    const r22 = await request('GET', '/api/admin/profile', { Authorization: `Bearer ${tokenAdmin}` });
    assert(r22.statusCode === 200 && r22.body?.data?.nama_coworking, '22. GET /api/admin/profile - Profil Lokasi Coworking', JSON.stringify(r22.body));

    const r23 = await request('PUT', '/api/admin/profile', { Authorization: `Bearer ${tokenAdmin}` }, {
      nama_coworking: 'Moklet Hub Coworking Space (Updated)',
      nama_pemilik: 'Ahmad Bidin, S.Kom',
      telp: '081298765432',
      deskripsi: `Coworking modern premium updated ${timestamp}`
    });
    assert(r23.statusCode === 200 && r23.body?.data?.nama_coworking?.includes('Updated'), '23. PUT /api/admin/profile - Update Profil Coworking', JSON.stringify(r23.body));

    // 07. MANAJEMEN MEMBER (ADMIN)
    console.log(`\n--- 07. Manajemen Member (Admin) ---`);
    const r24 = await request('GET', '/api/admin/members', { Authorization: `Bearer ${tokenAdmin}` });
    assert(r24.statusCode === 200 && Array.isArray(r24.body?.data), '24. GET /api/admin/members - Daftar Semua Member', JSON.stringify(r24.body));

    const r25 = await request('POST', '/api/admin/members', { Authorization: `Bearer ${tokenAdmin}` }, {
      username: `member_crud_${timestamp}`,
      password: 'Password123!',
      nama_member: 'Member CRUD Test',
      instansi: 'PT Inovasi',
      alamat: 'Jl. Gatot Subroto',
      telp: '081122334455'
    });
    assert(r25.statusCode === 201 && r25.body?.data?.id, '25. POST /api/admin/members - Tambah Member Baru oleh Admin', JSON.stringify(r25.body));
    memberId = r25.body?.data?.id;

    const r26 = await request('GET', `/api/admin/members/${memberId}`, { Authorization: `Bearer ${tokenAdmin}` });
    assert(r26.statusCode === 200 && r26.body?.data?.id === memberId, `26. GET /api/admin/members/:id - Detail Member (ID: ${memberId})`, JSON.stringify(r26.body));

    const r27 = await request('PUT', `/api/admin/members/${memberId}`, { Authorization: `Bearer ${tokenAdmin}` }, {
      nama_member: 'Member CRUD Updated'
    });
    assert(r27.statusCode === 200 && r27.body?.data?.nama_member === 'Member CRUD Updated', `27. PUT /api/admin/members/:id - Update Member (ID: ${memberId})`, JSON.stringify(r27.body));

    const r28 = await request('DELETE', `/api/admin/members/${memberId}`, { Authorization: `Bearer ${tokenAdmin}` });
    assert(r28.statusCode === 200 && r28.body?.message?.includes('dihapus'), `28. DELETE /api/admin/members/:id - Hapus Member (ID: ${memberId})`, JSON.stringify(r28.body));

    // 08. MANAJEMEN SPACES (ADMIN)
    console.log(`\n--- 08. Manajemen Space Ruangan & Meja (Admin) ---`);
    const r29 = await request('GET', '/api/admin/spaces', { Authorization: `Bearer ${tokenAdmin}` });
    assert(r29.statusCode === 200 && Array.isArray(r29.body?.data), '29. GET /api/admin/spaces - Daftar Space Milik Admin', JSON.stringify(r29.body));

    const r30 = await request('POST', '/api/admin/spaces', { Authorization: `Bearer ${tokenAdmin}` }, {
      nama_space: `Testing Room ${timestamp}`,
      harga_per_jam: 50000,
      tipe: 'meeting_room',
      kapasitas: 4,
      deskripsi: 'Ruangan testing lengkap'
    });
    assert(r30.statusCode === 201 && r30.body?.data?.id, '30. POST /api/admin/spaces - Tambah Space Baru', JSON.stringify(r30.body));
    const createdSpaceId = r30.body?.data?.id;

    const r31 = await request('GET', `/api/admin/spaces/${createdSpaceId}`, { Authorization: `Bearer ${tokenAdmin}` });
    assert(r31.statusCode === 200 && r31.body?.data?.id === createdSpaceId, `31. GET /api/admin/spaces/:id - Detail Space Admin (ID: ${createdSpaceId})`, JSON.stringify(r31.body));

    const r32 = await request('PUT', `/api/admin/spaces/${createdSpaceId}`, { Authorization: `Bearer ${tokenAdmin}` }, {
      nama_space: `Testing Room Updated ${timestamp}`
    });
    assert(r32.statusCode === 200 && r32.body?.data?.nama_space?.includes('Updated'), `32. PUT /api/admin/spaces/:id - Update Space Admin (ID: ${createdSpaceId})`, JSON.stringify(r32.body));

    const r33 = await request('DELETE', `/api/admin/spaces/${createdSpaceId}`, { Authorization: `Bearer ${tokenAdmin}` });
    assert(r33.statusCode === 200 && r33.body?.message?.includes('dihapus'), `33. DELETE /api/admin/spaces/:id - Hapus Space Admin (ID: ${createdSpaceId})`, JSON.stringify(r33.body));

    // 09. MANAJEMEN DISKON (ADMIN)
    console.log(`\n--- 09. Manajemen Kode Promo & Diskon (Admin) ---`);
    const r34 = await request('GET', '/api/admin/diskon', { Authorization: `Bearer ${tokenAdmin}` });
    assert(r34.statusCode === 200 && Array.isArray(r34.body?.data), '34. GET /api/admin/diskon - Daftar Semua Diskon', JSON.stringify(r34.body));

    const promoCode = `PROMO${timestamp.toString().slice(-4)}`;
    const r35 = await request('POST', '/api/admin/diskon', { Authorization: `Bearer ${tokenAdmin}` }, {
      nama_diskon: promoCode,
      persentase_diskon: 15,
      tanggal_awal: '2026-01-01T00:00:00.000Z',
      tanggal_akhir: '2026-12-31T23:59:59.000Z'
    });
    assert(r35.statusCode === 201 && r35.body?.data?.id, '35. POST /api/admin/diskon - Tambah Diskon Baru', JSON.stringify(r35.body));
    const createdDiskonId = r35.body?.data?.id;

    const r36 = await request('GET', `/api/admin/diskon/${createdDiskonId}`, { Authorization: `Bearer ${tokenAdmin}` });
    assert(r36.statusCode === 200 && r36.body?.data?.id === createdDiskonId, `36. GET /api/admin/diskon/:id - Detail Diskon Admin (ID: ${createdDiskonId})`, JSON.stringify(r36.body));

    const r37 = await request('PUT', `/api/admin/diskon/${createdDiskonId}`, { Authorization: `Bearer ${tokenAdmin}` }, {
      persentase_diskon: 25
    });
    assert(r37.statusCode === 200 && r37.body?.data?.persentase_diskon === 25, `37. PUT /api/admin/diskon/:id - Update Diskon Admin (ID: ${createdDiskonId})`, JSON.stringify(r37.body));

    const r38 = await request('DELETE', `/api/admin/diskon/${createdDiskonId}`, { Authorization: `Bearer ${tokenAdmin}` });
    assert(r38.statusCode === 200 && r38.body?.message?.includes('dihapus'), `38. DELETE /api/admin/diskon/:id - Hapus Diskon Admin (ID: ${createdDiskonId})`, JSON.stringify(r38.body));

    // 10. TRANSAKSI RESERVASI & STATUS LIFECYCLE (ADMIN)
    console.log(`\n--- 10. Transaksi Reservasi (Admin) ---`);
    const r39 = await request('GET', '/api/admin/reservasi', { Authorization: `Bearer ${tokenAdmin}` });
    assert(r39.statusCode === 200 && Array.isArray(r39.body?.data), '39. GET /api/admin/reservasi - Daftar Seluruh Reservasi', JSON.stringify(r39.body));

    const r40 = await request('PATCH', `/api/admin/reservasi/${reservasiId}/status`, { Authorization: `Bearer ${tokenAdmin}` }, {
      status: 'disetujui'
    });
    assert(r40.statusCode === 200 && r40.body?.data?.status === 'disetujui', `40. PATCH /api/admin/reservasi/:id/status - Konfirmasi Status (ID: ${reservasiId})`, JSON.stringify(r40.body));

    const r41 = await request('POST', `/api/admin/reservasi/${reservasiId}/check-in`, { Authorization: `Bearer ${tokenAdmin}` });
    assert(r41.statusCode === 200 && r41.body?.data?.status === 'aktif', `41. POST /api/admin/reservasi/:id/check-in - Check-In Pelanggan (ID: ${reservasiId})`, JSON.stringify(r41.body));

    const r42 = await request('POST', `/api/admin/reservasi/${reservasiId}/check-out`, { Authorization: `Bearer ${tokenAdmin}` });
    assert(r42.statusCode === 200 && r42.body?.data?.status === 'selesai', `42. POST /api/admin/reservasi/:id/check-out - Check-Out Pelanggan (ID: ${reservasiId})`, JSON.stringify(r42.body));

    // 11. LAPORAN PENDAPATAN (ADMIN)
    console.log(`\n--- 11. Laporan Pendapatan (Admin) ---`);
    const r43 = await request('GET', '/api/admin/reports/monthly?month=11&year=2026', { Authorization: `Bearer ${tokenAdmin}` });
    assert(r43.statusCode === 200 && typeof r43.body?.data?.realisasi_pendapatan_bersih === 'number', '43. GET /api/admin/reports/monthly - Rekapitulasi Bulanan', JSON.stringify(r43.body));

    const r44 = await request('GET', '/api/admin/reports/income?month=11&year=2026', { Authorization: `Bearer ${tokenAdmin}` });
    assert(r44.statusCode === 200 && typeof r44.body?.data?.realisasi_pendapatan_bersih === 'number', '44. GET /api/admin/reports/income - Alias Rekapitulasi Bulanan', JSON.stringify(r44.body));

    // 12. UPLOAD MEDIA
    console.log(`\n--- 12. Upload Berkas & Media ---`);
    // Create a 1x1 100-byte valid JPEG buffer
    const dummyJpg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
      0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
      0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
      0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
      0x00, 0x37, 0xff, 0xd9
    ]);

    const r45 = await multipartRequest('/api/upload/image', 'file', 'test.jpg', dummyJpg, 'image/jpeg');
    assert(r45.statusCode === 201 && r45.body?.data?.filename, '45. POST /api/upload/image - Upload Gambar Umum', JSON.stringify(r45.body));

    const r46 = await multipartRequest('/api/upload/spaces', 'file', 'space.jpg', dummyJpg, 'image/jpeg');
    assert(r46.statusCode === 201 && r46.body?.data?.filename, '46. POST /api/upload/spaces - Upload Foto Space', JSON.stringify(r46.body));

    const r47 = await multipartRequest('/api/upload/members', 'file', 'member.jpg', dummyJpg, 'image/jpeg');
    assert(r47.statusCode === 201 && r47.body?.data?.filename, '47. POST /api/upload/members - Upload Foto Profil Member', JSON.stringify(r47.body));

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log(`\n======================================================`);
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();
