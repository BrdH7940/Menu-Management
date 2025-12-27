import { useState, useRef } from "react";
import { Upload, X, Star, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { menuApi } from '@/lib/api';
import { MenuItemPhoto } from "@/types/menu";

interface PhotoManagerProps {
  itemId: string;
  photos: MenuItemPhoto[];
  onPhotosChange: (photos: MenuItemPhoto[]) => void;
}

export function PhotoManager({ itemId, photos, onPhotosChange }: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allowed image types
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return `File "${file.name}" không phải là file ảnh hợp lệ. Chỉ chấp nhận: JPEG, PNG, WebP`;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File "${file.name}" quá lớn (${sizeMB}MB). Kích thước tối đa: 5MB`;
    }
    
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files before uploading
    setError(null);
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (validFiles.length === 0) {
      setError("Không có file hợp lệ để upload");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    const progress: Record<string, number> = {};

    try {
      // Simulate upload progress
      validFiles.forEach((file) => {
        progress[file.name] = 0;
        const interval = setInterval(() => {
          progress[file.name] = Math.min(progress[file.name] + 10, 90);
          setUploadProgress({ ...progress });
        }, 100);
        setTimeout(() => clearInterval(interval), 2000);
      });

      const uploadedPhotos = await menuApi.uploadPhotos(itemId, validFiles);
      onPhotosChange([...photos, ...uploadedPhotos]);
      setError(null);
    } catch (error) {
      console.error("Error uploading photos:", error);
      setError("Không thể upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const deletedPhoto = photos.find(p => p.id === photoId);
      await menuApi.deletePhoto(itemId, photoId);
      const updatedPhotos = photos.filter((p) => p.id !== photoId);
      onPhotosChange(updatedPhotos);
      
      // Note: Backend automatically sets a new primary if the deleted one was primary
      // So we just update the local state
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      await menuApi.setPrimaryPhoto(itemId, photoId);
      onPhotosChange(
        photos.map((p) => ({
          ...p,
          isPrimary: p.id === photoId,
        }))
      );
    } catch (error) {
      console.error("Error setting primary photo:", error);
      alert("Failed to set primary photo. Please try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) return;

    // Validate all files before processing
    setError(null);
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    if (validFiles.length === 0) {
      setError("Không có file hợp lệ để upload");
      return;
    }

    // Create a synthetic event to reuse handleFileSelect logic
    const dataTransfer = new DataTransfer();
    validFiles.forEach((file) => dataTransfer.items.add(file));
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: fileInputRef.current } as any);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-muted-foreground/50"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Kéo thả ảnh vào đây, hoặc{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:underline"
            disabled={uploading}
          >
            chọn file
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG, hoặc WebP (Tối đa 5MB mỗi ảnh)
        </p>
        {uploading && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{filename}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-lg border"
            >
              <img
                src={photo.url}
                alt="Menu item"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-full items-center justify-center gap-2">
                  {!photo.isPrimary && (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleSetPrimary(photo.id)}
                      title="Set as primary"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeletePhoto(photo.id)}
                    title="Delete photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {photo.isPrimary && (
                <div className="absolute top-2 left-2 rounded-full bg-primary p-1.5">
                  <Star className="h-3 w-3 fill-white text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No photos yet. Upload some images to get started.
          </p>
        </div>
      )}
    </div>
  );
}

