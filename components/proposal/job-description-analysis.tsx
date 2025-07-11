import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface JobAnalysis {
  requirements: string[]
  metrics: string[]
  strongWords: string[]
  industry: string
  businessType: string
}

interface JobDescriptionAnalysisProps {
  analysis: JobAnalysis | null
}

export default function JobDescriptionAnalysis({ analysis }: JobDescriptionAnalysisProps) {
  if (!analysis) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No analysis data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Key Requirements</CardTitle>
          <CardDescription>Important requirements extracted from the job description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Requirements & Skills</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.requirements.map((req, index) => (
                  <Badge key={index} variant="outline" className="bg-purple-50">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Numbers & Metrics</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.metrics.map((metric, index) => (
                  <Badge key={index}>{metric}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Strong Words</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.strongWords.map((word, index) => (
                  <Badge key={index} variant="secondary">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Industry & Business Type</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{analysis.industry}</Badge>
                <Badge variant="outline">{analysis.businessType}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
