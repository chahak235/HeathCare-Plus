import React from 'react'
import VoiceAnalyzer from '../components/features/home/VoiceAnalyzer'
import { Container } from '../components/layout/Container'

const VoiceTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-medical-navy py-8">
      <Container>
        <div className="max-w-3xl mx-auto">
          <VoiceAnalyzer />
        </div>
      </Container>
    </div>
  )
}

export default VoiceTest
