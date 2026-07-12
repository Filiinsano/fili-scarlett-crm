const localtunnel = require('localtunnel');

async function startTunnel() {
    try {
        console.log("Iniciando localtunnel...");
        const tunnel = await localtunnel({ port: 3000, subdomain: 'felipe-scarlett', local_host: '127.0.0.1' });
        console.log('your url is:', tunnel.url);

        tunnel.on('close', () => {
            console.log('Tunnel cerrado. Reiniciando en 5 segundos...');
            setTimeout(startTunnel, 5000);
        });

        tunnel.on('error', (err) => {
            console.error('Error en el tunnel:', err);
            try {
                tunnel.close();
            } catch(e) {}
        });
    } catch (e) {
        console.error("Error al arrancar el tunnel:", e);
        console.log("Reiniciando en 5 segundos...");
        setTimeout(startTunnel, 5000);
    }
}

startTunnel();

// Mantener el proceso Node activo
setInterval(() => {}, 60000);
