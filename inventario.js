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
    
    // Mostrar máximo 5 páginas alrededor de la actual
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, paginaActual + 2);
    
    if (inicio > 1) {
        html += `<span class="puntos">...</span>`;
    }
    
    for (let i = inicio; i <= fin; i++) {
        html += `
            <button onclick="cambiarPagina('${containerId}', ${i})" class="${i === paginaActual ? 'activa' : ''}">
                ${i}
            </button>
        `;
    }
    
    if (fin < totalPaginas) {
        html += `<span class="puntos">...</span>`;
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
    const totalPaginas = Math.ceil(inventario.length / CONFIG.productosPorPagina);
    
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) {
        return;
    }
    
    paginaActual = nuevaPagina;
    
    if (containerId.includes('Admin')) {
        cargarInventarioAdmin();
    } else {
        cargarInventario();
    }
}

function actualizarContadorPaginas(productosList = null) {
    const contador = document.getElementById('contadorPaginas');
    if (!contador) return;
    
    const productos = productosList || inventario;
    const totalPaginas = Math.ceil(productos.length / CONFIG.productosPorPagina);
    contador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
}

// ===== 6. SISTEMA DE ORDENAMIENTO =====
function ordenarPor(tipo) {
    ordenActual = tipo;
    mostrarNotificacion(`🔍 Ordenando por: ${obtenerNombreOrden(tipo)}`, "info");
    filtrarProductos();
}

function obtenerNombreOrden(tipo) {
    const nombres = {
        'nombre': 'Nombre',
        'marca': 'Marca',
        'vencimiento': 'Fecha de vencimiento',
        'inteligente': 'Orden inteligente'
    };
    return nombres[tipo] || tipo;
}

function ordenarProductos(productos, tipo) {
    const productosCopia = [...productos];
    
    switch(tipo) {
        case 'nombre':
            return productosCopia.sort((a, b) => a.nombre.localeCompare(b.nombre));
            
        case 'marca':
            return productosCopia.sort((a, b) => a.marca.localeCompare(b.marca));
            
        case 'vencimiento':
            return productosCopia.sort((a, b) => {
                // Los que no tienen vencimiento van al final
                if (!a.vencimiento && !b.vencimiento) return 0;
                if (!a.vencimiento) return 1;
                if (!b.vencimiento) return -1;
                return new Date(a.vencimiento) - new Date(b.vencimiento);
            });
            
        case 'inteligente':
        default:
            return productosCopia.sort((a, b) => {
                // Prioridad 1: Productos vencidos o próximos a vencer
                const estadoA = obtenerEstadoVencimiento(a.vencimiento);
                const estadoB = obtenerEstadoVencimiento(b.vencimiento);
                
                const prioridadA = estadoA.estado === 'vencido' ? 0 : 
                                 estadoA.estado === 'proximo' ? 1 : 2;
                const prioridadB = estadoB.estado === 'vencido' ? 0 : 
                                 estadoB.estado === 'proximo' ? 1 : 2;
                
                if (prioridadA !== prioridadB) return prioridadA - prioridadB;
                
                // Prioridad 2: Stock bajo
                const stockA = obtenerEstadoStock(a.cantidad);
                const stockB = obtenerEstadoStock(b.cantidad);
                
                const prioridadStockA = stockA === 'estado-critico' ? 0 : 
                                      stockA === 'estado-bajo' ? 1 : 2;
                const prioridadStockB = stockB === 'estado-critico' ? 0 : 
                                      stockB === 'estado-bajo' ? 1 : 2;
                
                if (prioridadStockA !== prioridadStockB) return prioridadStockA - prioridadStockB;
                
                // Prioridad 3: Nombre alfabético
                return a.nombre.localeCompare(b.nombre);
            });
    }
}

// ===== 7. GESTIÓN CRUD DE PRODUCTOS =====
function agregarProducto() {
    mostrarModalProducto(null);
}

function editarProducto(id) {
    const producto = inventario.find(p => p.id === id);
    if (producto) {
        mostrarModalProducto(producto);
    }
}

function eliminarProducto(id) {
    const producto = inventario.find(p => p.id === id);
    if (!producto) return;
    
    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) {
        const productoEliminado = inventario.find(p => p.id === id);
        const indice = inventario.findIndex(p => p.id === id);
        
        if (indice !== -1) {
            // Registrar en historial ANTES de eliminar
            registrarEnHistorial(
                usuarioActivo,
                productoEliminado.nombre,
                'Eliminación',
                productoEliminado.cantidad,
                0,
                productoEliminado.cantidad, // Cambio total (todo a 0)
                'Producto eliminado del inventario'
            );
            
            inventario.splice(indice, 1);
            guardarTodo();
            cargarInventarioAdmin();
            mostrarNotificacion(`🗑️ Producto "${producto.nombre}" eliminado`, "exito");
        }
    }
}

function ajustarStock(id) {
    const producto = inventario.find(p => p.id === id);
    if (!producto) return;
    
    const nuevaCantidad = prompt(`Ajustar stock de "${producto.nombre}"\nCantidad actual: ${producto.cantidad} ${producto.unidad}\n\nIngresa la nueva cantidad:`, producto.cantidad);
    
    if (nuevaCantidad === null) return;
    
    const cantidadNum = parseInt(nuevaCantidad);
    if (isNaN(cantidadNum) || cantidadNum < 0) {
        mostrarNotificacion("❌ Cantidad inválida", "error");
        return;
    }
    
    const cantidadAnterior = producto.cantidad;
    const cambio = cantidadNum - cantidadAnterior;
    
    producto.cantidad = cantidadNum;
    producto.ultimaMod = new Date().toLocaleString('es-VE');
    
    guardarTodo();
    cargarInventarioAdmin();
    
    // Registrar en historial
    registrarEnHistorial(
        usuarioActivo,
        producto.nombre,
        'Ajuste de stock',
        cantidadAnterior,
        cantidadNum,
        cambio,
        `Stock ajustado de ${cantidadAnterior} a ${cantidadNum} ${producto.unidad}`
    );
    
    mostrarNotificacion(`📊 Stock de "${producto.nombre}" actualizado`, "exito");
}

// ===== 8. MODALES =====
function mostrarModalProducto(producto = null) {
    const esNuevo = producto === null;
    
    const modalHTML = `
        <div class="modal-overlay" onclick="cerrarModal()">
            <div class="modal-contenido" onclick="event.stopPropagation()">
                <div class="modal-cabecera">
                    <h3><i class="fas ${esNuevo ? 'fa-plus-circle' : 'fa-edit'}"></i> ${esNuevo ? 'Nuevo Producto' : 'Editar Producto'}</h3>
                    <button onclick="cerrarModal()" class="btn-cerrar-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-cuerpo">
                    <form id="formProducto" class="formulario-producto">
                        <input type="hidden" id="productoId" value="${producto?.id || ''}">
                        
                        <div class="grupo-formulario">
                            <label for="nombreProducto"><i class="fas fa-cube"></i> Nombre del Producto *</label>
                            <input type="text" id="nombreProducto" value="${producto?.nombre || ''}" required 
                                   placeholder="Ej: Refresco Coca-Cola 2L" maxlength="100">
                        </div>
                        
                        <div class="grupo-formulario grupo-unidades">
                            <div>
                                <label for="cantidadProducto"><i class="fas fa-hashtag"></i> Cantidad *</label>
                                <input type="number" id="cantidadProducto" value="${producto?.cantidad || '0'}" 
                                       min="0" step="1" required placeholder="0">
                            </div>
                            
                            <div>
                                <label><i class="fas fa-balance-scale"></i> Unidad</label>
                                <div class="seleccion-unidad">
                                    <button type="button" class="btn-unidad ${(!producto?.unidad || producto.unidad === 'Unidades') ? 'activa' : ''}" data-unidad="Unidades">
                                        Unidades
                                    </button>
                                    <button type="button" class="btn-unidad ${producto?.unidad === 'Bultos' ? 'activa' : ''}" data-unidad="Bultos">
                                        Bultos
                                    </button>
                                    <button type="button" class="btn-unidad ${producto?.unidad === 'Botellas' ? 'activa' : ''}" data-unidad="Botellas">
                                        Botellas
                                    </button>
                                </div>
                                <input type="hidden" id="unidadProducto" value="${producto?.unidad || 'Unidades'}">
                            </div>
                        </div>
                        
                        <div class="grupo-formulario">
                            <label for="vencimientoProducto"><i class="fas fa-calendar-alt"></i> Fecha de Vencimiento</label>
                            <input type="date" id="vencimientoProducto" value="${producto?.vencimiento || ''}">
                            <small class="texto-claro">Dejar en blanco si no aplica</small>
                        </div>
                        
                        <div class="grupo-formulario">
                            <label for="marcaProducto"><i class="fas fa-tag"></i> Marca</label>
                            <input type="text" id="marcaProducto" value="${producto?.marca || ''}" 
                                   placeholder="Ej: CocaCola, Bimbo, etc." list="marcasLista">
                            <datalist id="marcasLista">
                                ${[...new Set(inventario.map(p => p.marca))].filter(m => m && m !== "Sin marca").map(marca => 
                                    `<option value="${marca}">`).join('')}
                            </datalist>
                        </div>
                    </form>
                    
                    ${producto?.vencimiento ? `
                        <div class="alerta-vencimiento">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div class="contenido-alerta">
                                <h4>Estado del vencimiento</h4>
                                <p>${obtenerEstadoVencimiento(producto.vencimiento).texto}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-pie">
                    <button onclick="guardarProducto()" class="btn-modal btn-guardar">
                        <i class="fas fa-save"></i> ${esNuevo ? 'Agregar Producto' : 'Guardar Cambios'}
                    </button>
                    <button onclick="cerrarModal()" class="btn-modal btn-cancelar">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal
    document.getElementById('modalesContainer').innerHTML = modalHTML;
    
    // Configurar botones de unidad
    document.querySelectorAll('.btn-unidad').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-unidad').forEach(b => b.classList.remove('activa'));
            this.classList.add('activa');
            document.getElementById('unidadProducto').value = this.dataset.unidad;
        });
    });
    
    // Enfocar primer campo
    setTimeout(() => {
        document.getElementById('nombreProducto').focus();
    }, 100);
}

function guardarProducto() {
    const idInput = document.getElementById('productoId');
    const nombre = document.getElementById('nombreProducto').value.trim();
    const cantidad = parseInt(document.getElementById('cantidadProducto').value);
    const unidad = document.getElementById('unidadProducto').value;
    const vencimiento = document.getElementById('vencimientoProducto').value;
    const marca = document.getElementById('marcaProducto').value.trim() || "Sin marca";
    
    // Validaciones
    if (!nombre) {
        mostrarNotificacion("❌ El nombre del producto es obligatorio", "error");
        document.getElementById('nombreProducto').focus();
        return;
    }
    
    if (isNaN(cantidad) || cantidad < 0) {
        mostrarNotificacion("❌ La cantidad debe ser un número positivo", "error");
        document.getElementById('cantidadProducto').focus();
        return;
    }
    
    const esNuevo = !idInput.value;
    let producto;
    let cantidadAnterior = 0;
    
    if (esNuevo) {
        // Crear nuevo producto
        producto = {
            id: proximoId++,
            nombre,
            cantidad,
            unidad,
            vencimiento: vencimiento || "",
            marca,
            creadoPor: usuarioActivo,
            fechaCreacion: new Date().toLocaleString('es-VE'),
            ultimaMod: "Nunca"
        };
        inventario.push(producto);
        
        // Registrar en historial
        registrarEnHistorial(
            usuarioActivo,
            nombre,
            'Creación',
            0,
            cantidad,
            cantidad,
            'Producto agregado al inventario'
        );
        
        mostrarNotificacion(`✅ Producto "${nombre}" agregado`, "exito");
    } else {
        // Actualizar producto existente
        const id = parseInt(idInput.value);
        const indice = inventario.findIndex(p => p.id === id);
        
        if (indice === -1) return;
        
        producto = inventario[indice];
        cantidadAnterior = producto.cantidad;
        
        // Registrar cambios en historial si hubo modificación
        if (producto.nombre !== nombre || 
            producto.cantidad !== cantidad || 
            producto.unidad !== unidad || 
            producto.vencimiento !== vencimiento || 
            producto.marca !== marca) {
            
            const cambios = [];
            if (producto.nombre !== nombre) cambios.push(`nombre: "${producto.nombre}" → "${nombre}"`);
            i
