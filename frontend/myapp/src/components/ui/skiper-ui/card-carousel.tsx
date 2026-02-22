"use client"

import React from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"
import "swiper/css/effect-coverflow"
import "swiper/css/pagination"
import "swiper/css/navigation"
import {
  Autoplay,
  EffectCoverflow,
  Navigation,
  Pagination,
} from "swiper/modules"

interface CarouselProps {
  images: { src: string; alt: string }[]
  autoplayDelay?: number
  showPagination?: boolean
  showNavigation?: boolean
  title?: string
  subtitle?: string
}

export const CardCarousel: React.FC<CarouselProps> = ({
  images,
  autoplayDelay = 2500,
  showPagination = true,
  showNavigation = true,
  title = "Character Profiles",
  subtitle = "AI-generated character personas from your stories",
}) => {
  const css = `
  .persona-swiper {
    width: 100%;
    padding: 20px 0 50px;
  }

  .persona-swiper .swiper-slide {
    width: 320px;
    height: 420px;
    border-radius: 20px;
    overflow: hidden;
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }

  .persona-swiper .swiper-slide-active {
    transform: scale(1.05);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  }

  .persona-swiper .swiper-slide:not(.swiper-slide-active) {
    opacity: 0.7;
  }

  .persona-swiper .swiper-slide img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 20px;
  }

  .persona-swiper .swiper-3d .swiper-slide-shadow-left,
  .persona-swiper .swiper-3d .swiper-slide-shadow-right {
    background-image: none !important;
    background: none !important;
  }

  .swiper-3d .swiper-slide-shadow-left {
    background-image: none;
  }
  .swiper-3d .swiper-slide-shadow-right {
    background: none;
  }

  .persona-swiper .swiper-pagination-bullet {
    background: #047857;
    opacity: 0.3;
    width: 8px;
    height: 8px;
    transition: all 0.3s ease;
  }

  .persona-swiper .swiper-pagination-bullet-active {
    opacity: 1;
    width: 24px;
    border-radius: 4px;
  }
  `

  return (
    <section className="space-y-4">
      <style>{css}</style>
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-6 px-6">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-700 mb-2">
            ✦ Showcase
          </p>
          <h3 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {title}
          </h3>
          <p className="mt-2 text-base text-gray-500 max-w-lg">
            {subtitle}
          </p>
        </div>

        {/* Carousel */}
        <div className="w-full">
          <Swiper
            className="persona-swiper"
            spaceBetween={30}
            autoplay={{
              delay: autoplayDelay,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            loop={true}
            slidesPerView={"auto"}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 120,
              modifier: 2,
              slideShadows: false,
            }}
            pagination={showPagination ? { clickable: true } : false}
            navigation={
              showNavigation
                ? {
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
                }
                : undefined
            }
            modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "20px",
                  overflow: "hidden",
                  background: "#f0ebe3",
                }}>
                  <Image
                    src={image.src}
                    width={640}
                    height={840}
                    className="rounded-[20px]"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    alt={image.alt}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}

export default CardCarousel