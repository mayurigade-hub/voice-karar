<div align="center">

# Voice Karar 🎙️

### AI-Powered Informal Business Agreement Digitizer for MSMEs

*A robust, full-stack platform that captures verbal business deals, uses multimodal AI to extract structured terms and draft contracts, resolves missing details dynamically, and generates secure confirmation links for counterparties.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5--Flash-8E75C2?style=flat-square&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

[🚀 Getting Started](#getting-started) · [🏗️ Architecture](#architecture) · [✨ Features](#features) · [📸 Screenshots](#screenshots) · [🌐 GitHub Repository](https://github.com/mayurigade-hub/voice-karar)

</div>

---

## 🧠 What is Voice Karar?

Voice Karar is a production-grade web application built to solve a critical issue faced by Indian MSMEs (Micro, Small and Medium Enterprises):

> **How do you digitize informal agreements made over phone calls, WhatsApp voice notes, or verbal chats without complex paperwork?**

It solves this by allowing business owners to input deals through **live voice recordings**, **audio file uploads**, or **manual text summaries**. The platform forwards inputs to a specialized AI Agent powered by **Gemini 2.5 Flash** to:
1. Automatically transcribe audio summary recordings.
2. Detect language inputs dynamically (supporting English, Hindi, and Marathi).
3. Extract key structured parameters (buyer/supplier names, product/service, quantity, price, delivery date, payment terms, and conditions).
4. Identify missing parameters and dynamically generate targeted follow-up questions.
5. Compile structured agreement terms into a beautifully drafted Markdown contract.

Once created, sellers generate secure confirmation links. Buyers open the link, review the digitized terms, and instantly **accept** or **request changes**, which updates the seller's dashboard in real time.

---

<a name="screenshots"></a>

## 📸 Screenshots

### 🌐 Welcome & Authentication
> *A clean, stamp-themed landing page utilizing vintage-ledger colors. Secure signup and login forms configure user sessions, storing JWT credentials locally.*

![Welcome Landing Page](./assets/Welcome-Page.png)

---

### 🎙️ Record Voice Summary
> *Live recording screen. Renders a central microphone button and a real-time reactive voice frequency wave visualizer. Features standard start/stop controls, elapsed recording timers, and unmount cleanups.*

![Voice Recorder](./assets/Record-Voice.png)

---

### 📂 Upload Call Recording
> *Drag-and-drop zone supporting MP3, WAV, and M4A uploads. Provides dynamic upload progress indicators alongside live file play/pause preview playbacks.*

![Upload Audio](./assets/Upload-Audio.png)

---

### ❓ Dynamic Follow-Up Questions
> *When critical terms (like payment terms or price) are missing from the audio summary, the AI generates target fields for clarification. The frontend guides creators through filling in exactly what was left out.*

![Follow-Up Questions](./assets/Follow-up-Questions.png)

---

### 📁 Agreement Preview & History Log
> *The digitized contract is displayed as editable form fields side-by-side with a legal draft. Includes an immutable audit history log tracking actions like 'created', 'viewed', 'confirmed', and 'needs_changes'.*

![Agreement Preview](./assets/Agreement-Preview.png)

---

### 👁️ Buyer Confirmation Portal
> *A public portal accessed via share tokens. The counterparty reviews terms, signs their name to accept, or submits revisions to request changes.*

![Buyer Confirmation](./assets/Buyer-Confirmation.png)

---

<a name="features"></a>

## ✨ Features

| Feature | Description |
|---|---|
| **Multi-modal Input** | Support for live voice recording, file upload, or manual text summaries |
| **Real-time Visualization** | Web Audio API visualizer rendering reactive microphone waveforms |
| **Multilingual AI** | Transcribes and detects English, Hindi, and Marathi summary deal details |
| **Information Extraction** | Automated parameter mapping for suppliers, products, quantities, prices, dates, and terms |
| **Dynamic Follow-ups** | Identifies missing information and prompts creators to fill in only what's missing |
| **Editable Preview** | Review and adjust extracted contract terms directly on-screen before sharing |
| **Fallback Parser** | Local regex extraction fallback guarantees system uptime if AI services fail |
| **Audit Trails** | Immutable historical log recording lifecycle stages (created, sent, viewed, signed) |
| **Secure Share Links** | Unique, cryptographic 24-character hex share tokens prevent link-scraping |
| **Real-time Status Feed** | Aggregated dashboard feeds counting active, pending, needs-changes, and signed deals |
| **WhatsApp Integration** | Quick action button pre-fills deal links and messages for easy WhatsApp dispatching |
| **JWT Session Security** | JWT cookie/headers authentication with password hashing (`bcryptjs`) |

---

<a name="architecture"></a>

## 🏗️ Architecture

### Agreement Creation & AI Extraction Flow

```
Creator speaks/uploads audio
      ↓
Base64 string sent via JSON POST to Backend
      ↓
Backend proxies request to AI Agent Server (Port 5001)
      ↓
Gemini 2.5 Flash performs STT & detects language
      ↓
Gemini extracts Structured JSON & evaluates missing fields
      ↓
Backend saves data, creates MongoDB entry, and issues ShareToken
      ↓
User answers gaps (if any) → contract drafted in Markdown
      ↓
Share link sent to buyer → buyer confirms → Creator Dashboard updates
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, React Router, Tailwind CSS, Axios, Lucide Icons |
| **Backend Orchestrator** | Node.js, Express.js, JWT, Mongoose, Joi (Validations) |
| **AI Agent Service** | Node.js, TypeScript, TSX, `@google/generative-ai` SDK |
| **LLM Model** | Gemini 2.5 Flash |
| **Database** | MongoDB Atlas |

---

## 📂 Directory Structure

```
voice-karar/
├── ai-agent/
│   ├── src/
│   │   ├── config/            # Language and styling rules
│   │   ├── lib/               # AI agent core & DB handlers
│   │   └── server.ts          # AI Agent Express server
│
├── backend/
│   ├── src/
│   │   ├── config/            # Environment configurations
│   │   ├── controllers/       # Auth, agreement, dashboard and AI controllers
│   │   ├── middleware/        # Auth verify & schema validator
│   │   ├── models/            # User, Agreement, Confirmation models
│   │   ├── routes/            # REST endpoint declarations
│   │   └── server.js          # App bootstrapper
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout & badges
│   │   ├── pages/             # Views (Welcome, Dash, Record, Preview, Buyer)
│   │   └── services/          # Axios API wrappers
│
└── README.md
```

---

<a name="getting-started"></a>

## 🚀 Getting Started

### Prerequisites

- Node.js `18+`
- MongoDB database (local or Atlas)
- Gemini API Key

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/mayurigade-hub/voice-karar.git
cd voice-karar

# 2. Install dependencies for all services (frontend, backend, and ai-agent)
npm run install:all

# 3. Configure environment variables
# Copy .env configuration files in respective directories
```

#### Backend Setup (`backend/.env`):
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signature_secret
PORT=5000
AI_AGENT_URL=http://localhost:5001
```

#### AI Agent Setup (`ai-agent/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5001
```

### Running Locally

```bash
# 4. Start all services concurrently (Frontend, Backend, and AI Agent)
npm run dev
```

* Frontend: `http://localhost:5173`
* Backend Server: `http://localhost:5000`
* AI Agent Server: `http://localhost:5001`

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

*Digitizing verbal business trust.*

**Voice Karar — Speak. Confirm. Trust.**

</div>
