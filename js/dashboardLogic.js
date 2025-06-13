document.addEventListener('DOMContentLoaded', () => {
    const appointmentsList = document.getElementById('appointmentsList');
    const exportJsonBtn = document.getElementById('exportJson');
    const dashboardTitle = document.getElementById('dashboardTitle');
    
    // Admin Controls
    const adminControls = document.getElementById('adminControls');
    const filterDate = document.getElementById('filterDate');
    const filterService = document.getElementById('filterService');
    const clearFiltersBtn = document.getElementById('clearFilters');

    let allAppointments = [];
    let isAdmin = false;

    // --- Check for Admin Mode ---
    const checkAdminMode = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
            isAdmin = true;
            dashboardTitle.textContent = "Admin Dashboard: All Requests";
            adminControls.style.display = 'block';
        } else {
            isAdmin = false;
            dashboardTitle.textContent = "Your Scheduled Appointments";
            adminControls.style.display = 'none';
        }
    };


    // --- Load and Render Appointments ---
    const loadAppointments = () => {
        // In a real multi-user system, we'd filter by user. Here, we show all.
        const storedAppointments = JSON.parse(localStorage.getItem('appointments')) || [];
        allAppointments = storedAppointments;
        // In non-admin mode, we might want to filter, but for this project, we'll show all.
        renderAppointments(allAppointments);
    };
    
    const renderAppointments = (appointmentsToRender) => {
        appointmentsList.innerHTML = ''; // Clear current list

        if (appointmentsToRender.length === 0) {
            appointmentsList.innerHTML = '<p>No appointments scheduled yet. <a href="schedule.html">Book one now!</a></p>';
            return;
        }
        
        // Sorting: newest first
        appointmentsToRender.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        appointmentsToRender.forEach(appt => {
            const card = document.createElement('div');
            card.className = 'appointment-card';
            if (appt.status === 'Completed') {
                card.classList.add('completed');
            }
            
            const formattedDate = new Date(appt.preferredDate).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });

            let imageHtml = '';
            if (appt.imageData) {
                imageHtml = `<img src="${appt.imageData}" alt="Junk image" class="appointment-image">`;
            }

            let adminButtons = '';
            if (isAdmin) {
                adminButtons = `
                    <button class="btn btn-secondary complete-btn" data-id="${appt.id}">
                        ${appt.status === 'Completed' ? 'Mark as Scheduled' : 'Mark as Completed'}
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="appointment-details">
                    <h3>${appt.serviceType}</h3>
                    <p><strong>Client:</strong> ${appt.fullName}</p>
                    <p><strong>Contact:</strong> ${appt.email} | ${appt.phone}</p>
                    <p><strong>Requested Date:</strong> ${formattedDate}</p>
                    <p><strong>Status:</strong> <span class="status">${appt.status}</span></p>
                    ${appt.message ? `<p><strong>Message:</strong> ${appt.message}</p>` : ''}
                    <div class="appointment-actions">
                         <button class="btn delete-btn" data-id="${appt.id}">Delete</button>
                         ${adminButtons}
                    </div>
                </div>
                ${imageHtml}
            `;
            appointmentsList.appendChild(card);
        });
        
        // Add event listeners after rendering
        addEventListenersToButtons();
    };

    // --- Event Listeners for Buttons ---
    const addEventListenersToButtons = () => {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                deleteAppointment(id);
            });
        });

        if (isAdmin) {
             document.querySelectorAll('.complete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    toggleAppointmentStatus(id);
                });
            });
        }
    };

    // --- Appointment Management Functions ---
    const deleteAppointment = (id) => {
        if (confirm('Are you sure you want to delete this appointment?')) {
            const updatedAppointments = allAppointments.filter(appt => appt.id !== id);
            localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
            loadAppointments(); // Reload to reflect changes
        }
    };

    const toggleAppointmentStatus = (id) => {
        const appointment = allAppointments.find(appt => appt.id === id);
        if (appointment) {
            appointment.status = appointment.status === 'Completed' ? 'Scheduled' : 'Completed';
            localStorage.setItem('appointments', JSON.stringify(allAppointments));
            applyFilters();
        }
    };

    // --- Admin Filtering ---
    const applyFilters = () => {
        let filtered = [...allAppointments];

        const dateVal = filterDate.value;
        if (dateVal) {
            filtered = filtered.filter(appt => {
                const apptDate = appt.preferredDate.split('T')[0];
                return apptDate === dateVal;
            });
        }

        const serviceVal = filterService.value;
        if (serviceVal) {
             filtered = filtered.filter(appt => appt.serviceType === serviceVal);
        }

        renderAppointments(filtered);
    };

    filterDate.addEventListener('input', applyFilters);
    filterService.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', () => {
        filterDate.value = '';
        filterService.value = '';
        renderAppointments(allAppointments);
    });

    // --- Export to JSON ---
    exportJsonBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allAppointments, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "pounds_removal_appointments.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    // --- Initial Load ---
    checkAdminMode();
    loadAppointments();
});
