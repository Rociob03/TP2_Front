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

// imdb: ficha elegida en el buscador de OMDb (o null si se cargó a mano)
export function crearSerie({ titulo, genero, plataforma, imdb }, uid) {
  return addDoc(col, {
    titulo,
    genero,
    plataforma,
    creadaPor: uid,
    ultimaConfirmacion: serverTimestamp(),
    confirmaciones: 1,
    vistas: 0,
    // Datos de IMDb (vacíos si la serie se cargó a mano)
    imdbID: imdb?.imdbID || null,
    poster: imdb?.poster || null,
    anio: imdb?.anio || null,
    rating: imdb?.rating || null,
    trama: imdb?.trama || null,
    tipo: imdb?.tipo || null,
  });
}

export function eliminarSerie(id) {
  return deleteDoc(doc(db, "series", id));
}

export function sumarVista(id) {
  return updateDoc(doc(db, "series", id), { vistas: increment(1) });
}
