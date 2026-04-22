document.addEventListener('DOMContentLoaded', () => {
    const municipioSelect = document.getElementById('municipio');
    const areaTematicaSelect = document.getElementById('areaTematica');
    const finanzasSection = document.getElementById('finanzasSection');
    const recaudacionActualInput = document.getElementById('recaudacionActual');
    const metaRecaudacionInput = document.getElementById('metaRecaudacion');
    const pesoRecaudacionInput = document.getElementById('pesoRecaudacion');
    const tramitesRealizadosInput = document.getElementById('tramitesRealizados');
    const tiempoPromedioTramiteInput = document.getElementById('tiempoPromedioTramite');
    const pesoTramitesInput = document.getElementById('pesoTramites');
    const calcularBtn = document.getElementById('calcularIndicadores');
    const indiceGlobalSpan = document.getElementById('indiceGlobal');
    const radarCtx = document.getElementById('radarChart').getContext('2d');
    const barCtx = document.getElementById('barChart').getContext('2d');

    let radarChart;
    let barChart;

    // Function to show/hide thematic sections
    const showThematicSection = (selectedArea) => {
        // Hide all sections first
        finanzasSection.style.display = 'none';
        // Add more sections here as they are added to the HTML

        // Show the selected section
        if (selectedArea === 'finanzas') {
            finanzasSection.style.display = 'block';
        }
    };

    // Initial display based on default selection
    showThematicSection(areaTematicaSelect.value);

    // Event listener for thematic area selection change
    areaTematicaSelect.addEventListener('change', (event) => {
        showThematicSection(event.target.value);
    });

    calcularBtn.addEventListener('click', () => {
        const recaudacionActual = parseFloat(recaudacionActualInput.value);
        const metaRecaudacion = parseFloat(metaRecaudacionInput.value);
        const pesoRecaudacion = parseFloat(pesoRecaudacionInput.value) / 100;
        const tramitesRealizados = parseInt(tramitesRealizadosInput.value);
        const tiempoPromedioTramite = parseFloat(tiempoPromedioTramiteInput.value);
        const pesoTramites = parseFloat(pesoTramitesInput.value) / 100;

        if (isNaN(recaudacionActual) || isNaN(metaRecaudacion) || isNaN(pesoRecaudacion) ||
            isNaN(tramitesRealizados) || isNaN(tiempoPromedioTramite) || isNaN(pesoTramites)) {
            alert('Por favor, ingresa todos los valores válidos.');
            return;
        }

        // Cálculo del Porcentaje de Recaudación (normalizado a 0-100)
        const porcentajeRecaudacion = Math.min((recaudacionActual / metaRecaudacion) * 100, 100);

        // Cálculo de Eficiencia en Trámites (normalizado a 0-100, asumiendo un valor óptimo)
        // Ejemplo: Si 100 trámites/hora es óptimo, y el tiempo promedio es 30 min (2 trámites/min = 120 trámites/hora)
        const eficienciaTramites = Math.min((tramitesRealizados / (tiempoPromedioTramite / 60)) / 1.2, 100); // Normalizado a 100

        // Cálculo del Índice Global Ponderado
        const indiceGlobal = (porcentajeRecaudacion * pesoRecaudacion) + (eficienciaTramites * pesoTramites);
        indiceGlobalSpan.textContent = `${indiceGlobal.toFixed(2)}%`;

        // Semaforización
        indiceGlobalSpan.classList.remove('semaforo-rojo', 'semaforo-amarillo', 'semaforo-verde');
        if (indiceGlobal < 50) {
            indiceGlobalSpan.classList.add('semaforo-rojo');
        } else if (indiceGlobal >= 50 && indiceGlobal < 80) {
            indiceGlobalSpan.classList.add('semaforo-amarillo');
        } else {
            indiceGlobalSpan.classList.add('semaforo-verde');
        }

        // Actualizar o crear el gráfico de Radar
        if (radarChart) {
            radarChart.destroy();
        }
        radarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['% Recaudación', 'Eficiencia Trámites'],
                datasets: [{
                    label: 'Indicadores de Gestión',
                    data: [porcentajeRecaudacion, eficienciaTramites],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: {
                            display: false
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });

        // Actualizar o crear el gráfico de Barras
        if (barChart) {
            barChart.destroy();
        }
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['% Recaudación', 'Eficiencia Trámites'],
                datasets: [{
                    label: 'Valores de Indicadores',
                    data: [porcentajeRecaudacion, eficienciaTramites],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    });
});