const fs = require('fs');
const path = require('path');

console.log('=== SYNCHRONIZING & HARMONIZING POSTMAN COLLECTIONS & ENVIRONMENT ===');

// Paths in current workspace
const ukkCollectionPath = path.resolve(__dirname, '../UKK_Paket_B_Coworking_Space.postman_collection.json');
const postmanCollectionPath = path.resolve(__dirname, '../postman/Smart-Space-Booking.postman_collection.json');
const envPath = path.resolve(__dirname, '../postman/Smart-Space-Booking-Local.postman_environment.json');

// Paths in reference workspace (if available)
const refDir = '/Users/nabilkencana/Documents/Strategart/UKK/paketb-backend/postman';

// Standardized variables list for collections
const standardCollectionVariables = [
  { key: "base_url", value: "http://localhost:3000", type: "string", description: "Base URL server (snake_case standar)" },
  { key: "baseUrl", value: "http://localhost:3000", type: "string", description: "Base URL server (camelCase alias selaras)" },
  { key: "token_member", value: "", type: "string", description: "JWT Bearer Token Member" },
  { key: "token_admin", value: "", type: "string", description: "JWT Bearer Token Admin Space" },
  { key: "token", value: "", type: "string", description: "JWT Bearer Token (alias token_member)" },
  { key: "space_id", value: "1", type: "string", description: "ID Ruangan / Meja Space" },
  { key: "id_space", value: "1", type: "string", description: "ID Ruangan / Meja Space (alias id_space)" },
  { key: "member_id", value: "1", type: "string", description: "ID Member / Pelanggan" },
  { key: "id_member", value: "1", type: "string", description: "ID Member (alias id_member)" },
  { key: "diskon_id", value: "1", type: "string", description: "ID Kode Promo / Diskon" },
  { key: "id_diskon", value: "1", type: "string", description: "ID Kode Promo (alias id_diskon)" },
  { key: "reservasi_id", value: "1", type: "string", description: "ID Transaksi Reservasi" },
  { key: "id_reservasi", value: "1", type: "string", description: "ID Transaksi Reservasi (alias id_reservasi)" },
  { key: "cancel_reservasi_id", value: "1", type: "string", description: "ID Reservasi Uji Pembatalan" },
  { key: "booking_date", value: "2028-05-15", type: "string", description: "Tanggal Booking Dinamis" },
  { key: "booking_hour", value: "10:00", type: "string", description: "Jam Booking Dinamis" },
  { key: "cancel_booking_date", value: "2028-06-20", type: "string", description: "Tanggal Booking Uji Pembatalan" },
  { key: "cancel_booking_hour", value: "14:00", type: "string", description: "Jam Booking Uji Pembatalan" }
];

// 1. Update Environment File
const env = {
  id: "smart-space-local-env",
  name: "Smart Space Booking - Local Dev",
  values: [
    { key: "base_url", value: "http://localhost:3000", type: "default", enabled: true },
    { key: "baseUrl", value: "http://localhost:3000", type: "default", enabled: true },
    { key: "token_member", value: "", type: "secret", enabled: true },
    { key: "token_admin", value: "", type: "secret", enabled: true },
    { key: "token", value: "", type: "secret", enabled: true },
    { key: "space_id", value: "1", type: "default", enabled: true },
    { key: "id_space", value: "1", type: "default", enabled: true },
    { key: "member_id", value: "1", type: "default", enabled: true },
    { key: "id_member", value: "1", type: "default", enabled: true },
    { key: "diskon_id", value: "1", type: "default", enabled: true },
    { key: "id_diskon", value: "1", type: "default", enabled: true },
    { key: "reservasi_id", value: "1", type: "default", enabled: true },
    { key: "id_reservasi", value: "1", type: "default", enabled: true },
    { key: "cancel_reservasi_id", value: "1", type: "default", enabled: true },
    { key: "booking_date", value: "2028-05-15", type: "default", enabled: true },
    { key: "booking_hour", value: "10:00", type: "default", enabled: true },
    { key: "cancel_booking_date", value: "2028-06-20", type: "default", enabled: true },
    { key: "cancel_booking_hour", value: "14:00", type: "default", enabled: true }
  ],
  _postman_variable_scope: "environment",
  _postman_exported_at: new Date().toISOString(),
  _postman_exported_using: "Postman/11.0.0"
};

fs.writeFileSync(envPath, JSON.stringify(env, null, 2));
console.log('✅ Synchronized Environment File:', envPath);

// 2. Harmonize UKK Collection
let ukkCol = JSON.parse(fs.readFileSync(ukkCollectionPath, 'utf8'));
ukkCol.variable = standardCollectionVariables;

// Ensure tests set both base_url and baseUrl if they touch base URL, and both token_member & token
function enhanceScripts(items) {
  for (const item of items) {
    if (item.event) {
      for (const ev of item.event) {
        if (ev.listen === 'test' && ev.script && ev.script.exec) {
          const newExec = [];
          for (const line of ev.script.exec) {
            newExec.push(line);
            // If setting token_member, also set token
            if (line.includes('token_member') && line.includes('set(')) {
              newExec.push(line.replace(/token_member/g, 'token'));
            }
            // If setting space_id, also set id_space
            if (line.includes('space_id') && line.includes('set(')) {
              newExec.push(line.replace(/space_id/g, 'id_space'));
            }
            // If setting diskon_id, also set id_diskon
            if (line.includes('diskon_id') && line.includes('set(')) {
              newExec.push(line.replace(/diskon_id/g, 'id_diskon'));
            }
            // If setting reservasi_id, also set id_reservasi
            if (line.includes('reservasi_id') && line.includes('set(')) {
              newExec.push(line.replace(/reservasi_id/g, 'id_reservasi'));
            }
            // If setting member_id, also set id_member
            if (line.includes('member_id') && line.includes('set(')) {
              newExec.push(line.replace(/member_id/g, 'id_member'));
            }
          }
          ev.script.exec = newExec;
        }
      }
    }
    if (item.item) enhanceScripts(item.item);
  }
}

enhanceScripts(ukkCol.item);

// Save both UKK_Paket_B_Coworking_Space.postman_collection.json and postman/Smart-Space-Booking.postman_collection.json
const ukkColJson = JSON.stringify(ukkCol, null, 2);
fs.writeFileSync(ukkCollectionPath, ukkColJson);
fs.writeFileSync(postmanCollectionPath, ukkColJson);
console.log('✅ Synchronized Main UKK Collection:', ukkCollectionPath);
console.log('✅ Synchronized Postman Dir Collection:', postmanCollectionPath);

// 3. Harmonize reference workspace (paketb-backend) if present
if (fs.existsSync(refDir)) {
  // Sync environment file to refDir
  const refEnvPath = path.join(refDir, 'Smart-Space-Booking-Local.postman_environment.json');
  fs.writeFileSync(refEnvPath, JSON.stringify(env, null, 2));
  console.log('✅ Synchronized Environment File to reference repo:', refEnvPath);

  // Sync smart-space-booking.postman_collection.json in refDir
  const refSmartSpacePath = path.join(refDir, 'smart-space-booking.postman_collection.json');
  if (fs.existsSync(refSmartSpacePath)) {
    let smartCol = JSON.parse(fs.readFileSync(refSmartSpacePath, 'utf8'));
    smartCol.variable = standardCollectionVariables;
    fs.writeFileSync(refSmartSpacePath, JSON.stringify(smartCol, null, 2));
    console.log('✅ Synchronized smart-space-booking.postman_collection.json in reference repo:', refSmartSpacePath);
  }

  // Sync UKK_Paket_B_Coworking_Space.postman_collection.json in refDir
  const refUkkPath = path.join(refDir, 'UKK_Paket_B_Coworking_Space.postman_collection.json');
  if (fs.existsSync(refUkkPath)) {
    let refUkkCol = JSON.parse(fs.readFileSync(refUkkPath, 'utf8'));
    refUkkCol.variable = standardCollectionVariables;
    fs.writeFileSync(refUkkPath, JSON.stringify(refUkkCol, null, 2));
    console.log('✅ Synchronized UKK_Paket_B_Coworking_Space.postman_collection.json in reference repo:', refUkkPath);
  }
}

console.log('=== HARMONIZATION COMPLETE ===');
