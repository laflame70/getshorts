# Video Editor App - Ready for Render

## Setup locale

Copia `api/.env.example` in `api/.env` e inserisci le variabili.

Backend:
```
cd api
npm install
npm run dev
```

Frontend:
```
cd client
npm install
npm run dev
```

## Deploy su Render

Importa il repository o usa il file `render.yaml` presente nella cartella principale.

Assicurati di impostare le variabili d'ambiente su Render (MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, EMAIL_*, CLIENT_URL).

Google OAuth callback URL: https://<your-api-url>/api/auth/google/callback
