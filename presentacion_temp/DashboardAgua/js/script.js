document.addEventListener('DOMContentLoaded', () => {
            // --- Configuration ---
            const CONFIG = {
                DB_NAME: 'hydroReadings',
                NUM_STUDENTS: 200,
                TARIFF_2025: {
                    base_fee: 233.68, // Cost for the first 20 cubic meters
                    ranges: [
                        { from: 21, to: 50, price: 37.01 },
                        { from: 51, to: 80, price: 40.90 },
                        { from: 81, to: 100, price: 42.55 },
                        { from: 101, to: Infinity, price: 44.80 }
                    ]
                }
            };

            const readingForm = document.getElementById('readingForm');
            const readingsTableBody = document.querySelector('#readingsTable tbody');
            const editModeInput = document.getElementById('editModeDate');
            const submitButton = document.getElementById('submitButton');
            const historyChartCtx = document.getElementById('historyChart').getContext('2d');
            const consumptionValueEl = document.getElementById('consumptionValue');
            let historyChartInstance;
            let currentPeriod = 'daily';
            let hydrometerGauge; // Declare gauge instance

            // --- Render Functions ---
            function renderAll() {
                const readings = getReadings();
                readings.sort((a, b) => new Date(a.date) - new Date(b.date));
                renderTable(readings);
                renderHistoryChart(readings);
                updateHydrometer(readings, currentPeriod);
                updateConsumptionComparison(readings);
            }

            function renderTable(readings) {
                readingsTableBody.innerHTML = '';
                if (readings.length === 0) {
                    readingsTableBody.innerHTML = '<tr><td colspan="4">No hay lecturas registradas.</td></tr>';
                    return;
                }

                for (let i = 0; i < readings.length; i++) {
                    const current = readings[i];
                    const previous = readings[i - 1];
                    const consumption = previous ? current.reading - previous.reading : 0;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${current.date}</td>
                        <td>${current.reading}</td>
                        <td>${consumption > 0 ? consumption : '-' }</td>
                        <td class="action-buttons">
                            <button class="edit-btn" onclick="editReading('${current.date}')">Editar</button>
                            <button class="delete-btn" onclick="deleteReading('${current.date}')">X</button>
                        </td>
                    `;
                    readingsTableBody.appendChild(row);
                }
            }

            function renderHistoryChart(readings) {
                if (historyChartInstance) {
                    historyChartInstance.destroy();
                }

                const labels = [];
                const data = [];

                for (let i = 1; i < readings.length; i++) {
                    const consumption = readings[i].reading - readings[i - 1].reading;
                    if (consumption >= 0) {
                        labels.push(readings[i].date);
                        data.push(consumption);
                    }
                }

                historyChartInstance = new Chart(historyChartCtx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Consumo (m³)',
                            data: data,
                            borderColor: 'var(--primary-color)',
                            backgroundColor: 'rgba(0, 90, 156, 0.5)',
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: { display: true, text: 'Fecha' }
                            },
                            y: {
                                title: { display: true, text: 'Consumo (m³)' },
                                beginAtZero: true
                            }
                        }
                    }
                });
            }

            function calculateTariff(consumptionM3) {
                let totalCost = 0;
                let remainingConsumption = consumptionM3;

                // Apply base fee for the first 20m3
                if (remainingConsumption > 0) {
                    totalCost += CONFIG.TARIFF_2025.base_fee;
                    remainingConsumption = Math.max(0, remainingConsumption - 20);
                }

                // Apply additional charges based on ranges
                for (const range of CONFIG.TARIFF_2025.ranges) {
                    if (remainingConsumption <= 0) break;

                    const consumptionInThisRange = Math.min(remainingConsumption, range.to - range.from + 1);
                    if (consumptionInThisRange > 0) {
                        totalCost += consumptionInThisRange * range.price;
                        remainingConsumption -= consumptionInThisRange;
                    }
                }
                return totalCost.toFixed(2);
            }

            function updateHydrometer(readings, period) {
                const consumptionStatusEl = document.getElementById('consumptionStatus');
                const periodButtons = document.querySelectorAll('.period-btn');

                periodButtons.forEach(btn => {
                    if (btn.dataset.period === period) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                
                if (readings.length < 2) {
                    consumptionValueEl.textContent = '--';
                    consumptionStatusEl.textContent = 'Datos insuficientes';
                    consumptionStatusEl.className = 'consumption-status';
                    if (hydrometerGauge) hydrometerGauge.set(0); // Reset gauge
                    return;
                }

                const dailyConsumptions = [];
                for (let i = 1; i < readings.length; i++) {
                    const date1 = new Date(readings[i-1].date);
                    const date2 = new Date(readings[i].date);
                    const diffTime = Math.abs(date2 - date1);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    if (diffDays > 0) {
                        const consumption = readings[i].reading - readings[i-1].reading;
                        dailyConsumptions.push(consumption / diffDays);
                    }
                }

                if (dailyConsumptions.length === 0) {
                    consumptionValueEl.textContent = '0.00';
                    consumptionStatusEl.textContent = 'Normal';
                    consumptionStatusEl.className = 'consumption-status status-normal';
                    if (hydrometerGauge) hydrometerGauge.set(0); // Reset gauge
                    return;
                }

                const avgDailyConsumption = dailyConsumptions.reduce((a, b) => a + b, 0) / dailyConsumptions.length;
                
                let displayValue = 0;
                let consumptionForStatus = 0;
                let maxGaugeValue = 150; // Default max value for the gauge

                switch(period) {
                    case 'daily':
                        displayValue = avgDailyConsumption;
                        consumptionForStatus = displayValue;
                        maxGaugeValue = 10; // Example max for daily
                        break;
                    case 'weekly':
                        displayValue = avgDailyConsumption * 7;
                        consumptionForStatus = displayValue;
                        maxGaugeValue = 70; // Example max for weekly
                        break;
                    case 'monthly':
                        displayValue = avgDailyConsumption * 30; // Approximation for status, actual calculation for tariff will be more precise
                        consumptionForStatus = displayValue;
                        maxGaugeValue = 150; // Example max for monthly
                        break;
                }

                // Update gauge value
                if (hydrometerGauge) {
                    hydrometerGauge.maxValue = maxGaugeValue;
                    hydrometerGauge.set(displayValue.toFixed(2)); // Set value with 2 decimal places
                }

                consumptionValueEl.textContent = displayValue.toFixed(2);

                const calculatedTariff = calculateTariff(consumptionForStatus);
                
                let statusClass = 'status-normal';
                let statusText = 'Normal';

                // Define thresholds for status based on monthly equivalent consumption
                // These thresholds can be adjusted as needed
                if (consumptionForStatus > 100) { // Example: >100 m³ per month is High
                    statusClass = 'status-alto';
                    statusText = 'Consumo Alto';
                } else if (consumptionForStatus > 50) { // Example: 51-100 m³ per month is Exceeded
                    statusClass = 'status-excedido';
                    statusText = 'Consumo Excedido';
                } else { // Example: 0-50 m³ per month is Normal
                    statusClass = 'status-normal';
                    statusText = 'Consumo Normal';
                }

                consumptionStatusEl.className = `consumption-status ${statusClass}`;
                consumptionStatusEl.innerHTML = `${statusText} <br> (Costo estimado: ${calculatedTariff})`;
            }

            function updateConsumptionComparison(readings) {
                const realDailyAvgEl = document.getElementById('realDailyAvg');
                const standardDailyAvgEl = document.getElementById('standardDailyAvg');
                
                const L_PER_STUDENT_MIN = 11;
                const L_PER_STUDENT_MAX = 18;

                // Standard calculation (Liters per student per day)
                const standardMinLitersPerStudent = L_PER_STUDENT_MIN;
                const standardMaxLitersPerStudent = L_PER_STUDENT_MAX;
                standardDailyAvgEl.innerHTML = `${standardMinLitersPerStudent.toFixed(2)} - ${standardMaxLitersPerStudent.toFixed(2)} <span class="unit">L/niño</span>`;

                // Real calculation (Liters per student per day)
                if (readings.length < 2) {
                    realDailyAvgEl.innerHTML = `<img src="imagagua/child_icon.png" alt="Niño" class="comparison-icon"> -- <span class="unit">L/niño</span>`;
                    return;
                }
                const dailyConsumptions = [];
                for (let i = 1; i < readings.length; i++) {
                    const date1 = new Date(readings[i-1].date);
                    const date2 = new Date(readings[i].date);
                    const diffTime = Math.abs(date2 - date1);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    if (diffDays > 0) {
                        const consumption = readings[i].reading - readings[i-1].reading;
                        dailyConsumptions.push(consumption / diffDays);
                    }
                }
                if (dailyConsumptions.length > 0) {
                    const avgDailyConsumptionM3 = dailyConsumptions.reduce((a, b) => a + b, 0) / dailyConsumptions.length;
                    const avgDailyConsumptionLitersPerStudent = (avgDailyConsumptionM3 * 1000) / CONFIG.NUM_STUDENTS;
                    realDailyAvgEl.innerHTML = `<img src="imagagua/child_icon.png" alt="Niño" class="comparison-icon"> ${avgDailyConsumptionLitersPerStudent.toFixed(2)} <span class="unit">L/niño</span>`;
                } else {
                    realDailyAvgEl.innerHTML = `<img src="imagagua/child_icon.png" alt="Niño" class="comparison-icon"> 0.00 <span class="unit">L/niño</span>`;
                }
            }


            // --- Data Management ---
            function getReadings() {
                return JSON.parse(localStorage.getItem(CONFIG.DB_NAME)) || [];
            }

            function saveReadings(readings) {
                localStorage.setItem(CONFIG.DB_NAME, JSON.stringify(readings));
                renderAll();
            }

            window.deleteReading = (date) => {
                if (confirm(`¿Seguro que quieres eliminar la lectura del ${date}?`)) {
                    let readings = getReadings();
                    readings = readings.filter(r => r.date !== date);
                    saveReadings(readings);
                }
            }
            
            window.editReading = (date) => {
                const readings = getReadings();
                const readingToEdit = readings.find(r => r.date === date);
                if (!readingToEdit) return;

                document.getElementById('readingDate').value = readingToEdit.date;
                document.getElementById('readingValue').value = readingToEdit.reading;
                editModeInput.value = date;
                submitButton.textContent = 'Actualizar';
            }

            // --- Event Listeners ---
            readingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const dateInput = document.getElementById('readingDate');
                const valueInput = document.getElementById('readingValue');
                const originalDate = editModeInput.value;

                if (!dateInput.value || isNaN(valueInput.valueAsNumber)) {
                    alert('Por favor, introduce una fecha y una lectura válidas.');
                    return;
                }
                
                const newReading = { date: dateInput.value, reading: valueInput.valueAsNumber };
                let readings = getReadings();

                if (originalDate) { // Edit Mode
                    if (originalDate !== newReading.date && readings.some(r => r.date === newReading.date)) {
                        alert('Ya existe una lectura para la nueva fecha seleccionada.');
                        return;
                    }
                    const index = readings.findIndex(r => r.date === originalDate);
                    if (index !== -1) {
                        readings[index] = newReading;
                    }
                } else { // Add Mode
                    if (readings.some(r => r.date === newReading.date)) {
                        alert('Ya existe una lectura para esta fecha.');
                        return;
                    }
                    readings.push(newReading);
                }

                saveReadings(readings);
                
                readingForm.reset();
                editModeInput.value = '';
                submitButton.textContent = 'Añadir';
            });

            document.querySelector('.period-selector').addEventListener('click', (e) => {
                if (e.target.classList.contains('period-btn')) {
                    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    currentPeriod = e.target.dataset.period;
                    const readings = getReadings();
                    readings.sort((a, b) => new Date(a.date) - new Date(b.date));
                    updateHydrometer(readings, currentPeriod);
                }
            });

            document.getElementById('calculateTariffBtn').addEventListener('click', () => {
                const consumptionInput = document.getElementById('simulationConsumption');
                const simulatedCostSpan = document.getElementById('simulatedCost');
                const consumption = parseFloat(consumptionInput.value);

                if (isNaN(consumption) || consumption < 0) {
                    alert('Por favor, introduce un consumo válido (número positivo).');
                    simulatedCostSpan.textContent = '--';
                    return;
                }

                const cost = calculateTariff(consumption);
                simulatedCostSpan.textContent = `${cost}`;
            });

            // --- Gauge Initialization ---
            const gaugeTarget = document.getElementById('hydrometerGaugeCanvas');
            const consumptionValueEl = document.getElementById('consumptionValue');

            const gaugeOptions = {
                angle: 0.15, // The span of the gauge arc
                lineWidth: 0.44, // The line width
                radiusScale: 1, // Relative radius
                pointer: {
                    length: 0.6, // Relative to gauge radius
                    strokeWidth: 0.035, // The thickness
                    color: '#000000' // Fill color
                },
                limitMax: false,     // If false, max value increases automatically if value is higher than maxValue
                limitMin: false,     // If true, the gauge will lower the minimum value if value is lower than minValue
                colorStart: '#6FADCF',   // Colors
                colorStop: '#8FC0DA',    // just experiment with them
                strokeColor: '#E0E0E0',  // to see which ones work for you
                generateGradient: true,
                highDpiSupport: true,     // High resolution support
                
                // Specific options for speed-test like gauge
                staticZones: [
                    {strokeStyle: "#30B32D", min: 0, max: 50}, // Green
                    {strokeStyle: "#FFDD00", min: 50, max: 100}, // Yellow
                    {strokeStyle: "#F03E3E", min: 100, max: 150}  // Red
                ],
                staticLabels: {
                    font: "10px sans-serif",  // Specifies font
                    labels: [0, 25, 50, 75, 100, 125, 150],  // Print labels at these values
                    color: "#000000",  // Optional: Label text color
                    fractionDigits: 0  // Optional: Numerical precision.
                }
            };
            hydrometerGauge = new Gauge(gaugeTarget).setOptions(gaugeOptions);
            hydrometerGauge.maxValue = 150; // Set max value for the gauge
            hydrometerGauge.set(0); // Set initial value
            console.log('Gauge initialized:', hydrometerGauge);

            function updateHydrometer(readings, period) {
                const consumptionStatusEl = document.getElementById('consumptionStatus');
                const periodButtons = document.querySelectorAll('.period-btn');

                periodButtons.forEach(btn => {
                    if (btn.dataset.period === period) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                
                if (readings.length < 2) {
                    consumptionValueEl.textContent = '--';
                    consumptionStatusEl.textContent = 'Datos insuficientes';
                    consumptionStatusEl.className = 'consumption-status';
                    if (hydrometerGauge) hydrometerGauge.set(0); // Reset gauge
                    return;
                }

                const dailyConsumptions = [];
                for (let i = 1; i < readings.length; i++) {
                    const date1 = new Date(readings[i-1].date);
                    const date2 = new Date(readings[i].date);
                    const diffTime = Math.abs(date2 - date1);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    if (diffDays > 0) {
                        const consumption = readings[i].reading - readings[i-1].reading;
                        dailyConsumptions.push(consumption / diffDays);
                    }
                }

                if (dailyConsumptions.length === 0) {
                    consumptionValueEl.textContent = '0.00';
                    consumptionStatusEl.textContent = 'Normal';
                    consumptionStatusEl.className = 'consumption-status status-normal';
                    if (hydrometerGauge) hydrometerGauge.set(0); // Reset gauge
                    return;
                }

                const avgDailyConsumption = dailyConsumptions.reduce((a, b) => a + b, 0) / dailyConsumptions.length;
                
                let displayValue = 0;
                let consumptionForStatus = 0;
                let maxGaugeValue = 150; // Default max value for the gauge

                switch(period) {
                    case 'daily':
                        displayValue = avgDailyConsumption;
                        consumptionForStatus = displayValue;
                        maxGaugeValue = 10; // Example max for daily
                        break;
                    case 'weekly':
                        displayValue = avgDailyConsumption * 7;
                        consumptionForStatus = displayValue;
                        maxGaugeValue = 70; // Example max for weekly
                        break;
                    case 'monthly':
                        displayValue = avgDailyConsumption * 30; // Approximation for status, actual calculation for tariff will be more precise
                        consumptionForStatus = displayValue;
                        maxGaugeValue = 150; // Example max for monthly
                        break;
                }

                // Update gauge value
                if (hydrometerGauge) {
                    hydrometerGauge.maxValue = maxGaugeValue;
                    hydrometerGauge.set(displayValue.toFixed(2)); // Set value with 2 decimal places
                }

                consumptionValueEl.textContent = displayValue.toFixed(2);

                const calculatedTariff = calculateTariff(consumptionForStatus);
                
                let statusClass = 'status-normal';
                let statusText = 'Normal';

                // Define thresholds for status based on monthly equivalent consumption
                // These thresholds can be adjusted as needed
                if (consumptionForStatus > 100) { // Example: >100 m³ per month is High
                    statusClass = 'status-alto';
                    statusText = 'Consumo Alto';
                } else if (consumptionForStatus > 50) { // Example: 51-100 m³ per month is Exceeded
                    statusClass = 'status-excedido';
                    statusText = 'Consumo Excedido';
                } else { // Example: 0-50 m³ per month is Normal
                    statusClass = 'status-normal';
                    statusText = 'Consumo Normal';
                }

                consumptionStatusEl.className = `consumption-status ${statusClass}`;
                consumptionStatusEl.innerHTML = `${statusText} <br> (Costo estimado: ${calculatedTariff})`;
            }

            // --- Initial Load ---
            renderAll();
        });