/**
 * Completa `nombres` en los perfiles que no lo tienen, usando el nombre que
 * Firebase Auth guarda de la cuenta (el de Google).
 *
 * Por defecto SOLO LISTA lo que cambiaría y no escribe nada:
 *
 *   npm run backfill:names             # simulación
 *   npm run backfill:names -- --apply --backup=ruta.json  # escribe los cambios
 *
 * Con --backup guarda antes, en ese archivo, los valores que va a reemplazar
 * (`nombres` y `updatedAt` de cada perfil) por si hay que deshacerlo.
 *
 * Usa las credenciales del .env, así que apunta al mismo proyecto de Firebase
 * que el servidor con el que se ejecute. No toca perfiles que ya tienen nombre.
 */
import fs from 'node:fs';
import { adminAuth, adminDb } from '../src/config/firebaseAdmin.js';
import { nombresFromDisplayName } from '../src/services/user.service.js';

const apply = process.argv.includes('--apply');
const backupPath = (process.argv.find((arg) => arg.startsWith('--backup=')) || '').slice('--backup='.length);
const BATCH_SIZE = 400;

async function* listAllAuthUsers() {
  let pageToken;

  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    yield* page.users;
    pageToken = page.pageToken;
  } while (pageToken);
}

async function main() {
  if (!adminAuth || !adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const changes = [];
  let scanned = 0;
  let withoutProfile = 0;
  let withoutName = 0;

  for await (const authUser of listAllAuthUsers()) {
    scanned += 1;

    const ref = adminDb.collection('users').doc(authUser.uid);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      withoutProfile += 1;
      continue;
    }

    if (String(snapshot.data().nombres || '').trim()) continue;

    const nombres = nombresFromDisplayName(authUser.displayName);

    if (!nombres) {
      withoutName += 1;
      continue;
    }

    changes.push({
      ref,
      uid: authUser.uid,
      email: authUser.email || '(sin correo)',
      nombres,
      previous: { nombres: snapshot.data().nombres ?? null, updatedAt: snapshot.data().updatedAt ?? null },
    });
  }

  console.log(`\nCuentas revisadas: ${scanned}`);
  console.log(`Sin perfil en Firestore (se omiten): ${withoutProfile}`);
  console.log(`Sin nombre tampoco en Firebase Auth (se omiten): ${withoutName}`);
  console.log(`Perfiles a completar: ${changes.length}\n`);

  changes.forEach((change) => {
    console.log(`  ${change.email.padEnd(40)} → ${change.nombres}`);
  });

  if (!apply) {
    console.log('\nSimulación: no se escribió nada. Para aplicar los cambios, ejecuta con --apply.');
    return;
  }

  if (backupPath) {
    fs.writeFileSync(
      backupPath,
      JSON.stringify(changes.map(({ uid, email, previous }) => ({ uid, email, previous })), null, 2)
    );
    console.log(`
Respaldo guardado en ${backupPath}`);
  }

  const now = new Date().toISOString();

  for (let index = 0; index < changes.length; index += BATCH_SIZE) {
    const batch = adminDb.batch();

    changes.slice(index, index + BATCH_SIZE).forEach((change) => {
      batch.set(change.ref, { nombres: change.nombres, updatedAt: now }, { merge: true });
    });

    await batch.commit();
  }

  console.log(`\nListo: ${changes.length} perfiles actualizados.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
