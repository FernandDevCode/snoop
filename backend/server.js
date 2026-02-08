// backend/server.js (Version complète et correcte)

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app); 
const wss = new WebSocket.Server({ server });

const clients = new Map();

app.post('/api/get-id', (req, res) => {
    const newId = Math.floor(100000000 + Math.random() * 900000000).toString();
    console.log(`[HTTP] ID généré et envoyé : ${newId}`);
    res.json({ snoopId: newId });
});

wss.on('connection', (ws) => {
    console.log('[WS] Un nouveau client est connecté.');
    let currentClientId = null;

    
    ws.on('message', (messageAsString) => {
        const message = JSON.parse(messageAsString);

        if (message.type === 'register') {
            currentClientId = message.id;
            clients.set(currentClientId, ws);
            console.log(`[WS] Client ${currentClientId} a été enregistré.`);
        
        } else if (message.type === 'request-connection') {
            const targetId = message.targetId;
            console.log(`[WS] Le client ${currentClientId} demande à se connecter à ${targetId}`);

            const targetClient = clients.get(targetId);

            if (targetClient) {
                console.log(`[WS] Cible ${targetId} trouvée. On lui transmet la demande.`);
                const forwardMessage = {
                    type: 'incoming-connection-request',
                    fromId: currentClientId
                };
                targetClient.send(JSON.stringify(forwardMessage));
            } else {
                console.log(`[WS] Cible ${targetId} non trouvée ou non connectée.`);
            }
        } // --- NOUVELLE LOGIQUE POUR GÉRER LES RÉPONSES ---
        
        else if (message.type === 'connection-response') {
            const { toId, response } = message; // 'toId' est le demandeur initial
            console.log(`[WS] Le client ${currentClientId} a répondu "${response}" à la demande de ${toId}`);
            
            const originalRequester = clients.get(toId); // On cherche le demandeur dans notre liste

            if (originalRequester) {
                // Si le demandeur est toujours connecté
                console.log(`[WS] Demandeur ${toId} trouvé. On lui transmet la réponse.`);
                
                const forwardMessage = {
                    type: 'connection-outcome', // On utilise un nouveau type pour le résultat
                    outcome: response // 'accepted' ou 'refused'
                };
                
                originalRequester.send(JSON.stringify(forwardMessage));
            } else {
                console.log(`[WS] Demandeur ${toId} introuvable pour transmettre la réponse.`);
            }
        }

        else if (message.type === 'connection-response') {
            // ... (logique existante) ...

        // --- NOUVELLE LOGIQUE POUR RELAYER LES MESSAGES WEBRTC ---
        } else if (message.type === 'webrtc-signal') {
            const { toId, signal } = message;
            const targetClient = clients.get(toId);
            
            if (targetClient) {
                console.log(`[WS] Relais du signal WebRTC de ${currentClientId} vers ${toId}`);
                targetClient.send(JSON.stringify({
                    type: 'webrtc-signal',
                    fromId: currentClientId,
                    signal: signal
                }));
            }
        }

    });

    ws.on('close', () => {
        if (currentClientId) {
            clients.delete(currentClientId);
            console.log(`[WS] Client ${currentClientId} s'est déconnecté.`);
        } else {
            console.log('[WS] Un client non enregistré s\'est déconnecté.');
        }
    });
});

const PORT = 3001;
// Assurez-vous que cette ligne est bien "server.listen"
server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});