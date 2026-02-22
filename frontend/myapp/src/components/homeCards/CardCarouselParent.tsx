"use client";

import React from "react";
import { CardCarousel } from "@/components/ui/skiper-ui/card-carousel";

function CardCarouselParent() {
  const images = [
    { src: "/images/image1.png", alt: "Character Profile 1" },
    { src: "/images/image3.png", alt: "Character Profile 2" },
    { src: "/images/image4.png", alt: "Character Profile 3" },
    { src: "/images/image5.png", alt: "Character Profile 4" },
    { src: "/images/image1.png", alt: "Character Profile 5" },
    { src: "/images/image3.png", alt: "Character Profile 6" },
  ];

  return (
    <section className="relative w-full py-20 flex justify-center">
      <div className="w-full max-w-7xl h-[580px]">
        <CardCarousel
          images={images}
          title="Character Profiles"
          subtitle="AI-generated character personas from your stories"
          showPagination={true}
          autoplayDelay={2500}
        />
      </div>
    </section>
  );
}

export default CardCarouselParent;