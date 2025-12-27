import { supabase } from '../db/supabase.js';
import { CreateModifierGroupInput, UpdateModifierGroupInput, ModifierOptionInput } from '../schemas/validation.js';

export interface ModifierOption {
    id: string;
    modifier_group_id: string;
    name: string;
    price: number;
    is_default: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface ModifierGroup {
    id: string;
    restaurant_id: string;
    name: string;
    description: string | null;
    is_required: boolean;
    min_selections: number;
    max_selections: number;
    selection_type: 'single' | 'multiple';
    display_order: number;
    status: 'active' | 'inactive';
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    options?: ModifierOption[];
}

export class ModifierGroupService {
    /**
     * Tạo Modifier Group mới
     */
    async create(restaurantId: string, data: CreateModifierGroupInput): Promise<ModifierGroup> {
        // Kiểm tra tên trùng lặp
        const { data: existing } = await supabase
            .from('modifier_groups')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .ilike('name', data.name)
            .eq('is_deleted', false)
            .single();

        if (existing) {
            throw new Error('DUPLICATE_NAME: Tên nhóm tùy chọn đã tồn tại');
        }

        // Validate selection rules
        if (data.selection_type === 'single' && data.max_selections > 1) {
            throw new Error('INVALID_SELECTION: Single-select chỉ được chọn tối đa 1');
        }

        if (data.min_selections > data.max_selections) {
            throw new Error('INVALID_SELECTION: Min selections không được lớn hơn max selections');
        }

        // Tạo modifier group
        const { data: group, error: groupError } = await supabase
            .from('modifier_groups')
            .insert({
                restaurant_id: restaurantId,
                name: data.name,
                description: data.description || null,
                is_required: data.is_required,
                min_selections: data.min_selections,
                max_selections: data.max_selections,
                selection_type: data.selection_type,
                display_order: data.display_order,
                status: data.status,
            })
            .select()
            .single();

        if (groupError) {
            console.error('Error creating modifier group:', groupError);
            throw new Error('Không thể tạo nhóm tùy chọn: ' + groupError.message);
        }

        // Tạo options nếu có
        if (data.options && data.options.length > 0) {
            const optionsToInsert = data.options.map((opt, index) => ({
                modifier_group_id: group.id,
                name: opt.name,
                price: opt.price,
                is_default: opt.is_default,
                display_order: opt.display_order ?? index,
            }));

            const { error: optionsError } = await supabase
                .from('modifier_options')
                .insert(optionsToInsert);

            if (optionsError) {
                console.error('Error creating options:', optionsError);
                // Rollback: xóa group vừa tạo
                await supabase.from('modifier_groups').delete().eq('id', group.id);
                throw new Error('Không thể tạo tùy chọn: ' + optionsError.message);
            }
        }

        return this.getById(group.id, restaurantId) as Promise<ModifierGroup>;
    }

    /**
     * Lấy tất cả Modifier Groups
     */
    async getAll(restaurantId: string): Promise<ModifierGroup[]> {
        const { data: groups, error } = await supabase
            .from('modifier_groups')
            .select(`
        *,
        modifier_options(*)
      `)
            .eq('restaurant_id', restaurantId)
            .eq('is_deleted', false)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching modifier groups:', error);
            throw new Error('Không thể lấy danh sách nhóm tùy chọn');
        }

        return (groups || []).map(group => ({
            ...group,
            options: (group.modifier_options || []).sort((a: any, b: any) =>
                a.display_order - b.display_order
            ),
            modifier_options: undefined,
        }));
    }

    /**
     * Lấy Modifier Group theo ID
     */
    async getById(id: string, restaurantId: string): Promise<ModifierGroup | null> {
        const { data: group, error } = await supabase
            .from('modifier_groups')
            .select(`
        *,
        modifier_options(*)
      `)
            .eq('id', id)
            .eq('restaurant_id', restaurantId)
            .eq('is_deleted', false)
            .single();

        if (error || !group) {
            return null;
        }

        return {
            ...group,
            options: (group.modifier_options || []).sort((a: any, b: any) =>
                a.display_order - b.display_order
            ),
            modifier_options: undefined,
        };
    }

    /**
     * Cập nhật Modifier Group
     */
    async update(id: string, restaurantId: string, data: UpdateModifierGroupInput): Promise<ModifierGroup | null> {
        // Kiểm tra tồn tại
        const existing = await this.getById(id, restaurantId);
        if (!existing) {
            return null;
        }

        // Kiểm tra tên trùng lặp nếu cập nhật tên
        if (data.name) {
            const { data: duplicate } = await supabase
                .from('modifier_groups')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .ilike('name', data.name)
                .neq('id', id)
                .eq('is_deleted', false)
                .single();

            if (duplicate) {
                throw new Error('DUPLICATE_NAME: Tên nhóm tùy chọn đã tồn tại');
            }
        }

        // Validate selection rules
        const minSel = data.min_selections ?? existing.min_selections;
        const maxSel = data.max_selections ?? existing.max_selections;
        const selType = data.selection_type ?? existing.selection_type;

        if (selType === 'single' && maxSel > 1) {
            throw new Error('INVALID_SELECTION: Single-select chỉ được chọn tối đa 1');
        }

        if (minSel > maxSel) {
            throw new Error('INVALID_SELECTION: Min selections không được lớn hơn max selections');
        }

        const updateData: any = { updated_at: new Date().toISOString() };
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.is_required !== undefined) updateData.is_required = data.is_required;
        if (data.min_selections !== undefined) updateData.min_selections = data.min_selections;
        if (data.max_selections !== undefined) updateData.max_selections = data.max_selections;
        if (data.selection_type !== undefined) updateData.selection_type = data.selection_type;
        if (data.display_order !== undefined) updateData.display_order = data.display_order;
        if (data.status !== undefined) updateData.status = data.status;

        const { error } = await supabase
            .from('modifier_groups')
            .update(updateData)
            .eq('id', id)
            .eq('restaurant_id', restaurantId)
            .eq('is_deleted', false);

        if (error) {
            console.error('Error updating modifier group:', error);
            throw new Error('Không thể cập nhật nhóm tùy chọn');
        }

        // Cập nhật options nếu có
        if (data.options) {
            // Xóa options cũ
            await supabase
                .from('modifier_options')
                .delete()
                .eq('modifier_group_id', id);

            // Thêm options mới
            if (data.options.length > 0) {
                const optionsToInsert = data.options.map((opt, index) => ({
                    modifier_group_id: id,
                    name: opt.name,
                    price: opt.price,
                    is_default: opt.is_default,
                    display_order: opt.display_order ?? index,
                }));

                const { error: optionsError } = await supabase
                    .from('modifier_options')
                    .insert(optionsToInsert);

                if (optionsError) {
                    console.error('Error updating options:', optionsError);
                    throw new Error('Không thể cập nhật tùy chọn');
                }
            }
        }

        return this.getById(id, restaurantId);
    }

    /**
     * Xóa Modifier Group (soft delete)
     */
    async delete(id: string, restaurantId: string): Promise<{ success: boolean; message: string }> {
        const existing = await this.getById(id, restaurantId);
        if (!existing) {
            return { success: false, message: 'Nhóm tùy chọn không tồn tại' };
        }

        // Kiểm tra xem có menu item nào đang sử dụng không
        const { count } = await supabase
            .from('menu_item_modifiers')
            .select('*', { count: 'exact', head: true })
            .eq('modifier_group_id', id);

        if (count && count > 0) {
            return {
                success: false,
                message: 'Không thể xóa nhóm tùy chọn vì đang được sử dụng bởi món ăn. Vui lòng gỡ liên kết trước.',
            };
        }

        const { error } = await supabase
            .from('modifier_groups')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('restaurant_id', restaurantId);

        if (error) {
            console.error('Error deleting modifier group:', error);
            return { success: false, message: 'Không thể xóa nhóm tùy chọn' };
        }

        return { success: true, message: 'Đã xóa nhóm tùy chọn thành công' };
    }

    /**
     * Gắn Modifier Groups vào Menu Item
     */
    async attachToMenuItem(menuItemId: string, restaurantId: string, modifierGroupIds: string[], displayOrders?: Record<string, number>): Promise<void> {
        // 1. Xóa tất cả liên kết cũ của món ăn này
        const { error: deleteError } = await supabase
            .from('menu_item_modifiers')
            .delete()
            .eq('menu_item_id', menuItemId);

        if (deleteError) {
            console.error('Error clearing old modifiers:', deleteError);
            throw new Error('Không thể cập nhật danh sách tùy chọn');
        }

        // 2. Nếu danh sách mới trống (bỏ check hết), thì dừng ở đây (đã xóa xong)
        if (!modifierGroupIds || modifierGroupIds.length === 0) {
            return;
        }

        // 3. Thêm các liên kết mới
        const links = modifierGroupIds.map((groupId, index) => ({
            menu_item_id: menuItemId,
            modifier_group_id: groupId,
            display_order: displayOrders?.[groupId] ?? index,
        }));

        const { error: insertError } = await supabase
            .from('menu_item_modifiers')
            .insert(links);

        if (insertError) {
            console.error('Error inserting new modifiers:', insertError);
            throw new Error('Không thể gán nhóm tùy chọn mới');
        }
    }
    /**
     * Lấy Modifier Groups của Menu Item
     */
    async getByMenuItemId(menuItemId: string): Promise<ModifierGroup[]> {
        const { data: links, error } = await supabase
            .from('menu_item_modifiers')
            .select(`
        display_order,
        modifier_groups!inner(
          *,
          modifier_options(*)
        )
      `)
            .eq('menu_item_id', menuItemId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching menu item modifiers:', error);
            throw new Error('Không thể lấy danh sách tùy chọn của món ăn');
        }

        return (links || []).map((link: any) => {
            const group = link.modifier_groups;
            return {
                ...group,
                options: (group.modifier_options || []).sort((a: any, b: any) =>
                    a.display_order - b.display_order
                ),
                modifier_options: undefined,
            };
        });
    }

}

export const modifierGroupService = new ModifierGroupService();