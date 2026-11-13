// ============================================================
// MI LISTA — subcolección "usuarios/{uid}/miLista" (solo la ve y la modifica su dueño)
// Consultar: listarMiLista · Agregar: agregarPorVer
// Modificar: marcarVista (porVer → vista), calificar, marcarFavorito · Eliminar: quitarDeLista
// ============================================================
import {
  collection, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const colDe = (uid) => collection(db, "usuarios", uid, "miLista");
const docDe = (uid, serieId) => doc(db, "usuarios", uid, "miLista", serieId);

export async function listarMiLista(uid) {
  const snap = await getDocs(colDe(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function agregarPorVer(uid, serie) {
  return setDoc(docDe(uid, serie.id), {
    titulo: serie.titulo,
    poster: serie.poster || null,
    estado: "porVer",
    fecha: serverTimestamp(),
  });
}

// Un invitado que entra a la cuenta que ya tenía: se le suma lo que guardó como invitado.
// Si el título ya estaba en esa cuenta, se respeta lo que tenía.
export async function sumarAMiLista(uid, items) {
  for (const item of items) {
    const ref = docDe(uid, item.id);
    if ((await getDoc(ref)).exists()) continue;
    const datos = { titulo: item.titulo, poster: item.poster || null, estado: item.estado || "porVer", fecha: serverTimestamp() };
    if (item.calificacion != null) datos.calificacion = item.calificacion;
    if (item.favorito) datos.favorito = true;
    await setDoc(ref, datos);
  }
}

export function marcarVista(uid, serieId) {
  return updateDoc(docDe(uid, serieId), { estado: "vista", fecha: serverTimestamp() });
}

export function quitarDeLista(uid, serieId) {
  return deleteDoc(docDe(uid, serieId));
}

// Calificación personal de ½ a 5 estrellas (null = sin calificar)
export function calificar(uid, serieId, calificacion) {
  return updateDoc(docDe(uid, serieId), { calificacion });
}

// Marcar o desmarcar como favorita
export function marcarFavorito(uid, serieId, favorito) {
  return updateDoc(docDe(uid, serieId), { favorito });
}
