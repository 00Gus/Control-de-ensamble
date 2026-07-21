// Configuración
const PRECIO_VARILLA = 1.60;
const ADMIN_PASSWORD = "GusAdmin!"; // Cambia esta contraseña si lo deseas
let GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRHHwvbn0beZQeRiVm42HAVn5aQEK6wLjTvmDWNSKlD6UM5v-cxVyxQ8b-Ej1x-PWwCg/exec"; // URL de tu Google Apps Script

// Estado Local
let registros = JSON.parse(localStorage.getItem('registros_varillas')) || [];

// Nombres para mostrar
const userNames = {
    juan: 'Don Juan',
    marta: 'Doña Marta',
    aurelia: 'Doña Aurelia'
};

// Referencias del DOM
const views = {
    login: document.getElementById('view-login'),
    admin: document.getElementById('view-admin')
};

const onlineIndicator = document.getElementById('online-indicator');

function updateOnlineStatus() {
    if (navigator.onLine) {
        onlineIndicator.style.backgroundColor = '#4CAF50'; // Verde
        onlineIndicator.title = 'Conectado a internet';
    } else {
        onlineIndicator.style.backgroundColor = '#F44336'; // Rojo
        onlineIndicator.title = 'Sin internet (Guardando local)';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus(); // Estado inicial
const toastEl = document.getElementById('toast');
const syncStatusEl = document.getElementById('sync-status');

// Sincronización en segundo plano al volver internet
async function sincronizarPendientes() {
    if (!navigator.onLine || GOOGLE_SCRIPT_URL === "") return;
    
    // 1. Sincronizar Nuevos
    const pendientes = registros.filter(r => r.sincronizado === false);
    // 2. Sincronizar Editados
    const editados = registros.filter(r => r.editadoOffline === true);
    
    if (pendientes.length === 0 && editados.length === 0) return;
    
    showToast(`Sincronizando ${pendientes.length + editados.length} registros pendientes... ☁️`);
    
    let huboErrores = false;

    // Subir nuevos
    for (let r of pendientes) {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(r)
            });
            r.sincronizado = true;
        } catch (e) {
            huboErrores = true;
        }
    }
    
    // Subir editados
    for (let r of editados) {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: "editar_registro", id: r.id, nuevaCantidad: r.cantidad })
            });
            r.editadoOffline = false;
        } catch (e) {
            huboErrores = true;
        }
    }
    
    guardarRegistros();
    
    if (!huboErrores) {
        showToast('¡Sincronización completada! ✅');
    }
}

window.addEventListener('online', sincronizarPendientes);

// === INICIO DE SESIÓN ===
document.getElementById('btn-login').addEventListener('click', async () => {
    const pin = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    const loadingEl = document.getElementById('login-loading');
    const btnLogin = document.getElementById('btn-login');

    // Comprobar contraseña
    if (pin !== ADMIN_PASSWORD) {
        errorEl.classList.remove('hidden');
        return;
    }

    errorEl.classList.add('hidden');

    // Intentar Sincronizar si hay URL
    if (GOOGLE_SCRIPT_URL !== "") {
        btnLogin.classList.add('hidden');
        loadingEl.classList.remove('hidden');
        
        try {
            // Se hace un GET a la hoja para traer los registros de la semana
            const response = await fetch(GOOGLE_SCRIPT_URL);
            const data = await response.json();
            
            if(data && Array.isArray(data)) {
                // Rescatar los que no se han sincronizado o tienen ediciones pendientes
                const huerfanos = registros.filter(r => r.sincronizado === false);
                const idsEditados = registros.filter(r => r.editadoOffline === true).map(r => String(r.id));
                const mapaEditados = {};
                registros.filter(r => r.editadoOffline === true).forEach(r => mapaEditados[String(r.id)] = r.cantidad);
                
                registros = data.map(r => {
                    r.id = String(r.id);
                    r.sincronizado = true; // Todo lo de la nube está sincronizado
                    
                    // Si este registro estaba editado offline, preservar la cantidad local
                    if (idsEditados.includes(r.id)) {
                        r.cantidad = mapaEditados[r.id];
                        r.editadoOffline = true;
                    }

                    // Si Google Sheets convirtió la fecha a ISO, la reformateamos
                    if (r.fechaFormateada && r.fechaFormateada.includes('T')) {
                        const d = new Date(r.fechaCompleta || r.fechaFormateada);
                        r.fechaFormateada = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                    }
                    return r;
                });
                
                // Fusionar huérfanos
                registros = [...huerfanos, ...registros];
                guardarRegistros();
                
                // Disparar sincronización por si el internet volvió
                sincronizarPendientes();
            }
        } catch (error) {
            console.error("No se pudo sincronizar, usando memoria local.", error);
            showToast("Sin internet: usando memoria local.");
        }
        
        loadingEl.classList.add('hidden');
        btnLogin.classList.remove('hidden');
    }

    // Login Exitoso: Mostrar vistas
    views.login.classList.remove('active');
    views.login.classList.add('hidden');
    
    views.admin.classList.remove('hidden');
    views.admin.classList.add('active');
    
    document.getElementById('logout-btn').classList.remove('hidden');
    document.getElementById('admin-password').value = '';
    
    // Cargar vistas iniciales
    renderHistorial();
    renderTotales();
});

// Cerrar sesión
document.getElementById('logout-btn').addEventListener('click', () => {
    views.admin.classList.remove('active');
    views.admin.classList.add('hidden');
    
    views.login.classList.remove('hidden');
    views.login.classList.add('active');
    
    document.getElementById('logout-btn').classList.add('hidden');
});

// === NAVEGACIÓN INFERIOR ===
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Encontrar el botón clickeado (maneja clicks en el ícono/texto)
        const targetBtn = e.target.closest('.nav-item');
        if(!targetBtn) return;

        // Quitar activos
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Poner activo
        targetBtn.classList.add('active');
        const targetId = targetBtn.dataset.target;
        const targetTab = document.getElementById(targetId);
        targetTab.classList.remove('hidden');
        
        // Pequeño delay para la animación
        setTimeout(() => targetTab.classList.add('active'), 10);

        // Actualizar vistas al navegar
        if (targetId === 'tab-historial') renderHistorial();
        if (targetId === 'tab-totales') renderTotales();
    });
});

// === GUARDAR NUEVO REGISTRO ===
document.getElementById('btn-guardar-registro').addEventListener('click', async () => {
    const selectEl = document.getElementById('ensamblador-select');
    const inputEl = document.getElementById('varillas-count');
    
    const userId = selectEl.value;
    const cantidad = parseInt(inputEl.value);

    if (!userId) {
        showToast('⚠️ Selecciona a una persona primero.');
        return;
    }
    if (isNaN(cantidad) || cantidad === 0) {
        showToast('⚠️ Ingresa una cantidad válida distinta de 0.');
        return;
    }

    const fechaActual = new Date();
    const nuevoRegistro = {
        id: Date.now().toString(),
        userId: userId,
        nombre: userNames[userId],
        cantidad: cantidad,
        fechaCompleta: fechaActual.toISOString(),
        fechaFormateada: formatearFecha(fechaActual.toISOString()),
        sincronizado: false // Marca inicial
    };

    // 1. Guardar Localmente
    registros.push(nuevoRegistro);
    guardarRegistros();
    
    // Limpiar formulario
    inputEl.value = '';
    selectEl.value = '';
    showToast(`✅ Guardado: ${cantidad} varillas de ${userNames[userId]}`);
    
    // 2. Intentar guardar en Google Sheets (Si hay URL configurada)
    if (GOOGLE_SCRIPT_URL !== "") {
        syncStatusEl.textContent = 'Subiendo a la nube... ☁️';
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(nuevoRegistro)
            });
            nuevoRegistro.sincronizado = true; // Sincronización exitosa
            guardarRegistros();
            syncStatusEl.textContent = 'Sincronizado con Google Sheets ✅';
        } catch (error) {
            console.error('Error sincronizando:', error);
            syncStatusEl.textContent = 'Guardado local (Sin conexión a nube) ⚠️';
        }
        
        setTimeout(() => syncStatusEl.textContent = '', 3000);
    }
});

// === HISTORIAL ===
function renderHistorial() {
    const listEl = document.getElementById('history-list');
    listEl.innerHTML = '';
    
    const invertidos = [...registros].reverse();
    
    invertidos.forEach(r => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const isNegative = r.cantidad < 0;
        const color = isNegative ? '#FF5722' : 'var(--primary-color)';
        const sign = r.cantidad > 0 ? '+' : '';
        
        li.innerHTML = `
            <div class="record-info" style="flex: 1;">
                <strong>${userNames[r.userId]}</strong>
                <span style="font-size: 1.2rem; color: ${color}; font-weight: bold;">${sign}${r.cantidad} varillas</span>
                <small>${r.fechaFormateada}</small>
            </div>
            <div style="padding-left: 10px;">
                <button onclick="editarRegistro('${r.id}')" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;" title="Editar">✏️</button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

window.editarRegistro = async function(id) {
    const index = registros.findIndex(r => String(r.id) === String(id));
    if (index === -1) return;
    
    const registro = registros[index];
    const nuevaCantidadStr = prompt(`Editando registro de ${userNames[registro.userId]} del ${registro.fechaFormateada}\n\nIntroduce la nueva cantidad correcta:`, registro.cantidad);
    
    if (nuevaCantidadStr === null) return; // Canceló
    
    const nuevaCantidad = parseInt(nuevaCantidadStr);
    if (isNaN(nuevaCantidad) || nuevaCantidad === 0) {
        showToast('Cantidad inválida.');
        return;
    }
    
    // Actualizar localmente
    registro.cantidad = nuevaCantidad;
    guardarRegistros();
    renderHistorial();
    renderTotales();
    
    // Enviar a la nube
    if (GOOGLE_SCRIPT_URL !== "") {
        try {
            showToast('Actualizando en la nube... ☁️');
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: "editar_registro", id: id, nuevaCantidad: nuevaCantidad })
            });
            registro.editadoOffline = false;
            guardarRegistros();
            showToast('Registro editado con éxito en la nube ✅');
        } catch (e) {
            console.error(e);
            registro.editadoOffline = true;
            guardarRegistros();
            showToast('Editado localmente. Se enviará cuando regrese el internet ⚠️');
        }
    }
};

// === TOTALES Y PAGOS ===
function renderTotales() {
    const gridEl = document.getElementById('totals-grid');
    gridEl.innerHTML = '';

    const totales = { juan: 0, marta: 0, aurelia: 0 };
    
    registros.forEach(r => {
        if(totales[r.userId] !== undefined) {
            totales[r.userId] += r.cantidad;
        }
    });

    let hayRegistros = false;

    for (const [userId, cantidad] of Object.entries(totales)) {
        if (cantidad > 0) hayRegistros = true;
        
        const pago = (cantidad * PRECIO_VARILLA).toFixed(2);
        const div = document.createElement('div');
        div.className = 'total-card';
        div.innerHTML = `
            <h4>${userNames[userId]}</h4>
            <p class="total-rods">${cantidad} varillas</p>
            <div class="total-amount">$${pago}</div>
        `;
        gridEl.appendChild(div);
    }

    if (!hayRegistros) {
        gridEl.innerHTML = '<p style="text-align:center; color:#666;">Aún no hay varillas registradas para pagar.</p>';
    }
}

// === CIERRE SEMANAL Y EXPORTAR EXCEL ===
function realizarCierreSemanal() {
    if (registros.length === 0) {
        showToast('No hay registros para cerrar.');
        return;
    }

    if (confirm('¿Estás seguro de hacer el cierre semanal? Se borrarán los datos de esta semana para empezar una nueva.')) {
        exportarCSV();

        // Si hay conexión a la nube, enviar orden de cierre
        if (GOOGLE_SCRIPT_URL !== "") {
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: "cierre_semanal" })
            }).catch(e => console.error("Error enviando cierre a la nube", e));
        }

        registros = [];
        guardarRegistros();
        renderHistorial();
        renderTotales();
        showToast('🎉 Semana cerrada exitosamente. Contadores en cero.');
    }
}

document.getElementById('btn-cierre-semanal').addEventListener('click', realizarCierreSemanal);

function exportarCSV() {
    // Encabezados
    let csvContent = "Fecha,Ensamblador,Cantidad,Monto a Pagar\n";
    
    // Filas
    registros.forEach(r => {
        const monto = (r.cantidad * PRECIO_VARILLA).toFixed(2);
        // Escapar comas si es necesario, aunque aquí no las usamos en los datos
        csvContent += `${r.fechaFormateada},${userNames[r.userId]},${r.cantidad},$${monto}\n`;
    });

    // Crear el Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace falso para forzar descarga
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    link.setAttribute("download", `Cierre_Semanal_${fecha}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
}

// === UTILIDADES ===
function guardarRegistros() {
    localStorage.setItem('registros_varillas', JSON.stringify(registros));
}

function formatearFecha(isoString) {
    const opciones = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' };
    return new Date(isoString).toLocaleDateString('es-ES', opciones);
}

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    setTimeout(() => {
        toastEl.classList.add('hidden');
    }, 3000);
}
