"use client"

import { useEffect, useState } from "react"

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      console.log("[v0] Registering service worker...")
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      setRegistration(reg)
      setIsRegistered(true)
      console.log("[v0] Service worker registered successfully")

      // Check for updates
      reg.addEventListener("updatefound", () => {
        console.log("[v0] Service worker update found")
        const newWorker = reg.installing

        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[v0] New service worker installed, update available")
              setUpdateAvailable(true)
            }
          })
        }
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("[v0] Message from service worker:", event.data)
      })
    } catch (error) {
      console.error("[v0] Service worker registration failed:", error)
    }
  }

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      console.log("[v0] Updating service worker...")
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
      setUpdateAvailable(false)
      window.location.reload()
    }
  }

  const unregisterServiceWorker = async () => {
    if (registration) {
      const success = await registration.unregister()
      if (success) {
        setIsRegistered(false)
        setRegistration(null)
        console.log("[v0] Service worker unregistered")
      }
    }
  }

  return {
    registration,
    isSupported,
    isRegistered,
    updateAvailable,
    updateServiceWorker,
    unregisterServiceWorker,
  }
}
