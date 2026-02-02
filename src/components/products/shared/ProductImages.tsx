'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImagesProps {
  images: string[]
  productName: string
  selectedIndex: number
  onSelectIndex: (index: number) => void
}

export default function ProductImages({
  images,
  productName,
  selectedIndex,
  onSelectIndex,
}: ProductImagesProps) {
  const handlePrev = () => {
    onSelectIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)
  }

  const handleNext = () => {
    onSelectIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1)
  }

  return (
    <div className="space-y-4">
      {/* Main image with carousel controls */}
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-neutral-100 shadow-soft">
        <Image
          src={images[selectedIndex]}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white hover:scale-110"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white hover:scale-110"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => onSelectIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                selectedIndex === index
                  ? 'ring-2 ring-black ring-offset-2'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} - Miniature ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
