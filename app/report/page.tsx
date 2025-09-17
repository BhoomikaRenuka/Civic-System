"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Camera, AlertCircle, CheckCircle, Loader2, X } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { issuesApi } from "@/lib/api"

const categories = [
  { value: "Road", label: "Road Issues" },
  { value: "Electricity", label: "Street Lighting" },
  { value: "Waste", label: "Waste Management" },
  { value: "Water", label: "Water & Drainage" },
  { value: "Other", label: "Other Issues" },
]

export default function ReportPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    address: "",
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    setError("")

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ latitude, longitude })

        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`,
          )
          if (response.ok) {
            const data = await response.json()
            if (data.results && data.results[0]) {
              setFormData((prev) => ({
                ...prev,
                address: data.results[0].formatted,
              }))
            }
          }
        } catch (err) {
          // Fallback to coordinates if reverse geocoding fails
          setFormData((prev) => ({
            ...prev,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }))
        }

        setIsLoadingLocation(false)
      },
      (error) => {
        setError("Unable to retrieve your location. Please enter address manually.")
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.title || !formData.description || !formData.category) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = new FormData()
      submitData.append("title", formData.title)
      submitData.append("description", formData.description)
      submitData.append("category", formData.category)
      submitData.append("address", formData.address)

      if (location) {
        submitData.append("latitude", location.latitude.toString())
        submitData.append("longitude", location.longitude.toString())
      }

      if (image) {
        submitData.append("image", image)
      }

      await issuesApi.submitReport(submitData)

      setSuccess("Issue reported successfully!")
      setTimeout(() => {
        router.push("/my-reports")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Report an Issue</h1>
            <p className="text-gray-600 mt-2">Help improve your community by reporting civic issues.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
              <CardDescription>
                Provide as much detail as possible to help authorities address the issue quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Issue Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Brief description of the issue"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Provide detailed information about the issue..."
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Location</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      name="address"
                      placeholder="Enter address or use location button"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={isLoadingLocation}>
                      {isLoadingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {location && (
                    <p className="text-sm text-green-600">
                      Location captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Photo (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="flex-1" />
                    <Camera className="h-5 w-5 text-gray-400" />
                  </div>

                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
