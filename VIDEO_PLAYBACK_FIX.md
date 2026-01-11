# Video Upload & Playback Fix Guide

## 🎥 Issue
Videos upload to S3 successfully but don't play in the browser.

## 🔍 Root Causes

### 1. **Missing CORS Configuration**
S3 bucket needs CORS policy to allow browsers to fetch and play videos.

### 2. **Content-Type Headers**
Videos need proper `Content-Type` headers (e.g., `video/mp4`).

## ✅ Solution: Configure S3 Bucket

### Step 1: Add CORS Policy

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click on bucket: `amzn-crystalbowls3`
3. Go to **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. Paste this CORS configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "Content-Length",
            "Content-Type",
            "Content-Range",
            "Accept-Ranges"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

7. Click **Save changes**

### Step 2: Verify Content-Type (Already Fixed in Code)

✅ Updated `lib/aws-s3.ts` to:
- Detect video MIME type from base64 string
- Set correct `Content-Type` header (video/mp4, video/webm, etc.)
- Add detailed logging for troubleshooting

### Step 3: Check Bucket Policy (from previous guide)

Make sure your bucket policy allows public `GetObject`:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::amzn-crystalbowls3/*"
        }
    ]
}
```

## 🧪 Test Your Video

After configuring CORS, test the video URL directly in browser:

```
https://amzn-crystalbowls3.s3.ap-southeast-1.amazonaws.com/videos/1768027816305-product-video-1768027816283-1.mp4
```

**Expected Result:**
- ✅ Video should download or play directly
- ✅ Browser should NOT show CORS errors in console

**If Still Not Working:**
- Check browser console for errors (F12)
- Look for CORS or Content-Type errors
- Verify the video file isn't corrupted

## 🔄 Re-upload Test

After CORS configuration:
1. **Restart dev server**: `npm run dev`
2. Upload a new test video
3. Check console logs for proper Content-Type detection
4. Test playback

## 📊 Console Logs to Look For

After the update, you'll see detailed logs:
```
[S3 Upload] Starting upload for videos/test-video.mp4
[S3 Upload] Detected MIME type: video/mp4, Buffer size: 1234567 bytes
[S3 Upload] Video upload - ContentType: video/mp4, Size: 1234567 bytes
[S3 Upload] Uploading to S3 - Key: videos/1768027816305-test.mp4, ContentType: video/mp4
✓ Uploaded to S3: https://amzn-crystalbowls3.s3.ap-southeast-1.amazonaws.com/videos/1768027816305-test.mp4
```

## 🎯 Quick Checklist

- [ ] CORS policy added to S3 bucket
- [ ] Bucket policy allows public GetObject
- [ ] Block public access is disabled
- [ ] Dev server restarted
- [ ] Test video uploaded after changes
- [ ] Browser console checked for errors

## 🆘 Still Not Working?

### Check Video File Itself
The uploaded video might be corrupted. Try:
1. Download the video from S3
2. Try to play it locally with VLC or another player
3. If corrupted, the issue is in the upload process, not S3 configuration

### Browser-Specific Issues
- **Chrome/Edge**: Check console for CORS errors
- **Firefox**: Check Network tab for failed requests
- **Safari**: May have stricter video codec requirements

### Alternative: Use Pre-signed URLs
If public access is restricted, you can use [pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html) for video playback.

## 📝 Summary

**Most Likely Fix**: Add CORS policy to S3 bucket ✅

Without CORS, browsers block video playback from S3 even if the file is publicly accessible!



