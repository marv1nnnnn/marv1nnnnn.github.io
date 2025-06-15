'use client'

import React, { useState, useEffect } from 'react'
import { useChaos } from '@/contexts/ChaosProvider'

interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  location: string
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 72,
    condition: 'Sunny',
    humidity: 45,
    windSpeed: 8,
    location: 'Cyberspace'
  })
  const [isGlitching, setIsGlitching] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const { systemState, triggerSystemWideEffect, audio } = useChaos()

  const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Snowy', 'Foggy', 'Glitchy', 'Digital Rain', 'Cyber Storm', 'Data Fog']
  const locations = ['Cyberspace', 'The Matrix', 'GeoCities', 'AOL Dial-up Land', 'Y2K Zone', 'Netscape Valley', 'Windows 98 Heights', 'Dial-up Desert']
  const glitchyReadings = ['ERROR', '???', 'NaN', '∞', '42', 'NULL', 'UNDEFINED', 'CHAOS']

  const generateFakeWeather = (): WeatherData => {
    const isWeird = Math.random() < 0.3 * systemState.chaosLevel
    
    return {
      temperature: isWeird 
        ? Math.floor(Math.random() * 200) - 50 
        : Math.floor(Math.random() * 60) + 40,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: isWeird 
        ? Math.floor(Math.random() * 150) 
        : Math.floor(Math.random() * 80) + 20,
      windSpeed: isWeird 
        ? Math.floor(Math.random() * 100) 
        : Math.floor(Math.random() * 20),
      location: locations[Math.floor(Math.random() * locations.length)]
    }
  }

  const triggerGlitch = () => {
    setIsGlitching(true)
    audio.soundEffects.error()
    triggerSystemWideEffect('system-shock')
    
    const glitchInterval = setInterval(() => {
      setWeather({
        temperature: Math.random() * 999,
        condition: glitchyReadings[Math.floor(Math.random() * glitchyReadings.length)],
        humidity: Math.random() * 999,
        windSpeed: Math.random() * 999,
        location: 'SYSTEM CORRUPTED'
      })
    }, 100)

    setTimeout(() => {
      clearInterval(glitchInterval)
      setIsGlitching(false)
      setWeather(generateFakeWeather())
      setLastUpdated(new Date())
    }, 2000)
  }

  const refreshWeather = () => {
    if (Math.random() < 0.2) {
      triggerGlitch()
    } else {
      setWeather(generateFakeWeather())
      setLastUpdated(new Date())
      audio.soundEffects.click()
      triggerSystemWideEffect('rainbow-cascade')
    }
  }

  // Auto refresh with occasional glitches
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1 * systemState.chaosLevel) {
        triggerGlitch()
      } else {
        setWeather(generateFakeWeather())
        setLastUpdated(new Date())
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [systemState.chaosLevel])

  const getWeatherIcon = (condition: string) => {
    const iconMap: { [key: string]: string } = {
      'Sunny': '☀️',
      'Cloudy': '☁️',
      'Rainy': '🌧️',
      'Stormy': '⛈️',
      'Snowy': '❄️',
      'Foggy': '🌫️',
      'Glitchy': '📺',
      'Digital Rain': '💾',
      'Cyber Storm': '⚡',
      'Data Fog': '💻'
    }
    return iconMap[condition] || '🌍'
  }

  const formatValue = (value: number, unit: string) => {
    if (isGlitching) {
      return glitchyReadings[Math.floor(Math.random() * glitchyReadings.length)]
    }
    return `${Math.round(value)}${unit}`
  }

  return (
    <div className={`weather-widget ${isGlitching ? 'glitching' : ''}`}>
      <div className="widget-header">
        <h2 className="rainbow-text">🌤️ Y2K Weather Station 🌤️</h2>
        <button className="refresh-btn" onClick={refreshWeather}>
          🔄 Refresh
        </button>
      </div>

      <div className="weather-display">
        <div className="main-weather">
          <div className={`weather-icon ${isGlitching ? 'glitch-active' : ''}`}>
            {getWeatherIcon(weather.condition)}
          </div>
          <div className="temperature">
            <span className={`temp-value ${isGlitching ? 'error-text' : ''}`}>
              {formatValue(weather.temperature, '°F')}
            </span>
          </div>
          <div className={`condition ${isGlitching ? 'blink error-text' : ''}`}>
            {weather.condition}
          </div>
        </div>

        <div className="weather-details">
          <div className="detail-item">
            <span className="label">Humidity:</span>
            <span className={`value ${isGlitching ? 'error-text' : ''}`}>
              {formatValue(weather.humidity, '%')}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Wind:</span>
            <span className={`value ${isGlitching ? 'error-text' : ''}`}>
              {formatValue(weather.windSpeed, ' mph')}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Location:</span>
            <span className={`value ${isGlitching ? 'error-text blink' : ''}`}>
              {weather.location}
            </span>
          </div>
        </div>
      </div>

      <div className="widget-footer">
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
        <div className="disclaimer blink">
          ⚠️ Weather data may be inaccurate ⚠️
        </div>
      </div>

      <style jsx>{`
        .weather-widget {
          background: linear-gradient(135deg, #000080, #000040);
          border: 2px outset #4080ff;
          padding: 15px;
          color: white;
          font-family: 'Courier New', monospace;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(64, 128, 255, 0.3);
        }

        .weather-widget.glitching {
          animation: widgetGlitch 0.1s infinite;
          border-color: #ff0040;
        }

        @keyframes widgetGlitch {
          0%, 100% { transform: translate(0); filter: hue-rotate(0deg); }
          25% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
          50% { transform: translate(1px, -1px); filter: hue-rotate(180deg); }
          75% { transform: translate(-1px, 2px); filter: hue-rotate(270deg); }
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .widget-header h2 {
          font-size: 14px;
          margin: 0;
        }

        .refresh-btn {
          background: linear-gradient(135deg, #00aa00, #006600);
          border: 1px outset #00aa00;
          color: white;
          padding: 5px 10px;
          font-size: 10px;
          cursor: pointer;
          font-family: inherit;
          border-radius: 3px;
        }

        .refresh-btn:hover {
          background: linear-gradient(135deg, #00cc00, #008800);
          transform: scale(1.05);
        }

        .weather-display {
          margin-bottom: 15px;
        }

        .main-weather {
          text-align: center;
          margin-bottom: 15px;
        }

        .weather-icon {
          font-size: 48px;
          margin-bottom: 10px;
          animation: iconFloat 3s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(5deg); }
        }

        .temperature {
          margin-bottom: 5px;
        }

        .temp-value {
          font-size: 24px;
          font-weight: bold;
          color: #ffff00;
          text-shadow: 0 0 10px #ffff00;
        }

        .condition {
          font-size: 16px;
          color: #00ffff;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .weather-details {
          background: rgba(0, 0, 0, 0.3);
          border: 1px inset #4080ff;
          padding: 10px;
          border-radius: 5px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .label {
          color: #cccccc;
        }

        .value {
          color: #00ff00;
          font-weight: bold;
        }

        .widget-footer {
          text-align: center;
          font-size: 10px;
        }

        .last-updated {
          color: #cccccc;
          margin-bottom: 5px;
        }

        .disclaimer {
          color: #ff8000;
          font-size: 9px;
        }

        @media (max-width: 768px) {
          .widget-header {
            flex-direction: column;
            gap: 5px;
          }
          
          .weather-icon {
            font-size: 36px;
          }
          
          .temp-value {
            font-size: 20px;
          }
          
          .condition {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}

export default WeatherWidget