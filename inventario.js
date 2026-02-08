// ============================================
// inventario.js - SISTEMA COMPLETO FUNCIONAL
// ============================================

// VARIABLES GLOBALES
let inventario = [];
let historial = [];
let usuarios = [];
let usuarioActivo = null;
let proximoId = 1;

// ============================================
// 1. INICIALIZACIÓN
// ============================================

function inicializar() {
    console.log("🚀 Sistema de inventario iniciando...");
    
    cargarDatosPersistentes();
    verificarSesionActiva();
    actualizarInterfaz();
    
    console.log("✅ Sistema listo");
}

function cargarDatosPersistentes() {
    // Cargar inventario
    const inventarioGuardado = localStorage.getItem('inventario_persistente');
    if (inventarioGuardado) {
        inventario = JSON.parse(inventarioGuardado);
        proximoId = inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1;
    } else {
        // Datos de ejemplo
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
    
    // Usuarios
    usuarios = [
        { usuario: "admin", clave: "123", nombre: "Administrador" },
        { usuario: "fulano", clave: "abc", nombre: "Fulano" },
        { usuario: "mengano", clave: "xyz", nombre: "Mengano" }
    ];
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
        mostrarModoAdmin();
    } else {
        cargarInventario();
    }
}

// ============================================
// 2. LOGIN (¡ESTA PARTE FUNCIONA!)
// ============================================

function mostrarLogin() {
    console.log("🔓 Botón de login presionado");
    
    // Ocultar modo visita
    const modoVisita = document.getElementById('modoVisita');
    if (modoVisita) {
        modoVisita.classList.add('oculto');
        console.log("✅ Modo visita ocultado");
    }
    
    // Mostrar formulario login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.classList.remove('oculto');
        console.log("✅ Formulario login mostrado");
        
        // Enfocar campo usuario
        setTimeout(() => {
            const usuarioInput = document.getElementById('usuario');
            if (usuarioInput) {
                usuarioInput.focus();
            }
        }, 100);
    } else {
        console.error("❌ No se encontró #loginForm");
    }
}

function regresarAVisita() {
    // Ocultar formulario login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.classList.add('oculto');
    }
    
    // Mostrar modo visita
    const modoVisita = document.getElementById('modoVisita');
    if (modoVisita) {
        modoVisita.classList.remove('oculto');
    }
}

function verificarCredenciales() {
    const usuario = document.getElementById('usuario').value.trim();
    const clave = document.getElementById('clave').value;
    
    if (!usuario || !clave) {
        alert("Por favor, completa ambos campos");
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
        alert("Credenciales incorrectas");
        document.getElementById('clave').value = '';
        document.getElementById('clave').focus();
    }
}

function mostrarModoAdmin() {
    console.log("🖥️ Mostrando modo administrador...");
    
    // Ocultar otros modos
    document.getElementById('modoVisita')?.classList.add('oculto');
    document.getElementById('loginForm')?.classList.add('oculto');
    
    // Mostrar modo admin
    const modoAdmin = document.getElementById('modoAdmin');
    if (modoAdmin) {
        modoAdmin.classList.remove('oculto');
        
        // Mostrar nombre de usuario
        const usuarioInfo = usuarios.find(u => u.usuario === usuarioActivo);
        if (usuarioInfo) {
            document.getElementById('nombreUsuario').textContent = usuarioInfo.nombre;
        }
        
        // Cargar inventario
        cargarInventarioAdmin();
        mostrarHistorial();
        
        console.log("✅ Modo admin activado");
    }
}

function cerrarSesion() {
    if (confirm("¿Estás seguro de cerrar sesión?")) {
        usuarioActivo = null;
        sessionStorage.removeItem('sesion_usuario_activo');
        
        document.getElementById('modoAdmin').classList.add('oculto');
        document.getElementById('modoVisita').classList.remove('oculto');
        
        cargarInventario();
        mostrarNotificacion("Sesión cerrada");
    }
}

// ============================================
// 3. INVENTARIO (MODO VISITA)
// ============================================

function cargarInventario() {
    const container = document.getElementById('tablaInventario');
    if (!container) return;
    
    if (inventario.length === 0) {
        container.innerHTML = '<p>No hay productos en inventario</p>';
        return;
    }
    
    let html = '<table><thead><tr><th>Producto</th><th>Cantidad</th><th>Categoría</th><th>Última mod</th></tr></thead><tbody>';
    
    inventario.forEach(producto => {
        html += `
        <tr>
            <td>${producto.nombre}</td>
            <td>${producto.cantidad} ${producto.unidad}</td>
            <td>${producto.categoria}</td>
            <td>${producto.ultimaMod || 'Nunca'}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============================================
// 4. INVENTARIO (MODO ADMIN)
// ============================================

function cargarInventarioAdmin() {
    const container = document.getElementById('tablaInventarioAdmin');
    if (!container) return;
    
    if (inventario.length === 0) {
        container.innerHTML = '<p>No hay productos. Agrega el primero.</p>';
        return;
    }
    
    let html = '<table><thead><tr><th>Producto</th><th>Cantidad</th><th>Categoría</th><th>Acciones</th></tr></thead><tbody>';
    
    inventario.forEach((producto, index) => {
        html += `
        <tr>
            <td>${producto.nombre}</td>
            <td>${producto.cantidad} ${producto.unidad}</td>
            <td>${producto.categoria}</td>
            <td>
                <button onclick="modificarProducto(${index})">✏️ Editar</button>
                <button onclick="eliminarProducto(${index})">🗑️ Eliminar</button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function modificarProducto(index) {
    const producto = inventario[index];
    if (!producto) return;
    
    const nuevaCantidad = prompt(`Nueva cantidad para ${producto.nombre}:`, producto.cantidad);
    if (nuevaCantidad === null) return;
    
    const cantidadNum = parseInt(nuevaCantidad);
    if (isNaN(cantidadNum) || cantidadNum < 0) {
        alert("Cantidad inválida");
        return;
    }
    
    // Registrar cambio
    const registro = {
        fecha: new Date().toLocaleString('es-MX'),
        usuario: usuarioActivo,
        producto: producto.nombre,
        anterior: producto.cantidad,
        nuevo: cantidadNum,
        diferencia: cantidadNum - producto.cantidad
    };
    
    historial.unshift(registro);
    
    // Actualizar producto
    producto.cantidad = cantidadNum;
    producto.ultimaMod = registro.fecha;
    
    // Guardar
    guardarTodo();
    
    // Actualizar interfaz
    cargarInventarioAdmin();
    mostrarHistorial();
    
    mostrarNotificacion(`✅ ${producto.nombre} actualizado`);
}

function eliminarProducto(index) {
    const producto = inventario[index];
    if (!producto) return;
    
    if (confirm(`¿Eliminar ${producto.nombre}?`)) {
        inventario.splice(index, 1);
        guardarTodo();
        cargarInventarioAdmin();
        mostrarNotificacion(`🗑️ ${producto.nombre} eliminado`);
    }
}

function agregarProducto() {
    const nombre = prompt("Nombre del producto:");
    if (!nombre) return;
    
    const cantidad = parseInt(prompt("Cantidad inicial:") || "0");
    const unidad = prompt("Unidad (bultos, cajas, etc.):") || "unidades";
    const categoria = prompt("Categoría:") || "General";
    
    const nuevoProducto = {
        id: proximoId++,
        nombre: nombre,
        cantidad: cantidad,
        unidad: unidad,
        categoria: categoria,
        creadoPor: usuarioActivo,
        fechaCreacion: new Date().toLocaleString('es-MX'),
        ultimaMod: "Nunca"
    };
    
    inventario.push(nuevoProducto);
    guardarTodo();
    cargarInventarioAdmin();
    
    mostrarNotificacion(`✅ Producto "${nombre}" agregado`);
}

// ============================================
// 5. HISTORIAL
// ============================================

function mostrarHistorial() {
    const container = document.getElementById('historialContainer');
    const lista = document.getElementById('historial');
    
    if (!container || !lista) return;
    
    if (historial.length === 0) {
        container.classList.add('oculto');
        return;
    }
    
    container.classList.remove('oculto');
    
    let html = '';
    historial.slice(0, 10).forEach(registro => {
        const esPositivo = registro.diferencia >= 0;
        
        html += `
        <div class="registro-historial">
            <div class="registro-header">
                <span class="fecha">${registro.fecha}</span>
                <span class="usuario">${registro.usuario}</span>
            </div>
            <div class="registro-detalle">
                <span class="producto">${registro.producto}</span>
                <span class="cambio ${esPositivo ? 'positivo' : 'negativo'}">
                    ${registro.anterior} → ${registro.nuevo} 
                    (${esPositivo ? '+' : ''}${registro.diferencia})
                </span>
            </div>
        </div>`;
    });
    
    lista.innerHTML = html;
}

// ============================================
// 6. PERSISTENCIA
// ============================================

function guardarTodo() {
    localStorage.setItem('inventario_persistente', JSON.stringify(inventario));
    localStorage.setItem('historial_persistente', JSON.stringify(historial));
}

// ============================================
// 7. NOTIFICACIONES
// ============================================

function mostrarNotificacion(mensaje) {
    // Crear notificación simple
    const notificacion = document.createElement('div');
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 1000;
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// ============================================
// 8. EXPORTACIÓN/IMPORTACIÓN (SIMPLIFICADA)
// ============================================

function generarCodigoRespaldo() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión");
        return;
    }
    
    // Crear código simple pero único
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const userCode = usuarioActivo.substring(0, 3).toUpperCase();
    
    let codigo = (timestamp + random + userCode).substring(0, 12);
    codigo = codigo.toUpperCase();
    
    // Formatear
    const codigoFormateado = codigo.match(/.{1,3}/g).join('-');
    
    // Guardar datos asociados
    const datos = {
        inventario: inventario,
        historial: historial,
        usuario: usuarioActivo,
        fecha: new Date().toISOString()
    };
    
    localStorage.setItem(`respaldo_${codigo}`, JSON.stringify(datos));
    
    // Mostrar
    alert(`🔐 Tu código de respaldo es:\n\n${codigoFormateado}\n\nGuárdalo para importar tu inventario en otra computadora.`);
}

function mostrarImportarInventario() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión");
        return;
    }
    
    const opcion = prompt("¿Cómo quieres importar?\n\n1. Desde código\n2. Desde archivo\n\nEscribe 1 o 2:");
    
    if (opcion === '1') {
        importarDesdeCodigo();
    } else if (opcion === '2') {
        importarDesdeArchivo();
    }
}

function importarDesdeCodigo() {
    const codigo = prompt("Pega tu código (sin guiones):");
    if (!codigo) return;
    
    const codigoLimpio = codigo.replace(/-/g, '').toUpperCase();
    
    const datos = localStorage.getItem(`respaldo_${codigoLimpio}`);
    
    if (!datos) {
        alert("Código no encontrado");
        return;
    }
    
    try {
        const datosParseados = JSON.parse(datos);
        
        if (confirm(`¿Importar ${datosParseados.inventario.length} productos?`)) {
            inventario = datosParseados.inventario;
            historial = datosParseados.historial || [];
            
            guardarTodo();
            cargarInventarioAdmin();
            
            alert(`✅ Importado: ${inventario.length} productos`);
        }
    } catch (error) {
        alert("Error al importar");
    }
}

function importarDesdeArchivo() {
    alert("Para importar desde archivo:\n1. Exporta primero tu inventario actual\n2. En la otra computadora, carga el archivo .json");
    
    // Opción simple: crear input de archivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const archivo = e.target.files[0];
        if (!archivo) return;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const datos = JSON.parse(e.target.result);
                
                if (confirm(`¿Importar ${datos.inventario.length} productos?`)) {
                    inventario = datos.inventario;
                    historial = datos.historial || [];
                    
                    guardarTodo();
                    cargarInventarioAdmin();
                    
                    alert(`✅ Importado: ${inventario.length} productos`);
                }
            } catch (error) {
                alert("Archivo inválido");
            }
        };
        
        reader.readAsText(archivo);
    };
    
    input.click();
}

function exportarComoArchivo() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión");
        return;
    }
    
    const datos = {
        inventario: inventario,
        historial: historial,
        usuario: usuarioActivo,
        fecha: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(datos, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `inventario_${fecha}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`✅ Exportado: ${nombreArchivo}`);
}

// ============================================
// 9. HACER FUNCIONES GLOBALES
// ============================================

window.mostrarLogin = mostrarLogin;
window.regresarAVisita = regresarAVisita;
window.verificarCredenciales = verificarCredenciales;
window.cerrarSesion = cerrarSesion;
window.agregarProducto = agregarProducto;
window.modificarProducto = modificarProducto;
window.eliminarProducto = eliminarProducto;
window.generarCodigoRespaldo = generarCodigoRespaldo;
window.mostrarImportarInventario = mostrarImportarInventario;
window.exportarComoArchivo = exportarComoArchivo;

// ============================================
// 10. INICIAR
// ============================================

document.addEventListener('DOMContentLoaded', inicializar);
