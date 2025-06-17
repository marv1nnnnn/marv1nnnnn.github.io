'use client'

import React, { useState } from 'react'

export default function Browser() {
  const [url, setUrl] = useState('http://www.chaos-os.net')
  const [currentPage, setCurrentPage] = useState('home')

  const pages = {
    home: {
      title: 'Welcome to Chaos OS Net!',
      content: (
        <div className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-black text-green-400 font-mono">
          <h1 className="text-3xl font-bold mb-4 animate-pulse">🌐 CHAOS OS NET 🌐</h1>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-green-400 p-4 rounded">
              <h2 className="text-xl mb-2">Latest News</h2>
              <p>- Y2K Bug Still Not Fixed</p>
              <p>- New GeoCities Templates!</p>
              <p>- AOL Dial-up Speed Record</p>
            </div>
            <div className="border border-cyan-400 p-4 rounded">
              <h2 className="text-xl mb-2">WebRing</h2>
              <p>&lt;&lt; Previous | Random | Next &gt;&gt;</p>
              <p className="text-yellow-400">Member #1337 of ChaosRing</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="animate-bounce">🔥 HOT SITES 🔥</p>
            <p>Best viewed in Netscape Navigator 4.0</p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col">
      {/* Browser Toolbar */}
      <div className="bg-gray-200 border-b border-gray-300 p-2">
        <div className="flex items-center space-x-2 mb-2">
          <button className="px-3 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 rounded">
            ← Back
          </button>
          <button className="px-3 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 rounded">
            Forward →
          </button>
          <button className="px-3 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 rounded">
            🔄 Refresh
          </button>
          <button className="px-3 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 rounded">
            🏠 Home
          </button>
        </div>
        
        {/* Address Bar */}
        <div className="flex items-center space-x-2">
          <span className="text-xs">Address:</span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-400 text-xs font-mono"
            style={{ backgroundColor: 'white' }}
          />
          <button className="px-3 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 rounded">
            Go!
          </button>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 bg-white overflow-auto">
        {pages[currentPage as keyof typeof pages]?.content || (
          <div className="p-6 text-center">
            <h1 className="text-2xl mb-4">404 - Page Not Found</h1>
            <p>The page you requested could not be found.</p>
            <p className="text-sm text-gray-500 mt-4">
              This is a simulated browser environment.
            </p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-200 border-t border-gray-300 px-2 py-1 text-xs text-gray-600 flex justify-between">
        <span>Ready</span>
        <span>Document: Done</span>
      </div>
    </div>
  )
}