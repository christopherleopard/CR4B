"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, File, X, Check, Loader2, AlertCircle } from "lucide-react"
import { makeAuthenticatedRequest } from "@/lib/api-client"

interface Document {
  id: string
  name: string
  file_size: number
  file_type: string
  created_at: string
}

export default function UploadDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, boolean>>(new Map())
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setError(null)
      const response = await makeAuthenticatedRequest("/api/documents")

      if (response.ok) {
        const docs = await response.json()
        setDocuments(docs)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch documents")
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Failed to fetch documents")
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" is not supported. Please upload PDF, DOCX, or TXT files.`)
        continue
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`)
        continue
      }

      // Add to uploading files
      setUploadingFiles((prev) => new Map(prev.set(fileId, true)))
      setError(null)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await makeAuthenticatedRequest("/api/documents", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Upload failed")
        }

        const newDocument = await response.json()

        // Add to documents list
        setDocuments((prev) => [newDocument, ...prev])

        // Remove from uploading
        setUploadingFiles((prev) => {
          const newMap = new Map(prev)
          newMap.delete(fileId)
          return newMap
        })
      } catch (error) {
        console.error("Upload error:", error)
        setError(error instanceof Error ? error.message : "Upload failed")
        setUploadingFiles((prev) => {
          const newMap = new Map(prev)
          newMap.delete(fileId)
          return newMap
        })
      }
    }
  }

  const removeDocument = async (id: string) => {
    try {
      setError(null)
      const response = await makeAuthenticatedRequest(`/api/documents?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id))
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      setError("Failed to delete document")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading documents...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>Upload your past proposals to help the AI learn your writing style</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Drag and drop files here</h3>
            <p className="text-gray-500 mb-4">or click to browse from your computer</p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              onChange={handleFileInput}
              accept=".pdf,.docx,.txt"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
            <p className="text-xs text-gray-500 mt-4">Supported formats: PDF, DOCX, TXT (Max 10MB)</p>
          </div>

          {/* Show uploading files */}
          {uploadingFiles.size > 0 && (
            <div className="mt-4 space-y-2">
              {Array.from(uploadingFiles.keys()).map((fileId) => (
                <div key={fileId} className="flex items-center p-3 border rounded-md bg-blue-50">
                  <File className="h-5 w-5 text-blue-500 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium">Uploading...</p>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "50%" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Documents ({documents.length})</CardTitle>
          <CardDescription>Manage your uploaded documents</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No documents uploaded yet</p>
          ) : (
            <ul className="space-y-3">
              {documents.map((document) => (
                <li key={document.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{document.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(document.file_size)} • {formatDate(document.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-4" />
                    <Button size="icon" variant="ghost" onClick={() => removeDocument(document.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
