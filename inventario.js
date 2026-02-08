// inventario.js - Código JavaScript COMPLETO del sistema

// ============================================
// 1. VARIABLES GLOBALES Y DATOS INICIALES
// ============================================

let inventario = [];
let historial = [];
let usuarios = [];
let usuarioActivo = null;
let proximoId = 1;

// ============================================
// 2. FUNCIONES DE INICIALIZACIÓN
// ============================================

function inicializar() {
    cargarDatosPersistentes();
    configurarEventos();
    verificarSesionActiva();
    actualizarInterfaz();
    
    console.log("✅ Sistema de inventario inicializado");
    console.log(`📦 Productos cargados: ${inventario.length}`);
    console.log(`📝 Historial cargado: ${historial.length} registros`);
}

function cargarDatosPersistentes() {
    // Cargar inventario
    const inventarioGuardado = localStorage.getItem('inventario_persistente');
    if (inventarioGuardado) {
        inventario = JSON.parse(inventarioGuardado);
        proximoId = inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1;
    } else {
        // Datos iniciales de ejemplo
        inventario = [
            { id: 1, nombre: "Refresco Coca-Cola 2L", cantidad: 20, unidad: "bultos", categoria: "Bebidas", creadoPor: "admin", fechaCreacion: "2024-01-01", ultimaMod: "Nunca" },
            { id: 2, nombre: "Papas Sabritas", cantidad: 15, unidad: "paquetes", categoria: "Botanas", creadoPor: "admin", fechaCreacion: "2024-01-01", ultimaMod: "Nunca" },
            { id: 3, nombre: "Galletas Emperador", cantidad: 30, unidad: "cajas", categoria: "Dulces", creadoPor: "admin", fechaCreacion: "2024-01-01", ultimaMod: "Nunca" }
        ];
        proximoId = 4;
    }
    
    // Cargar historial
    const historialGuardado = localStorage.getItem('historial_persistente');
    historial = historialGuardado ? JSON.parse(historialGuardado) : [];
    
    // Cargar usuarios (en un sistema real esto estaría en servidor)
    usuarios = [
        { usuario: "admin", clave: "123", nombre: "Administrador Principal" },
        { usuario: "fulano", clave: "abc", nombre: "Fulano de Tal" },
        { usuario: "mengano", clave: "xyz", nombre: "Mengano Rodríguez" }
    ];
}

function configurarEventos() {
    // Configurar evento para campo de cantidad
    document.addEventListener('input', function(e) {
        if (e.target.id === 'nuevaCantidadInput' || e.target.classList.contains('input-cantidad')) {
            actualizarResumenCambio(e.target);
        }
    });
}

function verificarSesionActiva() {
    const sesion = sessionStorage.getItem('sesion_usuario_activo');
    if (sesion) {
        usuarioActivo = sesion;
        mostrarModoAdmin();
    }
}

function actualizarInterfaz() {
    if (usuarioActivo) {
        cargarInventarioAdmin();
        mostrarHistorial();
    } else {
        cargarInventario();
    }
}

// ============================================
// 3. FUNCIONES DE PERSISTENCIA
// ============================================

function guardarTodo() {
    try {
        localStorage.setItem('inventario_persistente', JSON.stringify(inventario));
        localStorage.setItem('historial_persistente', JSON.stringify(historial));
        
        // Mostrar notificación sutil en consola
        console.log(`💾 Guardado: ${inventario.length} productos, ${historial.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error al guardar:", error);
        mostrarNotificacion("Error al guardar datos", true);
        return false;
    }
}

// ============================================
// 4. FUNCIONES DE AUTENTICACIÓN
// ============================================

function mostrarLogin() {
    document.getElementById('modoVisita').classList.add('oculto');
    document.getElementById('loginForm').classList.remove('oculto');
    document.getElementById('usuario').focus();
}

function regresarAVisita() {
    document.getElementById('loginForm').classList.add('oculto');
    document.getElementById('modoVisita').classList.remove('oculto');
}

function verificarCredenciales() {
    const usuario = document.getElementById('usuario').value.trim();
    const clave = document.getElementById('clave').value;
    
    if (!usuario || !clave) {
        mostrarNotificacion("Por favor, completa ambos campos", true);
        return;
    }
    
    const usuarioValido = usuarios.find(u => 
        u.usuario.toLowerCase() === usuario.toLowerCase() && u.clave === clave
    );
    
    if (usuarioValido) {
        usuarioActivo = usuarioValido.usuario;
        sessionStorage.setItem('sesion_usuario_activo', usuarioActivo);
        mostrarModoAdmin();
        mostrarNotificacion(`Bienvenido, ${usuarioValido.nombre}`);
    } else {
        mostrarNotificacion("Credenciales incorrectas", true);
        document.getElementById('clave').value = '';
        document.getElementById('clave').focus();
    }
}

function mostrarModoAdmin() {
    document.getElementById('modoVisita').classList.add('oculto');
    document.getElementById('loginForm').classList.add('oculto');
    document.getElementById('modoAdmin').classList.remove('oculto');
    
    const usuarioInfo = usuarios.find(u => u.usuario === usuarioActivo);
    document.getElementById('nombreUsuario').textContent = 
        usuarioInfo ? usuarioInfo.nombre : usuarioActivo;
    
    cargarInventarioAdmin();
    mostrarHistorial();
    agregarBotonesRespaldo();
}

function cerrarSesion() {
    if (confirm("¿Estás seguro de cerrar sesión?")) {
        usuarioActivo = null;
        sessionStorage.removeItem('sesion_usuario_activo');
        
        document.getElementById('modoAdmin').classList.add('oculto');
        document.getElementById('modoVisita').classList.remove('oculto');
        
        cargarInventario();
        mostrarNotificacion("Sesión cerrada correctamente");
    }
}

// ============================================
// 5. FUNCIONES DE INVENTARIO (MODO VISITA)
// ============================================

function cargarInventario() {
    const container = document.getElementById('tablaInventario');
    
    if (!inventario || inventario.length === 0) {
        container.innerHTML = `
        <div class="sin-datos">
            <i class="fas fa-box-open fa-3x"></i>
            <h3>No hay productos en inventario</h3>
            <p>Inicia sesión para agregar el primer producto</p>
        </div>`;
        return;
    }
    
    let html = `
    <div class="estadisticas">
        <div class="estadistica">
            <i class="fas fa-boxes"></i>
            <span>${inventario.length} Productos</span>
        </div>
        <div class="estadistica">
            <i class="fas fa-cube"></i>
            <span>${inventario.reduce((sum, p) => sum + p.cantidad, 0)} Unidades totales</span>
        </div>
        <div class="estadistica">
            <i class="fas fa-history"></i>
            <span>${historial.length} Movimientos</span>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th><i class="fas fa-cube"></i> Producto</th>
                <th><i class="fas fa-hashtag"></i> Cantidad</th>
                <th><i class="fas fa-tag"></i> Categoría</th>
                <th><i class="fas fa-clock"></i> Última Modificación</th>
            </tr>
        </thead>
        <tbody>`;
    
    inventario.forEach(producto => {
        const claseStock = producto.cantidad < 10 ? 'bajo-stock' : '';
        
        html += `
        <tr>
            <td><i class="fas fa-box"></i> ${producto.nombre}</td>
            <td class="${claseStock}">
                <span class="cantidad-display">${producto.cantidad}</span>
                ${producto.unidad}
            </td>
            <td><span class="badge-categoria">${producto.categoria}</span></td>
            <td><small>${producto.ultimaMod || 'Nunca'}</small></td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ============================================
// 6. FUNCIONES DE INVENTARIO (MODO ADMIN)
// ============================================

function cargarInventarioAdmin() {
    const container = document.getElementById('tablaInventarioAdmin');
    
    if (!inventario || inventario.length === 0) {
        container.innerHTML = `
        <div class="sin-datos">
            <i class="fas fa-box-open fa-3x"></i>
            <h3>No hay productos en inventario</h3>
            <p>Haz clic en "Nuevo Producto" para agregar el primero</p>
        </div>`;
        return;
    }
    
    let html = `
    <div class="filtros-busqueda">
        <input type="text" id="buscarProducto" placeholder="🔍 Buscar producto..." 
               onkeyup="filtrarProductos()">
        <select id="filtroCategoria" onchange="filtrarProductos()">
            <option value="">Todas las categorías</option>
            ${[...new Set(inventario.map(p => p.categoria))].map(cat => 
                `<option value="${cat}">${cat}</option>`
            ).join('')}
        </select>
    </div>
    
    <table id="tablaProductos">
        <thead>
            <tr>
                <th>ID</th>
                <th><i class="fas fa-cube"></i> Producto</th>
                <th><i class="fas fa-hashtag"></i> Cantidad</th>
                <th><i class="fas fa-tag"></i> Categoría</th>
                <th><i class="fas fa-edit"></i> Acciones</th>
            </tr>
        </thead>
        <tbody>`;
    
    inventario.forEach(producto => {
        const claseStock = producto.cantidad < 10 ? 'bajo-stock' : '';
        
        html += `
        <tr data-id="${producto.id}" data-categoria="${producto.categoria}">
            <td class="id-producto">#${producto.id}</td>
            <td>
                <div class="info-producto">
                    <strong>${producto.nombre}</strong>
                    <small>${producto.creadoPor ? `Creado por: ${producto.creadoPor}` : ''}</small>
                </div>
            </td>
            <td class="${claseStock}">
                <span class="cantidad-display">${producto.cantidad}</span>
                ${producto.unidad}
                <br>
                <small>${producto.ultimaMod || 'Nunca modificado'}</small>
            </td>
            <td><span class="badge-categoria">${producto.categoria}</span></td>
            <td class="acciones">
                <button onclick="mostrarModalEdicion(${producto.id})" class="btn-editar">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="mostrarHistorialProducto(${producto.id})" class="btn-historial">
                    <i class="fas fa-history"></i>
                </button>
                <button onclick="eliminarProducto(${producto.id})" class="btn-eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function filtrarProductos() {
    const busqueda = document.getElementById('buscarProducto').value.toLowerCase();
    const categoria = document.getElementById('filtroCategoria').value;
    const filas = document.querySelectorAll('#tablaProductos tbody tr');
    
    filas.forEach(fila => {
        const nombre = fila.cells[1].textContent.toLowerCase();
        const catFila = fila.dataset.categoria;
        const coincideNombre = nombre.includes(busqueda);
        const coincideCategoria = !categoria || catFila === categoria;
        
        fila.style.display = (coincideNombre && coincideCategoria) ? '' : 'none';
    });
}

// ============================================
// 7. FUNCIONES DE EDICIÓN DE PRODUCTOS
// ============================================

function mostrarModalEdicion(productoId) {
    const producto = inventario.find(p => p.id === productoId);
    if (!producto) return;
    
    // Cerrar modal si ya existe
    cerrarModal();
    
    const modalHTML = `
    <div class="modal" id="modalEdicion">
        <div class="modal-contenido">
            <h2><i class="fas fa-edit"></i> Modificar Producto</h2>
            
            <div class="info-producto-actual">
                <div class="tarjeta-info">
                    <h3>${producto.nombre}</h3>
                    <p>Cantidad actual: <strong>${producto.cantidad} ${producto.unidad}</strong></p>
                    <p>Categoría: <span class="badge-categoria">${producto.categoria}</span></p>
                    ${producto.ultimaMod ? `<p>Última modificación: ${producto.ultimaMod}</p>` : ''}
                </div>
            </div>
            
            <div class="formulario-edicion">
                <div class="form-grupo">
                    <label for="nuevaCantidadInput"><i class="fas fa-hashtag"></i> Nueva cantidad:</label>
                    <input type="number" id="nuevaCantidadInput" 
                           value="${producto.cantidad}" min="0" step="1" 
                           class="input-cantidad" autofocus>
                </div>
                
                <div class="form-grupo">
                    <label for="motivoSelect"><i class="fas fa-clipboard-list"></i> Motivo del cambio:</label>
                    <select id="motivoSelect" class="select-motivo">
                        <option value="">Seleccionar motivo</option>
                        <option value="VENTA">🎫 Venta a cliente</option>
                        <option value="REABASTECIMIENTO">📦 Reabastecimiento</option>
                        <option value="DEVOLUCION">↩️ Devolución</option>
                        <option value="PERDIDA">💥 Pérdida o daño</option>
                        <option value="DONACION">🎁 Donación</option>
                        <option value="AJUSTE">📊 Ajuste de inventario</option>
                        <option value="OTRO">❓ Otro</option>
                    </select>
                </div>
                
                <div class="form-grupo">
                    <label for="observacionInput"><i class="fas fa-sticky-note"></i> Observaciones:</label>
                    <textarea id="observacionInput" rows="3" 
                              placeholder="Ej: Se vendieron 2 bultos a Don José Martínez..."></textarea>
                </div>
                
                <div class="resumen-cambio">
                    <div class="resumen-tarjeta">
                        <h4><i class="fas fa-calculator"></i> Resumen del cambio</h4>
                        <p id="resumenDiferencia">Cambio: 0 unidades</p>
                        <p id="resumenNuevoTotal">Nuevo total: ${producto.cantidad} ${producto.unidad}</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-botones">
                <button onclick="guardarCambio(${productoId})" class="btn-guardar">
                    <i class="fas fa-save"></i> Guardar Cambio
                </button>
                <button onclick="cerrarModal()" class="btn-cancelar">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Configurar evento para actualizar resumen en tiempo real
    const inputCantidad = document.getElementById('nuevaCantidadInput');
    inputCantidad.addEventListener('input', function() {
        actualizarResumenCambio(this, producto.cantidad, producto.unidad);
    });
    
    // Llamar una vez para mostrar resumen inicial
    actualizarResumenCambio(inputCantidad, producto.cantidad, producto.unidad);
}

function actualizarResumenCambio(inputElement, cantidadActual, unidad) {
    cantidadActual = cantidadActual || parseInt(inputElement.defaultValue) || 0;
    unidad = unidad || 'unidades';
    
    const nuevaCantidad = parseInt(inputElement.value) || 0;
    const diferencia = nuevaCantidad - cantidadActual;
    const signo = diferencia >= 0 ? '+' : '';
    
    const resumenDif = document.getElementById('resumenDiferencia');
    const resumenTotal = document.getElementById('resumenNuevoTotal');
    
    if (resumenDif) {
        resumenDif.textContent = `Cambio: ${signo}${diferencia} ${unidad}`;
        resumenDif.className = diferencia >= 0 ? 'positivo' : 'negativo';
    }
    
    if (resumenTotal) {
        resumenTotal.textContent = `Nuevo total: ${nuevaCantidad} ${unidad}`;
    }
}

function guardarCambio(productoId) {
    const nuevaCantidad = parseInt(document.getElementById('nuevaCantidadInput').value);
    const motivo = document.getElementById('motivoSelect').value;
    const observacion = document.getElementById('observacionInput').value.trim();
    
    if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
        mostrarNotificacion("Por favor, ingresa una cantidad válida", true);
        document.getElementById('nuevaCantidadInput').focus();
        return;
    }
    
    const producto = inventario.find(p => p.id === productoId);
    if (!producto) {
        mostrarNotificacion("Producto no encontrado", true);
        cerrarModal();
        return;
    }
    
    if (nuevaCantidad === producto.cantidad && !observacion) {
        mostrarNotificacion("No hay cambios para guardar", true);
        return;
    }
    
    const cantidadAnterior = producto.cantidad;
    const diferencia = nuevaCantidad - cantidadAnterior;
    const fechaHora = new Date().toLocaleString('es-MX');
    
    // Actualizar producto
    producto.cantidad = nuevaCantidad;
    producto.ultimaMod = fechaHora;
    producto.modificadoPor = usuarioActivo;
    
    // Crear registro de historial
    const registroHistorial = {
        id: historial.length + 1,
        productoId: productoId,
        productoNombre: producto.nombre,
        usuario: usuarioActivo,
        cantidadAnterior: cantidadAnterior,
        cantidadNueva: nuevaCantidad,
        diferencia: diferencia,
        fechaHora: fechaHora,
        observacion: observacion ? `${motivo ? motivo + ': ' : ''}${observacion}` : 
                    motivo ? `Motivo: ${motivo}` : 'Cambio sin observaciones',
        tipo: motivo || 'AJUSTE'
    };
    
    historial.unshift(registroHistorial);
    
    // Guardar cambios
    guardarTodo();
    
    // Actualizar interfaz
    cargarInventarioAdmin();
    mostrarHistorial();
    
    // Mostrar notificación
    const mensaje = diferencia >= 0 ? 
        `Se agregaron ${diferencia} ${producto.unidad} a ${producto.nombre}` :
        `Se redujeron ${Math.abs(diferencia)} ${producto.unidad} de ${producto.nombre}`;
    
    mostrarNotificacion(`✅ ${mensaje}`);
    
    // Cerrar modal
    cerrarModal();
}

// ============================================
// 8. FUNCIONES PARA AGREGAR Y ELIMINAR
// ============================================

function agregarProducto() {
    const modalHTML = `
    <div class="modal" id="modalNuevoProducto">
        <div class="modal-contenido">
            <h2><i class="fas fa-plus-circle"></i> Agregar Nuevo Producto</h2>
            
            <div class="formulario-nuevo">
                <div class="form-grupo">
                    <label for="nombreProducto"><i class="fas fa-tag"></i> Nombre del producto:</label>
                    <input type="text" id="nombreProducto" 
                           placeholder="Ej: Refresco Coca-Cola 2L" autofocus>
                </div>
                
                <div class="form-grupo">
                    <label for="cantidadInicial"><i class="fas fa-hashtag"></i> Cantidad inicial:</label>
                    <input type="number" id="cantidadInicial" value="0" min="0" step="1">
                </div>
                
                <div class="form-grupo">
                    <label for="unidadProducto"><i class="fas fa-balance-scale"></i> Unidad:</label>
                    <input type="text" id="unidadProducto" 
                           placeholder="Ej: bultos, cajas, piezas, paquetes..." 
   
