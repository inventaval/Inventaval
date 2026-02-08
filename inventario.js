// ============================================
// inventario.js - SISTEMA COMPLETO DE INVENTARIO
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
    console.log("🚀 Inicializando sistema...");
    
    cargarDatosPersistentes();
    verificarSesionActiva();
    actualizarInterfaz();
    
    console.log("✅ Sistema listo");
    console.log(`📦 Productos: ${inventario.length}`);
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
    
    // Usuarios predeterminados
    usuarios = [
        { usuario: "zona6", clave: "2026", nombre: "Administrador" },
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
// 2. FUNCIONES DE LOGIN (¡ESTAS DEBEN FUNCIONAR!)
// ============================================

function mostrarLogin() {
    console.log("🔓 Mostrando login...");
    
    // Ocultar modo visita
    const modoVisita = document.getElementById('modoVisita');
    if (modoVisita) {
        modoVisita.classList.add('oculto');
    }
    
    // Mostrar formulario login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.classList.remove('oculto');
        
        // Enfocar campo usuario
        setTimeout(() => {
            const usuarioInput = document.getElementById('usuario');
            if (usuarioInput) {
                usuarioInput.focus();
            }
        }, 100);
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
    console.log("🖥️ Mostrando modo admin...");
    
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
        container.innerHTML = '<p>No hay productos</p>';
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
    
    // Registrar en historial
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
    
    // Guardar cambios
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
    // Crear notificación temporal
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
// 8. EXPORTACIÓN/IMPORTACIÓN (NUEVAS FUNCIONES)
// ============================================

function generarCodigoRespaldo() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión");
        return;
    }
    
    // Crear objeto con datos
    const datos = {
        inventario: inventario,
        historial: historial,
        metadata: {
            fecha: new Date().toLocaleString('es-MX'),
            usuario: usuarioActivo,
            productos: inventario.length
        }
    };
    
    // Crear código simple
    const jsonString = JSON.stringify(datos);
    let codigo = btoa(jsonString).replace(/[^A-Za-z0-9]/g, '').substring(0, 12);
    
    // Formatear
    codigo = codigo.match(/.{1,3}/g).join('-');
    
    // Mostrar modal
    const modalHTML = `
    <div class="modal">
        <div class="modal-contenido">
            <h2>🔐 Código de Respaldo</h2>
            <div class="codigo-display">${codigo}</div>
            <p>Guarda este código para restaurar tu inventario.</p>
            <button onclick="copiarCodigo('${codigo}')">📋 Copiar</button>
            <button onclick="cerrarModal()">Cerrar</button>
        </div>
    </div>`;
    
    cerrarModal();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function mostrarImportarInventario() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión");
        return;
    }
    
    const modalHTML = `
    <div class="modal">
        <div class="modal-contenido">
            <h2>📥 Importar Inventario</h2>
            <div class="opciones-importacion">
                <div onclick="mostrarImportarCodigo()">
                    <div>🔐</div>
                    <h3>Desde Código</h3>
                    <p>Pega código de respaldo</p>
                </div>
                <div onclick="mostrarImportarArchivo()">
                    <div>📁</div>
                    <h3>Desde Archivo</h3>
                    <p>Carga archivo JSON</p>
                </div>
            </div>
            <button onclick="cerrarModal()">Cancelar</button>
        </div>
    </div>`;
    
    cerrarModal();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function exportarComoArchivo() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión");
        return;
    }
    
    const datos = {
        inventario: inventario,
        historial: historial,
        metadata: {
            fecha: new Date().toLocaleString('es-MX'),
            usuario: usuarioActivo
        }
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
// ============================================
// FUNCIONES REALES DE EXPORTACIÓN/IMPORTACIÓN
// ============================================

function base64Encode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function base64Decode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

function generarCodigoRespaldo() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión para generar respaldo");
        return;
    }
    
    try {
        console.log("🔐 Generando código de respaldo...");
        
        // 1. Preparar datos
        const datos = {
            i: inventario,
            h: historial,
            m: {
                f: new Date().toISOString(),
                u: usuarioActivo,
                p: inventario.length,
                m: historial.length
            }
        };
        
        // 2. Convertir a JSON
        const jsonString = JSON.stringify(datos);
        
        // 3. Crear hash único
        let hash = 0;
        for (let i = 0; i < jsonString.length; i++) {
            hash = ((hash << 5) - hash) + jsonString.charCodeAt(i);
            hash = hash & hash;
        }
        
        // 4. Generar código de 12 caracteres
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codigo = '';
        
        // Semilla basada en el hash
        Math.seed = Math.abs(hash);
        for (let i = 0; i < 12; i++) {
            Math.seed = (Math.seed * 9301 + 49297) % 233280;
            const rnd = Math.seed / 233280;
            codigo += caracteres.charAt(Math.floor(rnd * caracteres.length));
        }
        
        // 5. Formatear y guardar
        const codigoFormateado = codigo.match(/.{1,3}/g).join('-');
        
        // Guardar datos asociados al código
        const codigoData = {
            codigo: codigo,
            datos: jsonString,
            timestamp: Date.now()
        };
        
        localStorage.setItem(`respaldo_${codigo}`, JSON.stringify(codigoData));
        
        // 6. Mostrar al usuario
        mostrarModalCodigo(codigoFormateado, datos.m);
        
        console.log("✅ Código generado:", codigoFormateado);
        
    } catch (error) {
        console.error("❌ Error:", error);
        alert("Error al generar código");
    }
}

function mostrarModalCodigo(codigo, metadata) {
    const modalHTML = `
    <div class="modal">
        <div class="modal-contenido">
            <h2>🔐 Código de Respaldo</h2>
            
            <div class="codigo-mostrar">
                ${codigo}
            </div>
            
            <div class="codigo-info">
                <p><strong>Generado:</strong> ${new Date(metadata.f).toLocaleString('es-MX')}</p>
                <p><strong>Por:</strong> ${metadata.u}</p>
                <p><strong>Productos:</strong> ${metadata.p}</p>
            </div>
            
            <button onclick="copiarCodigo('${codigo}')">📋 Copiar</button>
            <button onclick="cerrarModal()">Cerrar</button>
        </div>
    </div>`;
    
    // Remover modales anteriores
    document.querySelectorAll('.modal').forEach(m => m.remove());
    
    // Agregar nuevo
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function copiarCodigo(codigo) {
    navigator.clipboard.writeText(codigo)
        .then(() => alert("✅ Código copiado"))
        .catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = codigo;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert("✅ Código copiado (modo alternativo)");
        });
}

function mostrarImportarInventario() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión");
        return;
    }
    
    const modalHTML = `
    <div class="modal">
        <div class="modal-contenido">
            <h2>📥 Importar Inventario</h2>
            
            <div class="opciones-importar">
                <div onclick="importarDesdeCodigo()">
                    <div>🔐</div>
                    <h3>Desde Código</h3>
                    <p>Pega un código de respaldo</p>
                </div>
                
                <div onclick="importarDesdeArchivo()">
                    <div>📁</div>
                    <h3>Desde Archivo</h3>
                    <p>Carga un archivo .json</p>
                </div>
            </div>
            
            <button onclick="cerrarModal()">Cancelar</button>
        </div>
    </div>`;
    
    cerrarModal();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function importarDesdeCodigo() {
    const codigo = prompt("Pega tu código de 12 caracteres:");
    if (!codigo) return;
    
    const codigoLimpio = codigo.replace(/-/g, '');
    
    if (codigoLimpio.length !== 12) {
        alert("El código debe tener 12 caracteres");
        return;
    }
    
    // Buscar datos del código
    const codigoData = localStorage.getItem(`respaldo_${codigoLimpio}`);
    
    if (!codigoData) {
        alert("Código no encontrado o expirado");
        return;
    }
    
    try {
        const datos = JSON.parse(codigoData);
        const inventarioData = JSON.parse(datos.datos);
        
        if (confirm(`¿Importar ${inventarioData.i.length} productos?`)) {
            inventario = inventarioData.i;
            historial = inventarioData.h || [];
            
            // Actualizar próximo ID
            proximoId = inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1;
            
            // Guardar
            guardarTodo();
            
            // Actualizar interfaz
            cargarInventarioAdmin();
            mostrarHistorial();
            
            alert(`✅ Importado: ${inventario.length} productos`);
        }
        
    } catch (error) {
        console.error("Error importando:", error);
        alert("Error al importar el código");
    }
}

function importarDesdeArchivo() {
    // Crear input de archivo
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
                
                if (!datos.i || !Array.isArray(datos.i)) {
                    throw new Error("Archivo inválido");
                }
                
                if (confirm(`¿Importar ${datos.i.length} productos?`)) {
                    inventario = datos.i;
                    historial = datos.h || [];
                    
                    // Actualizar próximo ID
                    proximoId = inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1;
                    
                    // Guardar
                    guardarTodo();
                    
                    // Actualizar interfaz
                    cargarInventarioAdmin();
                    mostrarHistorial();
                    
                    alert(`✅ Importado: ${inventario.length} productos`);
                }
                
            } catch (error) {
                alert("Error: Archivo inválido o corrupto");
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
        metadata: {
            fecha: new Date().toISOString(),
            usuario: usuarioActivo
        }
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

function cerrarModal() {
    document.querySelectorAll('.modal').forEach(modal => modal.remove());
}
