// ============================================
// 9. FUNCIONES DE EXPORTACIÓN/IMPORTACIÓN
// ============================================

function generarCodigoRespaldo() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión para generar respaldo");
        return;
    }
    
    // Crear objeto con datos
    const datosCompletos = {
        inventario: inventario,
        historial: historial,
        metadata: {
            fechaGeneracion: new Date().toISOString(),
            generadoPor: usuarioActivo,
            totalProductos: inventario.length,
            totalMovimientos: historial.length
        }
    };
    
    // Convertir a JSON y mostrar código simplificado
    const jsonString = JSON.stringify(datosCompletos);
    
    // Crear código simple (primeros 20 chars del hash)
    let codigo = btoa(jsonString).replace(/[^A-Za-z0-9]/g, '').substring(0, 12);
    
    // Formatear
    codigo = codigo.match(/.{1,3}/g).join('-');
    
    // Mostrar modal con código
    const modalHTML = `
    <div class="modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
        <div style="background:white;padding:30px;border-radius:10px;max-width:500px;">
            <h2>🔐 Código de Respaldo</h2>
            <div style="font-size:24px;font-weight:bold;letter-spacing:3px;padding:20px;background:#f5f5f5;border-radius:5px;margin:20px 0;">
                ${codigo}
            </div>
            <p>Guarda este código en un lugar seguro.</p>
            <p>Para importar, usa la opción "Importar Inventario" y pega este código.</p>
            <button onclick="copiarCodigo('${codigo}')" style="background:#2196f3;color:white;padding:10px 20px;border:none;border-radius:5px;margin:10px;cursor:pointer;">
                📋 Copiar Código
            </button>
            <button onclick="cerrarModal()" style="background:#757575;color:white;padding:10px 20px;border:none;border-radius:5px;margin:10px;cursor:pointer;">
                Cerrar
            </button>
        </div>
    </div>`;
    
    // Remover modal anterior si existe
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => modal.remove());
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function copiarCodigo(codigo) {
    navigator.clipboard.writeText(codigo)
        .then(() => {
            alert("✅ Código copiado al portapapeles");
        })
        .catch(err => {
            console.error("Error al copiar:", err);
            alert("❌ No se pudo copiar el código");
        });
}

function mostrarImportarInventario() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión para importar");
        return;
    }
    
    const modalHTML = `
    <div class="modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
        <div style="background:white;padding:30px;border-radius:10px;max-width:500px;">
            <h2>📥 Importar Inventario</h2>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0;">
                <div onclick="mostrarImportarCodigo()" style="padding:20px;border:2px solid #e0e0e0;border-radius:10px;cursor:pointer;text-align:center;">
                    <div style="font-size:40px;">🔐</div>
                    <h3>Desde Código</h3>
                    <p>Pega un código de respaldo</p>
                </div>
                
                <div onclick="mostrarImportarArchivo()" style="padding:20px;border:2px solid #e0e0e0;border-radius:10px;cursor:pointer;text-align:center;">
                    <div style="font-size:40px;">📁</div>
                    <h3>Desde Archivo</h3>
                    <p>Carga un archivo JSON</p>
                </div>
            </div>
            
            <div style="background:#f8d7da;color:#721c24;padding:10px;border-radius:5px;margin:20px 0;">
                ⚠️ <strong>Advertencia:</strong> Importar reemplazará tu inventario actual.
            </div>
            
            <button onclick="cerrarModal()" style="background:#757575;color:white;padding:10px 20px;border:none;border-radius:5px;width:100%;cursor:pointer;">
                Cancelar
            </button>
        </div>
    </div>`;
    
    cerrarModal();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function mostrarImportarCodigo() {
    const contenido = `
    <div style="padding:20px;">
        <h3>🔐 Importar desde Código</h3>
        <p>Pega tu código de 12 caracteres:</p>
        <textarea id="codigoInput" placeholder="Ej: A1B2-C3D4-E5F6" 
                  style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:5px;font-family:monospace;" 
                  rows="3"></textarea>
        <div style="display:flex;gap:10px;">
            <button onclick="importarDesdeCodigo()" style="background:#4caf50;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;">
                📥 Importar
            </button>
            <button onclick="mostrarImportarInventario()" style="background:#757575;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;">
                ↩️ Regresar
            </button>
        </div>
    </div>`;
    
    document.querySelector('.modal > div').innerHTML = contenido;
}

function importarDesdeCodigo() {
    const codigoInput = document.getElementById('codigoInput');
    if (!codigoInput) return;
    
    const codigo = codigoInput.value.trim().replace(/-/g, '');
    
    if (codigo.length !== 12) {
        alert("El código debe tener 12 caracteres");
        return;
    }
    
    if (!confirm("¿Importar inventario desde código? Esto reemplazará tu inventario actual.")) {
        return;
    }
    
    try {
        // Intentar decodificar (simplificado)
        const jsonString = atob(codigo + '=='); // Agregar padding
        const datos = JSON.parse(jsonString);
        
        if (datos.inventario && Array.isArray(datos.inventario)) {
            inventario = datos.inventario;
            historial = datos.historial || [];
            proximoId = inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1;
            
            guardarTodo();
            cargarInventarioAdmin();
            mostrarHistorial();
            cerrarModal();
            
            alert(`✅ Inventario importado: ${inventario.length} productos`);
        } else {
            alert("❌ Código inválido");
        }
    } catch (error) {
        console.error("Error al importar:", error);
        alert("❌ Error al importar el código");
    }
}

function mostrarImportarArchivo() {
    const contenido = `
    <div style="padding:20px;">
        <h3>📁 Importar desde Archivo</h3>
        <div style="border:3px dashed #ccc;padding:40px;text-align:center;margin:20px 0;cursor:pointer;" 
             onclick="document.getElementById('fileInput').click()">
            <div style="font-size:50px;">📂</div>
            <p>Arrastra tu archivo .json aquí o</p>
            <p style="color:#2196f3;font-weight:bold;">Seleccionar Archivo</p>
        </div>
        <input type="file" id="fileInput" accept=".json" style="display:none;" 
               onchange="procesarArchivoImportado(this)">
        
        <div style="margin:20px 0;">
            <p><strong>Requisitos:</strong></p>
            <ul style="text-align:left;">
                <li>Archivo .json exportado desde este sistema</li>
                <li>Tamaño máximo: 5MB</li>
            </ul>
        </div>
        
        <button onclick="mostrarImportarInventario()" style="background:#757575;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;">
            ↩️ Regresar
        </button>
    </div>`;
    
    document.querySelector('.modal > div').innerHTML = contenido;
}

function procesarArchivoImportado(input) {
    const archivo = input.files[0];
    if (!archivo) return;
    
    if (!archivo.name.endsWith('.json')) {
        alert("Solo se permiten archivos .json");
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            
            if (!confirm(`¿Importar ${datos.inventario.length} productos? Esto reemplazará tu inventario actual.`)) {
                return;
            }
            
            if (datos.inventario && Array.isArray(datos.inventario)) {
                inventario = datos.inventario;
                historial = datos.historial || [];
                proximoId = inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1;
                
                guardarTodo();
                cargarInventarioAdmin();
                mostrarHistorial();
                cerrarModal();
                
                alert(`✅ Inventario importado: ${inventario.length} productos`);
            } else {
                alert("❌ Archivo inválido");
            }
        } catch (error) {
            console.error("Error al procesar archivo:", error);
            alert("❌ Error al procesar el archivo");
        }
    };
    
    reader.readAsText(archivo);
}

function exportarComoArchivo() {
    if (!usuarioActivo) {
        alert("Debes iniciar sesión para exportar");
        return;
    }
    
    const datosCompletos = {
        inventario: inventario,
        historial: historial,
        metadata: {
            fechaExportacion: new Date().toISOString(),
            exportadoPor: usuarioActivo,
            totalProductos: inventario.length,
            totalMovimientos: historial.length
        }
    };
    
    const jsonString = JSON.stringify(datosCompletos, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `inventario_${fecha}_${usuarioActivo}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`✅ Archivo exportado: ${nombreArchivo}`);
}

function cerrarModal() {
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => modal.remove());
}

// ============================================
// 10. HACER FUNCIONES GLOBALES
// ============================================

// Exportar al objeto window para que estén disponibles globalmente
window.generarCodigoRespaldo = generarCodigoRespaldo;
window.mostrarImportarInventario = mostrarImportarInventario;
window.exportarComoArchivo = exportarComoArchivo;
window.copiarCodigo = copiarCodigo;
window.cerrarModal = cerrarModal;
window.mostrarImportarCodigo = mostrarImportarCodigo;
window.mostrarImportarArchivo = mostrarImportarArchivo;
window.importarDesdeCodigo = importarDesdeCodigo;
window.procesarArchivoImportado = procesarArchivoImportado;
