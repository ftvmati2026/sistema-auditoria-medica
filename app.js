let currentSheetId = '16wx9YDPOdGelHMtbwyOFatilAOHWrpgzVjr8Xn6fU9o';
let currentMonth = 'ENERO';

const todosLosMeses = [
    { clave: 'ENERO', nombre: 'Enero' },
    { clave: 'FEBRERO', nombre: 'Febrero' },
    { clave: 'MARZO', nombre: 'Marzo' },
    { clave: 'ABRIL', nombre: 'Abril' },
    { clave: 'MAYO', nombre: 'Mayo' },
    { clave: 'JUNIO', nombre: 'Junio' },
    { clave: 'JULIO', nombre: 'Julio' },
    { clave: 'AGOSTO', nombre: 'Agosto' },
    { clave: 'SEPTIEMBRE', nombre: 'Septiembre' },
    { clave: 'OCTUBRE', nombre: 'Octubre' },
    { clave: 'NOVIEMBRE', nombre: 'Noviembre' },
    { clave: 'DICIEMBRE', nombre: 'Diciembre' }
];

let sheetResponses = {}; // Guarda la respuesta en crudo de cada mes
let allData = [];
let chartInstance = null;
let currentStatusFilter = 'TODOS';
let currentSearchQuery = '';
let totalDesreguladas = 0; // Total de desreguladas del mes seleccionado (suma columna K)

// Nuevas variables globales para búsqueda global
let globalData = [];
let isLoadingGlobalData = false;

const sedesGlobales = [
    { id: '16wx9YDPOdGelHMtbwyOFatilAOHWrpgzVjr8Xn6fU9o', nombre: 'San Juan' },
    { id: '17FhJMhhK-lkW3_K6oDuUr_K3LDJz71oYg6R99_uGKF4', nombre: 'Salta' },
    { id: '1xGDGOSsexE7AWUicl4YBhF_SwtB-Y_bjAMR7o8ZqHcw', nombre: 'Protección Emerald' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Escuchadores de Campañas
    const campBtns = document.querySelectorAll('.camp-btn');
    campBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            campBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentSheetId = e.target.getAttribute('data-sheetid');
            actualizarTodo();
        });
    });

    // Escuchador de Actualizar
    const btnAct = document.getElementById('btn-actualizar');
    if (btnAct) {
        btnAct.addEventListener('click', () => {
            actualizarTodo();
        });
    }

    // Buscador
    document.getElementById('buscador').addEventListener('keyup', (e) => {
        currentSearchQuery = e.target.value.toLowerCase();
        aplicarFiltrosCombinados();
    });

    // Filtros de Estado
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentStatusFilter = e.target.getAttribute('data-filter');
                aplicarFiltrosCombinados();
            });
        });
    }

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            if (document.body.classList.contains('light-theme')) {
                themeIcon.innerText = 'dark_mode';
                themeToggle.style.color = '#000'; // Ajuste visual icon oscuro
            } else {
                themeIcon.innerText = 'light_mode';
                themeToggle.style.color = 'var(--text-main)';
            }
            // Re-renderizar grafico para actualizar los colores grid/textos
            if (chartInstance) {
                renderChart(allData);
            }
        });
    }

    // Modal Teresa Toggle
    const btnTeresa = document.getElementById('btn-teresa');
    const modalTeresa = document.getElementById('teresa-modal');
    const btnCerrarTeresa = document.getElementById('close-teresa');

    if (btnTeresa && modalTeresa) {
        btnTeresa.addEventListener('click', () => {
            abrirModalTeresa();
            modalTeresa.style.display = 'flex';
        });

        btnCerrarTeresa.addEventListener('click', () => {
            modalTeresa.style.display = 'none';
        });

        modalTeresa.addEventListener('click', (e) => {
            if (e.target === modalTeresa) modalTeresa.style.display = 'none';
        });
    }

    // Modal Asesores Toggle
    const btnAsesores = document.getElementById('btn-asesores');
    const modalAsesores = document.getElementById('asesores-modal');
    const btnCerrarAsesores = document.getElementById('close-asesores');

    if (btnAsesores && modalAsesores) {
        btnAsesores.addEventListener('click', () => {
            abrirModalAsesores();
        });

        btnCerrarAsesores.addEventListener('click', () => {
            modalAsesores.style.display = 'none';
        });

        modalAsesores.addEventListener('click', (e) => {
            if (e.target === modalAsesores) modalAsesores.style.display = 'none';
        });
    }

    // Reloj en tiempo real
    setInterval(actualizarReloj, 1000);
    actualizarReloj();

    // Arranque Inicial
    actualizarTodo();
});

function actualizarReloj() {
    const now = new Date();

    // Actualizar Reloj Split-flap
    const h1 = document.getElementById('flap-h1');
    if (h1) {
        // En formato 24hs
        const horas = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const sec = String(now.getSeconds()).padStart(2, '0');

        if (h1.innerText !== horas[0]) h1.innerText = horas[0];
        const h2 = document.getElementById('flap-h2');
        if (h2.innerText !== horas[1]) h2.innerText = horas[1];
        const m1 = document.getElementById('flap-m1');
        if (m1.innerText !== min[0]) m1.innerText = min[0];
        const m2 = document.getElementById('flap-m2');
        if (m2.innerText !== min[1]) m2.innerText = min[1];
        const s1 = document.getElementById('flap-s1');
        if (s1.innerText !== sec[0]) s1.innerText = sec[0];
        const s2 = document.getElementById('flap-s2');
        if (s2.innerText !== sec[1]) s2.innerText = sec[1];
    }

    // Actualizar Calendario Madera
    const calDay = document.getElementById('cal-day');
    if (calDay) {
        const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

        const diaTexto = dias[now.getDay()];
        const fechaNum = String(now.getDate()).padStart(2, '0');
        const mesTexto = meses[now.getMonth()];

        if (calDay.innerText !== diaTexto) calDay.innerText = diaTexto;
        const d1 = document.getElementById('cal-date-d1');
        if (d1.innerText !== fechaNum[0]) d1.innerText = fechaNum[0];
        const d2 = document.getElementById('cal-date-d2');
        if (d2.innerText !== fechaNum[1]) d2.innerText = fechaNum[1];
        const calMonth = document.getElementById('cal-month');
        if (calMonth.innerText !== mesTexto) calMonth.innerText = mesTexto;
    }
}

function toggleLoader(show) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}

function actualizarTodo() {
    toggleLoader(true);
    sheetResponses = {};
    let loadedCount = 0;
    const cacheBuster = new Date().getTime() + Math.random();

    loadGlobalDataBkg();

    // Hacemos 12 peticiones en simultaneo para descubrir cuales meses existen de verdad
    todosLosMeses.forEach((mesObj) => {
        const mes = mesObj.clave;
        const script = document.createElement('script');
        const callbackName = 'processSheet_' + mes;

        window[callbackName] = function (json) {
            sheetResponses[mes] = json;
            loadedCount++;
            checkFinish();
            delete window[callbackName];
            script.remove();
        };

        const url = `https://docs.google.com/spreadsheets/d/${currentSheetId}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${mes}&_=${cacheBuster}`;
        script.src = url;
        script.onerror = () => {
            sheetResponses[mes] = null;
            loadedCount++;
            checkFinish();
            script.remove();
        };
        document.body.appendChild(script);
    });

    function checkFinish() {
        if (loadedCount === 12) {
            processAllMonths();
        }
    }
}

function processAllMonths() {
    // La API de Google Sheets devuelve la pestaña N°1 SIEMPRE que pedis una que no existe.
    // Usualmente Enero es la pestaña #1.
    // Para identificar las bloqueadas sin que haya falsos positivos:
    // Comparamos los datos devolvidos de cada mes con los de ENERO. Si son IDÉNTICOS, significa que es la respuesta "por defecto" (no existe).

    let eneroDataStr = sheetResponses['ENERO'] && sheetResponses['ENERO'].table ? JSON.stringify(sheetResponses['ENERO'].table.rows) : null;
    let activeMonths = [];

    for (let i = 0; i < todosLosMeses.length; i++) {
        const mes = todosLosMeses[i].clave;
        // Si hay una respuesta de tabla válida para este mes
        if (sheetResponses[mes] && sheetResponses[mes].table) {
            if (mes === 'ENERO') {
                activeMonths.push(mes); // Enero siempre se considera activo a menos que no haya documento
            } else {
                const thisDataStr = JSON.stringify(sheetResponses[mes].table.rows);
                // Si la data del mes futuro es identica a la de Enero, significa que en realidad no existe.
                if (thisDataStr !== eneroDataStr && thisDataStr.length > 5) {
                    activeMonths.push(mes);
                }
            }
        }
    }

    // Si el mes que teníamos seleccionado antes ya no es válido, volvemos al último existente.
    if (!activeMonths.includes(currentMonth)) {
        currentMonth = activeMonths.length > 0 ? activeMonths[activeMonths.length - 1] : 'ENERO';
    }

    renderMonthTabs(activeMonths);
    processSelectedMonth();
}

function renderMonthTabs(activeMonths) {
    const monthTabsContainer = document.getElementById('month-tabs');
    if (!monthTabsContainer) return;

    monthTabsContainer.innerHTML = '';
    todosLosMeses.forEach(mes => {
        const btn = document.createElement('button');
        const isActive = activeMonths.includes(mes.clave);

        btn.className = 'tab-btn' + (mes.clave === currentMonth ? ' active' : '');
        btn.setAttribute('data-mes', mes.clave);
        btn.innerText = mes.nombre;

        if (!isActive) {
            // Estilo visual de "bloqueado" desde CSS
            btn.classList.add('disabled-tab');
            btn.title = "Aún no se ha creado u operado este mes en el Excel.";
        } else {
            // Botón habilitado
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#month-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                currentMonth = e.target.getAttribute('data-mes');
                processSelectedMonth();
            });
        }
        monthTabsContainer.appendChild(btn);
    });
}

function processSelectedMonth() {
    document.getElementById('mes-titulo').innerText = `Gestión de ${currentMonth}`;
    allData = [];
    totalDesreguladas = 0; // Resetear

    let json = sheetResponses[currentMonth];

    if (!json || json.status !== 'ok' || !json.table || !json.table.rows) {
        toggleLoader(false);
        renderMetrics([]);
        renderChart([]);
        renderTable([]);
        return;
    }

    // Columna K es el índice 10 (A=0, B=1, ... K=10)
    // Pero la API de Google Sheets puede devolver menos columnas si las últimas están vacías.
    // Buscamos por encabezado 'DESREGUL' primero; si no lo encontramos, usamos el índice 10.
    let desreguladaColIndex = 10; // Columna K por defecto (0-indexed)
    if (json.table.cols) {
        for (let c = 0; c < json.table.cols.length; c++) {
            const label = json.table.cols[c] && json.table.cols[c].label
                ? String(json.table.cols[c].label).toUpperCase().trim()
                : '';
            if (label.includes('DESREGUL')) {
                desreguladaColIndex = c;
                break;
            }
        }
    }

    let currentDate = "Sin fecha";
    const rows = json.table.rows;

    for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i].c;
        if (!rowData) continue;

        const getVal = (colIndex) => {
            if (rowData[colIndex] && rowData[colIndex].v !== null && rowData[colIndex].v !== undefined) {
                return String(rowData[colIndex].v).trim();
            }
            return '';
        };

        const getNumVal = (colIndex) => {
            if (rowData[colIndex] && rowData[colIndex].v !== null && rowData[colIndex].v !== undefined) {
                const n = parseFloat(rowData[colIndex].v);
                return isNaN(n) ? 0 : n;
            }
            return 0;
        };

        if (rowData.length < 4) continue;

        const col1 = getVal(1); // ASESOR
        const col3 = getVal(3); // CLIENTE/FECHA
        const col4 = getVal(4); // CATEGORIA

        // Ignorar encabezados
        if (col1.toUpperCase() === 'ASESOR' || col3.toUpperCase().includes('CLIENTE/FECHA')) {
            continue;
        }

        // Contar desreguladas independientemente de si la fila tiene Asesor o Cliente,
        // ya que a veces el total manual se coloca en filas vacías o de sólo fecha.
        if (rowData.length > desreguladaColIndex) {
            const desrVal = getVal(desreguladaColIndex);
            if (desrVal !== '' && desrVal.toUpperCase() !== 'DESREGULADAS') {
                // Si es numérico, sumamos el valor; si es texto (SI, X, etc.), contamos como 1
                const numericVal = parseFloat(desrVal);
                totalDesreguladas += isNaN(numericVal) ? 1 : numericVal;
            }
        }

        // Fila que es solo fecha
        if (col1 === '' && col3 !== '' && col4 === '') {
            currentDate = col3;
        }
        // Registro válido de cliente
        else if (col1 !== '' && col3 !== '') {
            const telefono = getVal(5);
            const observacion = getVal(6);
            const estado_auditor = getVal(7);
            const auditor = getVal(8);

            allData.push({
                fecha: currentDate,
                asesor: col1.toUpperCase(),
                cliente: col3.toUpperCase(),
                categoria: col4.toUpperCase(),
                telefono: telefono,
                observacion: observacion,
                estado_auditor: estado_auditor,
                auditor: auditor.toUpperCase()
            });
        }
    }

    document.getElementById('buscador').value = '';
    currentSearchQuery = '';

    // Primero, renderizamos las métricas y gráficos siempre con TODA la data (sin los filtros de búsqueda ni botones)
    renderMetrics(allData);
    renderChart(allData);

    // Luego, aplicamos los filtros solo a la tabla
    aplicarFiltrosCombinados();

    toggleLoader(false);
}

function aplicarFiltrosCombinados() {
    let filtered = allData;
    let isGlobalSearch = false;

    const buscadorEl = document.getElementById('buscador');
    // Mostrar un hint si esta cargando global data
    if (isLoadingGlobalData && currentSearchQuery) {
        buscadorEl.style.borderColor = "#f59e0b";
        buscadorEl.title = "Cargando búsqueda global desde Google Sheets. Aguarde un instante...";
    } else {
        buscadorEl.style.borderColor = "";
        buscadorEl.title = "";
    }

    if (currentSearchQuery && globalData.length > 0) {
        filtered = globalData;
        isGlobalSearch = true;
    }

    if (currentStatusFilter !== 'TODOS') {
        // DESREGULADAS es una métrica de planilla, no un filtro individual por cliente.
        // Al seleccionar ese filtro, mostramos todos los registros (sin filtrar la tabla)
        // ya que el dato viene de la columna K acumulada, no de campos por fila.
        if (currentStatusFilter !== 'DESREGULADA') {
            filtered = filtered.filter(d => d.categoria.includes(currentStatusFilter));
        }
    }

    if (currentSearchQuery) {
        filtered = filtered.filter(d => {
            return (
                d.cliente.toLowerCase().includes(currentSearchQuery) ||
                d.asesor.toLowerCase().includes(currentSearchQuery) ||
                d.telefono.includes(currentSearchQuery) ||
                d.categoria.toLowerCase().includes(currentSearchQuery) ||
                d.observacion.toLowerCase().includes(currentSearchQuery) ||
                d.auditor.toLowerCase().includes(currentSearchQuery)
            );
        });
    }

    // SOLO actualizamos la tabla para que los filtros no rompan las métricas de arriba ni el gráfico.
    renderTable(filtered, isGlobalSearch);
}

function getClassByCategoria(cat) {
    if (cat.includes('ACEPTADA')) return 'badge aceptada';
    if (cat.includes('RECHAZADA')) return 'badge rechazada';
    if (cat.includes('DEVUELTA')) return 'badge devuelta';
    if (cat.includes('CUOTA')) return 'badge cuota';
    if (cat.includes('PENDIENTE')) return 'badge pendiente';
    return 'badge'; // Default
}

function renderTable(dataArray, isGlobalSearch = false) {
    const tbody = document.getElementById('tabla-body');
    const thead = document.querySelector('table thead');
    const totRegistros = document.getElementById('tot-registros');

    tbody.innerHTML = '';
    
    let headerHtml = `<tr>
        <th>Fecha</th>
        <th>Asesor</th>
        <th>Cliente</th>
        <th>Teléfono</th>
        <th>Estado</th>
        <th>Auditor</th>
        <th>Observación / Estado Aud.</th>
    </tr>`;
    
    if (isGlobalSearch) {
        headerHtml = `<tr>
            <th>Sede / Mes</th>
            <th>Fecha</th>
            <th>Asesor</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Auditor</th>
            <th>Observación / Estado Aud.</th>
        </tr>`;
    }
    thead.innerHTML = headerHtml;

    if (dataArray.length === 0) {
        let cols = isGlobalSearch ? 8 : 7;
        tbody.innerHTML = `<tr><td colspan="${cols}" class="empty-state">No se encontraron clientes${isGlobalSearch ? ' en ninguna sede ni mes.' : ' o este mes está vacío en el Excel.'}</td></tr>`;
        totRegistros.innerText = `0 Registros`;
        return;
    }

    totRegistros.innerText = `${dataArray.length} Registros${isGlobalSearch ? ' en total (Global)' : ''}`;

    const renderLimit = Math.min(dataArray.length, 1000);

    for (let i = 0; i < renderLimit; i++) {
        const d = dataArray[i];
        const tr = document.createElement('tr');

        let observacionesHtml = `
            <div style="font-size:0.8rem">${d.observacion}</div>
            <div style="font-size:0.75rem; color: #8b5cf6; margin-top:4px;">${d.estado_auditor}</div>
        `;

        let extraTd = '';
        if (isGlobalSearch) {
            let colorSede = '#38bdf8';
            if (d.sedeNombre === 'San Juan') colorSede = '#8b5cf6';
            else if (d.sedeNombre === 'Protección Emerald') colorSede = '#10b981';
            
            extraTd = `<td>
                <div style="font-weight: 700; color: ${colorSede}; font-size: 0.85rem; text-transform: uppercase;">${d.sedeNombre}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${d.mes}</div>
            </td>`;
        }

        // Armar el label de estado
        tr.innerHTML = extraTd + `
            <td style="white-space: nowrap; font-size: 0.8rem; font-weight: 500;">${d.fecha}</td>
            <td style="font-weight: 600; color: #38bdf8;">${d.asesor}</td>
            <td style="font-weight: 500;">${d.cliente}</td>
            <td>${d.telefono}</td>
            <td><span class="${getClassByCategoria(d.categoria)}">${d.categoria}</span></td>
            <td>${d.auditor}</td>
            <td>${observacionesHtml}</td>
        `;
        tbody.appendChild(tr);
    }
}

function renderMetrics(dataArray) {
    let stats = {
        aceptadas: 0,
        rechazadas: 0,
        cuotas: 0,
        devueltas: 0,
        pendientes: 0
    };

    dataArray.forEach(d => {
        if (d.categoria.includes('ACEPTADA')) stats.aceptadas++;
        else if (d.categoria.includes('RECHAZADA')) stats.rechazadas++;
        else if (d.categoria.includes('CUOTA')) stats.cuotas++;
        else if (d.categoria.includes('DEVUELTA')) stats.devueltas++;
        else if (d.categoria.includes('PENDIENTE')) stats.pendientes++;
    });

    // Desreguladas: viene de la suma de la columna K, calculada en processSelectedMonth
    document.getElementById('tot-desreguladas').innerText = Math.round(totalDesreguladas);
    document.getElementById('tot-aceptadas').innerText = stats.aceptadas;
    document.getElementById('tot-rechazadas').innerText = stats.rechazadas;
    document.getElementById('tot-cuotas').innerText = stats.cuotas;
    document.getElementById('tot-devueltas').innerText = stats.devueltas;
    document.getElementById('tot-pendientes').innerText = stats.pendientes;
}

function renderChart(dataArray) {
    const ctx = document.getElementById('tendenciaChart').getContext('2d');
    const isLight = document.body.classList.contains('light-theme');

    const groupedByDate = {};
    dataArray.forEach(d => {
        const date = d.fecha;
        if (!groupedByDate[date]) {
            groupedByDate[date] = { ACEPTADA: 0, RECHAZADA: 0, CUOTA: 0, DEVUELTA: 0, PENDIENTE: 0 };
        }
        if (d.categoria.includes('ACEPTADA')) groupedByDate[date].ACEPTADA++;
        else if (d.categoria.includes('RECHAZADA')) groupedByDate[date].RECHAZADA++;
        else if (d.categoria.includes('CUOTA')) groupedByDate[date].CUOTA++;
        else if (d.categoria.includes('DEVUELTA')) groupedByDate[date].DEVUELTA++;
        else if (d.categoria.includes('PENDIENTE')) groupedByDate[date].PENDIENTE++;
    });

    const labels = Object.keys(groupedByDate);
    const dataAceptadas = labels.map(l => groupedByDate[l].ACEPTADA);
    const dataRechazadas = labels.map(l => groupedByDate[l].RECHAZADA);
    const dataCuotas = labels.map(l => groupedByDate[l].CUOTA);
    const dataDevueltas = labels.map(l => groupedByDate[l].DEVUELTA);
    const dataPendientes = labels.map(l => groupedByDate[l].PENDIENTE);

    if (chartInstance) {
        chartInstance.destroy();
    }

    Chart.defaults.color = isLight ? "#64748b" : "#94a3b8";
    Chart.defaults.font.family = "'Inter', sans-serif";

    const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Aceptadas',
                    data: dataAceptadas,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: isLight ? '#fff' : '#0b1120',
                    tension: 0.4
                },
                {
                    label: 'Rechazadas',
                    data: dataRechazadas,
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#f43f5e',
                    tension: 0.4
                },
                {
                    label: 'Cuotas',
                    data: dataCuotas,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#3b82f6',
                    tension: 0.4
                },
                {
                    label: 'Devueltas',
                    data: dataDevueltas,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#f59e0b',
                    tension: 0.4
                },
                {
                    label: 'Pendientes',
                    data: dataPendientes,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#8b5cf6',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                tooltip: {
                    backgroundColor: isLight ? '#ffffff' : '#1e293b',
                    titleColor: isLight ? '#0f172a' : '#f8fafc',
                    bodyColor: isLight ? '#475569' : '#e2e8f0',
                    borderColor: isLight ? '#cbd5e1' : '#334155',
                    borderWidth: 1,
                    padding: 12
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { stepSize: 1 }
                },
                x: {
                    grid: { color: gridColor, drawBorder: false }
                }
            }
        }
    });
}

function calcularDiasDesdeFicha(fechaStr) {
    if (!fechaStr || fechaStr.includes('Sin fecha')) return 0;

    // Asumimos formato corto: "04/03" o "04-03" o "04- 03"
    const partes = fechaStr.split(/[-\/]/);
    if (partes.length >= 2) {
        const dia = parseInt(partes[0].trim(), 10);
        const mes = parseInt(partes[1].trim(), 10);

        if (!isNaN(dia) && !isNaN(mes)) {
            // El año actual es 2026 como base estándar de las planillas
            const dateFicha = new Date(2026, mes - 1, dia);
            const now = new Date();
            // Diferencia en milisegundos a días
            const diffDias = Math.floor((now - dateFicha) / (1000 * 60 * 60 * 24));
            return diffDias > 0 ? diffDias : 0;
        }
    }
    return 0;
}

function abrirModalTeresa() {
    const modalTeresa = document.getElementById('teresa-modal');
    const tbody = document.getElementById('teresa-body');
    const totalDisplay = document.getElementById('teresa-total');
    if (!modalTeresa || !tbody) return;

    // Mostrar modal con estado de carga
    modalTeresa.style.display = 'flex';
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 3rem; text-align: center; color: var(--text-muted);">
        <div class="spinner" style="width: 30px; height: 30px; margin: 0 auto 15px auto;"></div>
        Consultando todas las sedes y meses en simultáneo... Esto puede tomar unos segundos.
    </td></tr>`;
    totalDisplay.innerText = 'Cargando...';

    const sedes = [
        { id: '16wx9YDPOdGelHMtbwyOFatilAOHWrpgzVjr8Xn6fU9o', nombre: 'San Juan' },
        { id: '17FhJMhhK-lkW3_K6oDuUr_K3LDJz71oYg6R99_uGKF4', nombre: 'Salta' },
        { id: '1xGDGOSsexE7AWUicl4YBhF_SwtB-Y_bjAMR7o8ZqHcw', nombre: 'Emerald' }
    ];

    let queryCount = 0;
    const totalQueries = sedes.length * todosLosMeses.length;
    let globalTeresaData = [];

    const cacheBuster = new Date().getTime() + Math.random();

    // Creamos promesas al estilo tradicional (JSONP forzado con script tag)
    sedes.forEach((sede) => {
        todosLosMeses.forEach((mesObj) => {
            const mes = mesObj.clave;
            const script = document.createElement('script');
            // Un callback unico para cada sede_mes
            const cbId = Math.floor(Math.random() * 999999);
            const callbackName = 'processTeresaGlobal_' + cbId;

            window[callbackName] = function (json) {
                analizarDatosTeresa(sede, mes, json);
                cleanAndCheck();
            };

            const url = `https://docs.google.com/spreadsheets/d/${sede.id}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${mes}&_=${cacheBuster}`;
            script.src = url;
            script.onerror = () => {
                cleanAndCheck();
            };
            document.body.appendChild(script);

            function cleanAndCheck() {
                queryCount++;
                delete window[callbackName];
                script.remove();
                if (queryCount === totalQueries) {
                    renderizarTablaGlobalTeresa();
                }
            }
        });
    });

    // Función interna para leer y sumar a la matriz principal
    // (Necesita el registro de "Enero" de la sede actual si queremos evitar "falsos eneros", 
    // pero para acelerar, buscamos la existencia real de la data con logica simplificada).
    function analizarDatosTeresa(sedeInfo, mesStr, json) {
        if (!json || json.status !== 'ok' || !json.table || !json.table.rows) return;

        // Determinar dinamicamente columna Teresa
        let teresaColIndex = -1;
        if (json.table.cols) {
            for (let c = 0; c < json.table.cols.length; c++) {
                if (json.table.cols[c] && json.table.cols[c].label) {
                    let label = String(json.table.cols[c].label).toUpperCase();
                    if (label.includes('LIBRET') || label.includes('RESPUESTA') || label.includes('TERESA')) {
                        teresaColIndex = c;
                        break;
                    }
                }
            }
        }
        if (teresaColIndex === -1 && json.table.cols && json.table.cols.length > 9) {
            teresaColIndex = 9;
        }
        if (teresaColIndex === -1) return;

        let currentDate = "Sin fecha";
        const rows = json.table.rows;

        // Evitador basico de "FALSO ENERO" (Google Sheets bug): 
        // Si no es enero, nos fijamos si hay columnas vacías extrañas o si la etiqueta esperada no cuadra.
        // Forma rápida: comprobando columnas de meses.
        let isPhantom = false;
        if (mesStr !== 'ENERO' && json.table.cols && json.table.cols.length >= 3) {
            let labelCol2 = String(json.table.cols[2].label).toUpperCase().trim();
            // Generalmente Enero dice "ENERO", entonces si la pestaña es Marzo y dice "ENERO", la skipeamos.
            if (labelCol2.includes('ENERO') && !mesStr.includes('ENERO')) {
                isPhantom = true;
            }
        }
        if (isPhantom) return;

        for (let i = 0; i < rows.length; i++) {
            const rowData = rows[i].c;
            if (!rowData || rowData.length < 4) continue;

            const getVal = (colIndex) => {
                if (rowData[colIndex] && rowData[colIndex].v !== null && rowData[colIndex].v !== undefined) {
                    return String(rowData[colIndex].v).trim();
                }
                return '';
            };

            const col1 = getVal(1); // ASESOR
            const col3 = getVal(3); // CLIENTE/FECHA
            const col4 = getVal(4); // CATEGORIA

            if (col1.toUpperCase() === 'ASESOR' || col3.toUpperCase().includes('CLIENTE/FECHA')) {
                continue;
            }

            if (col1 === '' && col3 !== '' && col4 === '') {
                currentDate = col3;
            } else if (col1 !== '' && col3 !== '') {
                const telefono = getVal(5);
                const teresaValue = getVal(teresaColIndex);

                if (teresaValue.toUpperCase().includes('TERESA')) {
                    globalTeresaData.push({
                        sede: sedeInfo.nombre,
                        mes: mesStr,
                        cliente: col3,
                        telefono: telefono,
                        asesor: col1,
                        anotacion: teresaValue,
                        fechaAnotada: currentDate,
                        diasDemora: calcularDiasDesdeFicha(currentDate)
                    });
                }
            }
        }
    }

    function renderizarTablaGlobalTeresa() {
        tbody.innerHTML = '';

        // Ordenamos por mayor número de días de demora, y luego por sede
        globalTeresaData.sort((a, b) => b.diasDemora - a.diasDemora || a.sede.localeCompare(b.sede));

        if (globalTeresaData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="padding: 3rem; text-align: center; color: var(--text-muted);">
                Excelente noticia: No hay ninguna libreta pendiente anotada con la palabra "TERESA" en absolutamente ninguna sede conectada. ¡Todo al día! ✨
            </td></tr>`;
            totalDisplay.innerText = "0";
            return;
        }

        globalTeresaData.forEach(d => {
            const tr = document.createElement('tr');

            let delayColor = 'var(--text-main)';
            if (d.diasDemora >= 5) delayColor = '#f43f5e';
            else if (d.diasDemora >= 3) delayColor = '#f59e0b';
            else delayColor = '#10b981';

            let sedeColor = '#38bdf8'; // Salta
            if (d.sede === 'San Juan') sedeColor = '#8b5cf6';
            if (d.sede === 'Emerald') sedeColor = '#10b981';

            tr.innerHTML = `
                <td style="font-weight: 700; color: ${delayColor}; font-size: 1.1rem; text-align: center;">
                    <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 16px;">timer</span> ${d.diasDemora} ${d.diasDemora === 1 ? 'Día' : 'Días'}
                </td>
                <td style="font-weight: 700; color: ${sedeColor};">${d.sede.toUpperCase()}</td>
                <td><span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted);">${d.mes}</span></td>
                <td style="font-weight: 600;">${d.cliente}</td>
                <td>${d.telefono}</td>
                <td style="color: var(--text-muted);">${d.asesor}</td>
                <td style="font-style: italic; color: #a78bfa;">${d.anotacion}</td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizamos el sumador final
        totalDisplay.innerText = globalTeresaData.length.toString();
    }
}

function loadGlobalDataBkg() {
    isLoadingGlobalData = true;
    globalData = [];
    let queryCount = 0;
    const totalQueries = sedesGlobales.length * todosLosMeses.length;
    const cacheBuster = new Date().getTime() + Math.random();
    
    sedesGlobales.forEach((sede) => {
        todosLosMeses.forEach((mesObj) => {
            const mes = mesObj.clave;
            const script = document.createElement('script');
            const cbId = Math.floor(Math.random() * 999999);
            const callbackName = 'processGlobal_' + cbId;
            
            window[callbackName] = function(json) {
                parseGlobalData(sede, mes, json);
                clean();
            };
            
            const url = `https://docs.google.com/spreadsheets/d/${sede.id}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${mes}&_=${cacheBuster}`;
            script.src = url;
            script.onerror = clean;
            document.body.appendChild(script);
            
            function clean() {
                queryCount++;
                delete window[callbackName];
                script.remove();
                if (queryCount === totalQueries) {
                    isLoadingGlobalData = false;
                    if (currentSearchQuery) aplicarFiltrosCombinados();
                }
            }
        });
    });
}

function parseGlobalData(sede, mesStr, json) {
    if (!json || json.status !== 'ok' || !json.table || !json.table.rows) return;
    
    let isPhantom = false;
    // Previene bug visual en Sheets donde devuelve el error fallback en Enero
    if (mesStr !== 'ENERO' && json.table.cols && json.table.cols.length >= 3) {
        let labelCol2 = String(json.table.cols[2].label).toUpperCase().trim();
        if (labelCol2.includes('ENERO') && !mesStr.includes('ENERO')) {
            isPhantom = true;
        }
    }
    if (isPhantom) return;

    let currentDate = "Sin fecha";
    const rows = json.table.rows;
    for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i].c;
        if (!rowData || rowData.length < 4) continue;
        const getVal = (colIndex) => {
            if (rowData[colIndex] && rowData[colIndex].v !== null && rowData[colIndex].v !== undefined) {
                return String(rowData[colIndex].v).trim();
            }
            return '';
        };

        const col1 = getVal(1); 
        const col3 = getVal(3); 
        const col4 = getVal(4); 

        if (col1.toUpperCase() === 'ASESOR' || col3.toUpperCase().includes('CLIENTE/FECHA')) continue;
        if (col1 === '' && col3 !== '' && col4 === '') {
            currentDate = col3;
        } else if (col1 !== '' && col3 !== '') {
            // Detectar columna DESREGULADAS para búsqueda global
            let desreguladaVal = '';
            if (json.table.cols) {
                for (let c = 0; c < json.table.cols.length; c++) {
                    const label = json.table.cols[c] && json.table.cols[c].label
                        ? String(json.table.cols[c].label).toUpperCase().trim()
                        : '';
                    if (label.includes('DESREGUL')) {
                        desreguladaVal = getVal(c);
                        break;
                    }
                }
            }
            globalData.push({
                sedeNombre: sede.nombre,
                sedeId: sede.id,
                mes: mesStr,
                fecha: currentDate,
                asesor: col1.toUpperCase(),
                cliente: col3.toUpperCase(),
                categoria: col4.toUpperCase(),
                telefono: getVal(5),
                observacion: getVal(6),
                estado_auditor: getVal(7),
                auditor: getVal(8).toUpperCase(),
                desregulada: desreguladaVal
            });
        }
    }
}

// ============================================================
// MODAL: ESTADÍSTICAS POR ASESOR
// ============================================================

let asesorSortCol = 'total';
let asesorSortDir = -1; // -1 = desc, 1 = asc
let asesorDataCache = [];
let asesorSedeActual = 'San Juan'; // Sede actualmente seleccionada en el modal
let asesorMesFiltro = 'GLOBAL';   // Mes actualmente seleccionado (GLOBAL = todos)

function abrirModalAsesores() {
    const modal = document.getElementById('asesores-modal');
    const buscador = document.getElementById('buscador-asesor');
    modal.style.display = 'flex';

    // Resetear buscador y sort
    buscador.value = '';
    asesorSortCol = 'total';
    asesorSortDir = -1;
    asesorMesFiltro = 'GLOBAL';

    // Detectar sede activa segun currentSheetId para pre-seleccionarla
    const sedeActual = sedesGlobales.find(s => s.id === currentSheetId);
    const nombreSedeDefault = sedeActual ? sedeActual.nombre : 'San Juan';
    asesorSedeActual = nombreSedeDefault;

    // Configurar listeners de botones de sede
    document.querySelectorAll('.asesor-sede-btn').forEach(btn => {
        btn.onclick = () => {
            asesorSedeActual = btn.getAttribute('data-sede');
            cambiarSedeAsesores(asesorSedeActual, asesorMesFiltro);
        };
    });

    // Configurar listeners de botones de mes
    document.querySelectorAll('.asesor-mes-btn').forEach(btn => {
        btn.onclick = () => {
            if (btn.disabled) return; // Ignorar clicks en meses deshabilitados
            asesorMesFiltro = btn.getAttribute('data-mes');
            cambiarSedeAsesores(asesorSedeActual, asesorMesFiltro);
        };
    });

    // Listener del buscador
    buscador.oninput = () => {
        renderTablaAsesores(asesorDataCache, buscador.value.trim().toLowerCase(), asesorMesFiltro);
    };

    // Listeners de ordenamiento en encabezados
    document.querySelectorAll('#asesores-table th.sortable').forEach(th => {
        th.onclick = () => {
            const col = th.getAttribute('data-col');
            if (asesorSortCol === col) {
                asesorSortDir *= -1;
            } else {
                asesorSortCol = col;
                asesorSortDir = -1;
            }
            renderTablaAsesores(asesorDataCache, buscador.value.trim().toLowerCase(), asesorMesFiltro);
        };
    });

    // Resetear seleccion visual de meses al GLOBAL
    actualizarBotonesMes('GLOBAL');

    // Cargar con la sede activa por defecto
    cambiarSedeAsesores(nombreSedeDefault, 'GLOBAL');
}

function actualizarBotonesMes(mesSeleccionado, colorActivo) {
    // colorActivo = { bg, color, border } según la sede seleccionada
    const cActivo = colorActivo || { bg: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: 'rgba(56,189,248,0.6)' };

    document.querySelectorAll('.asesor-mes-btn').forEach(btn => {
        if (btn.disabled) return; // No tocar botones deshabilitados
        const esActivo = btn.getAttribute('data-mes') === mesSeleccionado;
        if (esActivo) {
            btn.style.background = cActivo.bg;
            btn.style.color = cActivo.color;
            btn.style.border = '1px solid ' + cActivo.border;
            btn.style.fontWeight = '800';
        } else {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-muted)';
            btn.style.border = '1px solid var(--border-color)';
            btn.style.fontWeight = '700';
        }
    });
}

function habilitarBotonesMes(mesesConDatos) {
    // Habilita/deshabilita botones de mes según:
    // 1. Si el mes ya pasó o es el actual → habilitado siempre
    // 2. Si es futuro Y no tiene datos → deshabilitado
    const MESES_ORDEN = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                         'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const mesActualIndex = new Date().getMonth(); // 0-indexed: Ene=0, Mar=2, etc.

    document.querySelectorAll('.asesor-mes-btn').forEach(btn => {
        const dataMes = btn.getAttribute('data-mes');
        if (dataMes === 'GLOBAL') {
            btn.disabled = false;
            btn.style.opacity = '';
            btn.style.pointerEvents = '';
            return;
        }
        const idx = MESES_ORDEN.indexOf(dataMes);
        // Habilitado si: índice <= mes actual (ya pasó o es el corriente) O tiene datos
        const habilitado = idx <= mesActualIndex || mesesConDatos.has(dataMes);
        btn.disabled = !habilitado;
        btn.style.opacity = habilitado ? '' : '0.25';
        btn.style.pointerEvents = habilitado ? '' : 'none';
    });
}

function cambiarSedeAsesores(nombreSede, mesFiltro) {
    if (mesFiltro === undefined) mesFiltro = asesorMesFiltro;
    asesorSedeActual = nombreSede;
    asesorMesFiltro = mesFiltro;

    const buscador = document.getElementById('buscador-asesor');
    const subtitulo = document.getElementById('asesores-subtitulo');
    const loadingHint = document.getElementById('asesores-loading-hint');

    // Colores por sede (usados tanto para sede activa como para mes activo)
    const coloresSede = {
        'San Juan':           { bg: 'rgba(139,92,246,0.2)',  color: '#a78bfa', border: 'rgba(139,92,246,0.6)' },
        'Salta':              { bg: 'rgba(56,189,248,0.2)',  color: '#38bdf8', border: 'rgba(56,189,248,0.6)' },
        'Protección Emerald': { bg: 'rgba(16,185,129,0.2)', color: '#10b981', border: 'rgba(16,185,129,0.6)' }
    };
    const colorSede = coloresSede[nombreSede] || coloresSede['San Juan'];

    // --- Actualizar estilo visual de botones de SEDE ---
    document.querySelectorAll('.asesor-sede-btn').forEach(btn => {
        const esActivo = btn.getAttribute('data-sede') === nombreSede;
        if (esActivo) {
            btn.style.background  = colorSede.bg;
            btn.style.color       = colorSede.color;
            btn.style.border      = '1px solid ' + colorSede.border;
            btn.style.fontWeight  = '800';
        } else {
            btn.style.background  = 'transparent';
            btn.style.color       = 'var(--text-muted)';
            btn.style.border      = '1px solid var(--border-color)';
            btn.style.fontWeight  = '700';
        }
    });

    // --- Indicador de carga ---
    loadingHint.style.display = isLoadingGlobalData ? 'flex' : 'none';

    // --- Obtener TODOS los datos de la sede (sin filtro de mes) ---
    const todosDatosSede = globalData.filter(d => d.sedeNombre === nombreSede);

    // --- Determinar qué meses tienen datos en esta sede ---
    const mesesConDatos = new Set(todosDatosSede.map(d => d.mes));

    // --- Habilitar/deshabilitar botones de mes según datos y fecha actual ---
    habilitarBotonesMes(mesesConDatos);

    // --- Resaltar el mes activo (con el color de la sede) ---
    actualizarBotonesMes(mesFiltro, colorSede);

    // --- Aplicar filtro de mes si no es GLOBAL ---
    const datosFiltrados = mesFiltro === 'GLOBAL'
        ? todosDatosSede
        : todosDatosSede.filter(d => d.mes === mesFiltro);

    // --- Agrupar por asesor ---
    const mapaAsesores = {};
    datosFiltrados.forEach(d => {
        const nombre = d.asesor.trim();
        if (!nombre) return;
        if (!mapaAsesores[nombre]) {
            mapaAsesores[nombre] = { nombre, aceptadas: 0, rechazadas: 0, cuotas: 0, devueltas: 0, pendientes: 0, total: 0 };
        }
        const s = mapaAsesores[nombre];
        if (d.categoria.includes('ACEPTADA'))       { s.aceptadas++; s.total++; }
        else if (d.categoria.includes('RECHAZADA')) { s.rechazadas++; s.total++; }
        else if (d.categoria.includes('CUOTA'))     { s.cuotas++;    s.total++; }
        else if (d.categoria.includes('DEVUELTA'))  { s.devueltas++; s.total++; }
        else if (d.categoria.includes('PENDIENTE')) { s.pendientes++;s.total++; }
        else                                        { s.total++;               }
    });

    asesorDataCache = Object.values(mapaAsesores);

    // --- Subtítulo informativo ---
    const labelMes = mesFiltro === 'GLOBAL'
        ? 'Todos los meses'
        : mesFiltro.charAt(0) + mesFiltro.slice(1).toLowerCase();
    subtitulo.innerText = datosFiltrados.length > 0
        ? `${nombreSede}  ·  ${labelMes}  ·  ${datosFiltrados.length} registros`
        : `${nombreSede}  ·  ${labelMes}  ·  Sin datos (cargando o mes sin información)`;

    // --- Renderizar tabla ---
    buscador.value = '';
    renderTablaAsesores(asesorDataCache, '', mesFiltro);
}


function renderTablaAsesores(data, filtro, mesFiltro) {
    mesFiltro = mesFiltro || asesorMesFiltro;
    const tbody = document.getElementById('asesores-body');
    const footer = document.getElementById('asesores-footer');

    // Filtrar por búsqueda
    let lista = filtro
        ? data.filter(a => a.nombre.toLowerCase().includes(filtro))
        : [...data];

    // Ordenar
    lista.sort((a, b) => {
        const va = asesorSortCol === 'nombre' ? a.nombre : (a[asesorSortCol] ?? 0);
        const vb = asesorSortCol === 'nombre' ? b.nombre : (b[asesorSortCol] ?? 0);
        if (va < vb) return -1 * asesorSortDir;
        if (va > vb) return  1 * asesorSortDir;
        return 0;
    });

    // Actualizar íconos de sort en encabezados
    document.querySelectorAll('#asesores-table th.sortable').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        if (!icon) return;
        if (th.getAttribute('data-col') === asesorSortCol) {
            icon.innerHTML = asesorSortDir === -1 ? '&#8595;' : '&#8593;';
            th.style.opacity = '1';
        } else {
            icon.innerHTML = '&#8597;';
            th.style.opacity = '0.6';
        }
    });

    tbody.innerHTML = '';

    if (lista.length === 0) {
        // Generar mensaje contextual según el caso
        let mensajeVacio = '';
        const MESES_NOMBRES = {
            'ENERO':'Enero','FEBRERO':'Febrero','MARZO':'Marzo','ABRIL':'Abril',
            'MAYO':'Mayo','JUNIO':'Junio','JULIO':'Julio','AGOSTO':'Agosto',
            'SEPTIEMBRE':'Septiembre','OCTUBRE':'Octubre','NOVIEMBRE':'Noviembre','DICIEMBRE':'Diciembre'
        };
        const MESES_ORDEN = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                             'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
        const mesActualIdx = new Date().getMonth(); // 0=Ene, 2=Mar, etc.

        if (mesFiltro && mesFiltro !== 'GLOBAL') {
            const idx = MESES_ORDEN.indexOf(mesFiltro);
            if (idx > mesActualIdx) {
                // Mes futuro
                const nombreMes = MESES_NOMBRES[mesFiltro] || mesFiltro;
                mensajeVacio = `🗓️ Todavía no estamos en ${nombreMes}, por eso no existe información aún.`;
            } else if (filtro) {
                mensajeVacio = `🔍 No se encontró ningún asesor con "${filtro}" en ${MESES_NOMBRES[mesFiltro] || mesFiltro}.`;
            } else {
                mensajeVacio = `⚠️ Sin registros para ${MESES_NOMBRES[mesFiltro] || mesFiltro} en esta sede.`;
            }
        } else if (filtro) {
            mensajeVacio = `🔍 No se encontró ningún asesor con "${filtro}".`;
        } else {
            mensajeVacio = `⚠️ Sin datos disponibles para esta sede (cargando...)`;
        }

        tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="padding: 2.5rem; font-size: 0.95rem;">${mensajeVacio}</td></tr>`;
        footer.innerHTML = '';
        return;
    }

    // Totales generales
    let totAcep = 0, totRech = 0, totCuot = 0, totDev = 0, totPend = 0, totTotal = 0;

    lista.forEach(a => {
        // Fórmula: (Aceptadas + Cuotas) / (Aceptadas + Cuotas + Rechazadas + Devueltas) × 100
        // Las Pendientes se excluyen porque aún no tienen resultado definitivo
        const denominadorAsesor = a.aceptadas + a.cuotas + a.rechazadas + a.devueltas;
        const efectividad = denominadorAsesor > 0
            ? Math.round(((a.aceptadas + a.cuotas) / denominadorAsesor) * 100)
            : 0;
        let barColor = '#10b981';
        if (efectividad < 30) barColor = '#f43f5e';
        else if (efectividad < 60) barColor = '#f59e0b';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${a.nombre}</td>
            <td style="text-align:center; font-weight: 700; font-size: 1rem;">${a.total}</td>
            <td style="text-align:center;">
                <span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); padding:3px 10px; border-radius:20px; font-weight:700; font-size:0.85rem;">${a.aceptadas}</span>
            </td>
            <td style="text-align:center;">
                <span style="background:rgba(244,63,94,0.15); color:#f43f5e; border:1px solid rgba(244,63,94,0.3); padding:3px 10px; border-radius:20px; font-weight:700; font-size:0.85rem;">${a.rechazadas}</span>
            </td>
            <td style="text-align:center;">
                <span style="background:rgba(59,130,246,0.15); color:#3b82f6; border:1px solid rgba(59,130,246,0.3); padding:3px 10px; border-radius:20px; font-weight:700; font-size:0.85rem;">${a.cuotas}</span>
            </td>
            <td style="text-align:center;">
                <span style="background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3); padding:3px 10px; border-radius:20px; font-weight:700; font-size:0.85rem;">${a.devueltas}</span>
            </td>
            <td style="text-align:center;">
                <span style="background:rgba(139,92,246,0.15); color:#8b5cf6; border:1px solid rgba(139,92,246,0.3); padding:3px 10px; border-radius:20px; font-weight:700; font-size:0.85rem;">${a.pendientes}</span>
            </td>
            <td style="min-width:130px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="flex:1; background:rgba(255,255,255,0.08); border-radius:20px; height:8px; overflow:hidden;">
                        <div style="width:${efectividad}%; background:${barColor}; height:100%; border-radius:20px; transition:width 0.5s ease;"></div>
                    </div>
                    <span style="font-weight:700; font-size:0.8rem; color:${barColor}; min-width:34px;">${efectividad}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);

        totAcep += a.aceptadas;
        totRech += a.rechazadas;
        totCuot += a.cuotas;
        totDev  += a.devueltas;
        totPend += a.pendientes;
        totTotal += a.total;
    });

    // Footer con totales
    // Efectividad global con la misma fórmula: (Acep+Cuot) / (Acep+Cuot+Rech+Dev)
    const denominadorGlobal = totAcep + totCuot + totRech + totDev;
    const efecGeneral = denominadorGlobal > 0 ? Math.round(((totAcep + totCuot) / denominadorGlobal) * 100) : 0;
    footer.innerHTML = `
        <span style="color:var(--text-muted); margin-right:auto;">${lista.length} asesor${lista.length !== 1 ? 'es' : ''} encontrado${lista.length !== 1 ? 's' : ''}</span>
        <span style="font-weight:600;">Total: <strong>${totTotal}</strong></span>
        <span style="color:#10b981; font-weight:600;">✓ ${totAcep} Acep.</span>
        <span style="color:#f43f5e; font-weight:600;">✗ ${totRech} Rech.</span>
        <span style="color:#3b82f6; font-weight:600;">⊙ ${totCuot} Cuot.</span>
        <span style="color:#f59e0b; font-weight:600;">↩ ${totDev} Dev.</span>
        <span style="color:#8b5cf6; font-weight:600;">◷ ${totPend} Pend.</span>
        <span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.4); padding:4px 14px; border-radius:20px; font-weight:700;">Efectividad global: ${efecGeneral}%</span>
    `;
}
