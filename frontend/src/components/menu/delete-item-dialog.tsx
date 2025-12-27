import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { MenuItem } from "@/types/menu";
import { menuApi } from '@/lib/api';

interface DeleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  onSuccess: () => void;
}

export function DeleteItemDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: DeleteItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!item) return;

    try {
      setIsLoading(true);
      setError(null);
      await menuApi.deleteItem(item.id);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Không thể xóa món ăn");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Xác nhận xóa món ăn
          </DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <p>
            Bạn có chắc chắn muốn xóa món{" "}
            <strong className="text-primary">{item?.name}</strong>?
          </p>
          
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Lưu ý:</strong> Món ăn sẽ được xóa mềm (soft delete) - 
              nghĩa là nó sẽ bị ẩn khỏi menu hiện tại nhưng vẫn được giữ lại 
              trong lịch sử đơn hàng.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Xóa món ăn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
