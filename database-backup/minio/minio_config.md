# MinIO Object Storage Configuration Export

**Service**: NextAgent Lite Object Storage  
**Server**: http://103.6.168.6:9000  
**Export Date**: 2025-08-27  

## Connection Configuration

```yaml
minio:
  endpoint: "103.6.168.6:9000"
  access_key: "minio"
  secret_key: "minio123"
  secure: false  # HTTP not HTTPS
  region: "us-east-1"  # default region
  public_endpoint: "http://103.6.168.6:9000"
```

## Bucket Structure

Based on the .env configuration, the following buckets are used:

### 1. Document Storage
- **policy-qa-documents** - Primary document storage
  - Uploaded PDF, DOCX, TXT files
  - Original document preservation
  - Organized by collection and date

### 2. Media Files
- **policy-qa-media** - Multimedia content
  - Images (PNG, JPG, GIF)
  - Videos (MP4, AVI, MOV)
  - Audio files for transcription

### 3. System Assets
- **policy-qa-thumbnails** - Generated thumbnails
  - Document preview images
  - Media file thumbnails
  - UI asset previews

### 4. Knowledge Graph Data
- **policy-qa-knowledge-graph** - Graph storage
  - Graph visualization assets
  - Node/edge relationship files
  - Graph snapshots and exports

### 5. System Operations
- **policy-qa-reports** - Generated reports
  - Analytics reports
  - Performance summaries
  - Export files

- **policy-qa-backups** - System backups
  - Database dumps
  - Configuration backups
  - Application state snapshots

- **policy-qa-logs** - Log file storage
  - Application logs
  - Access logs
  - Error logs archive

- **policy-qa-cache** - Temporary cache files
  - Processing intermediate files
  - Temporary uploads
  - Cache data with TTL

## Bucket Policies

### Public Read Policy (for thumbnails and public assets)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "*"},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::policy-qa-thumbnails/*"]
    }
  ]
}
```

### Private Access Policy (for documents)
```json
{
  "Version": "2012-10-17", 
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::*:user/minio"},
      "Action": [
        "s3:GetObject",
        "s3:PutObject", 
        "s3:DeleteObject"
      ],
      "Resource": ["arn:aws:s3:::policy-qa-documents/*"]
    }
  ]
}
```

## Directory Structure

### Documents Bucket Layout
```
policy-qa-documents/
├── collections/
│   ├── {collection-id}/
│   │   ├── {document-id}/
│   │   │   ├── original.pdf
│   │   │   ├── metadata.json
│   │   │   └── chunks/
│   │   └── ...
│   └── ...
├── uploads/
│   ├── {year}/{month}/{day}/
│   │   ├── {timestamp}_{filename}
│   │   └── ...
│   └── ...
└── temp/
    └── processing/
```

### Media Bucket Layout
```
policy-qa-media/
├── images/
│   ├── {message-id}/
│   │   ├── {image-id}.jpg
│   │   └── ...
│   └── ...
├── videos/
│   └── {video-id}.mp4
└── audio/
    └── {audio-id}.mp3
```

## Setup Commands

### 1. MinIO Server Installation
```bash
# Download MinIO server
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create service user
sudo useradd -r minio-user -s /sbin/nologin

# Create data directory
sudo mkdir /data/minio
sudo chown minio-user:minio-user /data/minio
```

### 2. Service Configuration
```ini
# /etc/systemd/system/minio.service
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
WorkingDirectory=/usr/local/

User=minio-user
Group=minio-user
ProtectProc=invisible

EnvironmentFile=-/etc/default/minio
ExecStartPre=/bin/bash -c "if [ -z \"${MINIO_VOLUMES}\" ]; then echo \"Variable MINIO_VOLUMES not set in /etc/default/minio\"; exit 1; fi"
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES

Restart=always
LimitNOFILE=65536
TasksMax=infinity
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

### 3. Environment Configuration
```bash
# /etc/default/minio
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
MINIO_VOLUMES="/data/minio"
MINIO_OPTS="--console-address :9001"
MINIO_SERVER_URL="http://103.6.168.6:9000"
```

### 4. Bucket Creation Script
```bash
#!/bin/bash
# create_buckets.sh

MINIO_ENDPOINT="http://103.6.168.6:9000"
MINIO_ACCESS_KEY="minio" 
MINIO_SECRET_KEY="minio123"

# Install mc (MinIO Client)
curl https://dl.min.io/client/mc/release/linux-amd64/mc -o mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure mc
mc alias set myminio $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Create buckets
buckets=(
    "policy-qa-documents"
    "policy-qa-media" 
    "policy-qa-thumbnails"
    "policy-qa-knowledge-graph"
    "policy-qa-reports"
    "policy-qa-backups"
    "policy-qa-logs"
    "policy-qa-cache"
)

for bucket in "${buckets[@]}"; do
    echo "Creating bucket: $bucket"
    mc mb myminio/$bucket
done

# Set public read for thumbnails
mc policy set public myminio/policy-qa-thumbnails

echo "All buckets created successfully!"
```

## Data Migration Commands

### Export Bucket Contents
```bash
# Sync entire bucket to local directory
mc mirror myminio/policy-qa-documents ./backup/documents/

# Export bucket list and sizes
mc ls --recursive myminio/policy-qa-documents > documents_inventory.txt
mc du myminio/policy-qa-documents > documents_sizes.txt

# Export all bucket policies
for bucket in $(mc ls myminio | awk '{print $5}'); do
    echo "=== Policy for $bucket ===" >> bucket_policies.txt
    mc policy get myminio/$bucket >> bucket_policies.txt
    echo "" >> bucket_policies.txt
done
```

### Backup All Data
```bash
#!/bin/bash
# backup_minio.sh

BACKUP_DIR="/backup/minio/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Sync all buckets
buckets=$(mc ls myminio | awk '{print $5}')
for bucket in $buckets; do
    echo "Backing up bucket: $bucket"
    mc mirror myminio/$bucket "$BACKUP_DIR/$bucket/"
done

# Export configuration
mc admin info myminio > "$BACKUP_DIR/server_info.txt"
mc admin config get myminio > "$BACKUP_DIR/server_config.json"

echo "MinIO backup completed in $BACKUP_DIR"
```

## Application Integration

### Environment Variables
```bash
# In mat-backend/.env
MINIO_ENABLED="true"
MINIO_ENDPOINT="103.6.168.6:9000"
MINIO_ACCESS_KEY="minio"
MINIO_SECRET_KEY="minio123"
MINIO_SECURE="false"

# Individual bucket configuration  
MINIO_DOCUMENTS_BUCKET="policy-qa-documents"
MINIO_MEDIA_BUCKET="policy-qa-media"
MINIO_THUMBNAILS_BUCKET="policy-qa-thumbnails"
MINIO_KNOWLEDGE_GRAPH_BUCKET="policy-qa-knowledge-graph"
MINIO_REPORTS_BUCKET="policy-qa-reports"
MINIO_BACKUPS_BUCKET="policy-qa-backups"
MINIO_LOGS_BUCKET="policy-qa-logs"
MINIO_CACHE_BUCKET="policy-qa-cache"

# CDN and public access
MINIO_PUBLIC_ENDPOINT="http://103.6.168.6:9000"
MINIO_PRESIGNED_URL_EXPIRES="3600"
MINIO_AUTO_CREATE_BUCKETS="false"
MINIO_SKIP_BUCKET_VALIDATION=true
```

### Python Client Usage
```python
from minio import Minio
from minio.error import S3Error

# Initialize client
client = Minio(
    "103.6.168.6:9000",
    access_key="minio",
    secret_key="minio123", 
    secure=False
)

# Upload file
client.fput_object(
    "policy-qa-documents",
    "test/sample.pdf",
    "/path/to/sample.pdf"
)

# Generate presigned URL
url = client.presigned_get_object(
    "policy-qa-documents",
    "test/sample.pdf",
    expires=timedelta(hours=1)
)
```

## Migration Notes

### To New MinIO Instance
1. **Install MinIO server** with same version
2. **Configure same access keys** and network settings  
3. **Create all buckets** with proper policies
4. **Sync data** using `mc mirror` commands
5. **Update application configuration** with new endpoint
6. **Test file upload/download** functionality
7. **Verify presigned URL generation**

### Storage Optimization
- Set lifecycle policies for temporary files
- Configure compression for log files
- Implement automatic cleanup for cache bucket
- Monitor storage usage and set quotas

### Security Recommendations
- Change default access keys in production
- Enable HTTPS with proper certificates
- Implement bucket-level access policies
- Set up audit logging for compliance
- Regular security updates and monitoring