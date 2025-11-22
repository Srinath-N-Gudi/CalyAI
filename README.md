# 🚀 CalyAI — Intelligent AI-Powered Calendar Scheduler

CalyAI is an AI-assisted calendar and task-scheduling system designed to simplify weekly planning.  
Users can describe their tasks naturally—through text or voice—and the system automatically interprets, organizes, and schedules them into available time slots.

CalyAI reduces manual planning effort by combining natural language understanding with intelligent time allocation.

---

## ✨ Features

### 🔹 AI-Powered Scheduling
CalyAI analyzes user input using LLMs (Gemini preferred, Grok optional) and converts it into structured tasks with durations, deadlines, and constraints.

### 🔹 Voice + Text Interaction
Users can:
- Add tasks using natural speech or text  
- Modify or remove existing tasks  
- Request summaries  
- Interact conversationally with the assistant  

### 🔹 Automatic Free-Slot Detection
The system identifies free periods in the user’s weekly calendar and places tasks intelligently without overlap.

### 🔹 Clean and Modern UI
- Minimal and intuitive user interface  
- Inspired by modern AI dashboard layouts  
- Responsive design with smooth interactions  

### 🔹 Flexible Backend Architecture
- Flask-based backend  
- Modular AI and scheduling pipeline  
- Easy to extend with additional LLMs or calendar integrations  

---

## 🧠 How CalyAI Works

1. User provides plans or tasks in natural language.  
2. The LLM extracts:
   - Task names  
   - Estimated durations  
   - Deadlines  
   - Constraints  
3. The scheduling engine analyzes the existing weekly layout.  
4. Tasks are automatically assigned to valid free time slots.  
5. The finalized schedule is rendered back into the calendar interface.

**Example Input**

I have classes from 9 AM to 3 PM this week, gym in the morning, and I need to complete my ML assignment before Friday.

**CalyAI Action**
- Maps recurring events  
- Identifies free periods  
- Allocates the assignment within available slots  
- Generates a structured weekly schedule  

---

## 🛠️ Tech Stack

### **Backend**
- Python  
- Flask  
- Gemini LLM API  

### **Frontend**
- HTML  
- CSS  
- JavaScript  

### **Core Modules**
- Natural Language Processing  
- Free-slot detection engine  
- Automated time allocation system  
- JSON-based internal event model  

---

```bash
git clone https://github.com/Srinath-N-Gudi/CalyAI.git
```
## Note
Make a .env and put your GEMINI API KEY
GEMINI_API_KEY = "your-key-here"

