"use client";

import { useState, useRef, useEffect } from "react";

interface ImageUploadSectionProps {
  claimId: string;
  existingImages: string[];
  onImageUploaded: (imageUrl: string) => void;
  onTriggerAIAssessment: (imageUrl: string) => void;
  onProceedWithAssessment: () => void;
  onImageDeleted: (imageUrl: string) => void;
  isAssessing?: boolean;
  hideProceedButton?: boolean;
  /** When true, show "Proceed with AI Assessment" even when no images uploaded (uses claim vehicle image) */
  canAssessWithClaimImage?: boolean;
}

export function ImageUploadSection({
  claimId,
  existingImages,
  onImageUploaded,
  onTriggerAIAssessment,
  onProceedWithAssessment,
  onImageDeleted,
  isAssessing = false,
  hideProceedButton = false,
  canAssessWithClaimImage = false,
}: ImageUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [assessing, setAssessing] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        // Save image via API
        const res = await fetch(`/api/claims/${claimId}/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: base64Data, fileName: file.name }),
        });

        if (!res.ok) {
          throw new Error("Failed to upload image");
        }

        const { imageUrl } = await res.json();
        onImageUploaded(imageUrl);
        setUploading(false);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
      setUploading(false);
    }
  };

  const handleTriggerAssessment = async (imageUrl: string) => {
    setAssessing(imageUrl);
    try {
      // Mock AI assessment - in real implementation, this would call an AI service
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
      
      // Call the callback
      onTriggerAIAssessment(imageUrl);
      
      alert("AI assessment initiated. This is a mock implementation. In production, this would trigger a real AI analysis.");
    } catch (error) {
      console.error("Error triggering AI assessment:", error);
      alert("Failed to trigger AI assessment. Please try again.");
    } finally {
      setAssessing(null);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Uploaded Images
      </h3>

      {/* Upload Button */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${
            uploading ? "opacity-50" : ""
          }`}
        >
          {uploading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload New Image
            </>
          )}
        </label>
      </div>

      {/* Image Grid */}
      {existingImages.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No images uploaded yet. Please upload an image or use the claim&apos;s vehicle image below to proceed with AI assessment.
          </p>
          {canAssessWithClaimImage && !hideProceedButton && (
            <div className="flex flex-col items-center justify-center gap-4">
              <button
                type="button"
                onClick={onProceedWithAssessment}
                disabled={isAssessing}
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isAssessing ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing AI Assessment...
                  </span>
                ) : (
                  "Proceed with AI Assessment of Damages"
                )}
              </button>
              {isAssessing && (
                <div className="w-full max-w-md">
                  <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>AI is analyzing damage...</span>
                    <span className="font-medium">Processing</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-500"
                      style={{
                        width: "0%",
                        animation: "progress 4s ease-in-out forwards",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {existingImages.map((imageUrl, index) => {
              // Use absolute URL once origin is known so deployed site (e.g. Railway) loads from correct origin
              const imgSrc =
                origin && !imageUrl.startsWith("data:") && !imageUrl.startsWith("http")
                  ? origin + (imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`)
                  : imageUrl;
              return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={imgSrc}
                    alt={`Uploaded image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this image?")) {
                      onImageDeleted(imageUrl);
                    }
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                  title="Delete image"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              );
            })}
          </div>
          
          {/* Proceed Button - Only show if assessment section is not already visible */}
          {!hideProceedButton && (
            <div className="flex flex-col items-center justify-center gap-4">
              <button
                type="button"
                onClick={onProceedWithAssessment}
                disabled={isAssessing}
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isAssessing ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing AI Assessment...
                  </span>
                ) : (
                  "Proceed with AI Assessment of Damages"
                )}
              </button>
              {isAssessing && (
                <div className="w-full max-w-md">
                  <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>AI is analyzing damage...</span>
                    <span className="font-medium">Processing</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-500"
                      style={{
                        width: "0%",
                        animation: "progress 4s ease-in-out forwards",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
