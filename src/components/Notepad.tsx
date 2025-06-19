'use client'

import React, { useState } from 'react'

export default function Notepad() {
  const [text, setText] = useState('Welcome to Notepad.exe\n\nStart typing your notes here...')

  return (
    <div className="w-full h-full bg-white flex flex-col font-mono">
      {/* Menu Bar */}
      <div className="bg-gray-200 border-b border-gray-300 px-2 py-1 text-xs">
        <div className="flex space-x-4">
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">File</span>
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">Edit</span>
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">Format</span>
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">View</span>
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">Help</span>
        </div>
      </div>
      
      {/* Text Area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 w-full p-3 border-none outline-none resize-none font-mono text-sm bg-white text-black"
        style={{ fontFamily: 'Consolas, "Courier New", monospace' }}
        placeholder="Type your text here..."
      />
      
      {/* Status Bar */}
      <div className="bg-gray-200 border-t border-gray-300 px-2 py-1 text-xs text-gray-600 flex justify-between">
        <span>Ln {text.split('\n').length}, Col {text.length - text.lastIndexOf('\n')}</span>
        <span>{text.length} characters</span>
      </div>
    </div>
  )
}