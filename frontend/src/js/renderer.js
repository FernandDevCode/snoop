// frontend/src/js/renderer.js

document.addEventListener('DOMContentLoaded', async () => {
    // ... (déclaration des éléments du DOM comme avant) ...
    const idDisplayElement = document.getElementById('snoop-id-display');
    const partnerIdInput = document.getElementById('partner-id-input');
    const connectBtn = document.getElementById('connect-btn');
    const modal = document.getElementById('connection-request-modal');
    const requesterIdElement = document.getElementById('requester-id');
    const acceptBtn = document.getElementById('accept-btn');
    const refuseBtn = document.getElementById('refuse-btn');

    let ws;
    let pendingFromId = null;

    try {
        // ... (partie obtention de l'ID, identique) ...
        const response = await fetch('http://localhost:3001/api/get-id', { method: 'POST' });
        const data = await response.json();
        const mySnoopId = data.snoopId;
        idDisplayElement.innerText = mySnoopId.replace(/(\d{3})(?=\d)/g, '$1 ');

        // ... (partie connexion WebSocket, identique) ...
        ws = new WebSocket('ws://localhost:3001');

        ws.onopen = () => {
            console.log("Connecté au serveur via WebSocket !");
            ws.send(JSON.stringify({ type: 'register', id: mySnoopId }));
        };

        // GESTION AMÉLIORÉE DES MESSAGES
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Message reçu du serveur:', message);

            if (message.type === 'incoming-connection-request') {
                pendingFromId = message.fromId;
                requesterIdElement.innerText = pendingFromId;
                modal.style.display = 'flex';
            
            // --- NOUVELLE PARTIE : GÉRER LE RÉSULTAT CÔTÉ DEMANDEUR ---
            } else if (message.type === 'connection-outcome') {
                if (message.outcome === 'accepted') {
                    alert('Connexion acceptée ! Le partage va commencer.');
                    // C'est ici que l'on lancera la logique de partage d'écran (prochaine étape)
                } else {
                    alert("Connexion refusée par l'utilisateur.");
                }
            }
            // --- FIN DE LA NOUVELLE PARTIE ---
        };

        // FONCTION POUR ENVOYER LA RÉPONSE AU SERVEUR
        function sendResponse(responseType) {
            console.log(`Envoi de la réponse : "${responseType}" à ${pendingFromId}`);
            if (pendingFromId) {
                const responseMessage = {
                    type: 'connection-response',
                    toId: pendingFromId, // On dit au serveur à qui est destinée cette réponse
                    response: responseType // 'accepted' ou 'refused'
                };
                ws.send(JSON.stringify(responseMessage));
            }
            modal.style.display = 'none';
            pendingFromId = null;
        }

        // MISE À JOUR DES ÉVÉNEMENTS SUR LES BOUTONS
        acceptBtn.addEventListener('click', () => {
            sendResponse('accepted');
        });

        refuseBtn.addEventListener('click', () => {
            sendResponse('refused');
        });

        // Le bouton "Se connecter" ne change pas
        connectBtn.addEventListener('click', () => {
            const targetId = partnerIdInput.value.trim().replace(/\s/g, '');
            if (!targetId) return;
            ws.send(JSON.stringify({ type: 'request-connection', targetId: targetId }));
        });

    } catch (error) {
        console.error("Erreur de communication avec le serveur:", error);
        // ...
    }
});