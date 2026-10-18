import { NextResponse } from 'next/server';

export async function GET() {
  const projectId = process.env.GCP_PROJECT_ID || null;
  const region = process.env.GCP_REGION || 'asia-northeast3';
  const bucketName = process.env.GCS_BUCKET_NAME || null;
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const isCloudRun = Boolean(process.env.K_SERVICE);

  return NextResponse.json({
    connected: Boolean(projectId || hasGeminiKey || isCloudRun),
    environment: isCloudRun ? 'cloud-run' : 'local',
    gcp: {
      projectId: projectId || 'not-configured (local mode)',
      region,
      gcsBucket: bucketName || 'local-browser-storage',
      vertexAiReady: hasGeminiKey || Boolean(projectId),
      cloudRunService: process.env.K_SERVICE || null,
      cloudRunRevision: process.env.K_REVISION || null,
    },
  });
}
