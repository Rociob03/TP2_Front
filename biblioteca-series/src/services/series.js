import {
  collection, getDocs, addDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp, updateDoc, increment,
} from "firebase/firestore";
import { db } from "../firebase";

const col = collection(db, "series");

export async function listarSeries() {
  const snap = await getDocs(query(col, orderBy("ultimaConfirmacion", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function crearSerie({ titulo, genero, plataforma }, uid) {
  return addDoc(col, {
    titulo,
    genero,
    plataforma,
    creadaPor: uid,
    ultimaConfirmacion: serverTimestamp(),
    confirmaciones: 1,
    vistas: 0,
  });
}

export function eliminarSerie(id) {
  return deleteDoc(doc(db, "series", id));
}

export function sumarVista(id) {
  return updateDoc(doc(db, "series", id), { vistas: increment(1) });
}
