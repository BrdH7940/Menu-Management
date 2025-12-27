import express from 'express';
import { supabase } from '../db/supabase.js';
import { modifierGroupService } from '../services/modifier-groups-supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { search, category_id, is_chef_recommended, sort_by, order } = req.query;
        const isAscending = order !== 'desc';

        // 1. Lấy Categories - Đảm bảo lấy đủ các trường status để frontend filter
        const { data: categories, error: catError } = await supabase
            .from('menu_categories')
            .select('*')
            .eq('status', 'active')
            .eq('is_deleted', false)
            .order('display_order', { ascending: true });

        if (catError) throw catError;

        // 2. Lấy Items
        let itemsQuery = supabase
            .from('menu_items')
            .select(`
                *,
                menu_item_photos(id, url, is_primary, display_order)
            `)
            .eq('status', 'available')
            .eq('is_deleted', false);

        if (search) itemsQuery = itemsQuery.ilike('name', `%${search}%`);
        if (category_id) itemsQuery = itemsQuery.eq('category_id', category_id);
        if (is_chef_recommended === 'true') itemsQuery = itemsQuery.eq('is_chef_recommended', true);

        if (sort_by === 'price') {
            itemsQuery = itemsQuery.order('price', { ascending: isAscending });
        } else if (sort_by === 'displayOrder') {
            itemsQuery = itemsQuery.order('display_order', { ascending: isAscending });
        } else {
            // Mặc định sắp xếp theo tên hoặc theo lựa chọn khác
            itemsQuery = itemsQuery.order(sort_by ? String(sort_by) : 'name', { ascending: isAscending });
        }

        const { data: items, error: itemsError } = await itemsQuery;
        if (itemsError) throw itemsError;

        // 3. Map dữ liệu khớp với cấu trúc trong guest-menu-api.ts
        const itemsWithModifiers = await Promise.all(
            (items || []).map(async (item: any) => {
                let modifiers = [];
                try {
                    modifiers = await modifierGroupService.getByMenuItemId(item.id);
                } catch (e) {
                    console.error("Lỗi modifier:", e);
                }

                const photos = item.menu_item_photos || [];
                const primaryPhoto = photos.find((p: any) => p.is_primary);
                const currentCat = categories?.find(c => c.id === item.category_id);

                return {
                    ...item,
                    category_name: currentCat?.name || 'Khác',
                    status: item.status || 'available', // Đảm bảo có status để frontend filter
                    primary_photo_url: primaryPhoto?.url || (photos[0]?.url || null),
                    modifier_groups: (modifiers || []).map(group => ({
                        ...group,
                        // Map tên trường cho giống với cấu trúc DB/Service
                        is_required: group.is_required,
                        min_selections: group.min_selections,
                        max_selections: group.max_selections,
                        selection_type: group.selection_type,
                        options: group.options || []
                    }))
                };
            })
        );

        // 4. Nhóm theo Category - Trả về status để frontend không bị lỗi map
        const categoriesWithItems = (categories || []).map(cat => ({
            ...cat,
            status: cat.status || 'active', // Bắt buộc phải có trường này
            items: itemsWithModifiers.filter(i => i.category_id === cat.id)
        })).filter(cat => cat.items.length > 0);

        res.json({
            success: true,
            data: {
                restaurant_name: 'Smart Restaurant',
                categories: categoriesWithItems
            }
        });
    } catch (error: any) {
        console.error('SERVER ERROR:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

export { router as guestMenuRouter };