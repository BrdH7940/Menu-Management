import { motion } from "framer-motion"
import { Edit2, DollarSign } from "lucide-react"
import { MenuItem } from "@/types/menu"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MenuItemCardProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onQuickEditPrice: (item: MenuItem) => void
}

export function MenuItemCard({ item, onEdit, onQuickEditPrice }: MenuItemCardProps) {
  const isAvailable = item.status === 'available' || item.isAvailable === true;
  const statusText = item.status === 'available' ? 'Available' : item.status === 'sold_out' ? 'Sold Out' : 'Unavailable';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "group cursor-pointer overflow-hidden transition-all hover:shadow-md",
          !isAvailable && "opacity-75"
        )}
        onClick={() => onEdit(item)}
      >
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {(item.imageUrl || item.primaryPhotoUrl) ? (
            <motion.img
              src={item.imageUrl || item.primaryPhotoUrl}
              alt={item.name}
              className={cn(
                "h-full w-full object-cover transition-all duration-300 group-hover:scale-105",
                !isAvailable && "grayscale"
              )}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute right-2 top-2">
            <Badge
              variant={isAvailable ? "default" : "destructive"}
              className="shadow-sm"
            >
              {statusText}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold leading-tight line-clamp-1">
                {item.name}
              </h3>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">
                  ${item.price.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    onQuickEditPrice(item)
                  }}
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(item)
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

