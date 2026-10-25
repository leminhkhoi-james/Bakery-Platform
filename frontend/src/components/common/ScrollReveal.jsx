import React, { useEffect, useRef, useState } from 'react'

/**
 * ScrollReveal Wrapper Component (WinkCake / Shopify Scroll Animation)
 * Smoothly reveals child elements as the user scrolls down the viewport.
 */
export const ScrollReveal = ({
  children,
  animation = 'fade-up', // 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom-in'
  delay = 0, // ms delay (e.g. 100, 200, 300)
  duration = 800, // ms duration
  threshold = 0.12, // IntersectionObserver threshold
  className = '',
}) => {
  const [isRevealed, setIsRevealed] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true)
          if (elementRef.current) {
            observer.unobserve(elementRef.current)
          }
        }
      },
      {
        threshold: threshold || 0.05,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [delay, threshold])

  const getAnimStyles = () => {
    const baseTransition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`

    if (!isRevealed) {
      switch (animation) {
        case 'fade-up':
          return {
            opacity: 0,
            transform: 'translate3d(0, 48px, 0)',
            transition: baseTransition,
          }
        case 'fade-in':
          return {
            opacity: 0,
            transform: 'translate3d(0, 0, 0)',
            transition: baseTransition,
          }
        case 'slide-left':
          return {
            opacity: 0,
            transform: 'translate3d(-48px, 0, 0)',
            transition: baseTransition,
          }
        case 'slide-right':
          return {
            opacity: 0,
            transform: 'translate3d(48px, 0, 0)',
            transition: baseTransition,
          }
        case 'zoom-in':
          return {
            opacity: 0,
            transform: 'scale(0.92)',
            transition: baseTransition,
          }
        default:
          return {
            opacity: 0,
            transform: 'translate3d(0, 48px, 0)',
            transition: baseTransition,
          }
      }
    }

    return {
      opacity: 1,
      transform: 'translate3d(0, 0, 0) scale(1)',
      transition: baseTransition,
    }
  }

  return (
    <div
      ref={elementRef}
      style={getAnimStyles()}
      className={`will-change-[opacity,transform] ${className}`}
    >
      {children}
    </div>
  )
}

export default ScrollReveal
