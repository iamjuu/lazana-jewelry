# 📋 TODO: Update Events & Past Events with S3 Direct Upload

## 🎯 Goal
Apply the same S3 direct upload logic (like Products) to:
1. **Events** page - Image upload
2. **Past Events** page - Thumbnail, Photos (max 6), Videos (max 2)

## 🔄 Current Problem
Both pages use **base64 encoding** which causes:
- ❌ File corruption for large files
- ❌ Slow uploads
- ❌ Memory issues
- ❌ Auto-upload on file select

## ✅ Desired Behavior (Like Products)
1. **Select** file → Shows preview + filename + size
2. Click **"Upload"** button → Uploads to S3
3. **Success** message → Shows S3 URL
4. **Replace** → Deletes old from S3, uploads new
5. **Remove** → Deletes from S3

---

## 📝 Implementation Plan

### 1. Events Page (`app/admin/dashboard/events/page.tsx`)

#### Current Flow:
```tsx
handleImageUpload(file) {
  FileReader → base64 → formData.image
}
```

#### New Flow:
```tsx
// Add state
const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
const [uploadingImage, setUploadingImage] = useState(false);
const [uploadedImageUrl, setUploadedImageUrl] = useState("");

// Select handler
handleImageSelect(file) {
  setPendingImageFile(file); // Don't upload yet
}

// Upload handler
async handleImageUpload() {
  const formData = new FormData();
  formData.append('file', pendingImageFile);
  formData.append('folder', 'images');
  
  // Delete old image if replacing
  if (uploadedImageUrl) {
    await fetch('/api/upload/s3/delete', { ... });
  }
  
  const response = await fetch('/api/upload/s3', { method: 'POST', body: formData });
  const { url } = await response.json();
  
  setUploadedImageUrl(url);
  setFormData({ ...formData, image: url });
}

// Remove handler
async handleImageRemove() {
  await fetch('/api/upload/s3/delete', { body: JSON.stringify({ url: uploadedImageUrl }) });
  setUploadedImageUrl("");
}
```

#### UI Changes:
```tsx
<input type="file" onChange={handleImageSelect} />
{pendingImageFile && !uploadedImageUrl && (
  <>
    <div>📁 {pendingImageFile.name} - {size} MB</div>
    <button onClick={handleImageUpload} disabled={uploadingImage}>
      {uploadingImage ? 'Uploading...' : 'Upload'}
    </button>
  </>
)}
{uploadedImageUrl && (
  <div>
    ✅ Uploaded!
    <button onClick={handleImageRemove}>×</button>
  </div>
)}
```

---

### 2. Past Events Page (`app/admin/dashboard/past-events/page.tsx`)

#### A. Thumbnail Image

Same as Events page above.

#### B. Photos (Max 6)

```tsx
// Add state
const [pendingPhotoFiles, setPendingPhotoFiles] = useState<(File | null)[]>([]);
const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);

// Select handler
handlePhotoSelect(file, index) {
  const newFiles = [...pendingPhotoFiles];
  newFiles[index] = file;
  setPendingPhotoFiles(newFiles);
}

// Upload handler
async handlePhotoUpload(index) {
  const file = pendingPhotoFiles[index];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'images');
  
  // Delete old if replacing
  if (uploadedPhotoUrls[index]) {
    await fetch('/api/upload/s3/delete', { ... });
  }
  
  const response = await fetch('/api/upload/s3', { ... });
  const { url } = await response.json();
  
  const newUrls = [...uploadedPhotoUrls];
  newUrls[index] = url;
  setUploadedPhotoUrls(newUrls);
  setFormData({ ...formData, photos: newUrls });
}

// Remove handler
async handlePhotoRemove(index) {
  const url = uploadedPhotoUrls[index];
  await fetch('/api/upload/s3/delete', { body: JSON.stringify({ url }) });
  
  const newUrls = uploadedPhotoUrls.filter((_, i) => i !== index);
  setUploadedPhotoUrls(newUrls);
}
```

#### C. Videos (Max 2)

**Exactly like Products** - Already implemented in ProductForm.tsx:
- Pending file state
- Upload button
- S3 direct upload
- Old video deletion

---

## 🗂️ Files to Update

1. ✅ `app/api/upload/s3/route.ts` - Already supports FormData
2. ✅ `app/api/upload/s3/delete/route.ts` - Already created
3. ✅ `lib/aws-s3.ts` - Already supports Buffer upload
4. ⚠️ `app/admin/dashboard/events/page.tsx` - **NEEDS UPDATE**
5. ⚠️ `app/admin/dashboard/past-events/page.tsx` - **NEEDS UPDATE**

---

## 🎨 UI Pattern (Consistent Across All)

```
┌─────────────────────────────────────┐
│ Select File: [Choose File]          │
├─────────────────────────────────────┤
│ 📁 video.mp4 - 15.23 MB             │
│ ⚠️ Click Upload button               │
│ [Upload] ← Click to upload          │
└─────────────────────────────────────┘

After Upload:
┌─────────────────────────────────────┐
│ ✅ File uploaded successfully!       │
│ URL: https://s3.../video.mp4        │
│                               [×]    │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Events Page:
- [ ] Select image → Shows preview + filename
- [ ] Click Upload → Uploads to S3
- [ ] Success message appears
- [ ] Save event → S3 URL in MongoDB
- [ ] Edit event → Replace image deletes old from S3
- [ ] Remove image → Deletes from S3

### Past Events Page:
- [ ] Thumbnail: Same as above
- [ ] Photos: Upload up to 6, each with Upload button
- [ ] Videos: Upload up to 2, each with Upload button
- [ ] Replace any media → Deletes old from S3
- [ ] Remove any media → Deletes from S3

---

## 📊 Benefits

- ✅ No file corruption
- ✅ Larger file support (100MB videos)
- ✅ Automatic S3 cleanup
- ✅ Consistent UX across all pages
- ✅ Better performance
- ✅ Lower memory usage

---

## ⚡ Quick Implementation

Since both files follow similar patterns to ProductForm.tsx, you can:

1. **Copy state management** from ProductForm.tsx
2. **Copy handlers** (handleVideoSelect, handleVideoUpload, handleVideoRemove)
3. **Copy UI components** (Upload button, file preview, success message)
4. **Adjust** for single image (Events) vs multiple (Past Events)

---

## 🚀 Priority

**High** - Same issue (base64 corruption) affects Events and Past Events uploads.

**Status**: ⏳ Documented - Ready for implementation

---

## 💡 Note

The implementation for Events and Past Events follows **exactly the same pattern** as Products. The only differences are:

- Events: 1 image
- Past Events: 1 thumbnail + 6 photos + 2 videos
- Products: 7 images + 2 videos

The core logic is identical! 🎉



