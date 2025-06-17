document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const config = {
        workDays: [1, 2, 3, 4, 5], // 0=Sun, 1=Mon, 2=Tue...
        startTime: 9, 
        endTime: 17, 
        slotDuration: 60,
        daysToShow: 60,
    };

    // --- Get HTML Elements ---
    const dateSlotsContainer = document.getElementById('date-slots');
    const timeSlotsContainer = document.getElementById('time-slots');
    const quoteForm = document.getElementById('quoteForm');
    const selectedDateTimeField = document.getElementById('selectedDateTime');
    const appointmentDisplay = document.getElementById('appointment-display'); 

    // --- State Variables ---
    let selectedDate = null;
    let selectedDateText = '';
    let selectedTime = null;
    let selectedTimeText = '';

    // --- Core Functions ---
    const getBookedSlots = () => {
        return JSON.parse(localStorage.getItem('appointments')) || [];
    };
    const bookedSlots = getBookedSlots().map(appt => appt.preferredDate);

    const generateDateSlots = () => {
        dateSlotsContainer.innerHTML = '';
        const today = new Date();

        for (let i = 0; i < config.daysToShow; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            if (config.workDays.includes(date.getDay())) {
                const dateBtn = document.createElement('button');
                dateBtn.classList.add('slot-btn');
                const dateText = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                dateBtn.textContent = dateText;
                dateBtn.dataset.date = date.toISOString().split('T')[0];
                
                dateBtn.addEventListener('click', (e) => {
                    document.querySelectorAll('#date-slots .slot-btn').forEach(btn => btn.classList.remove('selected'));
                    e.target.classList.add('selected');
                    
                    selectedDate = e.target.dataset.date;
                    selectedDateText = dateText; 
                    selectedTime = null;
                    appointmentDisplay.textContent = 'Please select an available time below.'; 
                    generateTimeSlots(selectedDate);
                });

                dateSlotsContainer.appendChild(dateBtn);
            }
        }
    };

    const generateTimeSlots = (dateStr) => {
        timeSlotsContainer.innerHTML = '';
        
        // --- THE DEFINITIVE FIX ---
        // We now parse the date string manually to avoid all timezone issues.
        // This creates a date object that is guaranteed to be correct.
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const dayOfMonth = parseInt(parts[2], 10);
        const localDate = new Date(year, month, dayOfMonth);
        const dayOfWeek = localDate.getDay();

        if (!config.workDays.includes(dayOfWeek)) {
            timeSlotsContainer.innerHTML = '<p>Sorry, not a working day.</p>';
            return;
        }

        for (let hour = config.startTime; hour < config.endTime; hour++) {
            const timeStr = `${String(hour).padStart(2, '0')}:00`;
            const dateTimeStr = `${dateStr}T${timeStr}`;

            const timeBtn = document.createElement('button');
            timeBtn.classList.add('slot-btn');
            const timeText = new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            timeBtn.textContent = timeText;
            timeBtn.dataset.time = timeStr;

            if (bookedSlots.some(slot => slot.startsWith(dateTimeStr))) {
                timeBtn.disabled = true;
            }

            timeBtn.addEventListener('click', (e) => {
                document.querySelectorAll('#time-slots .slot-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedTime = e.target.dataset.time;
                selectedTimeText = timeText;

                appointmentDisplay.textContent = `${selectedDateText} at ${selectedTimeText}`;
            });

            timeSlotsContainer.appendChild(timeBtn);
        }
         if (timeSlotsContainer.childElementCount === document.querySelectorAll('#time-slots .slot-btn:disabled').length) {
            timeSlotsContainer.innerHTML = '<p>Sorry, no available time slots for this day.</p>';
        }
    };

    quoteForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!selectedDate || !selectedTime) {
            alert('Please select a date and time for your appointment.');
            return;
        }

        const fullDateTime = `${selectedDate}T${selectedTime}:00`;
        selectedDateTimeField.value = fullDateTime;

        const formData = new FormData(this);
        const newAppointment = {
            id: 'appt_' + Date.now(),
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            serviceType: formData.get('serviceType'),
            preferredDate: fullDateTime,
            message: formData.get('message'),
            status: 'Scheduled',
            submittedAt: new Date().toISOString()
        };
        const allAppointments = getBookedSlots();
        allAppointments.push(newAppointment);
        localStorage.setItem('appointments', JSON.stringify(allAppointments));

        const preferredDateText = appointmentDisplay.textContent; 
        const recipient = 'hayespounds@gmail.com';
        const subject = `New Quote Request from ${formData.get('fullName')} for ${formData.get('serviceType')}`;
        const body = `
A new estimate has been requested for: ${preferredDateText}.

Please reply to the customer at: ${formData.get('email')} or call them at ${formData.get('phone')} to confirm.

--- Customer Details ---
Full Name: ${formData.get('fullName')}
Phone: ${formData.get('phone')}
Email: ${formData.get('email')}

--- Appointment Details ---
Service Type: ${formData.get('serviceType')}
Requested Date: ${preferredDateText}

--- Message ---
${formData.get('message') || 'No message provided.'}
        `;
        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;

        alert("Your email app should now be open. After you send the email, your appointment will be requested.");
        
        generateTimeSlots(selectedDate);
    });

    // --- Initialize the Page ---
    generateDateSlots();
});

