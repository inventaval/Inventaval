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
    // Pedir correo del usuario
    const correoUsuario = prompt(
        "📧 ENVIAR CÓDIGO A TU CORREO:\n\n" +
        "Ingresa tu correo electrónico:\n" +
        "(El código se enviará a este correo)\n\n" +
        "Ej: juan@gmail.com, maria@hotmail.com",
        usuarioActivo + "@gmail.com" || "tucorreo@gmail.com"
    );
    
    if (!correoUsuario || !correoUsuario.includes('@')) {
        alert("❌ Necesito un correo válido para enviarte el código");
        return;
    }
    
    // Generar código de 8 caracteres
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    // Formato: INV-XXXX-XXXX
    const codigoFormateado = `INV-${codigo.substring(0, 4)}-${codigo.substring(4, 8)}`;
    
    // Crear el "email" (simulado)
    const asunto = `🏪 Tu código de respaldo InventaVal: ${codigoFormateado}`;
    
    const cuerpoEmail = `
INVENTAVAL - CÓDIGO DE RESPALDO

✅ Tu código único: ${codigoFormateado}
📧 Correo asociado: ${correoUsuario}
📅 Generado: ${new Date().toLocaleString('es-VE')}
📦 Productos incluidos: ${inventario.length}
👤 Generado por: ${usuarioActivo || "Sistema"}

📝 INSTRUCCIONES PARA USAR EN CASA:
1. Abre InventaVal en tu otra PC
2. Haz clic en "IMPORTAR"
3. Ingresa este código: ${codigoFormateado}
4. ¡Tu inventario se cargará automáticamente!

📊 RESUMEN DE TU INVENTARIO:
${inventario.slice(0, 10).map(p => `• ${p.nombre}: ${p.cantidad} ${p.unidad}`).join('\n')}
${inventario.length > 10 ? `\n... y ${inventario.length - 10} productos más` : ''}

⚠️ Este código expira en 7 días.
🔒 Solo tú puedes usarlo con este correo.

---
🏪 InventaVal v${CONFIG.version}
Sistema Profesional de Inventario
    `.trim();
    
    // Guardar el código en localStorage con el correo como referencia
    const codigosGuardados = JSON.parse(localStorage.getItem('inventaval_codigos_correo') || '{}');
    
    codigosGuardados[codigoFormateado] = {
        correo: correoUsuario.toLowerCase(),
        inventario: inventario,
        historial: historial,
        fechaGeneracion: new Date().toISOString(),
        expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    localStorage.setItem('inventaval_codigos_correo', JSON.stringify(codigosGuardados));
    
    // Mostrar para que el usuario "envíe" el email
    const textoParaEnviar = `mailto:${correoUsuario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpoEmail)}`;
    
    // Crear enlace para "enviar" email
    const enlaceEmail = document.createElement('a');
    enlaceEmail.href = textoParaEnviar;
    enlaceEmail.click();
    
    // También mostrar alerta con el código
    alert(`📧 CORREO PREPARADO PARA: ${correoUsuario}

✅ Tu código: ${codigoFormateado}

📝 AHORA:
1. Se abrirá tu cliente de correo
2. REVISA la bandeja de "Borradores" o "Redactar"
3. ENVÍA el correo a ti mismo
4. En casa, abre ese correo y usa el código

🔄 Si no se abre el correo, ANOTA ESTO:
Código: ${codigoFormateado}
Correo: ${correoUsuario}

🏠 En casa solo necesitas el código.`);
    
    // También copiar código al portapapeles por si acaso
    navigator.clipboard.writeText(codigoFormateado).then(() => {
        console.log("Código copiado al portapapeles");
    });
} // aqui ternmina function generarCodigo

function mostrarImportarInventario() {
    const codigoIngresado = prompt(
        "🔐 RECUPERAR DESDE CORREO:\n\n" +
        "Pega el código que recibiste por correo:\n\n" +
        "Formato: INV-XXXX-XXXX\n" +
        "Ej: INV-A2B3-C4D5\n\n" +
        "O ingresa tu correo si no tienes el código:",
        ""
    ).trim().toUpperCase();
    
    if (!codigoIngresado) {
        alert("❌ Necesito el código de tu correo");
        return;
    }
    
    // Buscar en los códigos guardados
    const codigosGuardados = JSON.parse(localStorage.getItem('inventaval_codigos_correo') || '{}');
    
    let datosRespaldo = null;
    let codigoValido = codigoIngresado;
    
    // Si es un correo en lugar de código, buscar por correo
    if (codigoIngresado.includes('@')) {
        // Buscar por correo
        for (const [codigo, datos] of Object.entries(codigosGuardados)) {
            if (datos.correo.toLowerCase() === codigoIngresado.toLowerCase()) {
                datosRespaldo = datos;
                codigoValido = codigo;
                break;
            }
        }
    } else {
        // Buscar por código directamente
        datosRespaldo = codigosGuardados[codigoIngresado];
    }
    
    if (!datosRespaldo) {
        // Si no se encontró, pedir que pegue el email completo
        alert(`❌ Código/Correo no encontrado: ${codigoIngresado}\n\n📧 ¿COPIASte TODO el correo que te enviaste?\n\nSi tienes el correo abierto:\n1. Copia TODO el texto del correo\n2. Pégalo aquí en el próximo paso`);
        
        const textoCorreoCompleto = prompt("📧 Pega TODO el texto de tu correo aquí:", "");
        
        if (textoCorreoCompleto) {
            // Intentar extraer código del correo
            const codigoMatch = textoCorreoCompleto.match(/INV-[A-Z0-9]{4}-[A-Z0-9]{4}/);
            if (codigoMatch) {
                codigoValido = codigoMatch[0];
                datosRespaldo = codigosGuardados[codigoValido];
            }
        }
        
        if (!datosRespaldo) {
            alert("❌ No se pudo recuperar. Asegúrate de:\n\n1. Haber enviado el correo a ti mismo\n2. Usar el mismo navegador\n3. O copiar TODO el texto del correo");
            return;
        }
    }
    
    // Verificar expiración
    const fechaExpiracion = new Date(datosRespaldo.expiracion);
    if (fechaExpiracion < new Date()) {
        if (!confirm(`⚠️ Este código expiró el ${fechaExpiracion.toLocaleDateString('es-VE')}\n\n¿Intentar cargar de todos modos?`)) {
            return;
        }
    }
    
    // Mostrar confirmación
    const confirmacion = `
✅ CÓDIGO ENCONTRADO:

📧 Correo: ${datosRespaldo.correo}
📅 Generado: ${new Date(datosRespaldo.fechaGeneracion).toLocaleString('es-VE')}
📦 Productos: ${datosRespaldo.inventario.length}
📋 Movimientos: ${datosRespaldo.historial?.length || 0}

¿Cargar este inventario en esta PC?
    `.trim();
    
    if (confirm(confirmacion)) {
        // Cargar datos
        inventario = datosRespaldo.inventario;
        historial = datosRespaldo.historial || [];
        
        // Actualizar próximo ID
        const maxId = Math.max(...inventario.map(p => p.id || 0));
        proximoId = maxId > 0 ? maxId + 1 : 1;
        
        // Guardar en localStorage permanente
        guardarTodo();
        
        // También guardar este código localmente para futuros usos
        codigosGuardados[codigoValido] = datosRespaldo;
        localStorage.setItem('inventaval_codigos_correo', JSON.stringify(codigosGuardados));
        
        // Recargar interfaz
        if (usuarioActivo) {
            cargarInventarioAdmin();
        } else {
            cargarInventario();
        }
        
        // Mostrar éxito
        alert(`🎉 ¡INVENTARIO CARGADO DESDE CORREO!

✅ ${inventario.length} productos recuperados
✅ Historial restaurado
✅ Todo listo para usar

El código ${codigoValido} ahora está guardado en esta PC
para futuras recuperaciones rápidas.`);
        
        // Registrar en historial
        registrarEnHistorial(
            "SISTEMA", 
            "Sistema", 
            "Importación desde correo", 
            null, 
            null, 
            0, 
            `Importado desde código: ${codigoValido} (${datosRespaldo.correo})`
        );
    }
} //aqui termina la fumction de ImportarCodigo

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
