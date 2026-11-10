import { apiClient } from '@/lib/api-client';
import type { components } from '@/types/api.generated';

type UploadResponseDto = components['schemas']['UploadResponseDto'];
type ConfirmResponseDto = components['schemas']['ConfirmResponseDto'];

async function requestUploadUrl(mimeType: string, size: number): Promise<UploadResponseDto> {
  const { data } = await apiClient.post<UploadResponseDto>('/media/upload-url', { mimeType, size });
  return data;
}

async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
}

async function confirmUpload(mediaId: string): Promise<ConfirmResponseDto> {
  const { data } = await apiClient.post<ConfirmResponseDto>(`/media/${mediaId}/confirm`);
  return data;
}

export async function uploadMedia(file: File): Promise<{ mediaId: string; url: string }> {
  const { mediaId, uploadUrl } = await requestUploadUrl(file.type, file.size);
  await uploadToS3(uploadUrl, file);
  const { url } = await confirmUpload(mediaId);
  return { mediaId, url };
}
