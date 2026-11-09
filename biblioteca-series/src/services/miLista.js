// ============================================================
// MI LISTA — subcolección "usuarios/{uid}/miLista" (solo la ve y la modifica su dueño)
// Consultar: listarMiLista · Agregar: agregarPorVer
// Modificar: marcarVista (porVer → vista), calificar, marcarFavorito · Eliminar: quitarDeLista
// ============================================================
import {
  collection, getDocs, setDoc, updateDoc, deleteDoc, doc, serverTimestamp,
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
