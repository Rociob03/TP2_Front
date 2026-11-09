// Pie de página: integrantes, materia y fuentes de datos (TMDB pide mostrar su logo y aclaración)
const INTEGRANTES = ["Yeimmy Gómez", "Rocío Bertolo"];
const LOGO_TMDB =
  "https://www.themoviedb.org/assets/v4/logos/v2/blue_long_1-8ba2ac31f354005783fab473602c34c3f4fd207150182061e425d366e4f34596.svg";

export default function Pie() {
  return (
    <footer className="pie">
      <div className="pie-marca">
        <p className="pie-logo">REEL CLUB</p>
        <p className="etiqueta">Tu videoclub de películas y series</p>
        <p className="pie-equipo">
          Hecho por {INTEGRANTES.join(" y ")} · Desarrollo Frontend II · UADE · 2026
        </p>
      </div>

      <div className="pie-fuentes">
        <p className="etiqueta">Datos de</p>
        <a className="pie-tmdb" href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
          <img src={LOGO_TMDB} alt="The Movie Database (TMDB)" width="180" height="13" loading="lazy" />
        </a>
        <p className="pie-legal">
          Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
        </p>
        <ul className="pie-lista">
          <li><a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer">OMDb</a> (puntajes de IMDb)</li>
          <li><a href="https://www.justwatch.com/" target="_blank" rel="noreferrer">JustWatch</a> (plataformas, vía TMDB)</li>
          <li>
            <a href="https://datos.cultura.gob.ar/dataset/37305de4-3cce-4d4b-9d9a-fec3ca61d09f" target="_blank" rel="noreferrer">
              Ministerio de Cultura de la Nación
            </a>{" "}
            (salas de cine)
          </li>
        </ul>
      </div>
    </footer>
  );
}
