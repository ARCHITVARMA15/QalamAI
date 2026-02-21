// "use client"

// import React from 'react';
// import { CardCarousel } from '../ui/skiper-ui/card-carousel';

// function CardCarouselParent() {

//     const images =[
//         {src:'/images/image1.webp' , alt:'Image 1'},
//         {src:'/images/image2.webp' , alt:'Image2'},
//          {src:'/images/image2.webp' , alt:'Image3'},
//     ]
//   return (
//     <div >
//         <CardCarousel images={images} showPagination={false}/>
//     </div>
//   );
// }

// export default CardCarouselParent;



"use client";

import React from "react";
import { CardCarousel } from "@/components/ui/skiper-ui/card-carousel";

 function CardCarouselParent() {
  const images = [
    { src: "/images/image1.png", alt: "Card 1" },
    { src: "/images/image2.png", alt: "Card 2" },
    { src: "/images/image3.png", alt: "Card 3" },
    { src: "/images/image4.png", alt: "Card 4" },
    { src: "/images/image5.png", alt: "Card 5" },
    { src: "/images/image6.png", alt: "Card 6" },
  ];

  return (
    <section className="relative w-full py-24 flex justify-center">
      {/* Height is REQUIRED */}
      <div className="w-full max-w-7xl h-[520px]">
        <CardCarousel
          images={images}
          showPagination={false}
        />
      </div>
    </section>
  );
}

export default CardCarouselParent;