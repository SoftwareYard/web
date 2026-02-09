"use client"

import { useEffect, useState, type RefObject } from "react"

interface UseInViewOptions {
  threshold?: number
  margin?: string
  once?: boolean
}

export function useInView(
  ref: RefObject<Element | null>,
  options: UseInViewOptions = {}
): boolean {
  const { threshold = 0.2, margin = "0px", once = false } = options
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (once) {
            observer.unobserve(element)
          }
        } else if (!once) {
          setIsInView(false)
        }
      },
      {
        threshold,
        rootMargin: margin,
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, threshold, margin, once])

  return isInView
}
