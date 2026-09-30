import { useEffect } from 'react'
import HeroSection from '../../../components/features/home/HeroSection.jsx'
import CategoryBentoSection from '../../../components/features/home/CategoryBentoSection.jsx'
import BestSellersSection from '../../../components/features/home/BestSellersSection.jsx'
import CustomAtelierSection from '../../../components/features/home/CustomAtelierSection.jsx'
import HowItWorksSection from '../../../components/features/home/HowItWorksSection.jsx'
import PartnerBakeriesSection from '../../../components/features/home/PartnerBakeriesSection.jsx'

export const HomePage = ({ onAddToCart, onNavigate }) => {
  useEffect(() => {
    document.documentElement.classList.add('snap-scroll-active')
    return () => {
      document.documentElement.classList.remove('snap-scroll-active')
    }
  }, [])

  return (
    <div className="home-page-wrapper w-full bg-[#fff4e9] min-h-screen pt-20">
      <div className="flex flex-col w-full">
        {/* 1. HERO SECTION */}
        <HeroSection onNavigate={onNavigate} />

        {/* 2. CATEGORY SHOWCASE */}
        <CategoryBentoSection />

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
