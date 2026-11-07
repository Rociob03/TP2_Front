# Reel Club 📼

Videoclub colaborativo de películas y series con estética retro.
Cada socio guarda lo que quiere ver (buscándolo por título, actor o país) y eso se suma al catálogo compartido del club
y armar su lista personal de **Por ver** y **Vistas**.

Trabajo Práctico 2 – Desarrollo Frontend II (UADE).

## Funcionalidades

- **Inicio de sesión**: con email y contraseña, con Google o como invitado. Un invitado puede crear
  su cuenta después sin perder su lista ("Guardar mi lista"). Incluye recuperación de contraseña.
- **Buscar**: por título (IMDb), por actor o actriz y por país (TMDB). Todo termina en una sola acción, *Guardar para ver*,
  que lo suma a tu lista y al catálogo del club. Debajo, *Lo que guardan los socios*, con filtros (cada persona solo puede
  sacar del club lo que cargó).
- **Buscador de IMDb**: al agregar una serie se busca por título y se completan solos el título,
  el género (traducido al español), el año, el póster, el puntaje de IMDb y la sinopsis.
  Si no aparece, se puede cargar a mano.
- **Mi lista**: marcar películas y series como *Por ver*, pasarlas a *Vistas* o quitarlas.
- **Inicio con estantes de videoclub**: *Estrenos*, *Tendencias de la semana* y *Mejor puntuadas* con datos reales de TMDB
  (en español), más *Más vistas en Reel Club* y *Recomendadas para vos* con los datos propios de la app.
  Al guardar un título de TMDB se agrega solo al catálogo, con su plataforma en Argentina.
- **Ficha de cada título de TMDB**: tráiler y, si está en cartelera, links a las cadenas de cine y "Cines cerca tuyo"
  (por ubicación o por provincia, con distancia y "Cómo llegar").
- **Calificaciones y favoritas**: estrellas de ½ a 5 y corazón, al estilo Letterboxd; estante "Tus favoritas".
- **Mi lista**: *Por ver* sobre el mostrador (con animación de ranura al marcar "¡Ya la vi!") y *Vistas* como recibo de caja.
- Validaciones, mensajes de carga, éxito y error, control de duplicados y diseño adaptable a celular.

## Tecnologías

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [Firebase](https://firebase.google.com/): Cloud Firestore (datos) y Authentication (email, Google y anónimo)
- [OMDb API](https://www.omdbapi.com/) (datos y puntajes de IMDb)
- [TMDB API](https://developer.themoviedb.org/) (estrenos, tendencias, mejor puntuadas y plataformas en Argentina).
  Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
- [Mapa Cultural – Salas de cine](https://datos.cultura.gob.ar/dataset/37305de4-3cce-4d4b-9d9a-fec3ca61d09f) (datos abiertos del
  Ministerio de Cultura de la Nación): 316 salas con ubicación. El archivo original está en `biblioteca-series/datos/`
  y la versión que usa la app en `src/data/cines.json`.
- [Pixelarticons](https://pixelarticons.com/) (íconos)
- Publicado en [Vercel](https://vercel.com/)

## Estructura

```
biblioteca-series/
├── firestore.rules          # Reglas de seguridad de Firestore
├── .env.example             # Variables de entorno necesarias (sin valores)
└── src/
    ├── firebase.js          # Conexión con Firebase
    ├── App.jsx              # Estado general y operaciones
    ├── services/
    │   ├── series.js        # Catálogo compartido del club (colección "series")
    │   ├── miLista.js       # Lista personal (usuarios/{uid}/miLista)
    │   └── omdb.js          # Búsqueda en IMDb a través de OMDb
    └── components/          # Interfaz (formulario, tarjetas, inicio, mensajes...)
```

## Datos guardados en Firestore

| Colección | Campos |
|---|---|
| `series/{id}` | `titulo`, `genero`, `plataforma`, `creadaPor`, `vistas`, `confirmaciones`, `ultimaConfirmacion`, y de IMDb: `imdbID`, `poster`, `anio`, `rating`, `trama`, `tipo` |
| `usuarios/{uid}/miLista/{serieId}` | `titulo`, `poster`, `estado` (`porVer` / `vista`), `fecha` |

## Cómo ejecutarlo

Requisitos: [Node.js](https://nodejs.org/) 18 o superior.

```bash
git clone https://github.com/Rociob03/TP2_Front.git
cd TP2_Front/biblioteca-series
npm install
```

1. Copiá `.env.example` como `.env` y completá los valores:
   - **Firebase**: Consola de Firebase → Configuración del proyecto → Tus apps → app web (`</>`).
   - **OMDb**: pedí una clave gratuita en <https://www.omdbapi.com/apikey.aspx> y activala desde el mail.
   - **TMDB**: creá una cuenta y pedí una clave (API Key v3) en <https://www.themoviedb.org/settings/api>.
2. Iniciá el servidor de desarrollo:

```bash
npm run dev
```

Si cambiás el `.env`, reiniciá `npm run dev` para que tome los nuevos valores.

## Configuración de Firebase

1. **Authentication → Método de acceso**: habilitar **Correo electrónico/contraseña**, **Google** y **Anónimo**.
   En **Authentication → Configuración → Dominios autorizados**, agregar el dominio de Vercel (`xxx.vercel.app`) para que funcione el acceso con Google.
2. **Firestore Database**: crear la base (edición Standard, modo producción).
3. **Firestore → Reglas**: pegar el contenido de [`biblioteca-series/firestore.rules`](biblioteca-series/firestore.rules) y **Publicar**.

Las reglas permiten:
- Leer el catálogo del club solo a usuarios autenticados.
- Crear series solo con un título válido y a nombre propio.
- Eliminar solo las series propias.
- Sumar de a una vista al contador, sin modificar otros campos.
- Leer y escribir la lista personal solo a su dueño.

## Despliegue en Vercel

- Framework: **Vite** · Build: `npm run build` · Output: `dist`
- **Root Directory**: `biblioteca-series`
- En **Settings → Environment Variables** (entorno Production) cargar las 6 variables del `.env.example`.
- Si se agregan o cambian variables, hacer **Redeploy**.

Cada `push` a `main` publica una nueva versión automáticamente.
