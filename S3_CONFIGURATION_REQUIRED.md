# AWS S3 Bucket Configuration Guide

## 🔧 Issue Found
Your S3 upload was failing because:
1. ✅ **Fixed**: `.env.local` had hyphens `-` instead of equals `=` signs
2. ⚠️ **To Configure**: S3 bucket needs proper permissions

## 📝 Example .env.local Format
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-southeast-1
S3_BASE_URL=https://your-bucket-name.s3.ap-southeast-1.amazonaws.com
```

**⚠️ Important**: Never commit actual credentials to Git. Keep them only in `.env.local`

## 🔐 S3 Bucket Configuration Required

You need to configure your S3 bucket `amzn-crystalbowls3` to allow:
1. Uploads from your application
2. Public read access for the uploaded files

### Option 1: Using AWS Console (Recommended)

#### Step 1: Enable Public Access
1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click on bucket: `amzn-crystalbowls3`
3. Go to **Permissions** tab
4. Under **Block public access (bucket settings)**, click **Edit**
5. **Uncheck** "Block all public access"
6. Save changes

#### Step 2: Add Bucket Policy
1. Still in **Permissions** tab
2. Scroll to **Bucket policy**
3. Click **Edit**
4. Paste this policy:

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

5. Click **Save changes**

#### Step 3: Verify IAM User Permissions
Make sure your IAM user has these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::amzn-crystalbowls3/*"
        }
    ]
}
```

To check/add:
1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users**
3. Find your user (the one with this access key)
4. Click **Add permissions** → **Create inline policy**
5. Use JSON editor and paste the policy above
6. Name it: `S3CrystalBowlUpload`
7. Click **Create policy**

### Option 2: Using AWS CLI

```bash
# 1. Update bucket policy
aws s3api put-bucket-policy --bucket amzn-crystalbowls3 --policy '{
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
}'

# 2. Disable block public access
aws s3api put-public-access-block --bucket amzn-crystalbowls3 --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

## 🧪 Test After Configuration

### Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Try Uploading
1. Go to admin dashboard
2. Try creating a product with an image
3. Check console logs - you should see:
   ```
   Converting image to WebP...
   ✓ Uploaded to S3: https://amzn-crystalbowls3.s3.ap-southeast-1.amazonaws.com/images/...
   ```

## ❓ Troubleshooting

### Error: "Access Denied"
- Check IAM user has `s3:PutObject` permission
- Verify AWS credentials are correct in `.env.local`

### Error: "Bucket policy invalid"
- Make sure bucket name is exactly `amzn-crystalbowls3` in the policy
- JSON must be valid (no trailing commas)

### Images Upload but Don't Display
- Check bucket policy allows `s3:GetObject`
- Verify "Block public access" is disabled

## 🔒 Security Note

**Important**: This configuration makes uploaded files publicly accessible. This is normal for a website where users need to view product images, event photos, etc.

If you need more control:
- Use CloudFront CDN with signed URLs
- Implement pre-signed URL generation
- Add IP restrictions in bucket policy

## 📞 Need Help?

If issues persist after following these steps, check:
1. AWS CloudTrail logs for denied requests
2. S3 access logs
3. Browser console for CORS errors

## ✅ Once Configured

After setting up S3 properly:
- ✅ Images will convert to WebP automatically
- ✅ Upload to S3 successfully
- ✅ Display on your website
- ✅ Reduce database size significantly
- ✅ Faster page loads

**Status**: Configuration required, then ready to go! 🚀



