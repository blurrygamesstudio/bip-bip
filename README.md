# Bip Bip

Bot Discord généré par **BotForge**.

## Installation locale

1. Installer [Node.js](https://nodejs.org) 18+
2. `npm install`
3. Copier `.env.example` vers `.env` et renseigner `DISCORD_TOKEN`
4. `npm start`

## Déploiement sur Render (gratuit)

1. Créer un repo GitHub avec ces fichiers
2. Aller sur [render.com](https://render.com) → **New** → **Web Service**
3. Connecter le repo GitHub
4. Render détectera automatiquement `render.yaml`
5. Ajouter la variable d'environnement `DISCORD_TOKEN` avec le jeton du bot
6. Cliquer **Create Web Service** — le bot sera en ligne 24/7

## Autres plateformes

- **Railway** : `railway init` puis ajouter `DISCORD_TOKEN`
- **Heroku** : `heroku create && git push heroku main` puis `heroku config:set DISCORD_TOKEN=...`
- **VPS** : installer Node.js, cloner le repo, utiliser PM2 : `pm2 start bot.js --name bip-bip`
