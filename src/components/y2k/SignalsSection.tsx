'use client'

import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { PROFILE } from '@/data/profile'

interface FormData {
  name: string
  email: string
  message: string
}

export default function SignalsSection() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>()
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      reset()
    }, 3000)
  }

  return (
    <section id="signals" className="signals">
      <motion.div
        className="section-container"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="section-header">
          <motion.h2
            className="section-title"
            initial={{ x: -20 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true }}
          >
            ━━━━━ SIGNALS ━━━━━━━━━━━━━━━━━━
          </motion.h2>
          <p className="section-subtitle">
            Send a message across the void
          </p>
        </div>

        <div className="content-grid">
          {/* Contact Info */}
          <motion.div
            className="info-box"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="box-title">[DIRECT CONTACT]</h3>

            <div className="contact-links">
              <a href={PROFILE.social.email} className="contact-link">
                <span className="bullet">[●]</span>
                <span>{PROFILE.social.email.replace('mailto:', '')}</span>
              </a>
              <a href={PROFILE.social.github} target="_blank" rel="noopener noreferrer" className="contact-link">
                <span className="bullet">[●]</span>
                <span>github.com/marv1nnnnn</span>
              </a>
              <a href={PROFILE.social.linkedin} target="_blank" rel="noopener noreferrer" className="contact-link">
                <span className="bullet">[●]</span>
                <span>linkedin.com/in/marv1nnnnn</span>
              </a>
            </div>

            <div className="status-badge">
              <div className="status-dot blink"></div>
              <div>
                <div className="status-label">[STATUS]</div>
                <div className="status-text">Open to opportunities</div>
              </div>
            </div>

            <motion.a
              href="#"
              className="resume-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>📄</span>
              <span>[DOWNLOAD RESUME]</span>
            </motion.a>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="form-box"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="box-title">[SEND MESSAGE]</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">[NAME]</label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: 'Name is required' })}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">[ERROR: {errors.name.message}]</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">[EMAIL]</label>
                <input
                  type="email"
                  id="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">[ERROR: {errors.email.message}]</span>}
              </div>

              <div className="form-group">
                <label htmlFor="message">[MESSAGE]</label>
                <textarea
                  id="message"
                  rows={6}
                  {...register('message', { required: 'Message is required' })}
                  className={errors.message ? 'error' : ''}
                />
                {errors.message && <span className="error-message">[ERROR: {errors.message.message}]</span>}
              </div>

              <motion.button
                type="submit"
                className="submit-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>[TRANSMIT]</span>
                <span className="arrow">→</span>
              </motion.button>

              {submitted && (
                <motion.div
                  className="success-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  [✓ MESSAGE TRANSMITTED]
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      </motion.div>

      <style jsx>{`
        .signals {
          min-height: 100vh;
          background: #000000;
          padding: 100px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .section-container {
          width: 100%;
          max-width: 1400px;
        }

        .section-header {
          margin-bottom: 60px;
          text-align: left;
        }

        .section-title {
          font-size: 36px;
          font-family: 'Courier New', monospace;
          color: #00FF00;
          margin: 0 0 15px 0;
          letter-spacing: 2px;
          text-shadow: 2px 2px 0 rgba(0, 255, 0, 0.3);
        }

        .section-subtitle {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          letter-spacing: 0.5px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .info-box,
        .form-box {
          background: rgba(0, 255, 0, 0.05);
          border: 3px solid #00FF00;
          padding: 40px;
        }

        .box-title {
          font-family: 'Courier New', monospace;
          font-size: 18px;
          color: #00FF00;
          margin: 0 0 30px 0;
          letter-spacing: 1px;
        }

        .contact-links {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 30px;
        }

        .contact-link {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #00FF00;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s ease;
          letter-spacing: 0.5px;
        }

        .contact-link:hover {
          color: #00FFFF;
          text-shadow: 0 0 10px currentColor;
          transform: translateX(5px);
        }

        .bullet {
          color: #00FF00;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid rgba(0, 255, 0, 0.3);
          margin-bottom: 30px;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          background: #00FF00;
          border-radius: 50%;
          box-shadow: 0 0 10px #00FF00;
        }

        .status-label {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 1px;
        }

        .status-text {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          color: #FFFFFF;
        }

        .resume-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 15px 30px;
          background: transparent;
          border: 2px solid #00FF00;
          color: #00FF00;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: bold;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .resume-button:hover {
          background: #00FF00;
          color: #000000;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #00FF00;
          letter-spacing: 1px;
        }

        .form-group input,
        .form-group textarea {
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(0, 255, 0, 0.3);
          color: #FFFFFF;
          padding: 12px 16px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #00FF00;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }

        .form-group input.error,
        .form-group textarea.error {
          border-color: #FF00FF;
        }

        .error-message {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #FF00FF;
          letter-spacing: 0.5px;
        }

        .submit-button {
          background: transparent;
          border: 3px solid #00FF00;
          color: #00FF00;
          padding: 15px 30px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          transition: all 0.2s ease;
        }

        .submit-button:hover {
          background: #00FF00;
          color: #000000;
          box-shadow:
            0 0 20px rgba(0, 255, 0, 0.6),
            inset 0 0 10px rgba(0, 255, 0, 0.3);
        }

        .arrow {
          transition: transform 0.2s ease;
        }

        .submit-button:hover .arrow {
          transform: translateX(5px);
        }

        .success-message {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #00FF00;
          text-align: center;
          padding: 15px;
          border: 2px solid #00FF00;
          background: rgba(0, 255, 0, 0.1);
          letter-spacing: 1px;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
        }

        @media (max-width: 768px) {
          .signals {
            padding: 60px 20px;
          }

          .section-header {
            margin-bottom: 40px;
          }

          .section-title {
            font-size: 24px;
          }

          .section-subtitle {
            font-size: 14px;
          }

          .info-box,
          .form-box {
            padding: 25px;
            border-width: 2px;
          }

          .box-title {
            font-size: 16px;
          }

          .contact-link {
            font-size: 12px;
          }

          .status-text {
            font-size: 12px;
          }
        }
      `}</style>
    </section>
  )
}
