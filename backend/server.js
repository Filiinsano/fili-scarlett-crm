/*
   Scarlett AI - Servidor Backend de Integración para Retell AI & Cartesia
   
   Felipe, este archivo está configurado específicamente para Retell AI y Cartesia.
   Incluye:
   1. Endpoints de API para servir citas y llamadas al Dashboard desde FIREBASE.
   2. Endpoint para leer y actualizar el Prompt del agente en Retell AI de forma dinámica.
   3. Webhook para registrar citas (tool calling) y guardarlas en Firebase.
   4. Webhook de eventos (fin de llamada) para almacenar grabaciones y enviar WhatsApp vía Twilio.
*/

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Servir la landing page y el dashboard

const PORT = process.env.PORT || 3000;

// Configuración de base de datos local para el prompt
const localPromptFilePath = path.join(__dirname, 'data', 'prompt.json');

// Reemplaza esto con tu API Key real de Retell
const RETELL_API_KEY = process.env.RETELL_API_KEY || 'key_28826c026b3e82144b8920e7181f';
const AGENT_ID = 'agent_1acf0831608f99ab3c87a7052b'; // ID de Fili

// ==========================================
// INICIALIZAR FIREBASE ADMIN SDK
// ==========================================
let db;
try {
    let serviceAccount;
    if (process.env.FIREBASE_CREDENTIALS) {
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else {
        serviceAccount = require('./config/firebase-key.json');
    }
    
    initializeApp({
      credential: cert(serviceAccount)
    });
    db = getFirestore();
    console.log("🔥 Firebase conectado exitosamente. Memoria permanente activada.");
} catch (error) {
    console.error("❌ Error al conectar con Firebase. Asegúrate de que backend/config/firebase-key.json exista.", error);
}

// Funciones ayudantes para persistir datos locales (solo para el prompt)
function readDataFile(filePath, defaultData = []) {
    try {
        if (!fs.existsSync(filePath)) return defaultData;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return defaultData;
    }
}

function writeDataFile(filePath, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("Error escribiendo archivo local:", filePath, e);
    }
}

// ==========================================
// 1. ENDPOINTS DE API PARA EL DASHBOARD CRM
// ==========================================

// Obtener todas las citas desde FIREBASE
app.get('/api/citas', async (req, res) => {
    try {
        if (!db) return res.json([]);
        const snapshot = await db.collection('citas').orderBy('creadoEn', 'desc').get();
        const citas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(citas);
    } catch (error) {
        console.error("Error obteniendo citas de Firebase:", error);
        res.status(500).json({ error: "Error de BD" });
    }
});

// Obtener todo el historial de llamadas desde FIREBASE
app.get('/api/llamadas', async (req, res) => {
    try {
        if (!db) return res.json([]);
        const snapshot = await db.collection('llamadas').orderBy('fecha', 'desc').get();
        const llamadas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(llamadas);
    } catch (error) {
        console.error("Error obteniendo llamadas de Firebase:", error);
        res.status(500).json({ error: "Error de BD" });
    }
});

// Endpoint para iniciar llamada web en vivo (Frontend -> Backend -> Retell)
app.post('/api/create-web-call', async (req, res) => {
    try {
        const response = await fetch('https://api.retellai.com/v2/create-web-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RETELL_API_KEY}`
            },
            body: JSON.stringify({ agent_id: AGENT_ID })
        });
        if (!response.ok) return res.status(response.status).json({ error: "Error Retell" });
        const data = await response.json();
        res.json({ accessToken: data.access_token });
    } catch (error) {
        res.status(500).json({ error: "Error interno al crear la llamada web." });
    }
});

// ==========================================
// 2. ENDPOINT PARA LEER Y ACTUALIZAR PROMPT (Dashboard -> Retell AI API)
// ==========================================
app.get('/api/agent-prompt', async (req, res) => {
    try {
        const resAgent = await fetch(`https://api.retellai.com/v2/get-agent/${AGENT_ID}`, { headers: { 'Authorization': `Bearer ${RETELL_API_KEY}` } });
        if (resAgent.ok) {
            const agentData = await resAgent.json();
            const llmId = agentData.response_engine?.llm_id;
            if (llmId) {
                const resLlm = await fetch(`https://api.retellai.com/v2/get-retell-llm/${llmId}`, { headers: { 'Authorization': `Bearer ${RETELL_API_KEY}` } });
                if (resLlm.ok) {
                    const llmData = await resLlm.json();
                    return res.json({ prompt: llmData.general_prompt });
                }
            }
        }
    } catch (e) {}
    res.json(readDataFile(localPromptFilePath, { prompt: "Hola, soy Fili, tu asistente virtual." }));
});

app.post('/api/agent-prompt', async (req, res) => {
    const { prompt } = req.body;
    writeDataFile(localPromptFilePath, { prompt });
    try {
        const resAgent = await fetch(`https://api.retellai.com/v2/get-agent/${AGENT_ID}`, { headers: { 'Authorization': `Bearer ${RETELL_API_KEY}` } });
        if (resAgent.ok) {
            const agentData = await resAgent.json();
            const llmId = agentData.response_engine?.llm_id;
            if (llmId) {
                await fetch(`https://api.retellai.com/v2/update-retell-llm/${llmId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RETELL_API_KEY}` },
                    body: JSON.stringify({ general_prompt: prompt })
                });
                return res.json({ success: true, message: "Prompt actualizado en Retell y localmente." });
            }
        }
    } catch (e) {}
    res.json({ success: true, message: "Prompt guardado localmente (Retell API offline)." });
});

// ==========================================
// 3. MOTOR DE NOTIFICACIONES WHATSAPP (Twilio API Integration)
// ==========================================
async function enviarMensajeWhatsApp(telefono, mensaje) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';
    if (accountSid && authToken) {
        try {
            const twilio = require('twilio');
            const client = twilio(accountSid, authToken);
            const toFormatted = telefono.startsWith('whatsapp:') ? telefono : `whatsapp:${telefono}`;
            const fromFormatted = fromPhone.startsWith('whatsapp:') ? fromPhone : `whatsapp:${fromPhone}`;
            await client.messages.create({ body: mensaje, from: fromFormatted, to: toFormatted });
        } catch (e) {}
    }
}

// ==========================================
// 4. WEBHOOK DE HERRAMIENTAS (Tool Calling)
// ==========================================
app.post('/webhook/agendar', async (req, res) => {
    const payload = req.body;
    try {
        const toolCalls = payload.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
            const toolCall = toolCalls[0];
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);
            
            if (functionName === 'agendar_cita' || functionName === 'book_appointment') {
                const { nombre, fecha, hora, servicio } = args;
                const callId = payload.call?.call_id || Date.now().toString();
                
                // Guardar en FIREBASE
                if (db) {
                    await db.collection('citas').doc(callId).set({
                        nombre,
                        servicio,
                        fecha,
                        hora,
                        nicho: "dentistas",
                        estado: "Confirmada",
                        estado_kanban: "Confirmada",
                        creadoEn: new Date().toISOString()
                    }, { merge: true });
                }
                
                return res.status(200).json({
                    output: `Perfecto ${nombre}, tu cita para ${servicio} ha quedado agendada con éxito el día ${fecha} a las ${hora}.`
                });
            }
        }
        res.status(400).json({ error: "Herramienta no reconocida." });
    } catch (error) {
        res.status(500).json({ error: "Error interno al procesar el agendamiento." });
    }
});

// ==========================================
// 5. WEBHOOK DE EVENTOS (Fin de llamada & WhatsApp)
// ==========================================
app.post('/webhook/estado-llamada', async (req, res) => {
    const payload = req.body;
    if (payload.event === 'call_ended' || payload.event === 'call_analyzed') {
        const callData = payload.call;
        const recordingUrl = callData.recording_url;
        const summary = callData.call_analysis?.call_summary;
        const durationSec = callData.duration_ms ? Math.round(callData.duration_ms / 1000) : 0;
        
        const customData = callData.call_analysis?.custom_analysis_data || {};
        const nombreCliente = customData.nombre_cliente || "Cliente Nuevo";
        const telefonoCliente = customData.telefono_cliente || callData.user_phone_number || callData.from_number || "Sin teléfono";
        const servicioDeseado = customData.servicio_deseado || "Atención General";
        
        const retellTranscript = callData.transcript_object || [];
        const formattedTranscript = retellTranscript.map(line => ({
            role: line.role === 'agent' ? 'agent' : 'user',
            content: line.content
        }));

        const nichoAsignado = callData.agent_id === AGENT_ID ? "admin" : "dentista@demo.com";

        // Guardar llamada en FIREBASE
        if (db) {
            const callId = callData.call_id || Date.now().toString();
            
            await db.collection('llamadas').doc(callId).set({
                fecha: new Date().toISOString(),
                duracion: `${durationSec}s`,
                nicho: nichoAsignado,
                grabacion: recordingUrl || "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
                resumen: summary || "Conversación gestionada por la IA.",
                transcripcion: formattedTranscript
            }, { merge: true });

            // Guardar el LEAD en Firebase para el Kanban SOLO si no se agendó cita antes
            const docRef = db.collection('citas').doc(callId);
            const docSnap = await docRef.get();
            
            if (!docSnap.exists) {
                await docRef.set({
                    nombre: nombreCliente,
                    servicio: servicioDeseado,
                    fecha: new Date().toISOString().split('T')[0],
                    hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                    nicho: nichoAsignado,
                    estado: "Nuevo",
                    estado_kanban: "Nuevo",
                    telefono: telefonoCliente,
                    creadoEn: new Date().toISOString()
                });
            } else {
                // Si ya existe (porque agendó en la llamada), solo actualizamos su teléfono
                await docRef.set({ telefono: telefonoCliente }, { merge: true });
            }
        }

        const msgConfirmacion = `¡Hola ${nombreCliente}! Hemos registrado tu interés por "${servicioDeseado}". Resumen de la IA: "${summary}". Nos pondremos en contacto muy pronto. ¡Gracias por confiar en Scarlett!`;
        enviarMensajeWhatsApp(telefonoCliente, msgConfirmacion);
    }
    res.status(200).json({ status: "recibido" });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
