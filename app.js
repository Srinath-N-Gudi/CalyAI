// ===== CalyAI - Smart Calendar Application =====

class CalyAI {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = this.loadEvents();
        this.userPreferences = this.loadPreferences();
        this.chatHistory = this.loadChatHistory();

        this.init();
    }

    init() {
        this.renderCalendar();
        this.setupEventListeners();
        this.renderUpcomingEvents();
        this.restoreChatHistory();
        this.autoFocusInput();
    }

    // ===== Local Storage =====
    loadEvents() {
        const stored = localStorage.getItem('calyai_events');
        return stored ? JSON.parse(stored) : [];
    }

    saveEvents() {
        localStorage.setItem('calyai_events', JSON.stringify(this.events));
        this.renderCalendar();
        this.renderUpcomingEvents();
    }

    loadPreferences() {
        const stored = localStorage.getItem('calyai_preferences');
        return stored ? JSON.parse(stored) : {
            workStart: '09:00',
            workEnd: '18:00',
            preferredTaskDuration: 60
        };
    }

    savePreferences() {
        localStorage.setItem('calyai_preferences', JSON.stringify(this.userPreferences));
    }

    loadChatHistory() {
        const stored = localStorage.getItem('calyai_chat');
        return stored ? JSON.parse(stored) : [];
    }

    saveChatHistory() {
        localStorage.setItem('calyai_chat', JSON.stringify(this.chatHistory));
    }

    // ===== Calendar Rendering =====
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            this.createDayElement(day, true, new Date(year, month - 1, day), calendarGrid);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            this.createDayElement(day, false, date, calendarGrid);
        }

        // Next month days
        const totalCells = calendarGrid.children.length;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let day = 1; day <= remainingCells; day++) {
            this.createDayElement(day, true, new Date(year, month + 1, day), calendarGrid);
        }
    }

    createDayElement(day, isOtherMonth, date, container) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';

        if (isOtherMonth) dayEl.classList.add('other-month');

        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }

        if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
            dayEl.classList.add('selected');
        }

        const dayEvents = this.getEventsForDate(date);
        if (dayEvents.length > 0) dayEl.classList.add('has-events');

        dayEl.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-events">
                ${dayEvents.slice(0, 3).map(event =>
            `<div class="event-dot" style="background: ${event.color}"></div>`
        ).join('')}
            </div>
        `;

        dayEl.addEventListener('click', () => {
            this.selectedDate = date;
            this.renderCalendar();
            this.handleDateClick(date);
        });

        container.appendChild(dayEl);
    }

    handleDateClick(date) {
        const dayEvents = this.getEventsForDate(date).sort((a, b) => a.startTime.localeCompare(b.startTime));

        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = date.toLocaleDateString('en-US', dateOptions);

        let message = `Here is your schedule for **${dateStr}**:\n\n`;

        if (dayEvents.length === 0) {
            message += "You have no events scheduled for this day. It's wide open! 🌟";
        } else {
            dayEvents.forEach(event => {
                message += `• **${event.startTime} - ${event.endTime}**: ${event.title} (${event.type})\n`;
            });
            message += `\nYou have ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''} scheduled.`;
        }

        // Add to chat history as an AI response
        this.chatHistory.push({
            role: 'assistant',
            content: message,
            timestamp: new Date().toISOString()
        });
        this.saveChatHistory();
        this.addAssistantMessage(message);
    }

    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
    }

    renderUpcomingEvents() {
        const upcomingList = document.getElementById('upcomingList');
        const upcoming = this.getUpcomingEvents(7);

        if (upcoming.length === 0) {
            upcomingList.innerHTML = '<div class="empty-state">No upcoming events</div>';
            return;
        }

        upcomingList.innerHTML = upcoming.map(event => {
            const eventDate = new Date(event.date);
            const dateStr = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="upcoming-event" data-event-id="${event.id}">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M15.71 15.18L12.61 13.33C12.07 13.01 11.63 12.24 11.63 11.61V7.51001" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        ${dateStr} • ${event.startTime} - ${event.endTime}
                    </div>
                </div>
            `;
        }).join('');

        upcomingList.querySelectorAll('.upcoming-event').forEach(el => {
            el.addEventListener('click', () => {
                const eventId = parseInt(el.dataset.eventId);
                const event = this.events.find(e => e.id === eventId);
                if (event) {
                    this.selectedDate = new Date(event.date);
                    this.renderCalendar();
                }
            });
        });
    }

    getUpcomingEvents(days) {
        const now = new Date();
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        return this.events
            .filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= now && eventDate <= future;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // ===== Event Listeners =====
    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            this.currentDate = new Date();
            this.selectedDate = new Date();
            this.renderCalendar();
        });

        // Chat functionality
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (message) {
                this.handleUserMessage(message);
                chatInput.value = '';
                this.autoResizeTextarea(chatInput);
            }
        });

        chatInput.addEventListener('input', (e) => {
            this.autoResizeTextarea(e.target);
        });

        // Example prompts
        document.querySelectorAll('.example-prompt').forEach(prompt => {
            prompt.addEventListener('click', () => {
                const text = prompt.textContent.replace(/['"]/g, '');
                chatInput.value = text;
                chatInput.focus();
            });
        });

        // Voice button
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.handleVoiceInput();
            });
        }

        // Clear chat
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear all chat history?')) {
                    this.chatHistory = [];
                    this.saveChatHistory();
                    this.clearChatMessages();
                }
            });
        }
    }

    handleVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        const voiceBtn = document.getElementById('voiceBtn');
        const chatInput = document.getElementById('chatInput');

        this.recognition.onstart = () => {
            this.isRecording = true;
            voiceBtn.classList.add('recording');
            chatInput.placeholder = 'Listening...';
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            this.autoResizeTextarea(chatInput);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.isRecording = false;
            voiceBtn.classList.remove('recording');
            chatInput.placeholder = 'Type a message...';
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            voiceBtn.classList.remove('recording');
            chatInput.placeholder = 'Type a message...';
            chatInput.focus();
        };

        this.recognition.start();
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    autoFocusInput() {
        const chatInput = document.getElementById('chatInput');
        setTimeout(() => chatInput.focus(), 100);
    }

    // ===== Chat Functionality =====
    async handleUserMessage(message) {
        this.addUserMessage(message);

        this.chatHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });
        this.saveChatHistory();

        this.showTypingIndicator();

        // Note: processWithAI is overridden by backend-client.js
        await this.processWithAI(message);

        this.hideTypingIndicator();
    }

    // Fallback AI processing (overridden by backend-client.js)
    async processWithAI(userMessage) {
        this.addAssistantMessage("I'm processing your request...");
    }

    addUserMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = 'message user';
        messageEl.innerHTML = `
            <div class="message-avatar">You</div>
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    addAssistantMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = 'message assistant';
        messageEl.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="message-content">${this.formatMessage(message)}</div>
        `;
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatMessage(message) {
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.classList.add('active');
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.classList.remove('active');
    }

    clearChatMessages() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
    }

    restoreChatHistory() {
        this.chatHistory.forEach(msg => {
            if (msg.role === 'user') {
                this.addUserMessage(msg.content);
            } else {
                this.addAssistantMessage(msg.content);
            }
        });
    }

    // ===== Helper Functions =====
    getEventColor(type) {
        const colors = {
            meeting: '#667eea',
            study: '#f5576c',
            workout: '#4facfe',
            task: '#fee140',
            routine: '#00f2fe',
            coding: '#764ba2'
        };
        return colors[type] || colors.task;
    }

    getAvailableSlotsForDay(date, options = {}) {
        const duration = options.duration || 60;
        const slots = [];
        const dayEvents = this.getEventsForDate(date);

        const workStart = this.userPreferences.workStart || '09:00';
        const workEnd = this.userPreferences.workEnd || '18:00';

        let currentTime = workStart;

        while (currentTime < workEnd) {
            const nextTime = this.addMinutes(currentTime, duration);
            const hasConflict = dayEvents.some(event => {
                return this.timesOverlap(currentTime, nextTime, event.startTime, event.endTime);
            });

            if (!hasConflict) {
                slots.push({ start: currentTime, end: nextTime });
            }

            currentTime = this.addMinutes(currentTime, 30);
        }

        return slots;
    }

    addMinutes(time, minutes) {
        const [hours, mins] = time.split(':').map(Number);
        const totalMins = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMins / 60);
        const newMins = totalMins % 60;
        return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
    }

    timesOverlap(start1, end1, start2, end2) {
        return start1 < end2 && end1 > start2;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CalyAI();
});
