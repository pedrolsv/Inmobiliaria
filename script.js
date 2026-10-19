// URL de Google Apps Script Backend
const API_URL = "https://script.google.com/macros/s/AKfycbyv0cXsaD_Up0THC38EQnMdKl_kVE2y_wZT6pVu6YZDlXMT5GyUbT05C1Luh19AcyhPEQ/exec";

let propiedadesGlobal = [];

// Transformación de enlaces de Google Drive
function transformarUrlFoto(url) {
    if (!url || typeof url !== 'string') return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6';
    url = url.trim();
    const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
    }
    return url;
}

// Cargar propiedades desde la API
async function cargarPropiedades() {
    mostrarCarga(true);
    const tipo = document.getElementById('filtroTipo').value;
    const categoria = document.getElementById('filtroCategoria').value;
    const ubicacion = document.getElementById('filtroUbicacion').value;
    const precioMax = document.getElementById('filtroPrecioMax').value;

    let url = API_URL + '?';
    if (tipo) url += `tipo=${encodeURIComponent(tipo)}&`;
    if (categoria) url += `categoria=${encodeURIComponent(categoria)}&`;
    if (ubicacion) url += `ubicacion=${encodeURIComponent(ubicacion)}&`;
    if (precioMax) url += `precioMax=${encodeURIComponent(precioMax)}&`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (Array.isArray(data)) {
            propiedadesGlobal = data;
            renderizarGrid(data);
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    } finally {
        mostrarCarga(false);
    }
}

// Renderizar tarjetas
function renderizarGrid(propiedades) {
    const grid = document.getElementById('propiedadesGrid');
    grid.innerHTML = '';

    if (propiedades.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <i class="fa-solid fa-house-chimney-crack text-5xl text-slate-300 mb-4"></i>
                <h3 class="text-xl font-bold text-slate-700">No se encontraron propiedades</h3>
            </div>
        `;
        return;
    }

    propiedades.forEach(prop => {
        const imgUrl = transformarUrlFoto(prop.imagenPrincipal || (prop.fotosArray && prop.fotosArray[0]));
        const card = document.createElement('div');
        card.className = 'bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 hover:shadow-2xl transition-all flex flex-col justify-between';
        card.innerHTML = `
            <div class="relative overflow-hidden h-64 bg-slate-200">
                <img src="${imgUrl}" alt="${prop.titulo}" class="w-full h-full object-cover">
                <div class="absolute top-4 left-4 bg-primary text-white text-xs font-bold uppercase px-3 py-1 rounded-full shadow-md">
                    ${prop.tipo}
                </div>
                <div class="absolute bottom-4 right-4 bg-accent text-white font-extrabold text-lg px-4 py-1.5 rounded-2xl shadow-lg">
                    $${Number(prop.precio).toLocaleString()}
                </div>
            </div>
            <div class="p-6 flex flex-col flex-grow justify-between space-y-4">
                <div>
                    <span class="text-xs uppercase text-accent font-semibold">${prop.categoria}</span>
                    <h3 class="text-xl font-bold text-primary mt-1 line-clamp-1">${prop.titulo}</h3>
                    <p class="text-slate-500 text-sm mt-1"><i class="fa-solid fa-location-dot text-accent mr-2"></i>${prop.ubicacion}</p>
                </div>
                <button onclick="abrirModalDetalle('${prop.id}')" class="w-full bg-primary hover:bg-slate-800 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                    Ver Detalle
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function limpiarFiltros() {
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('filtroUbicacion').value = '';
    document.getElementById('filtroPrecioMax').value = '';
    cargarPropiedades();
}


// Abrir/Cerrar Modal de Carga de Inmuebles para Asesores
function abrirModalCargaInmueble() {
    const modal = document.getElementById('modalCargaInmueble');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function cerrarModalCargaInmueble() {
    const modal = document.getElementById('modalCargaInmueble');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Guardar nuevo inmueble en Google Sheets vía Backend
async function guardarNuevoInmueble(event) {
    event.preventDefault();
    mostrarCarga(true);

    const payload = {
        accion: "crearInmueble",
        titulo: document.getElementById('nuevoTitulo').value,
        precio: document.getElementById('nuevoPrecio').value,
        tipo: document.getElementById('nuevoTipo').value,
        categoria: document.getElementById('nuevaCategoria').value,
        ubicacion: document.getElementById('nuevaUbicacion').value,
        habitaciones: document.getElementById('nuevasHabs').value,
        banos: document.getElementById('nuevosBanos').value,
        metros: document.getElementById('nuevosMetros').value,
        estacionamientos: document.getElementById('nuevosEst').value,
        imagenPrincipal: document.getElementById('nuevaFotoPrincipal').value,
        descripcion: document.getElementById('nuevaDescripcion').value
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        mostrarCarga(false);
        cerrarModalCargaInmueble();
        document.getElementById('formNuevoInmueble').reset();
        document.getElementById('mensajeExitoTexto').innerText = "¡El inmueble ha sido publicado y guardado en Google Sheets con éxito!";
        document.getElementById('modalExito').classList.remove('hidden');
        cargarPropiedades();
    } catch (error) {
        console.error("Error guardando inmueble:", error);
        mostrarCarga(false);
    }
}

// Calculadora Hipotecaria
function calcularHipoteca() {
    const valor = parseFloat(document.getElementById('sliderValor').value);
    const porcInicial = parseFloat(document.getElementById('sliderInicial').value);
    const plazoAnios = parseFloat(document.getElementById('sliderPlazo').value);

    document.getElementById('valPropiedadLabel').innerText = '$' + valor.toLocaleString();
    document.getElementById('valInicialLabel').innerText = porcInicial + '% ($' + (valor * porcInicial / 100).toLocaleString() + ')';
    document.getElementById('valPlazoLabel').innerText = plazoAnios + ' Años';

    const montoPrestamo = valor * (1 - porcInicial / 100);
    const tasaInteresMensual = 0.075 / 12;
    const numeroMeses = plazoAnios * 12;
    const cuota = (montoPrestamo * tasaInteresMensual * Math.pow(1 + tasaInteresMensual, numeroMeses)) / (Math.pow(1 + tasaInteresMensual, numeroMeses) - 1);

    document.getElementById('resultadoCuota').innerText = '$' + Math.round(cuota).toLocaleString();
}

function mostrarCarga(mostrar) {
    const modal = document.getElementById('modalCarga');
    if (mostrar) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function cerrarNotificaciones() {
    document.getElementById('modalExito').classList.add('hidden');
}

window.onload = () => {
    cargarPropiedades();
    calcularHipoteca();
};
