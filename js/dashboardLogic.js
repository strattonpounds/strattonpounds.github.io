document.addEventListener('DOMContentLoaded', () => {

    // --- PASSWORD PROTECTION LOGIC ---
    const correctPassword = 'texas'; // CHANGE THIS to your secret password!
    
    const passwordOverlay = document.getElementById('password-overlay');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmitBtn = document.getElementById('password-submit-btn');
    const mainContent = document.getElementById('main-content');

    const checkPassword = () => {
        if (passwordInput.value === correctPassword) {
            // Correct password: Hide overlay, show content, and run the app
            passwordOverlay.style.display = 'none';
            mainContent.style.display = 'block';
            initializeApp(); // This function contains all the original dashboard code
        } else {
            // Incorrect password: Flash a red border instead of using alert()
            passwordInput.classList.add('input-error');
            setTimeout(() => {
                passwordInput.classList.remove('input-error');
            }, 1000); // Remove the error class after 1 second
            passwordInput.value = '';
        }
    };

    passwordSubmitBtn.addEventListener('click', checkPassword);
    // Also allow pressing Enter to submit
    passwordInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            checkPassword();
        }
    });

    
    // --- DASHBOARD APP LOGIC ---
    // All of the original code is now wrapped in this function.
    // It will only run AFTER the password is correct.
    const initializeApp = () => {

        const appointmentsList = document.getElementById('appointmentsList');
        const exportJsonBtn = document.getElementById('exportJson');
        const dashboardTitle = document.getElementById('dashboardTitle');
        const adminControls = document.getElementById('adminControls');
        const filterDate = document.getElementById('filterDate');
        const filterService = document.getElementById('filterService');
        const clearFiltersBtn = document.getElementById('clearFilters');

        let allAppointments = [];

        const loadAppointments = () => {
            const storedAppointments = JSON.parse(localStorage.getItem('appointments')) || [];
            allAppointments = storedAppointments;
            renderAppointments(allAppointments);
        };
        
        const renderAppointments = (appointmentsToRender) => {
            appointmentsList.innerHTML = '';

            if (appointmentsToRender.length === 0) {
                appointmentsList.innerHTML = '<p>No appointments scheduled yet. <a href="schedule.html">Book one now!</a></p>';
                return;
            }
            
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
                             <button class="btn btn-secondary complete-btn" data-id="${appt.id}">
                                ${appt.status === 'Completed' ? 'Mark as Scheduled' : 'Mark as Completed'}
                            </button>
                        </div>
                    </div>
                `;
                appointmentsList.appendChild(card);
            });
            
            addEventListenersToButtons();
        };

        const addEventListenersToButtons = () => {
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const btn = e.target;
                    const id = btn.dataset.id;
                    
                    // Two-click delete confirmation logic
                    if (btn.classList.contains('delete-confirm')) {
                        deleteAppointment(id);
                    } else {
                        // First click: Change button to confirm state
                        btn.classList.add('delete-confirm');
                        btn.textContent = 'Confirm Delete?';
                        // Reset button if not clicked again after 3 seconds
                        setTimeout(() => {
                            if (btn.classList.contains('delete-confirm')) {
                                btn.classList.remove('delete-confirm');
                                btn.textContent = 'Delete';
                            }
                        }, 3000);
                    }
                });
            });

            document.querySelectorAll('.complete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    toggleAppointmentStatus(id);
                });
            });
        };

        // This function is now only called after confirmation
        const deleteAppointment = (id) => {
            allAppointments = allAppointments.filter(appt => appt.id !== id);
            localStorage.setItem('appointments', JSON.stringify(allAppointments));
            applyFilters(); 
        };

        const toggleAppointmentStatus = (id) => {
            const appointment = allAppointments.find(appt => appt.id === id);
            if (appointment) {
                appointment.status = appointment.status === 'Completed' ? 'Scheduled' : 'Completed';
                localStorage.setItem('appointments', JSON.stringify(allAppointments));
                applyFilters();
            }
        };

        const applyFilters = () => {
            let filtered = [...allAppointments];
            const dateVal = filterDate.value;
            if (dateVal) {
                filtered = filtered.filter(appt => appt.preferredDate.startsWith(dateVal));
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

        exportJsonBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allAppointments, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "pounds_removal_appointments.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });

        loadAppointments();
    };

});
