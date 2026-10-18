#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# GDG Design Studio - GCP Initial Setup Script
# Usage: ./scripts/setup-gcp.sh <YOUR_GCP_PROJECT_ID> [REGION]
# ==============================================================================

PROJECT_ID="${1:-}"
REGION="${2:-asia-northeast3}"
AR_REPO="gdg-studio-repo"
SERVICE_NAME="gdg-design-studio"
BUCKET_NAME="${PROJECT_ID}-gdg-design-assets"

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: ./scripts/setup-gcp.sh <GCP_PROJECT_ID> [REGION]"
  echo "Example: ./scripts/setup-gcp.sh my-gdg-project asia-northeast3"
  exit 1
fi

echo "🚀 Setting up GCP Project: $PROJECT_ID (Region: $REGION)"
gcloud config set project "$PROJECT_ID"

echo "1️⃣ Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com \
  aiplatform.googleapis.com

echo "2️⃣ Creating Artifact Registry repository ($AR_REPO)..."
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Docker repository for GDG Design Studio" || echo "Repository already exists."

echo "3️⃣ Creating Cloud Storage bucket ($BUCKET_NAME) for design assets..."
gcloud storage buckets create "gs://$BUCKET_NAME" \
  --location="$REGION" \
  --uniform-bucket-level-access || echo "Bucket already exists."

echo "✅ GCP infrastructure setup completed!"
echo "👉 Deploy manually anytime with:"
echo "   gcloud builds submit --config cloudbuild.yaml"
