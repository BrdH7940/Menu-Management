import { useState, useEffect } from "react";
import { Plus, Loader2, Settings2, AlertCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { menuApi } from "@/lib/api";
import { ModifierGroup } from "@/types/menu";
import { ModifierGroupItem } from "./modifier-group-item";

interface ModifierGroupsManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ModifierGroupsManagementDialog({ open, onOpenChange }: ModifierGroupsManagementDialogProps) {
    const [groups, setGroups] = useState<ModifierGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadGroups = async () => {
        try {
            setIsLoading(true);
            const data = await menuApi.getModifierGroups();
            // Sắp xếp theo thứ tự hiển thị
            setGroups(data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
        } catch (error) {
            console.error("Failed to load groups", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) loadGroups();
    }, [open]);

    // Tính năng Thêm nhóm mới: Tạo một object mẫu và đẩy vào state
    const handleAddGroup = () => {
        const newGroup: ModifierGroup = {
            id: `temp-${Date.now()}`, // Dùng temp-id để phân biệt tạo mới ở backend
            name: "", // Để trống để người dùng nhập
            selectionType: "single",
            isRequired: false,
            minSelections: 0,
            maxSelections: 1,
            displayOrder: 0, // Đưa lên đầu danh sách để dễ thấy
            options: [],
            status: "active",
            restaurantId: ""
        };
        // Thêm vào đầu mảng để mục mới hiện ngay phía trên
        setGroups([newGroup, ...groups]);
    };

    const handleUpdateGroup = (id: string, updates: Partial<ModifierGroup>) => {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    };

    const handleDeleteGroup = (id: string) => {
        setGroups(prev => prev.filter(g => g.id !== id));
    };

    const handleSaveAll = async () => {
        // Validation cơ bản trước khi lưu
        const hasInvalidGroup = groups.some(g => !g.name.trim());
        if (hasInvalidGroup) {
            alert("Vui lòng nhập tên cho tất cả các nhóm tùy chọn.");
            return;
        }

        try {
            setIsSaving(true);
            // Gọi API lưu hàng loạt (upsert) đã định nghĩa trong api.ts
            await menuApi.saveModifierGroups(groups);
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            alert("Lỗi khi lưu dữ liệu: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        <div>
                            <DialogTitle>Quản lý Danh mục Modifier</DialogTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Thiết lập các nhóm tùy chọn (Topping, Size, v.v.) dùng chung cho toàn menu.
                            </p>
                        </div>
                    </div>
                    <Button size="sm" onClick={handleAddGroup} disabled={isLoading || isSaving}>
                        <Plus className="w-4 h-4 mr-2" /> Thêm Nhóm mới
                    </Button>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="animate-spin h-8 w-8 text-primary" />
                            <p className="text-sm text-muted-foreground mt-2">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groups.map((group, index) => (
                                <div key={group.id} className="relative group">
                                    {/* Badge đánh dấu nhóm mới chưa lưu */}
                                    {group.id.startsWith('temp-') && (
                                        <div className="absolute -left-2 top-4 bottom-4 w-1 bg-yellow-400 rounded-full z-10" />
                                    )}

                                    <ModifierGroupItem
                                        group={group}
                                        onUpdate={handleUpdateGroup}
                                        onDelete={handleDeleteGroup}
                                        onAddOption={(groupId) => {
                                            const newOpt = {
                                                id: `opt-${Date.now()}`,
                                                name: "",
                                                price: 0,
                                                displayOrder: group.options.length
                                            };
                                            handleUpdateGroup(groupId, { options: [...group.options, newOpt] });
                                        }}
                                        onUpdateOption={(groupId, optId, updates) => {
                                            const newOpts = group.options.map(o => o.id === optId ? { ...o, ...updates } : o);
                                            handleUpdateGroup(groupId, { options: newOpts });
                                        }}
                                        onDeleteOption={(groupId, optId) => {
                                            handleUpdateGroup(groupId, { options: group.options.filter(o => o.id !== optId) });
                                        }}
                                    />
                                </div>
                            ))}

                            {groups.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
                                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                                    <p className="text-muted-foreground font-medium">Chưa có nhóm tùy chỉnh nào.</p>
                                    <p className="text-sm text-muted-foreground mt-1 mb-6">Nhấn "Thêm Nhóm mới" để bắt đầu thiết lập.</p>
                                    <Button variant="secondary" onClick={handleAddGroup}>
                                        <Plus className="w-4 h-4 mr-2" /> Tạo ngay
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-muted/30">
                    <div className="flex items-center justify-between w-full">
                        <p className="text-xs text-muted-foreground">
                            * Lưu ý: Các thay đổi chỉ có hiệu lực sau khi nhấn nút "Lưu toàn bộ".
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                            <Button onClick={handleSaveAll} disabled={isSaving || isLoading}>
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Lưu toàn bộ thay đổi
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}