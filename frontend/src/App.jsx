import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AgreementDetailPage from './pages/AgreementDetailPage'
import ConfirmationPage from './pages/ConfirmationPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RecordingPage from './pages/RecordingScreen'
import ProcessingScreen from './pages/ProcessingScreen'
import TranscriptReviewScreen from './pages/TranscriptReviewScreen'
import ReviewPage from './pages/ReviewPage'
import SharePage from './pages/SharePage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/record" element={<RecordingPage />} />
        <Route path="/processing" element={<ProcessingScreen />} />
        <Route path="/transcript-review" element={<TranscriptReviewScreen />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/confirm/:id" element={<ConfirmationPage />} />
        <Route path="/agreement/:id" element={<AgreementDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
