// ============================================
// INVENTAVAL - SISTEMA COMPLETO DE INVENTARIO
// Versión 2.0 - Diseño Comeval Venezuela
// ============================================

// ===== CONFIGURACIÓN INICIAL =====
const CONFIG = {
    productosPorPagina: 45,
    version: "2.0.0",
    nombreSistema: "InventaVal",
    colores: {
        verde: "#2e7d32",
        naranja: "#ff9800",
        blanco: "#f8f9fa"
    }
};

// ===== VARIABLES GLOBALES =====
let inventario = [];
let historial = [];
let usuarios = [];
let usuarioActivo = null;
let proximoId = 1;
let paginaActual = 1;
let filtroActual = {};
let ordenActual = "inteligente";

// ===== 1. INICIALIZACIÓN DEL SISTEMA =====
function inicializar() {
    console.log(`🚀 ${CONFIG.nombreSistema} v${CONFIG.version} iniciando...`);
    
    // Cargar datos persistentes
    cargarDatosPersistentes();
    
    // Verificar sesión activa
    verificarSesionActiva();
    
    // Actualizar interfaz
    actualizarInterfaz();
    
    // Actualizar estadísticas en footer
    actualizarEstadisticasFooter();
    
    // Verificar productos próximos a vencer
    verificarVencimientosProximos();
    
    console.log(`✅ ${CONFIG.nombreSistema} listo - ${inventario.length} productos cargados`);
}

function cargarDatosPersistentes() {
    // Cargar inventario
    try {
        const inventarioGuardado = localStorage.getItem('inventaval_inventario');
        if (inventarioGuardado) {
            inventario = JSON.parse(inventarioGuardado);
            // Asegurar que todos los productos tengan la nueva estructura
            inventario = inventario.map(producto => ({
                ...producto,
                marca: producto.marca || "Sin marca",
                vencimiento: producto.vencimiento || "",
                unidad: producto.unidad || "Unidades"
            }));
            
            // Calcular próximo ID
            const maxId = Math.max(...inventario.map(p => p.id || 0));
            proximoId = maxId > 0 ? maxId + 1 : 1;
        } else {
            // Datos de ejemplo iniciales
            inventario = [
                {
                    id: 1,
                    nombre: "Refresco Coca-Cola 2L",
                    cantidad: 30,
                    unidad: "Bultos",
                    vencimiento: "2024-06-15",
                    marca: "CocaCola",
                    creadoPor: "admin",
                    fechaCreacion: new Date().toLocaleString('es-VE'),
                    ultimaMod: "Nunca"
                },
                {
                    id: 2,
                    nombre: "Pan Bimbo Grande",
                    cantidad: 20,
                    unidad: "Unidades",
                    vencimiento: "2024-03-15",
                    marca: "Bimbo",
                    creadoPor: "admin",
                    fechaCreacion: new Date().toLocaleString('es-VE'),
                    ultimaMod: "Nunca"
                },
                {
                    id: 3,
                    nombre: "Galletas Oreo",
                    cantidad: 45,
                    unidad: "Paquetes",
                    vencimiento: "2024-08-30",
                    marca: "Nabisco",
                    creadoPor: "admin",
                    fechaCreacion: new Date().toLocaleString('es-VE'),
                    ultimaMod: "Nunca"
                },
                {
                    id: 4,
                    nombre: "Arroz Premium",
                    cantidad: 10,
                    unidad: "Bultos",
                    vencimiento: "2025-01-10",
                    marca: "Sin marca",
                    creadoPor: "admin",
                    fechaCreacion: new Date().toLocaleString('es-VE'),
                    ultimaMod: "Nunca"
                },
                {
                    id: 5,
                    nombre: "Aceite Vegetal 1L",
                    cantidad: 25,
                    unidad: "Botellas",
                    vencimiento: "2024-11-20",
                    marca: "Mazola",
                    creadoPor: "admin",
                    fechaCreacion: new Date().toLocaleString('es-VE'),
                    ultimaMod: "Nunca"
                }
            ];
            proximoId = 6;
            guardarTodo(); // Guardar datos de ejemplo
        }
    } catch (error) {
        console.error("❌ Error cargando inventario:", error);
        inventario = [];
        proximoId = 1;
    }
    
    // Cargar historial
    try {
        const historialGuardado = localStorage.getItem('inventaval_historial');
        historial = historialGuardado ? JSON.parse(historialGuardado) : [];
    } catch (error) {
        console.error("❌ Error cargando historial:", error);
        historial = [];
    }
    
    // Usuarios del sistema
    usuarios = [
        { usuario: "admin", clave: "123", nombre: "Administrador Principal" },
        { usuario: "fulano", clave: "abc", nombre: "Fulano de Tal" },
        { usuario: "mengano", clave: "xyz", nombre: "Mengano Rodríguez" }
    ];
}

function verificarSesionActiva() {
    try {
        const sesion = sessionStorage.getItem('inventaval_sesion');
        if (sesion) {
            usuarioActivo = sesion;
            mostrarModoAdmin();
            mostrarNotificacion(`👋 Bienvenido de nuevo, ${usuarioActivo}`);
        }
    } catch (error) {
        console.error("❌ Error verificando sesión:", error);
    }
}

function actualizarInterfaz() {
    if (usuarioActivo) {
        // Actualizar info de usuario
        const usuarioInfo = usuarios.find(u => u.usuario === usuarioActivo);
        if (usuarioInfo) {
            document.getElementById('infoUsuario').innerHTML = `
                <i class="fas fa-user-check"></i>
                <span>${usuarioInfo.nombre}</span>
            `;
        }
        
        // Mostrar herramientas de admin
        document.getElementById('herramientasVisita').classList.add('oculto');
        document.getElementById('herramientasAdmin').classList.remove('oculto');
        
        // Cargar inventario admin
        cargarInventarioAdmin();
        
        // Cargar filtros
        cargarFiltros();
        
        // Mostrar historial si hay
        mostrarHistorial();
    } else {
        // Mostrar herramientas de visita
        document.getElementById('herramientasVisita').classList.remove('oculto');
        document.getElementById('herramientasAdmin').classList.add('oculto');
        
        // Cargar inventario público
        cargarInventario();
    }
    
    // Actualizar contador de productos
    actualizarContadorProductos();
}

function actualizarEstadisticasFooter() {
    document.getElementById('footerTotalProductos').textContent = inventario.length;
    document.getElementById('footerTotalMovimientos').textContent = historial.length;
    document.getElementById('footerSesionActiva').textContent = usuarioActivo ? "Sí" : "No";
}

// ===== 2. SISTEMA DE AUTENTICACIÓN =====
function mostrarLogin() {
    console.log("🔓 Función mostrarLogin ejecutada");
    document.getElementById('modoVisita').classList.add('oculto');
    document.getElementById('loginForm').classList.remove('oculto');
    
    // Enfocar campo usuario
    setTimeout(() => {
        const usuarioInput = document.getElementById('usuario');
        if (usuarioInput) usuarioInput.focus();
    }, 100);
}

function regresarAVisita() {
    document.getElementById('loginForm').classList.add('oculto');
    document.getElementById('modoVisita').classList.remove('oculto');
}

function verificarCredenciales() {
    console.log("🔐 Verificando credenciales...");
    
    const usuario = document.getElementById('usuario').value.trim();
    const clave = document.getElementById('clave').value;
    
    console.log("Usuario ingresado:", usuario);
    console.log("Clave ingresada:", clave ? "***" : "(vacía)");
    
    if (!usuario || !clave) {
        mostrarNotificacion("❌ Por favor, completa ambos campos", "error");
        return;
    }
    
    // Buscar usuario (CASE SENSITIVE)
    const usuarioValido = usuarios.find(u => u.usuario === usuario && u.clave === clave);
    
    if (usuarioValido) {
        console.log("✅ Usuario válido:", usuarioValido.nombre);
        usuarioActivo = usuarioValido.usuario;
        sessionStorage.setItem('inventaval_sesion', usuarioActivo);
        mostrarModoAdmin();
        mostrarNotificacion(`✅ Bienvenido, ${usuarioValido.nombre}`, "exito");
        
        // Registrar en historial
        registrarEnHistorial("SISTEMA", "Sistema", "Inicio de sesión", null, null, 0, "Inició sesión en el sistema");
    } else {
        console.log("❌ Credenciales incorrectas");
        mostrarNotificacion("❌ Credenciales incorrectas", "error");
        document.getElementById('clave').value = '';
        document.getElementById('clave').focus();
    }
}

function mostrarModoAdmin() {
    console.log("👑 Mostrando modo administrador");
    document.getElementById('modoVisita').classList.add('oculto');
    document.getElementById('loginForm').classList.add('oculto');
    document.getElementById('modoAdmin').classList.remove('oculto');
    
    // Cargar inventario
    cargarInventarioAdmin();
    
    // Cargar filtros
    cargarFiltros();
}

function cerrarSesion() {
    if (confirm("¿Estás seguro de cerrar sesión?")) {
        // Registrar en historial
        registrarEnHistorial("SISTEMA", "Sistema", "Cierre de sesión", null, null, 0, "Cerró sesión del sistema");
        
        usuarioActivo = null;
        sessionStorage.removeItem('inventaval_sesion');
        
        document.getElementById('modoAdmin').classList.add('oculto');
        document.getElementById('modoVisita').classList.remove('oculto');
        
        cargarInventario();
        mostrarNotificacion("🔒 Sesión cerrada correctamente", "info");
        
        // Actualizar footer
        actualizarEstadisticasFooter();
    }
}

// ===== 3. GESTIÓN DE INVENTARIO (MODO VISITA) =====
function cargarInventario() {
    const container = document.getElementById('tablaInventario');
    if (!container) {
        console.error("❌ No se encontró #tablaInventario");
        return;
    }
    
    // Obtener productos para esta página
    const productosPagina = obtenerProductosPagina(paginaActual);
    
    if (productosPagina.length === 0) {
        container.innerHTML = `
            <div class="sin-datos">
                <i class="fas fa-box-open"></i>
                <h3>No hay productos en inventario</h3>
                <p>Accede al sistema para agregar el primer producto</p>
            </div>
        `;
        document.getElementById('paginacionVisita').innerHTML = '';
        return;
    }
    
    // Generar HTML de la tabla
    let html = `
        <table>
            <thead>
                <tr>
                    <th><i class="fas fa-cube"></i> Producto</th>
                    <th><i class="fas fa-hashtag"></i> Cantidad</th>
                    <th><i class="fas fa-calendar-alt"></i> Vencimiento</th>
                    <th><i class="fas fa-tag"></i> Marca</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    productosPagina.forEach(producto => {
        const estadoVencimiento = obtenerEstadoVencimiento(producto.vencimiento);
        const claseVencimiento = estadoVencimiento.estado;
        const textoVencimiento = estadoVencimiento.texto;
        
        html += `
            <tr>
                <td class="col-producto">${producto.nombre}</td>
                <td class="col-cantidad">
                    <span class="estado-producto ${obtenerEstadoStock(producto.cantidad)}">
                        ${producto.cantidad} ${producto.unidad}
                    </span>
                </td>
                <td class="col-vencimiento">
                    <span class="${claseVencimiento}" title="${estadoVencimiento.dias} días">
                        ${formatearFecha(producto.vencimiento)}<br>
                        <small>${textoVencimiento}</small>
                    </span>
                </td>
                <td class="col-marca">
                    ${producto.marca === "Sin marca" 
                        ? '<span class="sin-marca">Sin marca</span>' 
                        : `<span class="badge-marca">${producto.marca}</span>`}
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
    
    // Generar paginación
    generarPaginacion('paginacionVisita');
}

// ===== 4. GESTIÓN DE INVENTARIO (MODO ADMIN) =====
function cargarInventarioAdmin() {
    const container = document.getElementById('tablaInventarioAdmin');
    if (!container) {
        console.error("❌ No se encontró #tablaInventarioAdmin");
        return;
    }
    
    // Aplicar filtros si existen
    const productosFiltrados = aplicarFiltros();
    
    // Obtener productos para esta página
    const productosPagina = obtenerProductosPagina(paginaActual, productosFiltrados);
    
    if (productosPagina.length === 0) {
        container.innerHTML = `
            <div class="sin-datos">
                <i class="fas fa-boxes"></i>
                <h3>No hay productos</h3>
                <p>Haz clic en "Nuevo Producto" para agregar el primero</p>
                <button onclick="agregarProducto()" class="btn-herramienta btn-login" style="margin-top: 1rem;">
                    <i class="fas fa-plus-circle"></i> Agregar Producto
                </button>
            </div>
        `;
        document.getElementById('paginacionAdmin').innerHTML = '';
        return;
    }
    
    // Generar HTML de la tabla
    let html = `
        <table>
            <thead>
                <tr>
                    <th><i class="fas fa-cube"></i> Producto</th>
                    <th><i class="fas fa-hashtag"></i> Cantidad</th>
                    <th><i class="fas fa-calendar-alt"></i> Vencimiento</th>
                    <th><i class="fas fa-tag"></i> Marca</th>
                    <th><i class="fas fa-cog"></i> Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    productosPagina.forEach(producto => {
        const estadoVencimiento = obtenerEstadoVencimiento(producto.vencimiento);
        const claseVencimiento = estadoVencimiento.estado;
        const textoVencimiento = estadoVencimiento.texto;
        
        html += `
            <tr>
                <td class="col-producto">
                    <strong>${producto.nombre}</strong><br>
                    <small class="texto-claro">ID: ${producto.id}</small>
                </td>
                <td class="col-cantidad">
                    <span class="estado-producto ${obtenerEstadoStock(producto.cantidad)}">
                        ${producto.cantidad} ${producto.unidad}
                    </span>
                </td>
                <td class="col-vencimiento">
                    <span class="${claseVencimiento}" title="${estadoVencimiento.dias} días">
                        ${formatearFecha(producto.vencimiento)}<br>
                        <small>${textoVencimiento}</small>
                    </span>
                </td>
                <td class="col-marca">
                    ${producto.marca === "Sin marca" 
                        ? '<span class="sin-marca">Sin marca</span>' 
                        : `<span class="badge-marca ${producto.marca.toLowerCase()}">${producto.marca}</span>`}
                </td>
                <td class="col-acciones">
                    <div class="acciones-producto">
                        <button onclick="editarProducto(${producto.id})" class="btn-editar" title="Editar producto">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="eliminarProducto(${producto.id})" class="btn-eliminar" title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button onclick="mostrarHistorialProducto(${producto.id})" class="btn-historial" title="Ver historial">
                            <i class="fas fa-history"></i>
                        </button>
                        <button onclick="ajustarStock(${producto.id})" class="btn-ajustar" title="Ajustar stock">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
    
    // Generar paginación
    generarPaginacion('paginacionAdmin', productosFiltrados);
    
    // Actualizar contadores
    actualizarContadorProductos();
    actualizarContadorPaginas(productosFiltrados);
}

function cargarFiltros() {
    const filtroMarca = document.getElementById('filtroMarca');
    if (!filtroMarca) return;
    
    // Obtener marcas únicas
    const marcas = [...new Set(inventario.map(p => p.marca))].filter(m => m && m !== "Sin marca");
    
    // Limpiar opciones excepto la primera
    while (filtroMarca.options.length > 1) {
        filtroMarca.remove(1);
    }
    
    // Agregar marcas
    marcas.sort().forEach(marca => {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca;
        filtroMarca.appendChild(option);
    });
}

function aplicarFiltros() {
    let productosFiltrados = [...inventario];
    
    // Aplicar búsqueda
    const busqueda = document.getElementById('buscarProducto')?.value.toLowerCase() || '';
    if (busqueda) {
        productosFiltrados = productosFiltrados.filter(p => 
            p.nombre.toLowerCase().includes(busqueda) ||
            p.marca.toLowerCase().includes(busqueda)
        );
    }
    
    // Aplicar filtro de marca
    const marcaFiltro = document.getElementById('filtroMarca')?.value;
    if (marcaFiltro) {
        productosFiltrados = productosFiltrados.filter(p => p.marca === marcaFiltro);
    }
    
    // Aplicar filtro de vencimiento
    const vencimientoFiltro = document.getElementById('filtroVencimiento')?.value;
    if (vencimientoFiltro === "proximo") {
        productosFiltrados = productosFiltrados.filter(p => {
            const estado = obtenerEstadoVencimiento(p.vencimiento);
            return estado.estado === "proximo";
        });
    } else if (vencimientoFiltro === "vencido") {
        productosFiltrados = productosFiltrados.filter(p => {
            const estado = obtenerEstadoVencimiento(p.vencimiento);
            return estado.estado === "vencido";
        });
    }
    
    // Aplicar ordenamiento
    productosFiltrados = ordenarProductos(productosFiltrados, ordenActual);
    
    return productosFiltrados;
}

function filtrarProductos() {
    paginaActual = 1; // Volver a primera página al filtrar
    cargarInventarioAdmin();
}

// ===== 5. SISTEMA DE PAGINACIÓN =====
function obtenerProductosPagina(pagina, productosList = null) {
    const productos = productosList || inventario;
    const inicio = (pagina - 1) * CONFIG.productosPorPagina;
    const fin = inicio + CONFIG.productosPorPagina;
    return productos.slice(inicio, fin);
}

function generarPaginacion(containerId, productosList = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const productos = productosList || inventario;
    const totalPaginas = Math.ceil(productos.length / CONFIG.productosPorPagina);
    
    if (totalPaginas <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <button onclick="cambiarPagina('${containerId}', 1)" ${paginaActual === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-double-left"></i>
        </button>
        <button onclick="cambiarPagina('${containerId}', ${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-left"></i>
        </button>
    `;
 
