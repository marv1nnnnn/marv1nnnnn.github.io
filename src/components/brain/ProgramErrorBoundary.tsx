'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  programId?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ProgramErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 [ERROR-BOUNDARY] Program crashed:', {
      programId: this.props.programId,
      error: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString()
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full bg-red-900 text-white p-4 flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-red-300">
              💥 Program Crashed
            </h2>
            <div className="bg-black/50 p-4 rounded-lg border border-red-500 mb-4">
              <p className="font-mono text-sm">
                Program ID: {this.props.programId || 'Unknown'}
              </p>
              <p className="font-mono text-sm text-red-300">
                Error: {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded border border-red-400 transition-colors"
            >
              🔄 Restart Program
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}