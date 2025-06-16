// This function will run once the entire HTML document is loaded and ready.
document.addEventListener('DOMContentLoaded', () => {

    // --- PASSWORD PROTECTION ELEMENTS ---
    const passwordOverlay = document.getElementById('password-overlay');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmitBtn = document.getElementById('password-submit-btn');
    const mainContent = document.getElementById('main-content');
    
    // Set a default password. IMPORTANT: Change this to your own secret password!
    const correctPassword = 'texas'; 

    // This function checks the entered password.
    const checkPassword = () => {
        if (passwordInput.value === correctPassword) {
            // If correct, hide the password screen and show the main website content.
            passwordOverlay.style.display = 'none';
            mainContent.style.display = 'block';
            // Now that access is granted, run the main dashboard application logic.
            initializeApp(); 
        } else {
            // If incorrect, flash the input box red to give visual feedback.
            passwordInput.classList.add('input-error');
            // Remove the red flash after 1 second.
            setTimeout(() => {
                passwordInput.classList.remove('input-error');
            }, 1000);
            // Clear the incorrect password from the input box.
            passwordInput.value = '';
        }
    };

    // --- EVENT LISTENERS FOR PASSWORD SUBMISSION ---
    // Trigger the password check when the "Enter" button is clicked.
    passwordSubmitBtn.addEventListener('click', checkPassword);
    
    // Also trigger the password check if the user presses the 'Enter' key in the input field.
    passwordInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            checkPassword();
        }
    });

    
    // --- MAIN DASHBOARD APPLICATION LOGIC ---
    // This function contains all the code to make the dashboard work.
    // It is ONLY called after the correct password has been entered.
    function initializeApp() {

        // Get all the necessary elements from the dashboard page.
        const appointmentsList = document.getElementById('appointmentsList');
        const exportJsonBtn = document.getElementById('exportJson');
        const adminControls = document.getElementById('adminControls');
        const filterDate = document.getElementById('filterDate');
        const filterService = document.getElementById('filterService');
        const clearFiltersBtn = document.getElementById('clearFilters');

        let allAppointments = [];

        // Function to load appointments from the browser's local storage.
        const loadAppointments = () => {
            const storedAppointments = JSON.parse(localStorage.getItem('appointments')) || [];
            allAppointments = storedAppointments;
            renderAppointments(allAppointments);
        };
        
        // Function to display the appointments on the page.
        const renderAppointments = (appointmentsToRender) => {
            appointmentsList.innerHTML = ''; // Clear the list before re-drawing.

            if (appointmentsToRender.length === 0) {
                appointmentsList.innerHTML = '<p>No appointments scheduled yet. <a href="schedule.html">Book one now!</a></p>';
                return;
            }
            
            // Sort appointments to show the newest ones first.
            appointmentsToRender.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

            // Create an HTML card for each appointment.
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
            
            addEventListenersToButtons(); // Re-attach event listeners to the new buttons.
        };

        // Function to make the 'Delete' and 'Complete' buttons work.
        const addEventListenersToButtons = () => {
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const btn = e.target;
                    
                    if (btn.classList.contains('delete-confirm')) {
                        // If the button is already in "confirm" state, delete the appointment.
                        deleteAppointment(btn.dataset.id);
                    } else {
                        // On the first click, change the button to a "confirm" state.
                        btn.classList.add('delete-confirm');
                        btn.textContent = 'Confirm Delete?';
                        // Set a timeout to revert the button back to normal if not clicked again.
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
                    toggleAppointmentStatus(e.target.dataset.id);
                });
            });
        };

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

        // Attach event listeners to the filter controls.
        filterDate.addEventListener('input', applyFilters);
        filterService.addEventListener('change', applyFilters);
        clearFiltersBtn.addEventListener('click', () => {
            filterDate.value = '';
            filterService.value = '';
            renderAppointments(allAppointments);
        });

        // Make the "Export to JSON" button work.
        exportJsonBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allAppointments, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "pounds_removal_appointments.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });

        // Initial load of appointments when the app starts.
        loadAppointments();
    }
});
