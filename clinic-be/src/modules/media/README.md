# Media Module - API Usage

## Endpoints

All endpoints require authentication via Bearer token.

### Upload File

```http
POST /media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `file`: File (required) - The file to upload (form-data with key "file")

**Response:**
```json
{
  "data": {
    "id": "file-id",
    "key": "1234567890-filename.jpg"
  },
  "status": 201,
  "message": "File uploaded successfully."
}
```

**Notes:**
- Files are uploaded to AWS S3
- File metadata is stored in the database
- Returns the file ID and S3 key for future reference

### Delete File

```http
DELETE /media/delete/:id
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: string (required) - The file ID to delete

**Response:**
```json
{
  "data": null,
  "status": 204,
  "message": "File deleted successfully."
}
```

**Notes:**
- Deletes the file from both S3 and the database
- Returns 404 if file not found

### Generate Presigned URL

```http
GET /media/presigned-url/:id
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: string (required) - The file ID to generate a presigned URL for

**Response:**
```json
{
  "data": {
    "url": "https://s3.amazonaws.com/bucket/file.jpg?X-Amz-Algorithm=...",
    "filename": "file.jpg"
  },
  "status": 200,
  "message": "Presigned URL generated successfully."
}
```

**Notes:**
- Presigned URLs are temporary and expire after a configured time (default: 3600 seconds)
- Use presigned URLs to allow clients to access private S3 files without exposing AWS credentials
- The URL expiration time can be configured via `DEFAULT_PRESIGNED_URL_EXPIRATION` environment variable

## Configuration

The media module requires the following environment variables:

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., "us-east-1")
- `AWS_BUCKET_NAME` - S3 bucket name
- `DEFAULT_PRESIGNED_URL_EXPIRATION` - Presigned URL expiration time in seconds (optional, default: 3600)

## File Schema

Files are stored in MongoDB with the following schema:

```typescript
{
  _id: ObjectId,
  path: string, // S3 key/path
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Upload a file using cURL

```bash
curl -X POST http://localhost:3000/media/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/file.jpg"
```

### Upload a file using JavaScript (FormData)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});

const result = await response.json();
console.log('File ID:', result.data.id);
```

### Get a presigned URL

```javascript
const response = await fetch(`http://localhost:3000/media/presigned-url/${fileId}`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <token>'
  }
});

const result = await response.json();
console.log('Presigned URL:', result.data.url);
```

