/* 
   Scarlett AI - Lógica de Interactividad, Nichos y Simulaciones (Vanilla JS)
   
   Felipe, en este archivo programamos todas las funciones inteligentes:
   1. Cambio de Tema (Claro/Oscuro).
   2. Selector de Nicho (Actualiza el color de acento, la calculadora de ROI y los textos).
   3. Simulador de Chat (Respuestas automáticas inteligentes adaptadas al nicho).
   4. Simulador de Llamadas por Voz (Onda sonora animada, sintetizador de audio en JS y transcripción).
   5. Acordeón de FAQs (Preguntas frecuentes con apertura suave).
*/

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar los iconos de Lucide
    lucide.createIcons();

    // ==========================================
    // CONFIGURACIÓN DE NICHOS / INDUSTRIAS
    // ==========================================
    const NICHES = {
        dentistas: {
            accent: 'hsl(14, 85%, 50%)',
            accentRgb: '230, 80, 30',
            calls: 35,
            ticket: 120,
            conv: 45,
            chatWelcome: "¡Hola! Soy Scarlett, la recepcionista de IA de la clínica DentalCare. ¿Le gustaría agendar una cita para una limpieza o consulta dental?",
            chatAnswers: {
                cita: "¡Excelente decisión! Tengo disponible mañana a las 3:30 PM o a las 5:00 PM para su consulta dental. ¿Cuál le queda mejor? Confírmame tu nombre completo para bloquear el horario en la agenda.",
                servicios: "Ofrecemos limpiezas, ortodoncia, estética dental e implantes. En Scarlett podemos resolver dudas de estos tratamientos y agendar directamente.",
                soporte: "Entiendo, lamento el inconveniente con tu pago. Por favor indícame tu nombre completo o correo para revisar la cuenta del consultorio.",
                defecto: "Hola, soy tu recepcionista de IA. Puedo resolver dudas y agendar citas en tu clínica 24/7. ¿En qué te puedo ayudar hoy?"
            },
            voiceTranscript: [
                { sender: 'caller', text: "Hola, buenas tardes, ¿tienen alguna cita disponible para mañana por la tarde?" },
                { sender: 'bot', text: "¡Hola! Claro que sí. En DentalCare tengo espacio mañana a las 3:30 PM o a las 5:00 PM para consulta. ¿Cuál prefiere?" },
                { sender: 'caller', text: "La de las 5:00 PM me va perfecto, por favor." },
                { sender: 'bot', text: "Excelente. Queda agendada su consulta dental para mañana a las 5:00 PM. Le acabo de enviar la confirmación por WhatsApp." }
            ]
        },
        spas: {
            accent: 'hsl(280, 70%, 55%)', // Morado relajante
            accentRgb: '160, 40, 200',
            calls: 50,
            ticket: 65,
            conv: 50,
            chatWelcome: "¡Hola! Soy Scarlett, asistente virtual de Mandala Spa. ¿Le gustaría reservar un masaje relajante, facial o manicura para consentirse hoy?",
            chatAnswers: {
                cita: "¡Maravilloso! Tengo espacio libre este sábado a las 11:00 AM o a las 4:30 PM para un masaje. ¿Cuál prefiere? Indíqueme su nombre para reservar.",
                servicios: "Mandala Spa ofrece masajes de relajación, piedras calientes, exfoliaciones corporales y faciales premium. Todos se agendan de inmediato.",
                soporte: "Lamento el problema con tu cobro. Déjame el número de transacción que aparece en tu banco para verificarlo con administración del Spa.",
                defecto: "Hola, soy tu recepcionista virtual. Atiendo reservas de masajes y tratamientos en Mandala Spa 24/7. ¿Qué servicio te gustaría reservar hoy?"
            },
            voiceTranscript: [
                { sender: 'caller', text: "Hola, quería reservar un masaje relajante para dos personas para este sábado." },
                { sender: 'bot', text: "¡Hola, encantada! En Mandala Spa tengo disponible el sábado a las 11:00 AM y a las 4:30 PM para pareja. ¿Le sirve alguno?" },
                { sender: 'caller', text: "El de las 4:30 PM está excelente, a nombre de Laura." },
                { sender: 'bot', text: "Perfecto Laura, queda reservado el masaje de pareja para este sábado a las 4:30 PM. ¡Les esperamos en Mandala Spa!" }
            ]
        },
        restaurantes: {
            accent: 'hsl(350, 80%, 48%)', // Rojo gastronómico cálido
            accentRgb: '220, 20, 50',
            calls: 80,
            ticket: 45,
            conv: 60,
            chatWelcome: "¡Hola! Soy Scarlett, la asistente virtual de la parrilla El Fuego. ¿Te gustaría reservar una mesa para esta noche o ver nuestro menú?",
            chatAnswers: {
                cita: "¡Perfecto! Tengo una mesa libre en la terraza para hoy a las 8:30 PM. ¿Te gustaría que la asegure a tu nombre? Dime para cuántas personas sería.",
                servicios: "Nuestra especialidad son los cortes de carne a la parrilla, pastas artesanales y coctelería premium. ¿Deseas ver la carta de vinos?",
                soporte: "Si tuviste un problema con tu reserva o pedido a domicilio, facilítame tu número celular para que el gerente se comunique contigo de inmediato.",
                defecto: "¡Hola! Soy Scarlett. Administro las reservaciones de mesa y domicilios en El Fuego 24/7. ¿Deseas reservar mesa o pedir a casa?"
            },
            voiceTranscript: [
                { sender: 'caller', text: "Hola, buenas, quería reservar una mesa para 4 personas para hoy a las 8:30 PM." },
                { sender: 'bot', text: "¡Hola! Claro que sí. En El Fuego tengo una mesa disponible en la zona de la terraza a las 8:30 PM. ¿La aseguro a tu nombre?" },
                { sender: 'caller', text: "Sí, por favor, a nombre de Carlos Gómez." },
                { sender: 'bot', text: "Mesa reservada para 4 personas hoy a las 8:30 PM a nombre de Carlos. Te llegará un SMS de confirmación." }
            ]
        },
        abogados: {
            accent: 'hsl(210, 80%, 45%)', // Azul corporativo de confianza
            accentRgb: '20, 110, 220',
            calls: 20,
            ticket: 250,
            conv: 35,
            chatWelcome: "¡Hola! Soy Scarlett, asistente de la firma LegalConsult. ¿Le gustaría agendar una asesoría jurídica inicial de 30 minutos con alguno de nuestros abogados?",
            chatAnswers: {
                cita: "Excelente. Tengo espacio disponible para una asesoría penal o laboral con el Lic. Martínez mañana a las 10:00 AM o el jueves a las 2:00 PM. ¿Cuál le acomoda?",
                servicios: "Ofrecemos asesoría en derecho corporativo, civil, familiar y laboral. Todas las citas de diagnóstico se agendan por este medio.",
                soporte: "Lamento la confusión con su factura de honorarios. Indíqueme su número de contrato o RFC para derivarlo con tesorería.",
                defecto: "Hola, soy el asistente de IA de la firma. Agendo citas de consultoría y respondo dudas básicas sobre nuestras áreas de práctica 24/7."
            },
            voiceTranscript: [
                { sender: 'caller', text: "Hola, buenas, necesito agendar una consulta urgente con un abogado laboral para esta semana." },
                { sender: 'bot', text: "¡Hola! Entiendo. Tengo espacio libre con el especialista Lic. Martínez mañana a las 10:00 AM o el jueves a las 2:00 PM. ¿Cuál prefiere?" },
                { sender: 'caller', text: "Mañana a las 10:00 AM me va muy bien." },
                { sender: 'bot', text: "Perfecto. Queda agendada la asesoría laboral para mañana a las 10:00 AM. Le envié los accesos del Zoom a su correo." }
            ]
        }
    };

    let activeNiche = 'dentistas';

    // ==========================================
    // 1. CONTROL DE TEMA (CLARO / OSCURO)
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        let newTheme = 'light';
        let iconName = 'moon';

        if (currentTheme === 'light') {
            newTheme = 'dark';
            iconName = 'sun';
        }

        htmlElement.setAttribute('data-theme', newTheme);
        themeToggle.innerHTML = `<i data-lucide="${iconName}"></i>`;
        lucide.createIcons();
    });

    // ==========================================
    // 2. CALCULADORA DE ROI INTERACTIVA
    // ==========================================
    const inputCalls = document.getElementById('input-calls');
    const inputValue = document.getElementById('input-value');
    const inputConv = document.getElementById('input-conv');

    const valCalls = document.getElementById('val-calls');
    const valValue = document.getElementById('val-value');
    const valConv = document.getElementById('val-conv');

    const roiIncome = document.getElementById('roi-income');
    const roiYearly = document.getElementById('roi-yearly');
    const roiMultiplier = document.getElementById('roi-multiplier');

    function calcularROI() {
        const llamadas = parseInt(inputCalls.value);
        const valorCliente = parseInt(inputValue.value);
        const tasaConversion = parseInt(inputConv.value) / 100;

        valCalls.textContent = llamadas;
        valValue.textContent = `$${valorCliente} USD`;
        valConv.textContent = `${inputConv.value}%`;

        const citasRecuperadas = llamadas * tasaConversion;
        const ingresoMensual = Math.round(citasRecuperadas * valorCliente);
        const ingresoAnual = ingresoMensual * 12;

        const costoMensualAura = 299;
        const multiplier = (ingresoMensual / costoMensualAura).toFixed(1);

        roiIncome.textContent = `$${ingresoMensual.toLocaleString('es-MX')}`;
        roiYearly.textContent = `$${ingresoAnual.toLocaleString('es-MX')}`;
        roiMultiplier.textContent = ingresoMensual === 0 ? "0.0x" : `${multiplier}x`;
    }

    inputCalls.addEventListener('input', calcularROI);
    inputValue.addEventListener('input', calcularROI);
    inputConv.addEventListener('input', calcularROI);

    // ==========================================
    // 3. SECTOR DE NICHOS DINÁMICO
    // ==========================================
    const nicheTabs = document.querySelectorAll('.niche-tab');

    function cambiarNicho(nicheKey) {
        if (!NICHES[nicheKey]) return;
        activeNiche = nicheKey;
        const nData = NICHES[nicheKey];

        // 1. Cambiar color de acento global dinámicamente
        document.documentElement.style.setProperty('--accent', nData.accent);
        document.documentElement.style.setProperty('--accent-rgb', nData.accentRgb);

        // 2. Actualizar sliders e inputs con valores recomendados del nicho
        inputCalls.value = nData.calls;
        inputValue.value = nData.ticket;
        inputConv.value = nData.conv;
        
        // Recalcular ROI al instante
        calcularROI();

        // 3. Reiniciar el simulador de Chat con los textos del nicho
        reiniciarChatDemo(nData.chatWelcome);

        // 4. Detener llamada en curso y reiniciar simulador de voz
        detenerLlamadaDemo();
        reiniciarLlamadaDemo();
    }

    nicheTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            nicheTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const niche = tab.getAttribute('data-niche');
            cambiarNicho(niche);
        });
    });

    // ==========================================
    // 4. SIMULADOR DE CHAT
    // ==========================================
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const promptButtons = document.querySelectorAll('.prompt-btn');

    function agregarMensaje(texto, remitente) {
        const burbuja = document.createElement('div');
        burbuja.classList.add('msg');
        burbuja.classList.add(remitente === 'usuario' ? 'msg-user' : 'msg-bot');
        burbuja.innerHTML = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        chatMessages.appendChild(burbuja);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function mostrarIndicadorEscritura() {
        const indicador = document.createElement('div');
        indicador.classList.add('msg-writing');
        indicador.id = 'temp-writing';
        indicador.innerHTML = `
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        `;
        chatMessages.appendChild(indicador);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removerIndicadorEscritura() {
        const indicador = document.getElementById('temp-writing');
        if (indicador) indicador.remove();
    }

    function reiniciarChatDemo(welcomeText) {
        chatMessages.innerHTML = '';
        agregarMensaje(welcomeText, 'bot');
    }

    function procesarMensajeUsuario(texto) {
        if (!texto.trim()) return;

        agregarMensaje(texto, 'usuario');
        chatInput.value = '';
        mostrarIndicadorEscritura();

        const mensajeMinuscula = texto.toLowerCase();
        let claveRespuesta = 'defecto';

        if (mensajeMinuscula.includes('cita') || mensajeMinuscula.includes('agendar') || mensajeMinuscula.includes('mañana') || mensajeMinuscula.includes('manana') || mensajeMinuscula.includes('reservar') || mensajeMinuscula.includes('mesa') || mensajeMinuscula.includes('manicura') || mensajeMinuscula.includes('masaje') || mensajeMinuscula.includes('limpieza') || mensajeMinuscula.includes('abogado') || mensajeMinuscula.includes('asesoría')) {
            claveRespuesta = 'cita';
        } else if (mensajeMinuscula.includes('servicio') || mensajeMinuscula.includes('precio') || mensajeMinuscula.includes('costo') || mensajeMinuscula.includes('planes') || mensajeMinuscula.includes('carta') || mensajeMinuscula.includes('menú') || mensajeMinuscula.includes('tratamiento')) {
            claveRespuesta = 'servicios';
        } else if (mensajeMinuscula.includes('soporte') || mensajeMinuscula.includes('pago') || mensajeMinuscula.includes('problema') || mensajeMinuscula.includes('factura') || mensajeMinuscula.includes('cobro')) {
            claveRespuesta = 'soporte';
        }

        const respuestas = NICHES[activeNiche].chatAnswers;

        setTimeout(() => {
            removerIndicadorEscritura();
            agregarMensaje(respuestas[claveRespuesta], 'bot');
        }, 1200);
    }

    chatSend.addEventListener('click', () => {
        procesarMensajeUsuario(chatInput.value);
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') procesarMensajeUsuario(chatInput.value);
    });

    promptButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mensajeDemo = btn.getAttribute('data-message');
            procesarMensajeUsuario(mensajeDemo);
        });
    });

    // ==========================================
    // CONFIGURACIÓN DEL REPRODUCTOR DE VOZ HÍBRIDO (MP3 / SÍNTESIS / LIVE RETELL)
    // ==========================================
    const voicePlay = document.getElementById('voice-play');
    const voiceTranscript = document.getElementById('voice-transcript');
    const soundWave = document.getElementById('sound-wave');
    
    let audioContext = null;
    let osc = null;
    let gainNode = null;
    let callInterval = null;
    let isCallPlaying = false;
    
    // Variables para el control del reproductor de audio MP3
    let localAudio = null;
    let lastRenderedIndex = -1;

    // Tiempos estimativos de inicio para cada frase (en segundos) para sincronizar con el MP3
    const TIMESTAMPS = {
        dentistas: [0, 4.0, 9.5, 12.0],
        spas: [0, 4.5, 9.5, 12.5],
        restaurantes: [0, 4.5, 9.5, 12.5],
        abogados: [0, 5.0, 10.5, 14.0]
    };

    // ==========================================
    // INICIALIZACIÓN DINÁMICA DEL SDK CLIENTE DE RETELL
    // ==========================================
    let retellClient = null;
    let usingRetellWebCall = false;

    // Cargamos dinámicamente el SDK de Retell en segundo plano para evitar bloqueos de CORS locales
    import('https://esm.sh/retell-client-js-sdk').then((module) => {
        try {
            retellClient = new module.RetellWebClient();
            console.log("Retell Client SDK cargado dinámicamente con éxito.");
            
            // Configurar los escuchadores una vez que el cliente está listo
            retellClient.on('call_started', () => {
                console.log("Llamada web de Retell iniciada.");
                voiceTranscript.innerHTML = "";
                soundWave.classList.add('active');
            });

            retellClient.on('call_ended', () => {
                console.log("Llamada web de Retell finalizada.");
                detenerLlamadaDemo();
            });

            retellClient.on('error', (err) => {
                console.error("Error en llamada de Retell:", err);
                detenerLlamadaDemo();
            });

            retellClient.on('update', (update) => {
                if (update && update.transcript) {
                    voiceTranscript.innerHTML = "";
                    update.transcript.forEach(msg => {
                        const esBot = msg.role === 'agent';
                        const bubble = document.createElement('div');
                        bubble.classList.add('voice-line');
                        bubble.classList.add(esBot ? 'voice-bot' : 'voice-caller');
                        
                        const speakerName = esBot ? 'Fili (IA)' : 'Tú';
                        bubble.innerHTML = `<strong>${speakerName}:</strong> ${msg.content}`;
                        
                        voiceTranscript.appendChild(bubble);
                    });
                    voiceTranscript.scrollTop = voiceTranscript.scrollHeight;
                }
            });
        } catch (e) {
            console.error("Error al instanciar RetellWebClient:", e);
        }
    }).catch((err) => {
        console.log("No se pudo cargar el SDK de Retell desde el CDN en este entorno. Usando simulador local.");
    });


    // Función para hablar el texto en español usando Web Speech API (Fallback)
    function hablarTexto(texto, esBot) {
        if (!('speechSynthesis' in window)) return null;
        
        const cleanText = texto.replace(/\*\*(.*?)\*\*/g, '$1');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-MX';
        
        const voices = window.speechSynthesis.getVoices();
        const spanishVoices = voices.filter(v => v.lang.includes('es'));
        
        if (spanishVoices.length > 0) {
            if (esBot) {
                const femaleVoice = spanishVoices.find(v => 
                    v.name.toLowerCase().includes('sabina') || 
                    v.name.toLowerCase().includes('helena') || 
                    v.name.toLowerCase().includes('google') ||
                    v.name.toLowerCase().includes('zira') ||
                    v.name.toLowerCase().includes('daria')
                );
                utterance.voice = femaleVoice || spanishVoices[0];
                utterance.pitch = 1.1;
                utterance.rate = 0.95;
            } else {
                const maleVoice = spanishVoices.find(v => 
                    !v.name.toLowerCase().includes('sabina') && 
                    !v.name.toLowerCase().includes('helena') &&
                    !v.name.toLowerCase().includes('zira')
                );
                utterance.voice = maleVoice || spanishVoices[spanishVoices.length - 1];
                utterance.pitch = 0.95;
                utterance.rate = 1.0;
            }
        }
        
        window.speechSynthesis.speak(utterance);
        return utterance;
    }

    // Generador de audio Web Audio API para simular el sonido telefónico de fondo
    function iniciarSonidoTelefonico() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            osc = audioContext.createOscillator();
            gainNode = audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.005, audioContext.currentTime);
            
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);
            osc.start();
        } catch (e) {
            console.log("AudioContext blocked or unsupported", e);
        }
    }

    function detenerSonidoTelefonico() {
        if (osc) {
            try { osc.stop(); } catch {}
            osc = null;
        }
        if (audioContext) {
            try { audioContext.close(); } catch {}
            audioContext = null;
        }
    }

    function reiniciarLlamadaDemo() {
        lastRenderedIndex = -1;
        voiceTranscript.innerHTML = `
            <div class="voice-sys-msg">
                <i data-lucide="phone"></i> Presiona el botón de llamada para simular el audio de Scarlett
            </div>
        `;
        lucide.createIcons();
        soundWave.classList.remove('active');
        voicePlay.innerHTML = `<i data-lucide="phone"></i> Iniciar Llamada`;
        lucide.createIcons();
    }

    function detenerLlamadaDemo() {
        isCallPlaying = false;
        clearTimeout(callInterval);
        
        if (usingRetellWebCall && retellClient) {
            try {
                retellClient.stopCall();
            } catch (e) {
                console.log(e);
            }
            usingRetellWebCall = false;
        }

        if (localAudio) {
            localAudio.pause();
            localAudio = null;
        }
        
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        detenerSonidoTelefonico();
        reiniciarLlamadaDemo();
    }

    // Función que añade la línea a la transcripción en pantalla
    function renderizarLineaLlamada(linea) {
        const esBot = linea.sender === 'bot';
        const bubble = document.createElement('div');
        bubble.classList.add('voice-line');
        bubble.classList.add(esBot ? 'voice-bot' : 'voice-caller');
        
        const speakerName = esBot ? 'Fili (IA)' : 'Cliente';
        bubble.innerHTML = `<strong>${speakerName}:</strong> ${linea.text}`;
        
        voiceTranscript.appendChild(bubble);
        voiceTranscript.scrollTop = voiceTranscript.scrollHeight;
    }

    async function reproducirLlamadaDemo() {
        if (isCallPlaying) {
            detenerLlamadaDemo();
            return;
        }

        isCallPlaying = true;
        voiceTranscript.innerHTML = `<div class="voice-sys-msg">Conectando llamada...</div>`;
        voicePlay.innerHTML = `<i data-lucide="phone-off"></i> Colgar Llamada`;
        lucide.createIcons();

        // 1. INTENTAR LLAMADA WEB EN VIVO CON EL MICRÓFONO (Retell SDK)
        if (retellClient) {
            try {
                // Hacer petición a tu servidor backend para crear el token de acceso seguro
                const resToken = await fetch('http://localhost:3000/api/create-web-call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (resToken.ok) {
                    const data = await resToken.json();
                    if (data.accessToken) {
                        usingRetellWebCall = true;
                        retellClient.startCall({ accessToken: data.accessToken });
                        return; // Retell toma el control completo, salimos del simulador local
                    }
                }
            } catch (e) {
                console.log("El backend no está en ejecución. Utilizando simulador local con SpeechSynthesis.");
            }
        }

        // 2. FALLBACK: SI EL BACKEND ESTÁ APAGADO O FALLA, USAMOS LA SIMULACIÓN LOCAL
        soundWave.classList.add('active');

        // Intentar cargar el archivo MP3 del nicho correspondiente
        const mp3Path = `assets/llamada-${activeNiche}.mp3`;
        localAudio = new Audio(mp3Path);
        let usingFallback = false;

        // Si el navegador puede reproducir el MP3, iniciamos la reproducción sincronizada por tiempo
        localAudio.addEventListener('canplaythrough', () => {
            if (!isCallPlaying || usingFallback) return;
            
            voiceTranscript.innerHTML = "";
            localAudio.play();

            const transcript = NICHES[activeNiche].voiceTranscript;
            const cues = TIMESTAMPS[activeNiche];

            // Escuchar el progreso del audio para lanzar los textos en el segundo exacto
            localAudio.addEventListener('timeupdate', () => {
                if (!isCallPlaying || usingFallback) return;
                const currentTime = localAudio.currentTime;

                cues.forEach((time, index) => {
                    if (currentTime >= time && index > lastRenderedIndex) {
                        lastRenderedIndex = index;
                        renderizarLineaLlamada(transcript[index]);
                    }
                });
            });

            // Detener todo automáticamente al terminar el audio
            localAudio.addEventListener('ended', () => {
                detenerLlamadaDemo();
            });
        });

        // FALLBACK: Si no existe el archivo MP3, se ejecuta la síntesis de voz (SpeechSynthesis)
        localAudio.addEventListener('error', () => {
            if (usingFallback) return;
            usingFallback = true;
            localAudio = null;
            iniciarLlamadaFallback();
        });

        // Lógica de síntesis de voz por si no hay audios locales cargados
        function iniciarLlamadaFallback() {
            iniciarSonidoTelefonico();
            const transcript = NICHES[activeNiche].voiceTranscript;
            let currentLineIndex = 0;

            function escribirSiguienteLinea() {
                if (!isCallPlaying) return;
                if (currentLineIndex >= transcript.length) {
                    callInterval = setTimeout(() => {
                        detenerLlamadaDemo();
                    }, 1500);
                    return;
                }

                const linea = transcript[currentLineIndex];
                renderizarLineaLlamada(linea);
                currentLineIndex++;

                const utterance = hablarTexto(linea.text, linea.sender === 'bot');
                
                if (utterance) {
                    utterance.onend = () => {
                        if (isCallPlaying) {
                            callInterval = setTimeout(escribirSiguienteLinea, 1000);
                        }
                    };
                    utterance.onerror = () => {
                        if (isCallPlaying) {
                            callInterval = setTimeout(escribirSiguienteLinea, 2500);
                        }
                    };
                } else {
                    callInterval = setTimeout(escribirSiguienteLinea, 2500);
                }
            }

            voiceTranscript.innerHTML = "";
            escribirSiguienteLinea();
        }

        // Tono de llamada inicial para la demo
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const ringOsc = context.createOscillator();
            const ringGain = context.createGain();
            ringOsc.frequency.setValueAtTime(425, context.currentTime);
            ringGain.gain.setValueAtTime(0.04, context.currentTime);
            ringGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8);
            ringOsc.connect(ringGain);
            ringGain.connect(context.destination);
            ringOsc.start();
            ringOsc.stop(context.currentTime + 1.0);
        } catch(e) {}
    }

    voicePlay.addEventListener('click', reproducirLlamadaDemo);
    reiniciarLlamadaDemo();

    // ==========================================
    // 6. ACORDEÓN DE PREGUNTAS FRECUENTES (FAQs)
    // ==========================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Cerrar todos los demás
            faqItems.forEach(i => i.classList.remove('active'));
            
            // Alternar el actual
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // ==========================================
    // 7. ANIMACIONES AL HACER SCROLL (REVEAL)
    // ==========================================
    const revealElements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    revealElements.forEach(el => observer.observe(el));

    // ==========================================
    // 8. MOVIMIENTO ZOOM Y OPACIDAD DEL FONDO AL HACER SCROLL
    // ==========================================
    const fluidBg = document.getElementById('fluid-bg');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const vh = window.innerHeight;
        
        const progress = Math.min(1, scrolled / vh);
        const scale = 1 + progress * 0.25;
        const opacity = 0.95 - progress * 0.25;
        
        fluidBg.style.transform = `scale(${scale})`;
        fluidBg.style.opacity = opacity;
    });

    // Iniciar por primera vez en el nicho por defecto
    cambiarNicho('dentistas');
});
