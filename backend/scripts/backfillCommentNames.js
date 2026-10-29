/**
 * Corrige los comentarios de las obras que quedaron firmados como "Anónimo"
 * aunque su autor tiene nombre en el perfil.
 *
 * En una obra el nombre se guarda DENTRO de cada comentario al escribirlo, así
 * que completar el perfil después no cambia los comentarios ya publicados. Este
 * script pone en cada uno el nombre actual del perfil de su autor.
 *
 * Por defecto SOLO LISTA lo que cambiaría y no escribe nada:
 *
 *   npm run backfill:comments
 *   npm run backfill:comments -- --apply --backup=ruta.json
 *
 * Solo toca el campo `userName` de comentarios que hoy dicen "Anónimo" (o están
 * vacíos) y cuyo autor sigue existiendo con nombre. Cada obra se reescribe en
 * una transacción, volviendo a leerla justo antes, para no pisar un comentario
 * publicado mientras el script corre.
 */
import fs from 'node:fs';
import { adminDb } from '../src/config/firebaseAdmin.js';

const apply = process.argv.includes('--apply');
const backupPath = (process.argv.find((arg) => arg.startsWith('--backup=')) || '').slice('--backup='.length);

const isMissingName = (value) => !String(value || '').trim() || String(value).trim() === 'Anónimo';

async function loadNames(uids) {
  const names = new Map();

  await Promise.all([...uids].map(async (uid) => {
    const snapshot = await adminDb.collection('users').doc(uid).get();
    const nombres = snapshot.exists ? String(snapshot.data().nombres || '').trim() : '';
    if (nombres) names.set(uid, nombres);
  }));

  return names;
}

// Qué comentarios de una obra hay que corregir y con qué nombre.
function plan(work, names) {
  return (work.comments || [])
    .filter((comment) => comment.userId && isMissingName(comment.userName) && names.has(comment.userId))
    .map((comment) => ({
      commentId: comment.id,
      userId: comment.userId,
      before: comment.userName ?? null,
      after: names.get(comment.userId),
    }));
}

async function main() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const works = await adminDb.collection('literature').get();

  const uids = new Set();
  works.docs.forEach((doc) => {
    (doc.data().comments || []).forEach((comment) => {
      if (comment.userId && isMissingName(comment.userName)) uids.add(comment.userId);
    });
  });

  const names = await loadNames(uids);
  const changes = [];

  works.docs.forEach((doc) => {
    const data = doc.data();
    plan(data, names).forEach((item) => {
      changes.push({ workId: doc.id, workTitle: data.title || '(sin título)', ...item });
    });
  });

  console.log(`\nObras revisadas: ${works.size}`);
  console.log(`Autores de comentarios "Anónimo" con nombre en su perfil: ${names.size}`);
  console.log(`Comentarios a corregir: ${changes.length}\n`);

  changes.forEach((change) => {
    console.log(`  ${change.workTitle.slice(0, 40).padEnd(42)} "${change.before}" → ${change.after}`);
  });

  if (!apply) {
    console.log('\nSimulación: no se escribió nada. Para aplicar los cambios, ejecuta con --apply.');
    return;
  }

  if (backupPath) {
    fs.writeFileSync(backupPath, JSON.stringify(changes, null, 2));
    console.log(`\nRespaldo guardado en ${backupPath}`);
  }

  const workIds = [...new Set(changes.map((change) => change.workId))];
  let updated = 0;

  for (const workId of workIds) {
    const ref = adminDb.collection('literature').doc(workId);

    updated += await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return 0;

      const work = snapshot.data();
      const fixes = new Map(plan(work, names).map((item) => [item.commentId, item.after]));
      if (fixes.size === 0) return 0;

      const comments = (work.comments || []).map((comment) => (
        fixes.has(comment.id) ? { ...comment, userName: fixes.get(comment.id) } : comment
      ));

      transaction.update(ref, { comments });
      return fixes.size;
    });
  }

  console.log(`\nListo: ${updated} comentarios actualizados en ${workIds.length} obras.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
