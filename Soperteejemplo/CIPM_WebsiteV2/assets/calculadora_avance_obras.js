document.addEventListener('DOMContentLoaded', () => {
    const presupuestoTotalInput = document.getElementById('presupuestoTotal');
    const presupuestoGastadoInput = document.getElementById('presupuestoGastado');
    const avanceFisicoInput = document.getElementById('avanceFisico');
    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinPrevistaInput = document.getElementById('fechaFinPrevista');
    const calcularBtn = document.getElementById('calcularAvance');
    const avanceFinancieroSpan = document.getElementById('avanceFinanciero');
    const estadoAvanceSpan = document.getElementById('estadoAvance');
    const fechaFinProyectadaSpan = document.getElementById('fechaFinProyectada');
    const ctx = document.getElementById('avanceChart').getContext('2d');

    let avanceChart;

    calcularBtn.addEventListener('click', () => {
        const presupuestoTotal = parseFloat(presupuestoTotalInput.value);
        const presupuestoGastado = parseFloat(presupuestoGastadoInput.value);
        const avanceFisico = parseFloat(avanceFisicoInput.value);
        const fechaInicio = new Date(fechaInicioInput.value);
        const fechaFinPrevista = new Date(fechaFinPrevistaInput.value);

        if (isNaN(presupuestoTotal) || isNaN(presupuestoGastado) || isNaN(avanceFisico) || !fechaInicio || !fechaFinPrevista) {
            alert('Por favor, ingresa todos los valores válidos.');
            return;
        }

        // Cálculo del Avance Financiero
        const avanceFinanciero = (presupuestoGastado / presupuestoTotal) * 100;
        avanceFinancieroSpan.textContent = `${avanceFinanciero.toFixed(2)}%`;

        // Determinación del Estado de Avance
        let estado = '';
        if (avanceFisico > avanceFinanciero) {
            estado = 'Atraso Financiero (más avance físico que gasto)';
            estadoAvanceSpan.style.color = 'orange';
        } else if (avanceFinanciero > avanceFisico) {
            estado = 'Atraso Físico (más gasto que avance físico)';
            estadoAvanceSpan.style.color = 'red';
        } else {
            estado = 'Equilibrado';
            estadoAvanceSpan.style.color = 'green';
        }
        estadoAvanceSpan.textContent = estado;

        // Cálculo de la Fecha de Fin Proyectada
        const diasTotalesPrevistos = (fechaFinPrevista - fechaInicio) / (1000 * 60 * 60 * 24);
        const diasTranscurridos = (new Date() - fechaInicio) / (1000 * 60 * 60 * 24);

        let fechaProyectada = 'N/A';
        if (avanceFisico > 0) {
            const diasParaCompletar = (diasTranscurridos / (avanceFisico / 100)) - diasTranscurridos;
            const fechaFinCalculada = new Date();
            fechaFinCalculada.setDate(fechaFinCalculada.getDate() + diasParaCompletar);
            fechaProyectada = fechaFinCalculada.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        fechaFinProyectadaSpan.textContent = fechaProyectada;

        // Actualizar o crear el gráfico
        if (avanceChart) {
            avanceChart.destroy();
        }
        avanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Avance Físico', 'Avance Financiero'],
                datasets: [{
                    label: '% de Avance',
                    data: [avanceFisico, avanceFinanciero],
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