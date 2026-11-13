import { useEffect, useRef } from 'react'
import HeroSection from '../../../components/features/home/HeroSection.jsx'
import CategoryBentoSection from '../../../components/features/home/CategoryBentoSection.jsx'
import BestSellersSection from '../../../components/features/home/BestSellersSection.jsx'
import CustomAtelierSection from '../../../components/features/home/CustomAtelierSection.jsx'
import HowItWorksSection from '../../../components/features/home/HowItWorksSection.jsx'
import PartnerBakeriesSection from '../../../components/features/home/PartnerBakeriesSection.jsx'

export const HomePage = ({ onAddToCart, onNavigate }) => {
  const isScrollingRef = useRef(false)

  useEffect(() => {
    document.documentElement.classList.add('snap-scroll-active')

    const getSections = () => {
      return Array.from(document.querySelectorAll('.snap-section, footer'))
    }

    const getCurrentSectionIndex = (sections) => {
      const scrollY = window.scrollY
      const headerOffset = 95
      let bestIdx = 0
      let minDiff = Infinity

      sections.forEach((sec, idx) => {
        const targetScroll = idx === 0 ? 0 : Math.max(0, sec.getBoundingClientRect().top + scrollY - headerOffset)
        const diff = Math.abs(scrollY - targetScroll)
        if (diff < minDiff) {
          minDiff = diff
          bestIdx = idx
        }
      })
      return bestIdx
    }

    const handleWheel = (e) => {
      // Ignore very small trackpad micro-scrolls
      if (Math.abs(e.deltaY) < 18) return

      const sections = getSections()
      if (!sections.length) return

      if (isScrollingRef.current) {
        e.preventDefault()
        return
      }

      const currentIdx = getCurrentSectionIndex(sections)

      if (e.deltaY > 0) {
        // Scroll DOWN to the next section immediately
        if (currentIdx < sections.length - 1) {
          e.preventDefault()
          isScrollingRef.current = true
          const target = sections[currentIdx + 1]
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          setTimeout(() => {
            isScrollingRef.current = false
          }, 750)
        }
      } else if (e.deltaY < 0) {
        // Scroll UP to the previous section immediately
        if (currentIdx > 0) {
          e.preventDefault()
          isScrollingRef.current = true
          if (currentIdx - 1 === 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } else {
            const target = sections[currentIdx - 1]
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          setTimeout(() => {
            isScrollingRef.current = false
          }, 750)
        }
      }
    }

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      const sections = getSections()
      if (!sections.length) return
      const currentIdx = getCurrentSectionIndex(sections)

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (currentIdx < sections.length - 1) {
          e.preventDefault()
          sections[currentIdx + 1].scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (currentIdx > 0) {
          e.preventDefault()
          if (currentIdx - 1 === 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } else {
            sections[currentIdx - 1].scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.documentElement.classList.remove('snap-scroll-active')
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="home-page-wrapper w-full bg-[#fff0f5] min-h-screen">
      <div className="flex flex-col w-full">
        {/* 1. HERO SECTION */}
        <HeroSection onNavigate={onNavigate} />

        {/* 2. CATEGORY SHOWCASE */}
        <CategoryBentoSection onNavigate={onNavigate} />

        {/* 3. BEST SELLERS SECTION */}
        <BestSellersSection onAddToCart={onAddToCart} onNavigate={onNavigate} />

        {/* 4. CUSTOM CAKE SPOTLIGHT & AI IDEA GENERATOR */}
        <CustomAtelierSection onNavigate={onNavigate} />

        {/* 5. QUY TRÌNH & CAM KẾT YÊN TÂM */}
        <HowItWorksSection onNavigate={onNavigate} />

        {/* 6. TOP TIỆM BÁNH ĐỐI TÁC XUẤT SẮC */}
        <PartnerBakeriesSection onNavigate={onNavigate} />
      </div>
    </div>
  )
}

export default HomePage
