/*
   Scarlett AI - Servidor Backend de Integración para Retell AI & Cartesia
   
   Felipe, este archivo está configurado específicamente para Retell AI y Cartesia.
   Incluye:
   1. Endpoints de API para servir citas y llamadas al Dashboard.
   2. Endpoint para leer y actualizar el Prompt del agente en Retell AI de forma dinámica.
   3. Webhook para registrar citas (tool calling) y guardarlas en base de datos.
   4. Webhook de eventos (fin de llamada) para almacenar grabaciones y enviar WhatsApp vía Twilio.
*/

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Servir la landing page y el dashboard en http://localhost:3000

const PORT = process.env.PORT || 3000;

// Configuración de base de datos local
const citasFilePath = path.join(__dirname, 'data', 'citas.json');
const llamadasFilePath = path.join(__dirname, 'data', 'llamadas.json');
const localPromptFilePath = path.join(__dirname, 'data', 'prompt.json');

// Reemplaza esto con tu API Key real de Retell
const RETELL_API_KEY = process.env.RETELL_API_KEY || 'key_28826c026b3e82144b8920e7181f';
const AGENT_ID = 'agent_1acf0831608f99ab3c87a7052b'; // ID de Fili

// Funciones ayudantes para persistir datos
function readDataFile(filePath, defaultData = []) {
    try {
        if (!fs.existsSync(filePath)) {
            return defaultData;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error leyendo archivo de datos:", filePath, e);
        return defaultData;
    }
}

function writeDataFile(filePath, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("Error escribiendo archivo de datos:", filePath, e);
    }
}

// ==========================================
// 1. ENDPOINTS DE API PARA EL DASHBOARD CRM
// ==========================================

// Obtener todas las citas
app.get('/api/citas', (req, res) => {
    const citas = readDataFile(citasFilePath);
    res.json(citas);
});

// Obtener todo el historial de llamadas
app.get('/api/llamadas', (req, res) => {
    const llamadas = readDataFile(llamadasFilePath);
    res.json(llamadas);
});

// Endpoint para iniciar llamada web en vivo (Frontend -> Backend -> Retell)
app.post('/api/create-web-call', async (req, res) => {
    try {
        console.log("Generando llamada web para el agente:", AGENT_ID);
        
        const response = await fetch('https://api.retellai.com/v2/create-web-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RETELL_API_KEY}`
            },
            body: JSON.stringify({
                agent_id: AGENT_ID
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error("Error de Retell AI:", errData);
            return res.status(response.status).json({ error: "Error al comunicarse con Retell AI.", details: errData });
        }

        const data = await response.json();
        console.log("Llamada web creada con éxito. Access Token recibido.");
        res.json({ accessToken: data.access_token });

    } catch (error) {
        console.error("Error interno al crear llamada web:", error);
        res.status(500).json({ error: "Error interno al crear la llamada web." });
    }
});

// ==========================================
// 2. ENDPOINT PARA LEER Y ACTUALIZAR PROMPT (Dashboard -> Retell AI API)
// ==========================================

// Obtener el Prompt del sistema actual
app.get('/api/agent-prompt', async (req, res) => {
    try {
        console.log("Consultando Prompt del Agente en Retell...");
        
        // 1. Obtener los detalles del agente para extraer el llm_id
        const resAgent = await fetch(`https://api.retellai.com/v2/get-agent/${AGENT_ID}`, {
            headers: { 'Authorization': `Bearer ${RETELL_API_KEY}` }
        });
        
        if (resAgent.ok) {
            const agentData = await resAgent.ok ? await resAgent.json() : {};
            const llmId = agentData.response_engine?.llm_id;
            
            if (llmId) {
                // 2. Obtener la configuración del LLM de Retell
                const resLlm = await fetch(`https://api.retellai.com/v2/get-retell-llm/${llmId}`, {
                    headers: { 'Authorization': `Bearer ${RETELL_API_KEY}` }
                });
                
                if (resLlm.ok) {
                    const llmData = await resLlm.json();
                    console.log("Prompt cargado con éxito desde Retell API.");
                    return res.json({ prompt: llmData.general_prompt });
                }
            }
        }
    } catch (e) {
        console.log("Error al conectar con Retell API. Usando prompt respaldado localmente.");
    }
    
    // Fallback local si la API falla o no está configurada
    const localPrompt = readDataFile(localPromptFilePath, { prompt: "Hola, soy Fili, tu asistente virtual. ¿En qué puedo ayudarte?" });
    res.json(localPrompt);
});

// Actualizar el Prompt del sistema
app.post('/api/agent-prompt', async (req, res) => {
    const { prompt } = req.body;
    console.log("Recibida solicitud para actualizar prompt...");

    // 1. Respaldar localmente
    writeDataFile(localPromptFilePath, { prompt });

    try {
        // 2. Obtener el agente para saber el llm_id
        const resAgent = await fetch(`https://api.retellai.com/v2/get-agent/${AGENT_ID}`, {
            headers: { 'Authorization': `Bearer ${RETELL_API_KEY}` }
        });
        
        if (resAgent.ok) {
            const agentData = await resAgent.json();
            const llmId = agentData.response_engine?.llm_id;
            
            if (llmId) {
                // 3. Hacer PATCH para actualizar el prompt en Retell AI
                const resUpdate = await fetch(`https://api.retellai.com/v2/update-retell-llm/${llmId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RETELL_API_KEY}`
                    },
                    body: JSON.stringify({
                        general_prompt: prompt
                    })
                });

                if (resUpdate.ok) {
                    console.log("¡Prompt del Agente actualizado con éxito en Retell AI!");
                    return res.json({ success: true, message: "Prompt actualizado en Retell y localmente." });
                } else {
                    const errData = await resUpdate.json();
                    console.error("Error al actualizar LLM en Retell:", errData);
                }
            }
        }
    } catch (e) {
        console.log("Error al actualizar en Retell. Guardado solo en local.");
    }

    res.json({ success: true, message: "Prompt guardado localmente (Retell API offline)." });
});

// ==========================================
// 3. MOTOR DE NOTIFICACIONES WHATSAPP (Twilio API Integration)
// ==========================================
async function enviarMensajeWhatsApp(telefono, mensaje) {
    console.log("==========================================");
    console.log(`📲 [WhatsApp Notification Engine]`);
    console.log(`Para: ${telefono}`);
    console.log(`Mensaje: "${mensaje}"`);
    console.log("==========================================");

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886'; // sandbox de Twilio

    if (accountSid && authToken) {
        try {
            const twilio = require('twilio');
            const client = twilio(accountSid, authToken);
            
            // Forzar formato whatsapp: para Twilio
            const toFormatted = telefono.startsWith('whatsapp:') ? telefono : `whatsapp:${telefono}`;
            const fromFormatted = fromPhone.startsWith('whatsapp:') ? fromPhone : `whatsapp:${fromPhone}`;

            await client.messages.create({
                body: mensaje,
                from: fromFormatted,
                to: toFormatted
            });
            console.log(`[WhatsApp Engine] ¡Mensaje enviado con éxito a través de Twilio!`);
        } catch (e) {
            console.error(`[WhatsApp Engine] Error al enviar Twilio:`, e.message);
        }
    } else {
        console.log(`[WhatsApp Engine] MOCK: Twilio no configurado. Mensaje simulado en logs con éxito.`);
    }
}

// ==========================================
// 4. WEBHOOK DE HERRAMIENTAS (Tool Calling)
// ==========================================
app.post('/webhook/agendar', async (req, res) => {
    const payload = req.body;
    console.log("Petición de herramienta recibida de Retell:", JSON.stringify(payload, null, 2));

    try {
        const toolCalls = payload.tool_calls;
        
        if (toolCalls && toolCalls.length > 0) {
            const toolCall = toolCalls[0];
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

            console.log(`[Herramienta Ejecutada] Nombre de función: ${functionName}`);
            
            if (functionName === 'agendar_cita' || functionName === 'book_appointment') {
                const { nombre, fecha, hora, servicio } = args;
                console.log(`[Cita Confirmada] Cliente: ${nombre}, Servicio: ${servicio}, Fecha: ${fecha}, Hora: ${hora}`);

                // Guardar la cita real en citas.json
                const citas = readDataFile(citasFilePath);
                const nuevaCita = {
                    id: citas.length > 0 ? Math.max(...citas.map(c => c.id)) + 1 : 1,
                    nombre,
                    servicio,
                    fecha,
                    hora,
                    nicho: "dentistas",
                    estado: "Confirmada",
                    creadoEn: new Date().toISOString()
                };
                citas.push(nuevaCita);
                writeDataFile(citasFilePath, citas);

                console.log(`[Base de Datos] Nueva cita guardada: ID ${nuevaCita.id}`);

                return res.status(200).json({
                    output: `Perfecto ${nombre}, tu cita para ${servicio} ha quedado agendada con éxito el día ${fecha} a las ${hora}. Te llegará un mensaje de confirmación.`
                });
            }
        }

        res.status(400).json({ error: "Herramienta no reconocida o formato inválido." });

    } catch (error) {
        console.error("Error al procesar la herramienta de Retell:", error);
        res.status(500).json({ error: "Error interno al procesar el agendamiento." });
    }
});

// ==========================================
// 5. WEBHOOK DE EVENTOS (Fin de llamada & WhatsApp)
// ==========================================
app.post('/webhook/estado-llamada', async (req, res) => {
    const payload = req.body;
    console.log("Evento recibido de Retell:", payload.event);
    
    // En Retell V2, 'call_analyzed' es el evento que trae el resumen final y la grabación completa.
    if (payload.event === 'call_ended' || payload.event === 'call_analyzed') {
        const callData = payload.call;
        const recordingUrl = callData.recording_url;
        const summary = callData.call_analysis?.call_summary;
        const durationSec = callData.duration_ms ? Math.round(callData.duration_ms / 1000) : 0;
        
        // EXTRAER DATOS PERSONALIZADOS DE RETELL (Para el Kanban)
        const customData = callData.call_analysis?.custom_analysis_data || {};
        const nombreCliente = customData.nombre_cliente || "Cliente Nuevo";
        const telefonoCliente = customData.telefono_cliente || callData.user_phone_number || callData.from_number || "Sin teléfono";
        const servicioDeseado = customData.servicio_deseado || "Atención General";
        
        // Formatear transcripción para que sea legible
        const retellTranscript = callData.transcript_object || [];
        const formattedTranscript = retellTranscript.map(line => ({
            role: line.role === 'agent' ? 'agent' : 'user',
            content: line.content
        }));

        console.log("==========================================");
        console.log("📞 LLAMADA WEB FINALIZADA");
        console.log(`Resumen de la IA: ${summary}`);
        console.log(`Grabación de Audio: ${recordingUrl}`);
        console.log("==========================================");

        // Mapeo básico Multi-Cliente: Si tuviéramos varios agentes, cruzaríamos agent_id con la base de datos.
        // Como ahorita es el de prueba, lo asignamos a 'admin' para que siempre lo veas en tu sesión maestra.
        const nichoAsignado = callData.agent_id === AGENT_ID ? "admin" : "dentista@demo.com";

        // Guardar llamada real en llamadas.json
        const llamadas = readDataFile(llamadasFilePath);
        const nuevaLlamada = {
            id: llamadas.length > 0 ? Math.max(...llamadas.map(l => l.id)) + 1 : 1,
            fecha: new Date().toISOString(),
            duracion: `${durationSec}s`,
            nicho: nichoAsignado,
            grabacion: recordingUrl || "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
            resumen: summary || "Conversación telefónica gestionada por la IA.",
            transcripcion: formattedTranscript
        };
        
        llamadas.push(nuevaLlamada);
        writeDataFile(llamadasFilePath, llamadas);
        console.log(`[Base de Datos] Historial de llamada guardado: ID ${nuevaLlamada.id}`);

        // CREAR NUEVO LEAD EN EL PIPELINE KANBAN (citas.json)
        const citas = readDataFile(citasFilePath);
        const nuevoLead = {
            id: citas.length > 0 ? Math.max(...citas.map(c => c.id)) + 1 : 1,
            nombre: nombreCliente,
            servicio: servicioDeseado,
            fecha: new Date().toISOString().split('T')[0],
            hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            nicho: nichoAsignado,
            estado: "Nuevo",
            estado_kanban: "Nuevo",
            telefono: telefonoCliente
        };
        
        citas.push(nuevoLead);
        writeDataFile(citasFilePath, citas);
        console.log(`[Base de Datos] Nuevo Lead en CRM: ${nombreCliente} - ${servicioDeseado}`);

        // DISPARAR NOTIFICACIÓN DE CONFIRMACIÓN POR WHATSAPP
        const userPhone = telefonoCliente;
        const msgConfirmacion = `¡Hola ${nombreCliente}! Hemos registrado tu interés por "${servicioDeseado}". Resumen de la IA: "${nuevaLlamada.resumen}". Nos pondremos en contacto muy pronto. ¡Gracias por confiar en Scarlett!`;
        
        // Ejecutar en segundo plano sin bloquear la respuesta de Retell
        enviarMensajeWhatsApp(userPhone, msgConfirmacion);
    }

    res.status(200).json({ status: "recibido" });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend de Scarlett corriendo en http://localhost:${PORT}`);
});
