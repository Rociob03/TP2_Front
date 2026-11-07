# Reel Club 📼

Biblioteca colaborativa de series y películas con estética de videoclub retro.
Cualquier persona puede sumar títulos a la biblioteca compartida (buscándolos en IMDb)
y armar su lista personal de **Por ver** y **Vistas**.

Trabajo Práctico 2 – Desarrollo Frontend II (UADE).

## Funcionalidades

- **Inicio de sesión**: con email y contraseña, con Google o como invitado. Un invitado puede crear
  su cuenta después sin perder su lista ("Guardar mi lista"). Incluye recuperación de contraseña.
- **Biblioteca compartida**: agregar y eliminar series (cada persona solo puede eliminar las que cargó).
- **Buscador de IMDb**: al agregar una serie se busca por título y se completan solos el título,
  el género (traducido al español), el año, el póster, el puntaje de IMDb y la sinopsis.
  Si no aparece, se puede cargar a mano.
- **Mi lista**: marcar series como *Por ver*, pasarlas a *Vistas* o quitarlas.
- **Inicio**: filas de *Más vistas*, *Sugerencias para vos* (según los géneros de tu lista) y *Recién agregadas*.
- Validaciones, mensajes de carga, éxito y error, control de duplicados y diseño adaptable a celular.

## Tecnologías

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [Firebase](https://firebase.google.com/): Cloud Firestore (datos) y Authentication (email, Google y anónimo)
- [OMDb API](https://www.omdbapi.com/) (datos de IMDb)
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
    │   ├── series.js        # Biblioteca compartida (colección "series")
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
- Leer la biblioteca solo a usuarios autenticados.
- Crear series solo con un título válido y a nombre propio.
- Eliminar solo las series propias.
- Sumar de a una vista al contador, sin modificar otros campos.
- Leer y escribir la lista personal solo a su dueño.

## Despliegue en Vercel

- Framework: **Vite** · Build: `npm run build` · Output: `dist`
- **Root Directory**: `biblioteca-series`
- En **Settings → Environment Variables** (entorno Production) cargar las 5 variables del `.env.example`.
- Si se agregan o cambian variables, hacer **Redeploy**.

Cada `push` a `main` publica una nueva versión automáticamente.
