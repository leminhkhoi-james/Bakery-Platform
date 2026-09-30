import {
  HOME_COMMITMENTS,
  HOME_CUSTOMER_REVIEWS,
} from '../../../mockData/customer/reviews.js'

export const CommitmentsAndReviewsSection = () => {
  return (
    <section className="py-20 bg-surface-container-low w-full">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* 4 Golden Commitments */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-label-md text-label-md text-secondary tracking-widest uppercase mb-2 block font-semibold">
              Triết Lý Thủ Công
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary">
              4 Cam Kết Vàng Từ Tiệm Bánh
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOME_COMMITMENTS.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-surface-bright shadow-sm flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mb-4">
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2">
                  {item.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Real Customer Stories */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="font-label-md text-label-md text-secondary tracking-widest uppercase mb-2 block font-semibold">
                Dấu Ấn Hạnh Phúc
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary">
                Khách Hàng Chia Sẻ Cảm Xúc
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <span className="material-symbols-outlined text-secondary text-2xl">
                favorite
              </span>
              <span className="font-label-lg text-label-lg text-on-surface">
                Đồng hành trong hơn 12.000 bữa tiệc năm 2024
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOME_CUSTOMER_REVIEWS.map((story) => (
              <div
                key={story.id}
                className="bg-surface-bright rounded-2xl p-6 shadow-sm flex flex-col"
              >
                <div className="aspect-video rounded-xl overflow-hidden mb-5 bg-surface-container">
                  <img
                    className="w-full h-full object-cover"
                    alt={story.author}
                    src={story.image}
                  />
                </div>
                <div className="flex items-center gap-1 text-secondary mb-3">
                  {[...Array(story.stars)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="font-body-md text-body-md text-on-surface mb-6 flex-1 italic">
                  {story.comment}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t-0 bg-surface-container/50 p-3 rounded-xl">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${story.initialsBg}`}
                  >
                    {story.initials}
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-primary font-bold">
                      {story.author}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {story.occasion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CommitmentsAndReviewsSection
