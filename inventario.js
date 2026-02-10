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
                }
            ];
            proximoId = 3;
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

function guardarTodo() {
    try {
        localStorage.setItem('inventaval_inventario', JSON.stringify(inventario));
        localStorage.setItem('inventaval_historial', JSON.stringify(historial));
    } catch (error) {
        console.error("❌ Error guardando datos:", error);
    }
}

function verificarSesionActiva() {
    try {
        const sesion = sessionStorage.getItem('inventaval_sesion');
        if (sesion) {
            usuarioActivo = sesion;
            mostrarModoAdmin();
            mostrarNotificacion(`👋 Bienvenido de nuevo, ${usuarioActivo}`, "info");
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
        
        // Mostrar secciones
        document.getElementById('modoVisita').classList.add('oculto');
        document.getElementById('modoAdmin').classList.remove('oculto');
        
        // Cargar inventario admin
        cargarInventarioAdmin();
        
        // Cargar filtros
        cargarFiltros();
    } else {
        // Mostrar herramientas de visita
        document.getElementById('herramientasVisita').classList.remove('oculto');
        document.getElementById('herramientasAdmin').classList.add('oculto');
        
        // Mostrar secciones
        document.getElementById('modoVisita').classList.remove('oculto');
        document.getElementById('modoAdmin').classList.add('oculto');
        
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

function verificarVencimientosProximos() {
    const hoy = new Date();
    const productosProximos = inventario.filter(p => {
        if (!p.vencimiento) return false;
        const fechaVencimiento = new Date(p.vencimiento);
        const diferenciaDias = Math.floor((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
        return diferenciaDias > 0 && diferenciaDias <= 30;
    });
    
    if (productosProximos.length > 0 && usuarioActivo) {
        mostrarNotificacion(`⚠️ ${productosProximos.length} productos próximos a vencer`, "alerta");
    }
}

// ===== 2. SISTEMA DE AUTENTICACIÓN =====
function mostrarLogin() {
    console.log("🔓 Función mostrarLogin ejecutada");
    document.getElementById('modoVisita').classList.add('oculto');
    document.getElementById('loginForm').classList.remove('oculto');
    document.getElementById('modoAdmin').classList.add('oculto');
    
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
    
    if (!usuario || !clave) {
        mostrarNotificacion("❌ Por favor, completa ambos campos", "error");
        return;
    }
    
    // Buscar usuario
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
    if (!container) return;
    
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
        
        html += `
            <tr>
                <td class="col-producto">${producto.nombre}</td>
                <td class="col-cantidad">
                    <span>${producto.cantidad} ${producto.unidad}</span>
                </td>
                <td class="col-vencimiento">
                    <span>${formatearFecha(producto.vencimiento)}</span>
                </td>
                <td class="col-marca">${producto.marca}</td>
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
    if (!container) return;
    
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
        html += `
            <tr>
                <td class="col-producto">${producto.nombre}</td>
                <td class="col-cantidad">${producto.cantidad} ${producto.unidad}</td>
                <td class="col-vencimiento">${formatearFecha(producto.vencimiento)}</td>
                <td class="col-marca">${producto.marca}</td>
                <td class="col-acciones">
                    <button onclick="editarProducto(${producto.id})" class="btn-editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="eliminarProducto(${producto.id})" class="btn-eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
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
            return estado && estado.estado === "proximo";
        });
    } else if (vencimientoFiltro === "vencido") {
        productosFiltrados = productosFiltrados.filter(p => {
            const estado = obtenerEstadoVencimiento(p.vencimiento);
            return estado && estado.estado === "vencido";
        });
    }
    
    return productosFiltrados;
}

function filtrarProductos() {
    paginaActual = 1;
    cargarInventarioAdmin();
}

// ===== 5. FUNCIONES DE UTILIDAD =====
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
    
       // Generar números de página
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === paginaActual) {
            html += `<button class="activa">${i}</button>`;
        } else {
            html += `<button onclick="cambiarPagina('${containerId}', ${i})">${i}</button>`;
        }
    }
    
    html += `
        <button onclick="cambiarPagina('${containerId}', ${paginaActual + 1})" ${paginaActual === totalPaginas ? 'disabled' : ''}>
            <i class="fas fa-angle-right"></i>
        </button>
        <button onclick="cambiarPagina('${containerId}', ${totalPaginas})" ${paginaActual === totalPaginas ? 'disabled' : ''}>
            <i class="fas fa-angle-double-right"></i>
        </button>
    `;
    
    container.innerHTML = html;
}

function cambiarPagina(containerId, nuevaPagina) {
    const productos = containerId.includes('Admin') ? aplicarFiltros() : inventario;
    const totalPaginas = Math.ceil(productos.length / CONFIG.productosPorPagina);
    
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    paginaActual = nuevaPagina;
    
    if (containerId.includes('Admin')) {
        cargarInventarioAdmin();
    } else {
        cargarInventario();
    }
}

function obtenerEstadoVencimiento(fecha) {
    if (!fecha) return { estado: "normal", texto: "Sin fecha", dias: 999 };
    
    const hoy = new Date();
    const fechaVencimiento = new Date(fecha);
    const diferenciaDias = Math.floor((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias < 0) {
        return { estado: "vencido", texto: "VENCIDO", dias: diferenciaDias };
    } else if (diferenciaDias <= 30) {
        return { estado: "proximo", texto: `Vence en ${diferenciaDias} días`, dias: diferenciaDias };
    } else {
        return { estado: "normal", texto: `Vence en ${diferenciaDias} días`, dias: diferenciaDias };
    }
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";
    return new Date(fecha).toLocaleDateString('es-VE');
}

function actualizarContadorProductos() {
    const total = inventario.length;
    document.getElementById('infoProductos').innerHTML = `
        <i class="fas fa-boxes"></i>
        <span>${total} productos</span>
    `;
    document.getElementById('contadorProductos').textContent = `${total} productos`;
}

function registrarEnHistorial(tipo, producto, accion, cantidadAnterior, cantidadNueva, diferencia, detalles) {
    const registro = {
        id: historial.length + 1,
        fecha: new Date().toLocaleString('es-VE'),
        usuario: usuarioActivo || "Sistema",
        tipo,
        producto,
        accion,
        cantidadAnterior,
        cantidadNueva,
        diferencia,
        detalles
    };
    
    historial.unshift(registro); // Agregar al inicio
    if (historial.length > 100) historial.pop(); // Limitar a 100 registros
    
    guardarTodo();
}

function mostrarNotificacion(mensaje, tipo = "info") {
    console.log(`📢 ${mensaje}`);
    alert(mensaje); // Temporal - puedes cambiar esto por algo más bonito
}

// ===== 6. FUNCIONES PARA LOS BOTONES (TEMPORALES) =====
function agregarProducto() {
    const nombre = prompt("Nombre del producto:");
    if (!nombre) return;
    
    const cantidad = parseInt(prompt("Cantidad:"));
    if (isNaN(cantidad)) return;
    
    const unidad = prompt("Unidad (Bultos, Unidades, etc.):", "Unidades");
    const vencimiento = prompt("Fecha de vencimiento (YYYY-MM-DD):");
    const marca = prompt("Marca (deja vacío para 'Sin marca'):", "Sin marca");
    
    const nuevoProducto = {
        id: proximoId++,
        nombre,
        cantidad,
        unidad: unidad || "Unidades",
        vencimiento: vencimiento || "",
        marca: marca || "Sin marca",
        creadoPor: usuarioActivo || "Sistema",
        fechaCreacion: new Date().toLocaleString('es-VE'),
        ultimaMod: new Date().toLocaleString('es-VE')
    };
    
    inventario.push(nuevoProducto);
    guardarTodo();
    
    registrarEnHistorial(
        "AGREGAR",
        nombre,
        "Producto agregado",
        0,
        cantidad,
        cantidad,
        `Producto creado por ${usuarioActivo}`
    );
    
    cargarInventarioAdmin();
    mostrarNotificacion(`✅ Producto "${nombre}" agregado`, "exito");
}

function editarProducto(id) {
    const producto = inventario.find(p => p.id === id);
    if (!producto) return;
    
    const nuevoNombre = prompt("Nuevo nombre:", producto.nombre);
    if (!nuevoNombre) return;
    
    const nuevaCantidad = parseInt(prompt("Nueva cantidad:", producto.cantidad));
    if (isNaN(nuevaCantidad)) return;
    
    const diferencia = nuevaCantidad - producto.cantidad;
    
    // Actualizar producto
    producto.nombre = nuevoNombre;
    producto.cantidad = nuevaCantidad;
    producto.ultimaMod = new Date().toLocaleString('es-VE');
    
    guardarTodo();
    
    registrarEnHistorial(
        "EDITAR",
        producto.nombre,
        "Producto editado",
        producto.cantidad - diferencia,
        nuevaCantidad,
        diferencia,
        `Editado por ${usuarioActivo}`
    );
    
    cargarInventarioAdmin();
    mostrarNotificacion(`✏️ Producto actualizado`, "exito");
}

function eliminarProducto(id) {
    const producto = inventario.find(p => p.id === id);
    if (!producto) return;
    
    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) {
        inventario = inventario.filter(p => p.id !== id);
        guardarTodo();
        
        registrarEnHistorial(
            "ELIMINAR",
            producto.nombre,
            "Producto eliminado",
            producto.cantidad,
            0,
            -producto.cantidad,
            `Eliminado por ${usuarioActivo}`
        );
        
        cargarInventarioAdmin();
        mostrarNotificacion(`🗑️ Producto eliminado`, "exito");
    }
}

function ordenarPor(criterio) {
    mostrarNotificacion(`🔍 Ordenando por ${criterio}`, "info");
}

function exportarAPDF() {
    mostrarNotificacion("📄 Exportando a PDF...", "info");
}

function exportarAExcel() {
    mostrarNotificacion("📊 Exportando a Excel...", "info");
}

function exportarAImagen() {
    mostrarNotificacion("🖼️ Exportando a imagen...", "info");
}

function imprimirDirecto() {
    window.print();
}

function generarCodigoRespaldo() {
    console.log("🔐 Generando código corto...");
    
    // 1. Pedir un ID único (como tu nombre o email)
    const idUsuario = prompt(
        "📝 Para generar tu código de respaldo:\n\n" +
        "Ingresa un ID único (ej: tu email, nombre, o número):\n" +
        "Ej: juan@gmail.com, inventarioTienda, 001\n\n" +
        "Este ID te servirá para recuperar en otra PC.",
        usuarioActivo || "miInventario"
    );
    
    if (!idUsuario) {
        alert("❌ Se necesita un ID para generar el código");
        return;
    }
    
    // 2. Generar código corto aleatorio (6 caracteres)
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin 0,1,O,I para evitar confusiones
    let codigoCorto = 'INV-';
    for (let i = 0; i < 5; i++) {
        codigoCorto += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    // 3. Crear datos del inventario
    const datosInventario = {
        id: codigoCorto,
        usuario: idUsuario,
        inventario: inventario,
        historial: historial,
        fecha: new Date().toLocaleString('es-VE'),
        total: inventario.length
    };
    
    // 4. Guardar en el SERVIDOR (simulado con localStorage)
    const respaldosGuardados = JSON.parse(localStorage.getItem('inventaval_respaldos') || '{}');
    respaldosGuardados[codigoCorto] = datosInventario;
    respaldosGuardados[idUsuario] = datosInventario; // También guardar por ID
    localStorage.setItem('inventaval_respaldos', JSON.stringify(respaldosGuardados));
    
    // 5. Mostrar código simple para anotar
    mostrarCodigoParaAnotar(codigoCorto, idUsuario, datosInventario);
    
    console.log("✅ Código corto generado:", codigoCorto, "para ID:", idUsuario);
}

function mostrarCodigoParaAnotar(codigo, idUsuario, datos) {
    const modalHTML = `
        <div class="modal-overlay" id="modalCodigoCorto">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-cabecera">
                    <h2><i class="fas fa-pencil-alt"></i> Anota este Código</h2>
                    <button class="btn-cerrar-modal" onclick="document.getElementById('modalCodigoCorto').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-contenido" style="text-align: center;">
                    
                    <div style="margin: 20px 0; padding: 25px; background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); border-radius: 12px; color: white;">
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 3px; margin-bottom: 10px;">
                            ${codigo}
                        </div>
                        <div style="font-size: 16px; opacity: 0.9;">
                            ID: <strong>${idUsuario}</strong>
                        </div>
                    </div>
                    
                    <div style="background: #fff8e1; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 5px solid #ff9800;">
                        <h4 style="margin-top: 0; color: #ff6f00;">
                            <i class="fas fa-pencil-alt"></i> ANOTA EN PAPEL:
                        </h4>
                        <div style="font-family: 'Courier New', monospace; font-size: 18px; text-align: left; background: white; padding: 15px; border-radius: 5px; border: 2px dashed #ff9800;">
                            <div style="margin-bottom: 10px;"><strong>Código:</strong> ${codigo}</div>
                            <div style="margin-bottom: 10px;"><strong>ID:</strong> ${idUsuario}</div>
                            <div><strong>Productos:</strong> ${datos.total}</div>
                            <div><strong>Fecha:</strong> ${datos.fecha}</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
                        <div style="text-align: left; background: #e8f5e9; padding: 10px; border-radius: 5px;">
                            <div style="font-weight: bold; color: #2e7d32;">📦 Incluye:</div>
                            <div>✅ ${datos.total} productos</div>
                            <div>✅ Historial completo</div>
                            <div>✅ Fecha: ${new Date().toLocaleDateString('es-VE')}</div>
                        </div>
                        
                        <div style="text-align: left; background: #e3f2fd; padding: 10px; border-radius: 5px;">
                            <div style="font-weight: bold; color: #1976d2;">🏠 Para usar en casa:</div>
                            <div>1. Ve a "Importar"</div>
                            <div>2. Usa el código o ID</div>
                            <div>3. ¡Listo!</div>
                        </div>
                    </div>
                    
                    <button onclick="imprimirCodigo('${codigo}', '${idUsuario}', ${datos.total})" 
                            style="background: #2196f3; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 10px; display: flex; align-items: center; gap: 8px; margin: 10px auto;">
                        <i class="fas fa-print"></i> Imprimir o Guardar PDF
                    </button>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('modalesContainer')) {
        const container = document.createElement('div');
        container.id = 'modalesContainer';
        document.body.appendChild(container);
    }
    
    document.getElementById('modalesContainer').innerHTML = modalHTML;
}

function imprimirCodigo(codigo, idUsuario, totalProductos) {
    const contenidoImprimir = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Código Respaldo InventaVal</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .codigo-grande { font-size: 36px; font-weight: bold; color: #2e7d32; margin: 20px 0; padding: 15px; border: 3px solid #2e7d32; text-align: center; letter-spacing: 3px; }
                .info { margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                .instrucciones { margin-top: 30px; padding: 15px; border-top: 2px dashed #ccc; }
            </style>
        </head>
        <body>
            <h1>🏪 InventaVal - Código de Respaldo</h1>
            <div class="codigo-grande">${codigo}</div>
            
            <div class="info">
                <strong>ID de Usuario:</strong> ${idUsuario}<br>
                <strong>Total Productos:</strong> ${totalProductos}<br>
                <strong>Fecha Generación:</strong> ${new Date().toLocaleString('es-VE')}<br>
                <strong>Generado por:</strong> ${usuarioActivo || 'Sistema'}
            </div>
            
            <div class="instrucciones">
                <h3>📝 Instrucciones para recuperar:</h3>
                <ol>
                    <li>Ve a <strong>Importar Inventario</strong></li>
                    <li>Selecciona <strong>Desde Código Corto</strong></li>
                    <li>Ingresa el código: <strong>${codigo}</strong></li>
                    <li>O ingresa el ID: <strong>${idUsuario}</strong></li>
                    <li>¡Tu inventario se cargará automáticamente!</li>
                </ol>
                
                <p style="margin-top: 20px; font-style: italic;">
                    Guarda este papel en un lugar seguro. Es tu respaldo completo.
                </p>
            </div>
            
            <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
                🏪 InventaVal v${CONFIG.version} | Sistema de Inventario Profesional
            </div>
        </body>
        </html>
    `;
    
    const ventanaImprimir = window.open('', '_blank');
    ventanaImprimir.document.write(contenidoImprimir);
    ventanaImprimir.document.close();
    ventanaImprimir.focus();
    
    setTimeout(() => {
        ventanaImprimir.print();
        ventanaImprimir.close();
    }, 500);
}
function mostrarImportarInventario() {
    const modalHTML = `
        <div class="modal-overlay" id="modalImportarSimple">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-cabecera">
                    <h2><i class="fas fa-file-import"></i> Importar desde Código</h2>
                    <button class="btn-cerrar-modal" onclick="document.getElementById('modalImportarSimple').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-contenido">
                    <div style="margin-bottom: 20px;">
                        <p><i class="fas fa-key"></i> <strong>Pega tu código de respaldo:</strong></p>
                        <p style="font-size: 14px; color: #666;">Formato: ABCD1-EFGH2-IJK3L-MNOP4</p>
                    </div>
                    
                    <input type="text" id="codigoImportarInput" placeholder="Ej: HS72-29JFK-HAKE-6767" style="width: 100%; padding: 12px; font-size: 18px; text-align: center; letter-spacing: 2px; border: 2px solid #ddd; border-radius: 6px; margin: 10px 0;">
                    
                    <button onclick="importarDesdeCodigoSimple()" style="background: #ff9800; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 15px;">
                        <i class="fas fa-upload"></i> Importar Inventario
                    </button>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('modalesContainer')) {
        const container = document.createElement('div');
        container.id = 'modalesContainer';
        document.body.appendChild(container);
    }
    
    document.getElementById('modalesContainer').innerHTML = modalHTML;
    
    // Enfocar el input
    setTimeout(() => {
        const input = document.getElementById('codigoImportarInput');
        if (input) input.focus();
    }, 100);
}

function importarDesdeCodigoSimple() {
    const codigo = document.getElementById('codigoImportarInput').value.trim().toUpperCase();
    
    if (!codigo || !/^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(codigo)) {
        alert("❌ Código inválido. Formato: ABCD1-EFGH2-IJK3L-MNOP4");
        return;
    }
    
    // Buscar respaldo en localStorage
    const datosGuardados = localStorage.getItem(`respaldo_${codigo}`);
    
    if (!datosGuardados) {
        alert("❌ Código no encontrado o expirado");
        return;
    }
    
    try {
        const datos = JSON.parse(datosGuardados);
        
        if (confirm(`¿Importar ${datos.inventario.length} productos y ${datos.historial.length} movimientos?\n\nEsto reemplazará tu inventario actual.`)) {
            inventario = datos.inventario;
            historial = datos.historial;
            
            // Actualizar próximo ID
            const maxId = Math.max(...inventario.map(p => p.id || 0));
            proximoId = maxId > 0 ? maxId + 1 : 1;
            
            // Guardar en localStorage permanente
            guardarTodo();
            
            // Cerrar modal
            document.getElementById('modalImportarSimple').remove();
            
            // Recargar interfaz
function mostrarImportarInventario() {
    const modalHTML = `
        <div class="modal-overlay" id="modalImportarCorto">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-cabecera">
                    <h2><i class="fas fa-home"></i> Recuperar en Casa</h2>
                    <button class="btn-cerrar-modal" onclick="document.getElementById('modalImportarCorto').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-contenido" style="text-align: center;">
                    
                    <div style="margin-bottom: 25px;">
                        <div style="font-size: 48px; color: #4caf50; margin-bottom: 10px;">
                            <i class="fas fa-house-user"></i>
                        </div>
                        <h3 style="margin-bottom: 5px;">Recupera tu inventario</h3>
                        <p style="color: #666;">Ingresa el código o ID que anotaste</p>
                    </div>
                    
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; text-align: left; margin-bottom: 5px; font-weight: bold; color: #2e7d32;">
                                <i class="fas fa-key"></i> Código (INV-XXXXX):
                            </label>
                            <input type="text" id="codigoCortoInput" placeholder="INV-A1B2C" 
                                   style="width: 100%; padding: 12px; font-size: 18px; text-align: center; letter-spacing: 2px; border: 2px solid #4caf50; border-radius: 6px;">
                        </div>
                        
                        <div style="color: #666; margin: 10px 0; font-size: 14px;">--- O ---</div>
                        
                        <div>
                            <label style="display: block; text-align: left; margin-bottom: 5px; font-weight: bold; color: #2196f3;">
                                <i class="fas fa-user"></i> ID (email/nombre):
                            </label>
                            <input type="text" id="idUsuarioInput" placeholder="juan@gmail.com o inventarioTienda" 
                                   style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #2196f3; border-radius: 6px;">
                        </div>
                    </div>
                    
                    <div style="background: #e8f5e9; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left;">
                        <h4 style="margin-top: 0; color: #2e7d32;"><i class="fas fa-question-circle"></i> Ejemplos:</h4>
                        <ul style="margin-bottom: 0;">
                            <li><strong>Código:</strong> INV-7A2F9</li>
                            <li><strong>ID:</strong> juan@gmail.com</li>
                            <li><strong>ID:</strong> inventarioPrincipal</li>
                            <li><strong>ID:</strong> tienda001</li>
                        </ul>
                    </div>
                    
                    <button onclick="recuperarConCodigoCorto()" 
                            style="background: #ff9800; color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: bold; width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="fas fa-upload"></i> Recuperar Mi Inventario
                    </button>
                    
                    <p style="margin-top: 15px; font-size: 14px; color: #666;">
                        <i class="fas fa-info-circle"></i> Recuperarás todos los productos y el historial completo.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('modalesContainer')) {
        const container = document.createElement('div');
        container.id = 'modalesContainer';
        document.body.appendChild(container);
    }
    
    document.getElementById('modalesContainer').innerHTML = modalHTML;
    
    // Enfocar el input
    setTimeout(() => {
        document.getElementById('codigoCortoInput').focus();
    }, 100);
}

function recuperarConCodigoCorto() {
    const codigoInput = document.getElementById('codigoCortoInput').value.trim().toUpperCase();
    const idInput = document.getElementById('idUsuarioInput').value.trim();
    
    if (!codigoInput && !idInput) {
        alert("❌ Por favor, ingresa el código (INV-XXXXX) o tu ID (email/nombre)");
        return;
    }
    
    // Buscar en respaldos guardados
    const respaldosGuardados = JSON.parse(localStorage.getItem('inventaval_respaldos') || '{}');
    
    let datosRespaldo = null;
    let claveUsada = '';
    
    // Buscar por código primero
    if (codigoInput) {
        datosRespaldo = respaldosGuardados[codigoInput];
        claveUsada = codigoInput;
    }
    
    // Si no encontró por código, buscar por ID
    if (!datosRespaldo && idInput) {
        datosRespaldo = respaldosGuardados[idInput];
        claveUsada = idInput;
    }
    
    if (!datosRespaldo) {
        alert(`❌ No se encontró respaldo\n\nCódigo/ID: ${codigoInput || idInput}\n\nVerifica que esté bien escrito.`);
        return;
    }
    
    // Mostrar confirmación
    const confirmacion = `
✅ RESPalDO ENCONTRADO:

📦 Productos: ${datosRespaldo.inventario.length}
📋 Movimientos: ${datosRespaldo.historial?.length || 0}
👤 Generado por: ${datosRespaldo.usuario}
📅 Fecha: ${datosRespaldo.fecha}

⚠️ Esto reemplazará tu inventario actual.
¿Recuperar este inventario?
    `;
    
    if (confirm(confirmacion)) {
        // Restaurar inventario
        inventario = datosRespaldo.inventario;
        historial = datosRespaldo.historial || [];
        
        // Actualizar próximo ID
        const maxId = Math.max(...inventario.map(p => p.id || 0));
        proximoId = maxId > 0 ? maxId + 1 : 1;
        
        // Guardar en localStorage permanente
        guardarTodo();
        
        // Cerrar modal
        document.getElementById('modalImportarCorto')?.remove();
        
        // Recargar interfaz
        if (usuarioActivo) {
            cargarInventarioAdmin();
        } else {
            cargarInventario();
        }
        
        // Mostrar éxito
        setTimeout(() => {
            alert(`🎉 ¡INVENTARIO RECUPERADO!

✅ ${inventario.length} productos restaurados
✅ Historial completo recuperado
✅ Listo para usar en esta PC

Código usado: ${claveUsada}`);
        }, 500);
        
        // Registrar en historial
        registrarEnHistorial(
            "SISTEMA", 
            "Sistema", 
            "Recuperación desde código corto", 
            null, 
            null, 
            0, 
            `Recuperado desde código: ${claveUsada} (${datosRespaldo.usuario})`
        );
    }
}

function toggleHistorial() {
    mostrarNotificacion("📜 Mostrando/ocultando historial...", "info");
}

function mostrarAcercaDe() {
    alert(`🏪 ${CONFIG.nombreSistema} v${CONFIG.version}\nSistema de inventario profesional\nDesarrollado por Esaa Jocsuel\n\n✅ ¡Todo está funcionando correctamente!`);
}

function exportarComoArchivo() {
    const dataStr = JSON.stringify(inventario, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `inventaval_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    mostrarNotificacion("💾 Inventario exportado como JSON", "exito");
}

// ===== 7. INICIALIZACIÓN =====

// Hacer todas las funciones disponibles globalmente
window.mostrarLogin = mostrarLogin;
window.verificarCredenciales = verificarCredenciales;
window.regresarAVisita = regresarAVisita;
window.cerrarSesion = cerrarSesion;
window.agregarProducto = agregarProducto;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.ordenarPor = ordenarPor;
window.exportarAPDF = exportarAPDF;
window.exportarAExcel = exportarAExcel;
window.exportarAImagen = exportarAImagen;
window.imprimirDirecto = imprimirDirecto;
window.generarCodigoRespaldo = generarCodigoRespaldo;
window.mostrarImportarInventario = mostrarImportarInventario;
window.filtrarProductos = filtrarProductos;
window.toggleHistorial = toggleHistorial;
window.mostrarAcercaDe = mostrarAcercaDe;
window.exportarComoArchivo = exportarComoArchivo;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    inicializar();
}

console.log("✅ inventario.js cargado completamente");
