# Image & Video Upload - WebP Conversion + AWS S3 Storage

## 🎯 Overview
All images and videos uploaded through the admin dashboard are automatically processed and stored in AWS S3. Images are converted to **WebP format** for optimal performance.

## 📋 Implementation Summary

### ✅ Areas Covered
1. **Products** - Product images (max 7) and videos
2. **Events** - Event featured images
3. **Past Events** - Thumbnail + gallery photos (max 6) + videos (max 2)
4. **Blogs** - Blog featured images
5. **Sessions** - Discovery, Private, Corporate, Free Studio Visit images and videos

### 🔄 Upload Flow

```
Admin uploads image/video
    ↓
Frontend converts to base64
    ↓
Sends to Backend API
    ↓
Backend receives base64/URL
    ↓
Image? → Convert to WebP (90% quality)
Video? → Keep as MP4
    ↓
Upload to AWS S3
    ↓
Get S3 URL
    ↓
Save S3 URL in MongoDB
    ↓
Return success to frontend
```

## 🛠️ Technical Details

### WebP Conversion (`lib/aws-s3.ts`)
```typescript
// Images are automatically converted to WebP
sharp(buffer)
  .webp({ quality: 90 }) // High quality
  .toBuffer()

// Videos remain as MP4
// No conversion for videos
```

### File Naming Convention
- **Products**: `product-{timestamp}-{index}.webp`
- **Events**: `event-{id}-{timestamp}.webp`
- **Past Events**: 
  - Thumbnail: `past-event-thumbnail-{id}-{timestamp}.webp`
  - Photos: `past-event-photo-{id}-{timestamp}-{index}.webp`
  - Videos: `past-event-video-{id}-{timestamp}-{index}.mp4`
- **Blogs**: `blog-{id}-{timestamp}.webp`
- **Sessions**: `session-{type}-{timestamp}.webp`

### S3 Folder Structure
```
amzn-crystalbowls3/
├── images/
│   ├── product-*.webp
│   ├── event-*.webp
│   ├── past-event-*.webp
│   ├── blog-*.webp
│   └── session-*.webp
└── videos/
    ├── product-video-*.mp4
    └── past-event-video-*.mp4
```

## 📊 API Routes Updated

### Products
- `POST /api/admin/products` - Create with S3 upload
- `PATCH /api/admin/products/[id]` - Update with S3 upload

### Events
- `POST /api/admin/events` - Create with S3 upload
- `PATCH /api/admin/events/[id]` - Update with S3 upload

### Past Events
- `POST /api/admin/past-events` - Create with S3 upload
- `PATCH /api/admin/past-events/[id]` - Update with S3 upload

### Blogs
- `POST /api/admin/blogs` - Create with S3 upload
- `PATCH /api/admin/blogs/[id]` - Update with S3 upload

### Sessions
- `POST /api/admin/sessions` - Create with S3 upload
  - Discovery, Private, Corporate, Free Studio Visit

## 🔑 Environment Variables Required

```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-southeast-1
S3_BASE_URL=https://amzn-crystalbowls3.s3.ap-southeast-1.amazonaws.com
```

## 💾 Database Storage

### Before (Old System)
```json
{
  "imageUrl": ["data:image/jpeg;base64,/9j/4AAQSkZJ..."] // Huge base64 strings
}
```

### After (New System)
```json
{
  "imageUrl": ["https://amzn-crystalbowls3.s3.ap-southeast-1.amazonaws.com/images/1736559234567-product-1.webp"]
}
```

## 📈 Benefits

### 1. **Smaller File Sizes**
- WebP reduces image size by **25-35%** compared to JPEG
- Faster page loads
- Lower bandwidth costs

### 2. **Better Performance**
- CDN-like delivery from S3
- Parallel loading
- Optimized for web

### 3. **Cleaner Database**
- No large base64 strings
- Faster queries
- Smaller backups

### 4. **Scalability**
- S3 handles unlimited files
- No server storage needed
- Automatic backup & redundancy

### 5. **Modern Format**
- WebP supported by all modern browsers (98%+ support)
- Better quality at smaller sizes
- Transparent backgrounds supported

## 🔒 Security & Access

- **S3 ACL**: `public-read` (images/videos are publicly accessible)
- **HTTPS**: All URLs use HTTPS
- **No direct DB access**: Only S3 URLs stored

## 🧪 Testing

### How to Test
1. Login to admin dashboard
2. Create/Edit any product, event, blog, etc.
3. Upload an image (JPEG/PNG)
4. Check console logs for S3 upload confirmation
5. Verify image displays correctly (WebP format)
6. Check database - should contain S3 URL only

### Expected Console Output
```
✓ Uploaded product image to S3 as WebP: https://amzn-crystalbowls3.s3.ap-southeast-1.amazonaws.com/images/1736559234567-product-1.webp
```

## 🐛 Error Handling

### Upload Failures
- API returns 500 with error message
- Transaction rolled back (no partial saves)
- Original content not affected

### Example Error Response
```json
{
  "success": false,
  "message": "Failed to upload image 2 to S3"
}
```

## 🔄 Backward Compatibility

### Existing S3 URLs
- If URL starts with `https://`, it's kept as-is
- No re-upload for existing images
- Seamless migration

### Mixed Content
- Can handle mix of new uploads and existing URLs
- Automatically detects and processes only new content

## 📦 Dependencies

```json
{
  "@aws-sdk/client-s3": "^3.x.x",
  "sharp": "^0.x.x"
}
```

## 🚀 Future Enhancements

### Potential Improvements
1. **Multiple Image Sizes**
   - Generate thumbnails automatically
   - Responsive images (small, medium, large)

2. **Lazy Loading**
   - Progressive image loading
   - Blur-up placeholder

3. **Image Optimization**
   - Smart cropping
   - Face detection
   - Auto-rotation

4. **CDN Integration**
   - CloudFront distribution
   - Edge caching
   - Geo-optimization

5. **Cleanup Service**
   - Delete old/unused images
   - Orphan file detection
   - Storage monitoring

## 📝 Notes

- **Max Image Limits**:
  - Products: 7 images
  - Past Events: 6 photos
  - Events/Blogs/Sessions: 1 image each

- **Video Formats**: MP4 only (no conversion)
- **Quality**: WebP at 90% quality (excellent balance)
- **File Size**: No explicit limit (S3 handles large files)

## ✅ Status

**All implementations completed and tested successfully!**

Build Status: ✅ **PASSING**



