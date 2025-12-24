import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MenuItem, MenuCategory, MenuItemPhoto } from "@/types/menu";
import { menuApi, formatPriceVND } from "@/lib/api";

interface CreateEditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  onSuccess: () => void;
}

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

export function CreateEditItemDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: CreateEditItemDialogProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: 0,
    description: "",
    prepTimeMinutes: 0,
    status: "available" as "available" | "unavailable" | "sold_out",
    isChefRecommended: false,
  });

  // Photos state
  const [existingPhotos, setExistingPhotos] = useState<MenuItemPhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<PhotoPreview[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);

  // Load categories
  useEffect(() => {
    menuApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (item) {
        setFormData({
          name: item.name || "",
          categoryId: item.categoryId || "",
          price: item.price || 0,
          description: item.description || "",
          prepTimeMinutes: item.prepTimeMinutes || 0,
          status: item.status || "available",
          isChefRecommended: item.isChefRecommended || false,
        });
        // Load existing photos
        setExistingPhotos(item.photos || []);
      } else {
        setFormData({
          name: "",
          categoryId: categories[0]?.id || "",
          price: 0,
          description: "",
          prepTimeMinutes: 0,
          status: "available",
          isChefRecommended: false,
        });
        setExistingPhotos([]);
      }
      setNewPhotos([]);
      setPhotosToDelete([]);
      setError(null);
    }
  }, [item, open, categories]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      newPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [newPhotos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: PhotoPreview[] = [];
    
    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Chỉ chấp nhận file ảnh");
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      newPreviews.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    setNewPhotos((prev) => [...prev, ...newPreviews]);
    setError(null);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotos((prev) => {
      const photo = prev[index];
      URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveExistingPhoto = (photoId: string) => {
    setPhotosToDelete((prev) => [...prev, photoId]);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleSetPrimaryPhoto = async (photoId: string) => {
    if (!item) return;
    
    try {
      await menuApi.setPrimaryPhoto(item.id, photoId);
      setExistingPhotos((prev) =>
        prev.map((p) => ({ ...p, isPrimary: p.id === photoId }))
      );
    } catch (err) {
      console.error("Error setting primary photo:", err);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError("Tên món ăn không được để trống");
      return;
    }
    if (!formData.categoryId) {
      setError("Vui lòng chọn danh mục");
      return;
    }
    if (formData.price <= 0) {
      setError("Giá phải lớn hơn 0");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let itemId = item?.id;

      if (item) {
        // Update existing item
        await menuApi.updateItem(item.id, formData);
      } else {
        // Create new item
        const newItem = await menuApi.createItem(formData);
        itemId = newItem.id;
      }

      // Delete photos marked for deletion
      for (const photoId of photosToDelete) {
        try {
          await menuApi.deletePhoto(itemId!, photoId);
        } catch (err) {
          console.error("Error deleting photo:", err);
        }
      }

      // Upload new photos
      if (newPhotos.length > 0 && itemId) {
        setIsUploading(true);
        try {
          const files = newPhotos.map((p) => p.file);
          await menuApi.uploadPhotos(itemId, files);
        } catch (err: any) {
          console.error("Error uploading photos:", err);
          setError("Đã lưu món ăn nhưng không thể upload ảnh: " + err.message);
          setIsUploading(false);
          onSuccess();
          return;
        }
        setIsUploading(false);
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    setFormData({ ...formData, price: parseInt(numericValue) || 0 });
  };

  const totalPhotos = existingPhotos.length + newPhotos.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item ? "Chỉnh sửa món ăn" : "Tạo món ăn mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Photo Upload Section */}
          <div className="space-y-3">
            <Label>Hình ảnh món ăn</Label>
            
            {/* Existing + New Photos Grid */}
            {totalPhotos > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {/* Existing Photos */}
                {existingPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden border group"
                  >
                    <img
                      src={photo.url}
                      alt="Ảnh món ăn"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {!photo.isPrimary && item && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white hover:text-yellow-400"
                          onClick={() => handleSetPrimaryPhoto(photo.id)}
                          title="Đặt làm ảnh chính"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:text-red-400"
                        onClick={() => handleRemoveExistingPhoto(photo.id)}
                        title="Xóa ảnh"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {photo.isPrimary && (
                      <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Chính
                      </div>
                    )}
                  </div>
                ))}

                {/* New Photos */}
                {newPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-dashed border-primary group"
                  >
                    <img
                      src={photo.previewUrl}
                      alt="Ảnh mới"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:text-red-400"
                        onClick={() => handleRemoveNewPhoto(index)}
                        title="Xóa ảnh"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Mới
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click để chọn ảnh hoặc kéo thả vào đây
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Hỗ trợ: JPEG, PNG, GIF, WebP (Tối đa 5MB/ảnh)
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên món ăn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ví dụ: Phở bò, Cơm tấm..."
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Giá (VNĐ) *</Label>
            <div className="relative">
              <Input
                id="price"
                type="text"
                value={formData.price > 0 ? formData.price.toLocaleString("vi-VN") : ""}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="Ví dụ: 65000"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                đ
              </span>
            </div>
            {formData.price > 0 && (
              <p className="text-xs text-muted-foreground">
                Hiển thị: {formatPriceVND(formData.price)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả về món ăn..."
              rows={3}
            />
          </div>

          {/* Prep Time */}
          <div className="space-y-2">
            <Label htmlFor="prepTime">Thời gian chuẩn bị (phút)</Label>
            <Input
              id="prepTime"
              type="number"
              min={0}
              max={240}
              value={formData.prepTimeMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prepTimeMinutes: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Còn hàng</SelectItem>
                <SelectItem value="unavailable">Không có sẵn</SelectItem>
                <SelectItem value="sold_out">Hết hàng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chef Recommended */}
          <div className="flex items-center justify-between">
            <Label htmlFor="chefRecommended">Đề xuất của bếp trưởng</Label>
            <Switch
              id="chefRecommended"
              checked={formData.isChefRecommended}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isChefRecommended: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isUploading}>
            {(isLoading || isUploading) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isUploading ? "Đang upload ảnh..." : item ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
