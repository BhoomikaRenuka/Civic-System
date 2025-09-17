import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, User } from "lucide-react"

interface ReportCardProps {
  report: {
    _id: string
    title: string
    description: string
    category: string
    status: string
    image?: string
    location?: {
      address?: string
      latitude?: number
      longitude?: number
    }
    user_name?: string
    created_at: string
    updated_at: string
  }
  showUserName?: boolean
}

export function ReportCard({ report, showUserName = false }: ReportCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      "Road Issues": "bg-red-100 text-red-800",
      "Street Lighting": "bg-yellow-100 text-yellow-800",
      "Waste Management": "bg-green-100 text-green-800",
      "Water & Drainage": "bg-blue-100 text-blue-800",
      "Public Safety": "bg-purple-100 text-purple-800",
      "Parks & Recreation": "bg-emerald-100 text-emerald-800",
      "Traffic Signals": "bg-orange-100 text-orange-800",
      Graffiti: "bg-pink-100 text-pink-800",
      Other: "bg-gray-100 text-gray-800",
    }
    return colors[category as keyof typeof colors] || colors["Other"]
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{report.title}</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className={getCategoryColor(report.category)}>
                {report.category}
              </Badge>
              <Badge variant="outline" className={getStatusColor(report.status)}>
                {report.status}
              </Badge>
            </div>
          </div>
          {report.image && (
            <img
              src={`http://localhost:5000/uploads/${report.image}`}
              alt="Issue"
              className="w-16 h-16 object-cover rounded-lg ml-4"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{report.description}</p>

        <div className="space-y-2 text-sm text-gray-500">
          {report.location?.address && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="truncate">{report.location.address}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{new Date(report.created_at).toLocaleDateString()}</span>
            </div>

            {showUserName && report.user_name && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>{report.user_name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
