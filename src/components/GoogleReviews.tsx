'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

interface Review {
  id: number
  name: string
  rating: number
  date: string
  comment: string
  avatar?: string
}

// Fallback reviews in case API fails
const fallbackReviews: Review[] = [
  {
    id: 1,
    name: "Sarah M.",
    rating: 5,
    date: "Il y a 2 semaines",
    comment: "Service exceptionnel ! La décoration était magnifique et exactement ce que j'imaginais pour mon mariage. L'équipe est très professionnelle et à l'écoute."
  },
  {
    id: 2,
    name: "Karim B.",
    rating: 5,
    date: "Il y a 1 mois",
    comment: "Qualité irréprochable des locations. Les trônes étaient sublimes et ont fait sensation lors de notre événement. Je recommande vivement !"
  },
  {
    id: 3,
    name: "Amina L.",
    rating: 5,
    date: "Il y a 3 semaines",
    comment: "Les accessoires personnalisés sont d'une grande finesse. Le henné était magnifique et a tenu toute la soirée. Merci pour ce travail d'exception !"
  },
  {
    id: 4,
    name: "Mohamed R.",
    rating: 5,
    date: "Il y a 2 mois",
    comment: "Parfait du début à la fin. La livraison et l'installation ont été impeccables. Tout était prêt à temps et la qualité au rendez-vous."
  },
  {
    id: 5,
    name: "Leila K.",
    rating: 5,
    date: "Il y a 1 mois",
    comment: "Un grand merci pour la décoration de notre événement. Tout était parfait et nos invités étaient émerveillés. Service au top !"
  },
  {
    id: 6,
    name: "Rachid A.",
    rating: 5,
    date: "Il y a 3 semaines",
    comment: "Excellent rapport qualité-prix. Les tenues homme étaient élégantes et bien entretenues. Je recommande sans hésitation !"
  }
]

export default function GoogleReviews() {
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set())
  const [truncatedReviews, setTruncatedReviews] = useState<Set<number>>(new Set())
  const reviewRefs = useRef<Map<number, HTMLParagraphElement>>(new Map())

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/google-reviews')
        if (response.ok) {
          const data = await response.json()
          if (data.reviews && data.reviews.length > 0) {
            setReviews(data.reviews)
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
        // Keep fallback reviews
      }
    }

    fetchReviews()
  }, [])

  // Determine how many reviews to show based on screen size
  const getReviewsPerSlide = () => {
    if (typeof window === 'undefined') return 1
    if (window.innerWidth >= 1024) return 3 // lg
    if (window.innerWidth >= 768) return 2 // md
    return 1 // mobile
  }

  const [reviewsPerSlide, setReviewsPerSlide] = useState(1)

  useEffect(() => {
    setReviewsPerSlide(getReviewsPerSlide())

    const handleResize = () => {
      setReviewsPerSlide(getReviewsPerSlide())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const totalSlides = Math.ceil(reviews.length / reviewsPerSlide)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  // Reset expanded state when changing slides
  useEffect(() => {
    setExpandedReviews(new Set())
  }, [currentIndex])


  const getCurrentReviews = () => {
    const start = currentIndex * reviewsPerSlide
    return reviews.slice(start, start + reviewsPerSlide)
  }

  // Check if text is truncated after render
  useEffect(() => {
    const checkTruncation = () => {
      const newTruncated = new Set<number>()
      reviewRefs.current.forEach((element, reviewId) => {
        if (element && !expandedReviews.has(reviewId)) {
          // Check if element is truncated by comparing scrollHeight to clientHeight
          if (element.scrollHeight > element.clientHeight) {
            newTruncated.add(reviewId)
          }
        }
      })
      setTruncatedReviews(newTruncated)
    }

    // Check after a short delay to ensure DOM is updated
    const timer = setTimeout(checkTruncation, 100)
    return () => clearTimeout(timer)
  }, [reviews, currentIndex, expandedReviews])

  const toggleExpanded = (reviewId: number) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  const isExpanded = (reviewId: number) => expandedReviews.has(reviewId)

  const shouldShowButton = (reviewId: number) => {
    return truncatedReviews.has(reviewId) || expandedReviews.has(reviewId)
  }

  return (
    <section className="bg-white pt-7 md:pt-10 lg:pt-14 pb-14 md:pb-20 lg:pb-28">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        {/* Section Title */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 font-satisfy">
            Nos avis Google
          </h2>
          <p className="text-s md:text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez ce que nos clients disent de nos services
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-7xl mx-auto">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / reviewsPerSlide)}%)`,
                gap: reviewsPerSlide === 1 ? '0' : reviewsPerSlide === 2 ? '1.5rem' : '2rem'
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 transition-all duration-300 min-h-[400px] flex flex-col flex-shrink-0"
                  style={{ width: `calc((100% - ${(reviewsPerSlide - 1) * (reviewsPerSlide === 1 ? 0 : reviewsPerSlide === 2 ? 1.5 : 2)}rem) / ${reviewsPerSlide})` }}
                >
                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review Comment */}
                  <div className="flex-1 mb-4">
                    <p
                      ref={(el) => {
                        if (el) {
                          reviewRefs.current.set(review.id, el)
                        } else {
                          reviewRefs.current.delete(review.id)
                        }
                      }}
                      className={`text-gray-700 text-base md:text-lg leading-relaxed ${
                        isExpanded(review.id) ? '' : 'line-clamp-6'
                      }`}
                    >
                      {review.comment}
                    </p>
                    {shouldShowButton(review.id) && (
                      <button
                        onClick={() => toggleExpanded(review.id)}
                        className="text-sm text-gray-600 hover:text-black mt-2 font-medium transition-colors"
                      >
                        {isExpanded(review.id) ? 'Voir moins' : 'Lire la suite'}
                      </button>
                    )}
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.name}</p>
                      <p className="text-sm text-gray-500">{review.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation with Dots */}
          {totalSlides > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              {/* Previous Button */}
              <button
                onClick={prevSlide}
                className="bg-black hover:bg-gray-800 rounded-full p-1.5 transition-all duration-300"
                aria-label="Avis précédent"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-2">
                {[...Array(totalSlides)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-8 bg-black'
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Aller à la slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={nextSlide}
                className="bg-black hover:bg-gray-800 rounded-full p-1.5 transition-all duration-300"
                aria-label="Avis suivant"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
