import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, X, Star, Tag } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuItem, MenuCategory, MenuItemPhoto, ModifierGroup } from "@/types/menu";
import { menuApi, formatPriceVND } from "@/lib/api";
import { ModifierGroupSelector } from "./modifier-group-selector";

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
    const [activeTab, setActiveTab] = useState("general");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- THÔNG TIN CHUNG ---
    const [formData, setFormData] = useState({
        name: "",
        categoryId: "",
        price: 0,
        description: "",
        prepTimeMinutes: 0,
        status: "available" as "available" | "unavailable" | "sold_out",
        isChefRecommended: false,
    });

    const [existingPhotos, setExistingPhotos] = useState<MenuItemPhoto[]>([]);
    const [newPhotos, setNewPhotos] = useState<PhotoPreview[]>([]);
    const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);

    // --- MODIFIER GROUPS ---
    const [selectedModifierGroupIds, setSelectedModifierGroupIds] = useState<string[]>([]);
    const [attachedModifierGroups, setAttachedModifierGroups] = useState<ModifierGroup[]>([]);
    const [isLoadingModifiers, setIsLoadingModifiers] = useState(false);

    useEffect(() => {
        if (open) {
            menuApi.getCategories().then(setCategories).catch(console.error);
        }
    }, [open]);

    const fetchAttachedModifiers = async (itemId: string) => {
        try {
            setIsLoadingModifiers(true);
            // FIX: Sử dụng endpoint đúng từ backend
            const groups = await menuApi.getAttachedModifiers(itemId);
            setAttachedModifierGroups(groups);
            const ids = groups.map((g: ModifierGroup) => g.id);
            setSelectedModifierGroupIds(ids);
        } catch (err) {
            console.error("Lỗi khi lấy modifier đã gán:", err);
            setAttachedModifierGroups([]);
            setSelectedModifierGroupIds([]);
        } finally {
            setIsLoadingModifiers(false);
        }
    };

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
                setExistingPhotos(item.photos || []);
                fetchAttachedModifiers(item.id);
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
                setSelectedModifierGroupIds([]);
                setAttachedModifierGroups([]);
            }
            setNewPhotos([]);
            setPhotosToDelete([]);
            setError(null);
            setActiveTab("general");
        }
    }, [item, open, categories]);

    useEffect(() => {
        return () => {
            newPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
        };
    }, [newPhotos]);

    // --- HANDLERS ẢNH ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newPreviews: PhotoPreview[] = [];
        Array.from(files).forEach((file) => {
            if (!file.type.startsWith("image/")) return;
            if (file.size > 5 * 1024 * 1024) return;
            newPreviews.push({ file, previewUrl: URL.createObjectURL(file) });
        });
        setNewPhotos((prev) => [...prev, ...newPreviews]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveNewPhoto = (index: number) => {
        setNewPhotos((prev) => {
            URL.revokeObjectURL(prev[index].previewUrl);
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
            console.error(err);
        }
    };

    // --- LƯU TỔNG HỢP ---
    const handleSave = async () => {
        if (!formData.name.trim()) return setError("Tên món ăn không được để trống");
        if (!formData.categoryId) return setError("Vui lòng chọn danh mục");
        if (formData.price <= 0) return setError("Giá phải lớn hơn 0");

        try {
            setIsLoading(true);
            setError(null);
            let savedItem;

            // 1. Lưu thông tin cơ bản
            if (item) {
                savedItem = await menuApi.updateItem(item.id, formData);
            } else {
                savedItem = await menuApi.createItem(formData);
            }

            const itemId = savedItem.id || item?.id;

            // 2. Lưu/Xóa Modifiers - CHỈ KHI ACTIVE TAB LÀ MODIFIERS
            // FIX: Chỉ cập nhật modifiers khi người dùng đã vào tab modifiers
            // Để tránh xóa nhầm khi chỉ cập nhật thông tin chung
            if (activeTab === "modifiers" || !item) {
                try {
                    await menuApi.attachModifiersToItem(itemId, selectedModifierGroupIds);
                } catch (modifierError) {
                    // Không block việc tạo món ăn, chỉ log warning
                    console.warn('Modifier attachment skipped:', modifierError);
                }
            }

            // 3. Xử lý ảnh
            for (const photoId of photosToDelete) {
                await menuApi.deletePhoto(itemId, photoId).catch(console.error);
            }

            if (newPhotos.length > 0) {
                setIsUploading(true);
                const files = newPhotos.map((p) => p.file);
                await menuApi.uploadPhotos(itemId, files);
                setIsUploading(false);
            }

            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Có lỗi xảy ra khi lưu");
        } finally {
            setIsLoading(false);
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{item ? "Chỉnh sửa món ăn" : "Tạo món ăn mới"}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                        <TabsTrigger value="modifiers">
                            Gán Modifiers
                            {selectedModifierGroupIds.length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                                    {selectedModifierGroupIds.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="photos">Hình ảnh</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-4 pr-1">
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                                {error}
                            </div>
                        )}

                        <TabsContent value="general" className="space-y-4 mt-0">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Tên món ăn *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="VD: Phở Bò Chín"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Danh mục *</Label>
                                        <Select
                                            value={formData.categoryId}
                                            onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn danh mục" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Giá (VNĐ) *</Label>
                                        <Input
                                            type="text"
                                            value={formData.price > 0 ? formData.price.toLocaleString("vi-VN") : ""}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                price: parseInt(e.target.value.replace(/\D/g, "")) || 0
                                            })}
                                        />
                                        <p className="text-xs text-muted-foreground">Hiển thị: {formatPriceVND(formData.price)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Mô tả</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Mô tả ngắn gọn về món ăn..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Trạng thái</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(val: any) => setFormData({ ...formData, status: val })}
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
                                    <div className="flex items-center justify-between border rounded-md px-3 mt-8">
                                        <Label className="cursor-pointer">Đề xuất của bếp</Label>
                                        <Switch
                                            checked={formData.isChefRecommended}
                                            onCheckedChange={(val) => setFormData({ ...formData, isChefRecommended: val })}
                                        />
                                    </div>
                                </div>

                                {/* HIỂN THỊ MODIFIERS ĐÃ GÁN */}
                                {item && (
                                    <div className="space-y-2 pt-4 border-t">
                                        <Label className="flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            Modifiers đang được gán
                                        </Label>
                                        {isLoadingModifiers ? (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Đang tải...
                                            </div>
                                        ) : attachedModifierGroups.length > 0 ? (
                                            <div className="space-y-2">
                                                {attachedModifierGroups.map((group) => (
                                                    <div
                                                        key={group.id}
                                                        className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm">{group.name}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {group.selectionType === 'single' ? 'Chọn 1' : 'Chọn nhiều'} •
                                                                {group.isRequired ? ' Bắt buộc' : ' Tùy chọn'} •
                                                                {group.options?.length || 0} tùy chọn
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setActiveTab("modifiers")}
                                                        >
                                                            Chỉnh sửa
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground py-3 px-4 bg-muted/30 rounded-md">
                                                Chưa có modifiers nào được gán.
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="px-1 h-auto"
                                                    onClick={() => setActiveTab("modifiers")}
                                                >
                                                    Gán ngay
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="modifiers" className="space-y-4 mt-0">
                            <div className="bg-muted/50 p-3 rounded-md text-sm mb-4">
                                Chọn các nhóm tùy chỉnh (Size, Topping,...) để áp dụng cho món ăn này.
                            </div>
                            <ModifierGroupSelector
                                selectedGroupIds={selectedModifierGroupIds}
                                onSelectionChange={setSelectedModifierGroupIds}
                            />
                        </TabsContent>

                        <TabsContent value="photos" className="space-y-4 mt-0">
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                {existingPhotos.map((photo) => (
                                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border group">
                                        <img src={photo.url} className="w-full h-full object-cover" alt="Món ăn" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white" onClick={() => handleSetPrimaryPhoto(photo.id)}>
                                                <Star className={photo.isPrimary ? "fill-yellow-400 text-yellow-400" : ""} />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white" onClick={() => handleRemoveExistingPhoto(photo.id)}>
                                                <X />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {newPhotos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-primary/50 group">
                                        <img src={photo.previewUrl} className="w-full h-full object-cover" alt="Mới" />
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveNewPhoto(index)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {(existingPhotos.length + newPhotos.length) < 5 && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center aspect-square hover:bg-muted/50 transition-colors"
                                    >
                                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Tải ảnh</span>
                                    </button>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                            <p className="text-xs text-muted-foreground text-center italic">Hỗ trợ tối đa 5 ảnh. Dung lượng mỗi ảnh &lt; 5MB.</p>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                    <Button onClick={handleSave} disabled={isLoading || isUploading}>
                        {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUploading ? "Đang tải ảnh..." : item ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}