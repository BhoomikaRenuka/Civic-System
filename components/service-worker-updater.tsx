"use client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"
import { useServiceWorker } from "@/hooks/use-service-worker"

export function ServiceWorkerUpdater() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker()

  if (!updateAvailable) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Alert className="border-blue-200 bg-blue-50">
        <RefreshCw className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm">App update available</span>
            <Button size="sm" onClick={updateServiceWorker} className="ml-2">
              Update
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
