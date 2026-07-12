/*
   Scarlett CRM - Lógica del Panel de Administración (Vanilla JS)
*/

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar iconos de Lucide
    lucide.createIcons();

    // Estado global de datos (con datos semilla de reserva por si el backend no responde)
    let citasGlobal = [
        { id: 1, nombre: "Ana Gomez", servicio: "limpieza dental", fecha: "2026-07-09", hora: "10:00", nicho: "dentistas", estado: "Confirmada" },
        { id: 2, nombre: "Carlos Martinez", servicio: "masaje relajante", fecha: "2026-07-09", hora: "15:30", nicho: "spas", estado: "Confirmada" },
        { id: 3, nombre: "Laura Rodriguez", servicio: "reserva mesa 4 personas", fecha: "2026-07-08", hora: "21:00", nicho: "restaurantes", estado: "Confirmada" },
        { id: 4, nombre: "Sofia Diaz", servicio: "consulta legal laboral", fecha: "2026-07-10", hora: "11:00", nicho: "abogados", estado: "Pendiente" }
    ];

    let llamadasGlobal = [
        {
            id: 1,
            fecha: new Date(Date.now() - 3600000 * 2).toISOString(), // hace 2 horas
            duracion: "45s",
            nicho: "dentistas",
            grabacion: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
            resumen: "La paciente Ana Gomez agendó con éxito una limpieza dental para mañana a las 10 AM. Se mostró muy satisfecha con la atención.",
            transcripcion: [
                { role: "agent", content: "Hola, bienvenido a DentalCare. Soy Fili, tu asistente virtual. ¿En qué te puedo ayudar hoy?" },
                { role: "user", content: "Hola, me gustaría agendar una limpieza para mañana." },
                { role: "agent", content: "Claro que sí, me puedes decir tu nombre completo?" },
                { role: "user", content: "Ana Gomez." },
                { role: "agent", content: "Perfecto Ana, tengo disponible mañana a las 10:00 AM o a las 3:30 PM. ¿Cuál prefieres?" },
                { role: "user", content: "La de las 10 de la mañana." },
                { role: "agent", content: "Listo Ana, tu cita para limpieza dental ha sido agendada con éxito para mañana a las 10:00 AM." }
            ]
        },
        {
            id: 2,
            fecha: new Date(Date.now() - 3600000 * 4).toISOString(), // hace 4 horas
            duracion: "58s",
            nicho: "spas",
            grabacion: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
            resumen: "El cliente Carlos Martinez agendó un masaje relajante para mañana a las 3:30 PM.",
            transcripcion: [
                { role: "agent", content: "Hola, bienvenido a Aura Spa. Soy Fili, tu asistente virtual. ¿En qué te puedo ayudar?" },
                { role: "user", content: "Hola, quiero reservar un masaje relajante para mañana por la tarde." },
                { role: "agent", content: "Excelente, ¿me das tu nombre completo?" },
                { role: "user", content: "Carlos Martinez." },
                { role: "agent", content: "Gracias Carlos. Para mañana por la tarde tengo libre a las 3:30 PM o a las 5:00 PM. ¿Cuál te acomoda?" },
                { role: "user", content: "La de las 3:30 de la tarde." },
                { role: "agent", content: "Excelente Carlos, tu cita para el masaje relajante ha quedado confirmada para mañana a las 3:30 PM." }
            ]
        }
    ];

    // ==========================================
    // 1. MANEJO DE PESTAÑAS (TABS)
    // ==========================================
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    window.switchTab = function(tabId) {
        // Desactivar botones y pestañas
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        tabContents.forEach(tab => {
            if (tab.id === `tab-${tabId}`) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Actualizar títulos del Header
        const titleEl = document.getElementById('tab-title');
        const subtitleEl = document.getElementById('tab-subtitle');

        if (tabId === 'overview') {
            titleEl.textContent = "Resumen General";
            subtitleEl.textContent = "Monitoreo de recepcionista de IA en tiempo real";
        } else if (tabId === 'citas') {
            titleEl.textContent = "Citas Agendadas";
            subtitleEl.textContent = "Control e historial de reservas registradas por Fili";
        } else if (tabId === 'llamadas') {
            titleEl.textContent = "Registro de Llamadas";
            subtitleEl.textContent = "Escucha las grabaciones e inspecciona los diálogos de la IA";
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // ==========================================
    // 2. PETICIONES DE DATOS AL BACKEND (FETCH)
    // ==========================================
    async function cargarDatosDesdeServidor() {
        try {
            // Intentar cargar citas
            const resCitas = await fetch('http://localhost:3000/api/citas');
            if (resCitas.ok) {
                const dataCitas = await resCitas.json();
                if (dataCitas && dataCitas.length > 0) citasGlobal = dataCitas;
            }
        } catch (e) {
            console.log("No se pudo conectar al backend para cargar citas. Usando datos de simulación.");
        }

        try {
            // Intentar cargar llamadas
            const resLlamadas = await fetch('http://localhost:3000/api/llamadas');
            if (resLlamadas.ok) {
                const dataLlamadas = await resLlamadas.json();
                if (dataLlamadas && dataLlamadas.length > 0) llamadasGlobal = dataLlamadas;
            }
        } catch (e) {
            console.log("No se pudo conectar al backend para cargar llamadas. Usando datos de simulación.");
        }

        // Renderizar todo
        renderizarResumen();
        renderizarCitas();
        renderizarLlamadas();
    }

    // ==========================================
    // 3. RENDERIZACIÓN DE VISTAS
    // ==========================================

    // Formateador de fecha amigable
    function formatearFechaAmigable(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        } catch(e) {
            return dateStr;
        }
    }

    // Pestaña: Resumen
    function renderizarResumen() {
        // Calcular métricas
        const totalCalls = llamadasGlobal.length;
        const totalAppointments = citasGlobal.length;
        const conversionRate = totalCalls > 0 ? Math.round((totalAppointments / totalCalls) * 100) : 0;
        
        let totalDurSec = 0;
        llamadasGlobal.forEach(l => {
            const match = l.duracion.match(/(\d+)s/);
            if (match) totalDurSec += parseInt(match[1]);
        });
        const totalMin = Math.round(totalDurSec / 60);

        document.getElementById('metric-calls').textContent = totalCalls;
        document.getElementById('metric-appointments').textContent = totalAppointments;
        document.getElementById('metric-rate').textContent = `${conversionRate}%`;
        document.getElementById('metric-minutes').textContent = `${totalMin} min`;

        // Renderizar tabla mini (Citas próximas)
        const tbodyMini = document.querySelector('#table-citas-mini tbody');
        tbodyMini.innerHTML = "";
        
        // Tomar las últimas 3 citas agendadas
        const proximasCitas = [...citasGlobal].reverse().slice(0, 3);
        
        proximasCitas.forEach(cita => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${cita.nombre}</strong></td>
                <td>${cita.servicio}</td>
                <td>${cita.fecha}</td>
                <td>${cita.hora}</td>
                <td><span class="badge-status ${cita.estado.toLowerCase()}">${cita.estado}</span></td>
            `;
            tbodyMini.appendChild(tr);
        });

        // Renderizar última llamada preview
        const lastCallPreview = document.getElementById('last-call-preview');
        if (llamadasGlobal.length > 0) {
            const ultimaLlamada = llamadasGlobal[llamadasGlobal.length - 1];
            
            // Buscar nombre del cliente en la transcripción
            let clientName = "Cliente Anónimo";
            const userMsg = ultimaLlamada.transcripcion.find(t => t.role === 'user' && t.content.length < 30);
            if (userMsg) {
                // Sacar un posible nombre del mensaje
                const matchName = userMsg.content.match(/(me llamo|soy|mi nombre es) ([A-Za-z ]+)/i);
                if (matchName) {
                    clientName = matchName[2];
                } else if (userMsg.content.split(' ').length <= 3) {
                    clientName = userMsg.content;
                }
            }

            // Si hay cita guardada reciente, usar ese nombre
            if (citasGlobal.length > 0) {
                clientName = citasGlobal[citasGlobal.length - 1].nombre;
            }

            lastCallPreview.innerHTML = `
                <div class="call-meta">
                    <div class="avatar-ph"><i data-lucide="phone"></i></div>
                    <div>
                        <h4 class="caller-name">${clientName}</h4>
                        <span class="call-time">${formatearFechaAmigable(ultimaLlamada.fecha)}</span>
                    </div>
                </div>
                <div class="summary-box">
                    <p class="summary-text">"${ultimaLlamada.resumen.substring(0, 80)}..."</p>
                </div>
                <button class="btn btn-primary btn-sm" id="btn-inspect-last">
                    <i data-lucide="eye"></i> Inspeccionar llamada
                </button>
            `;
            lucide.createIcons();

            document.getElementById('btn-inspect-last').addEventListener('click', () => {
                switchTab('llamadas');
                seleccionarLlamada(ultimaLlamada.id);
            });
        }
    }

    // Pestaña: Citas (Con filtros)
    function renderizarCitas(filtroTexto = "", filtroNicho = "all") {
        const tbodyFull = document.querySelector('#table-citas-full tbody');
        tbodyFull.innerHTML = "";

        const textoLower = filtroTexto.toLowerCase();

        citasGlobal.forEach(cita => {
            // Aplicar filtros
            const coincideTexto = cita.nombre.toLowerCase().includes(textoLower) || cita.servicio.toLowerCase().includes(textoLower);
            const coincideNicho = filtroNicho === 'all' || cita.nicho === filtroNicho;

            if (coincideTexto && coincideNicho) {
                const tr = document.createElement('tr');
                const nicheLabel = {
                    dentistas: "🦷 Dental",
                    spas: "💆 Spa / Estética",
                    restaurantes: "🍕 Restaurante",
                    abogados: "⚖️ Abogado"
                }[cita.nicho] || "Negocio";

                tr.innerHTML = `
                    <td><strong>${cita.nombre}</strong></td>
                    <td>${cita.servicio}</td>
                    <td>${cita.fecha}</td>
                    <td>${cita.hora}</td>
                    <td>${nicheLabel}</td>
                    <td><span class="badge-status ${cita.estado.toLowerCase()}">${cita.estado}</span></td>
                `;
                tbodyFull.appendChild(tr);
            }
        });
    }

    // Pestaña: Llamadas (Filtro buscador + lista)
    function renderizarLlamadas(filtroTexto = "") {
        const listContainer = document.getElementById('calls-list');
        listContainer.innerHTML = "";

        const textoLower = filtroTexto.toLowerCase();

        // Encontrar nombres correspondientes
        const nombresCitas = citasGlobal.map(c => c.nombre);

        llamadasGlobal.forEach((llamada, index) => {
            const coincideTexto = llamada.resumen.toLowerCase().includes(textoLower);

            if (coincideTexto) {
                // Emparejar nombre de cliente usando el índice
                const clientName = nombresCitas[index] || (index === 0 ? "Ana Gomez" : index === 1 ? "Carlos Martinez" : "Cliente");

                const item = document.createElement('div');
                item.className = "call-item";
                item.setAttribute('data-id', llamada.id);

                const nicheIcon = {
                    dentistas: "🦷",
                    spas: "💆",
                    restaurantes: "🍕",
                    abogados: "⚖️"
                }[llamada.nicho] || "📞";

                item.innerHTML = `
                    <div class="call-item-main">
                        <span class="nicho-icon">${nicheIcon}</span>
                        <div class="call-item-info">
                            <h4>${clientName}</h4>
                            <p>${llamada.resumen}</p>
                        </div>
                    </div>
                    <div class="call-item-right">
                        <span class="call-duration">${llamada.duracion}</span>
                        <div class="call-date">${formatearFechaAmigable(llamada.fecha)}</div>
                    </div>
                `;

                item.addEventListener('click', () => {
                    // Remover clase activa de otros items
                    document.querySelectorAll('.call-item').forEach(x => x.classList.remove('active'));
                    item.classList.add('active');
                    seleccionarLlamada(llamada.id, clientName);
                });

                listContainer.appendChild(item);
            }
        });
    }

    // ==========================================
    // 4. INSPECTOR DE LLAMADAS (AUDIO Y TRANSCRIPCIÓN)
    // ==========================================
    const inspectorEmpty = document.querySelector('.inspector-empty');
    const inspectorContent = document.querySelector('.inspector-content');
    const audioEl = document.getElementById('inspector-audio');
    const playBtn = document.getElementById('audio-play-btn');
    const progressBar = document.getElementById('audio-progress');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeEl = document.querySelector('.current-time');
    const totalTimeEl = document.querySelector('.total-time');

    function seleccionarLlamada(id, clientName = "Cliente") {
        const llamada = llamadasGlobal.find(l => l.id === id);
        if (!llamada) return;

        // Mostrar inspector y rellenar datos
        inspectorEmpty.classList.add('hidden');
        inspectorContent.classList.remove('hidden');

        document.querySelector('.inspector-name').textContent = clientName;
        document.querySelector('.inspector-date').textContent = formatearFechaAmigable(llamada.fecha);
        document.getElementById('inspector-duration').textContent = `Duración: ${llamada.duracion}`;
        document.querySelector('.inspector-summary-text').textContent = llamada.resumen;

        // Resetear audio
        audioEl.src = llamada.grabacion;
        audioEl.load();
        playBtn.innerHTML = `<i data-lucide="play"></i>`;
        lucide.createIcons();
        progressBar.style.width = "0%";
        currentTimeEl.textContent = "00:00";
        totalTimeEl.textContent = "00:00";

        // Rellenar transcripción chat bubbles
        const transcriptContainer = document.getElementById('inspector-transcript');
        transcriptContainer.innerHTML = "";

        llamada.transcripcion.forEach(line => {
            const bubble = document.createElement('div');
            bubble.className = `bubble ${line.role}`;
            bubble.textContent = line.content;
            transcriptContainer.appendChild(bubble);
        });

        // Seleccionar visualmente el item en la lista lateral
        document.querySelectorAll('.call-item').forEach(x => {
            if (parseInt(x.getAttribute('data-id')) === id) {
                x.classList.add('active');
            } else {
                x.classList.remove('active');
            }
        });
    }

    // Controles de Audio personalizados
    playBtn.addEventListener('click', () => {
        if (audioEl.paused) {
            audioEl.play();
            playBtn.innerHTML = `<i data-lucide="pause"></i>`;
        } else {
            audioEl.pause();
            playBtn.innerHTML = `<i data-lucide="play"></i>`;
        }
        lucide.createIcons();
    });

    audioEl.addEventListener('timeupdate', () => {
        const current = audioEl.currentTime;
        const duration = audioEl.duration || 0;
        
        if (duration > 0) {
            const pct = (current / duration) * 100;
            progressBar.style.width = `${pct}%`;
            
            currentTimeEl.textContent = formatTime(current);
            totalTimeEl.textContent = formatTime(duration);
        }
    });

    audioEl.addEventListener('ended', () => {
        playBtn.innerHTML = `<i data-lucide="play"></i>`;
        lucide.createIcons();
        progressBar.style.width = "0%";
        currentTimeEl.textContent = "00:00";
    });

    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audioEl.duration || 0;
        if (duration > 0) {
            audioEl.currentTime = (clickX / width) * duration;
        }
    });

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    }

    // ==========================================
    // 5. MANEJADORES DE FILTROS (INPUTS)
    // ==========================================
    const searchCitas = document.getElementById('search-citas');
    const filterNicho = document.getElementById('filter-nicho');
    const searchCalls = document.getElementById('search-calls');

    searchCitas.addEventListener('input', () => {
        renderizarCitas(searchCitas.value, filterNicho.value);
    });

    filterNicho.addEventListener('change', () => {
        renderizarCitas(searchCitas.value, filterNicho.value);
    });

    searchCalls.addEventListener('input', () => {
        renderizarLlamadas(searchCalls.value);
    });

    // ==========================================
    // 6. CONFIGURACIÓN DEL PROMPT DE LA IA (TAB 4)
    // ==========================================
    const promptEditor = document.getElementById('prompt-editor');
    const savePromptBtn = document.getElementById('btn-save-prompt');
    const saveStatus = document.getElementById('save-status');

    // Cargar prompt desde el servidor backend
    async function cargarPrompt() {
        try {
            const res = await fetch('http://localhost:3000/api/agent-prompt');
            if (res.ok) {
                const data = await res.json();
                if (data.prompt) {
                    promptEditor.value = data.prompt;
                }
            }
        } catch (e) {
            console.log("No se pudo cargar el prompt desde el backend.");
        }
    }

    // Guardar prompt modificado en el backend
    if (savePromptBtn) {
        savePromptBtn.addEventListener('click', async () => {
            savePromptBtn.disabled = true;
            savePromptBtn.innerHTML = `Guardando...`;
            
            try {
                const res = await fetch('http://localhost:3000/api/agent-prompt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: promptEditor.value })
                });
                
                if (res.ok) {
                    saveStatus.textContent = "¡Guardado con éxito!";
                    saveStatus.style.color = "var(--success)";
                } else {
                    saveStatus.textContent = "Error al conectar con Retell.";
                    saveStatus.style.color = "#ef4444";
                }
            } catch (e) {
                saveStatus.textContent = "Error de red local.";
                saveStatus.style.color = "#ef4444";
            }
            
            // Mostrar estado y restaurar botón
            saveStatus.style.opacity = "1";
            savePromptBtn.disabled = false;
            savePromptBtn.innerHTML = `<i data-lucide="save"></i> Guardar Cambios`;
            lucide.createIcons();

            setTimeout(() => {
                saveStatus.style.opacity = "0";
            }, 3000);
        });
    }

    // Iniciar carga inicial
    cargarPrompt();
    cargarDatosDesdeServidor();
});
