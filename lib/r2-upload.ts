import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadImageToR2(imageUrl: string, fileName: string): Promise<string> {
  try {
    // Download the image from the OpenAI URL
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error('Failed to download image from OpenAI')
    }
    
    const imageBuffer = await response.arrayBuffer()
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `soulmates/${fileName}`,
      Body: Buffer.from(imageBuffer),
      ContentType: 'image/png',
      ACL: 'public-read',
    })
    
    await r2Client.send(command)
    
    // Return the public URL
    return `${process.env.R2_PUBLIC_URL}soulmates/${fileName}`
  } catch (error) {
    console.error('Error uploading image to R2:', error)
    throw new Error('Failed to upload image to R2')
  }
}

export async function generateSoulmateImageFileName(): Promise<string> {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  return `soulmate-${timestamp}-${randomId}.png`
} 