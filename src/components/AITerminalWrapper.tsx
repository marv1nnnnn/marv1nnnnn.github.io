'use client'

import React from 'react'
import AITerminal from './AITerminal'

interface AITerminalWrapperProps {
  personalityId: string
}

export default function AITerminalWrapper({ personalityId }: AITerminalWrapperProps) {
  return <AITerminal personalityId={personalityId} />
}

// Pre-built terminal components for specific personalities
export const HackerAITerminal: React.FC = () => (
  <AITerminalWrapper personalityId="HACKER_AI" />
)

export const SageTerminal: React.FC = () => (
  <AITerminalWrapper personalityId="THE_SAGE" />
)

export const ChaosTerminal: React.FC = () => (
  <AITerminalWrapper personalityId="CHAOS_AI" />
)

export const PhilosopherTerminal: React.FC = () => (
  <AITerminalWrapper personalityId="THE_PHILOSOPHER" />
)

export const TechnoMysticTerminal: React.FC = () => (
  <AITerminalWrapper personalityId="TECHNO_MYSTIC" />
)