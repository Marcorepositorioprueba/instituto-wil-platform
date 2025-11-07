document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registro-form');
    const messageDiv = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');
    
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzfbA5oFHSVjGskn5b4ELeSfQLBuvv7kjrtRWinWB7P6FTRBdjSmRKmoEugaKHynUPB/exec';

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        messageDiv.style.display = 'none'; // Ocultar mensajes previos

        // --- Validación de Horas ---
        const horaEntrada = form.querySelector('#horaEntrada').value;
        const horaSalida = form.querySelector('#horaSalida').value;

        if (horaSalida <= horaEntrada) {
            messageDiv.textContent = 'La hora de salida debe ser posterior a la hora de entrada.';
            messageDiv.className = 'error';
            messageDiv.style.display = 'block';
            return; // Detiene el envío
        }

        // --- Lógica para los checkboxes ---
        const checkedGroups = form.querySelectorAll('input[name="grupos"]:checked');
        if (checkedGroups.length === 0) {
            messageDiv.textContent = 'Por favor, seleccione al menos un grupo.';
            messageDiv.className = 'error';
            messageDiv.style.display = 'block';
            return; // Detiene el envío si no se seleccionó ningún grupo
        }
        const gruposAtendidosValue = Array.from(checkedGroups).map(cb => cb.value).join(', ');
        
        // --- Formateo de Fecha para Google Sheets ---
        const fechaValue = form.querySelector('#fecha').value; // Formato: "YYYY-MM-DD"
        const parts = fechaValue.split('-'); // ["YYYY", "MM", "DD"]
        const dateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        const formattedDate = `${String(dateObj.getUTCDate()).padStart(2, '0')}/${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}/${dateObj.getUTCFullYear()}`;

        // --- Confirmación antes de enviar ---
        if (!confirm('¿Estás seguro de que deseas enviar este registro?')) {
            return; // El usuario canceló el envío
        }

        // --- Proceso de Envío ---
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        // Crear un objeto simple con los datos del formulario
        const data = {
            nombreMaestro: form.querySelector('#nombreMaestro').value,
            horaEntrada: horaEntrada, // Ya la tenemos de la validación
            horaSalida: horaSalida,   // Ya la tenemos de la validación
            fecha: formattedDate,     // Ya la tenemos formateada
            gruposAtendidos: gruposAtendidosValue // Ya lo tenemos de la lógica de checkboxes
        };

        // Enviar los datos como un string de texto plano (JSON).
        // Esto evita la solicitud de "pre-vuelo" (preflight) de CORS.
        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                messageDiv.textContent = '¡Registro guardado con éxito!';
                messageDiv.className = 'success';
                form.reset();
            } else {
                throw new Error(data.message || 'Ocurrió un error desconocido.');
            }
        })
        .catch(error => {
            messageDiv.textContent = `Error al enviar el registro: ${error.message}`;
            messageDiv.className = 'error';
        })
        .finally(() => {
            messageDiv.style.display = 'block';
            submitButton.disabled = false;
            submitButton.textContent = 'Registrar Jornada';
        });
    });
});