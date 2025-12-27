# Menu-Management

Hệ thống Quản lý Thực đơn Nhà hàng (Restaurant Menu Management System) với Admin Dashboard và Public Menu.

## 📋 Tính năng chính

### 🔐 Quản trị viên (Admin)

- **Quản lý Danh mục (Categories)**
  - Tạo, sửa, xóa danh mục món ăn
  - Sắp xếp thứ tự hiển thị (drag & drop)
  - Bật/tắt trạng thái active/inactive

- **Quản lý Món ăn (Menu Items)**
  - CRUD đầy đủ cho món ăn
  - Upload nhiều ảnh cho mỗi món
  - Đặt ảnh chính (primary photo)
  - Quản lý trạng thái: Available, Unavailable, Sold Out
  - Đánh dấu "Chef Choice" cho món đặc biệt
  - Thiết lập thời gian chuẩn bị (prep time)
  - Hỗ trợ giá tiền VNĐ

- **Quản lý Modifier Groups (Tùy chọn)**
  - Tạo nhóm tùy chọn (Size, Topping, Extra...)
  - Thiết lập single/multiple selection
  - Cấu hình min/max selections
  - Gắn modifier groups vào món ăn

- **Dashboard & Analytics**
  - Tổng quan menu health
  - Thống kê số món available/sold out
  - Cảnh báo món thiếu ảnh/mô tả

### 👥 Khách hàng (Public)

- **Xem Menu**
  - Giao diện mobile-friendly
  - Hiển thị theo danh mục
  - Filter theo status (Available, Unavailable, Sold Out)
  - Tìm kiếm món ăn
  - Sort theo: Ngày tạo, Giá, Chef Choice

- **Chi tiết món ăn**
  - Xem ảnh, mô tả, giá
  - Chọn modifier options
  - Hiển thị thời gian chuẩn bị

## 🛠️ Công nghệ sử dụng

### Frontend

| Technology | Version | Description |
|------------|---------|-------------|
| React | 18.2 | UI Library |
| TypeScript | 5.3 | Type Safety |
| Vite | 5.x | Build Tool |
| TanStack Query | 5.17 | Server State Management |
| React Router | 7.11 | Client-side Routing |
| Tailwind CSS | 3.x | Utility-first CSS |
| Radix UI | Latest | Accessible UI Components |
| React Hook Form | 7.49 | Form Management |
| Zod | 3.22 | Schema Validation |
| Framer Motion | 11.0 | Animations |
| Lucide React | 0.344 | Icons |
| dnd-kit | 6.1 | Drag and Drop |

### Backend

| Technology | Version | Description |
|------------|---------|-------------|
| Node.js | 20.x | Runtime |
| Express | 4.18 | Web Framework |
| TypeScript | 5.3 | Type Safety |
| Supabase | 2.89 | Database & Auth |
| PostgreSQL | 15.x | Database (via Supabase) |
| Multer | 1.4 | File Upload |
| Sharp | 0.33 | Image Processing |
| Zod | 3.22 | Schema Validation |
| tsx | 4.7 | TypeScript Execution |

## 📁 Cấu trúc dự án

```
Menu-Management/
├── backend/
│   ├── src/
│   │   ├── db/                 # Database config (Supabase)
│   │   ├── middleware/         # Express middlewares
│   │   │   ├── auth.ts         # Authentication
│   │   │   └── upload-validation.ts
│   │   ├── routes/             # API Routes
│   │   │   ├── categories.ts   # Categories CRUD
│   │   │   ├── menu-items-db.ts# Menu Items CRUD
│   │   │   ├── photos-db.ts    # Photo management
│   │   │   ├── modifier-groups.ts # Modifier Groups
│   │   │   └── guest-menu.ts   # Public menu API
│   │   ├── services/           # Business Logic
│   │   │   ├── categories-supabase.ts
│   │   │   ├── menu-items-supabase.ts
│   │   │   ├── photos-supabase.ts
│   │   │   └── modifier-groups-supabase.ts
│   │   ├── schemas/            # Zod Validation Schemas
│   │   └── server.ts           # Express App Entry
│   ├── uploads/                # Uploaded images
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Topbar
│   │   │   ├── menu/           # Menu-related components
│   │   │   │   ├── create-edit-item-dialog.tsx
│   │   │   │   ├── filter-bar.tsx
│   │   │   │   ├── sort-bar.tsx
│   │   │   │   ├── menu-grid.tsx
│   │   │   │   ├── menu-item-card.tsx
│   │   │   │   ├── photo-manager.tsx
│   │   │   │   └── guest-item-dialog.tsx
│   │   │   └── ui/             # Reusable UI components
│   │   ├── hooks/              # Custom React Hooks
│   │   │   ├── use-menu-query.ts
│   │   │   └── use-guest-menu.ts
│   │   ├── lib/                # Utilities & API clients
│   │   │   ├── api.ts          # Admin API calls
│   │   │   ├── guest-menu-api.ts # Public API calls
│   │   │   └── utils.ts
│   │   ├── pages/              # Page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── menu-items.tsx
│   │   │   ├── categories.tsx
│   │   │   ├── guest-menu.tsx
│   │   │   ├── analytics.tsx
│   │   │   └── settings.tsx
│   │   ├── types/              # TypeScript types
│   │   ├── styles/             # Global CSS
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
└── README.md
```

## 🚀 Cài đặt và chạy

### Yêu cầu

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Supabase Account** (hoặc PostgreSQL local)

### Backend Setup

1. **Di chuyển vào thư mục backend:**
   ```bash
   cd backend
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Tạo file môi trường `.env`:**
   ```env
   PORT=3000
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Upload Configuration
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880
   
   # Environment
   NODE_ENV=development
   ```

4. **Tạo database tables trong Supabase:**
   ```sql
   -- Categories
   CREATE TABLE menu_categories (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR(100) NOT NULL,
       description TEXT,
       display_order INT DEFAULT 0,
       status VARCHAR(20) DEFAULT 'active',
       is_deleted BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Menu Items
   CREATE TABLE menu_items (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR(200) NOT NULL,
       description TEXT,
       price DECIMAL(12,2) NOT NULL,
       category_id UUID REFERENCES menu_categories(id),
       status VARCHAR(20) DEFAULT 'available',
       prep_time_minutes INT,
       is_chef_recommended BOOLEAN DEFAULT FALSE,
       is_deleted BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Menu Item Photos
   CREATE TABLE menu_item_photos (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
       url TEXT NOT NULL,
       is_primary BOOLEAN DEFAULT FALSE,
       display_order INT DEFAULT 0,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

5. **Chạy server:**
   ```bash
   # Development mode (hot reload)
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

   Server chạy tại: `http://localhost:3000`

### Frontend Setup

1. **Di chuyển vào thư mục frontend:**
   ```bash
   cd frontend
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Tạo file môi trường `.env`:**
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Chạy development server:**
   ```bash
   npm run dev
   ```

   Frontend chạy tại: `http://localhost:5173`

5. **Build production:**
   ```bash
   npm run build
   npm run preview
   ```

## 📡 API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Kiểm tra trạng thái server |

### Categories (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/menu/categories` | Lấy tất cả danh mục |
| GET | `/api/admin/menu/categories/:id` | Lấy chi tiết danh mục |
| POST | `/api/admin/menu/categories` | Tạo danh mục mới |
| PUT | `/api/admin/menu/categories/:id` | Cập nhật danh mục |
| DELETE | `/api/admin/menu/categories/:id` | Xóa danh mục (soft delete) |
| PUT | `/api/admin/menu/categories/reorder` | Sắp xếp lại thứ tự |

### Menu Items (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/menu/items` | Lấy danh sách món (có filter, sort, pagination) |
| GET | `/api/admin/menu/items/:id` | Lấy chi tiết món ăn |
| POST | `/api/admin/menu/items` | Tạo món ăn mới |
| PUT | `/api/admin/menu/items/:id` | Cập nhật món ăn |
| DELETE | `/api/admin/menu/items/:id` | Xóa món ăn (soft delete) |
| GET | `/api/admin/menu/items/health` | Thống kê menu health |

**Query Parameters cho GET /items:**
- `search` - Tìm kiếm theo tên
- `category_id` - Filter theo danh mục
- `status` - Filter theo trạng thái (available, unavailable, sold_out)
- `sort_by` - Sắp xếp theo (price, created_at, name)
- `sort_order` - Thứ tự (asc, desc)
- `page` - Trang hiện tại
- `limit` - Số item mỗi trang

### Photos (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/menu/items/:id/photos` | Lấy danh sách ảnh |
| POST | `/api/admin/menu/items/:id/photos` | Upload ảnh (multipart/form-data) |
| DELETE | `/api/admin/menu/items/:id/photos/:photoId` | Xóa ảnh |
| PUT | `/api/admin/menu/items/:id/photos/:photoId/primary` | Đặt làm ảnh chính |

### Modifier Groups (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/menu/modifier-groups` | Lấy tất cả modifier groups |
| POST | `/api/admin/menu/modifier-groups` | Tạo modifier group mới |
| PUT | `/api/admin/menu/modifier-groups/:id` | Cập nhật modifier group |
| DELETE | `/api/admin/menu/modifier-groups/:id` | Xóa modifier group |
| POST | `/api/admin/menu/modifier-groups/items/:itemId/modifiers` | Gắn modifiers vào món |
| GET | `/api/admin/menu/modifier-groups/items/:itemId/modifiers` | Lấy modifiers của món |

### Guest Menu (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Lấy menu công khai cho khách hàng |

**Query Parameters:**
- `search` - Tìm kiếm theo tên món
- `category_id` - Filter theo danh mục
- `status` - Filter theo trạng thái
- `is_chef_recommended` - Chỉ lấy món Chef Choice
- `sort_by` - Sắp xếp (price, created_at, chef_choice)
- `sort_order` - Thứ tự (asc, desc)

---

## 📝 License

MIT License

## 👥 Author

GA04 Team
