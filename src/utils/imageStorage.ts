// نظام تخزين الصور المحسن للتطبيق
import { invoke } from '@tauri-apps/api/tauri';
import { BaseDirectory, createDir, exists, writeFile, readBinaryFile, removeFile } from '@tauri-apps/api/fs';
import { join } from '@tauri-apps/api/path';

export interface ImageMetadata {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  createdAt: string;
  patientId: number;
}

export interface StoredImage {
  metadata: ImageMetadata;
  filePath: string;
  thumbnailPath?: string;
}

class ImageStorageManager {
  private readonly IMAGES_DIR = 'xray_images';
  private readonly THUMBNAILS_DIR = 'xray_thumbnails';
  private readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly THUMBNAIL_SIZE = 200;
  private readonly COMPRESSION_QUALITY = 0.8;

  constructor() {
    this.initializeDirectories();
  }

  // تهيئة مجلدات التخزين
  private async initializeDirectories(): Promise<void> {
    try {
      const imagesExists = await exists(this.IMAGES_DIR, { dir: BaseDirectory.AppData });
      if (!imagesExists) {
        await createDir(this.IMAGES_DIR, { dir: BaseDirectory.AppData, recursive: true });
      }

      const thumbnailsExists = await exists(this.THUMBNAILS_DIR, { dir: BaseDirectory.AppData });
      if (!thumbnailsExists) {
        await createDir(this.THUMBNAILS_DIR, { dir: BaseDirectory.AppData, recursive: true });
      }
    } catch (error) {
      console.error('خطأ في تهيئة مجلدات التخزين:', error);
    }
  }

  // ضغط الصورة وإنشاء thumbnail
  private async compressImage(file: File): Promise<{ compressed: Blob; thumbnail: Blob; metadata: Partial<ImageMetadata> }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // ضغط الصورة الأساسية
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // حساب الأبعاد المضغوطة
          const maxWidth = 1200;
          const maxHeight = 900;
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // إنشاء الصورة المضغوطة
          canvas.toBlob((compressedBlob) => {
            if (!compressedBlob) {
              reject(new Error('فشل في ضغط الصورة'));
              return;
            }
            
            // إنشاء thumbnail
            const thumbCanvas = document.createElement('canvas');
            const thumbCtx = thumbCanvas.getContext('2d')!;
            const thumbSize = this.THUMBNAIL_SIZE;
            
            thumbCanvas.width = thumbSize;
            thumbCanvas.height = thumbSize;
            
            // حساب موضع الصورة في المربع
            const scale = Math.min(thumbSize / width, thumbSize / height);
            const scaledWidth = width * scale;
            const scaledHeight = height * scale;
            const x = (thumbSize - scaledWidth) / 2;
            const y = (thumbSize - scaledHeight) / 2;
            
            thumbCtx.fillStyle = '#f3f4f6';
            thumbCtx.fillRect(0, 0, thumbSize, thumbSize);
            thumbCtx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            thumbCanvas.toBlob((thumbnailBlob) => {
              if (!thumbnailBlob) {
                reject(new Error('فشل في إنشاء thumbnail'));
                return;
              }
              
              resolve({
                compressed: compressedBlob,
                thumbnail: thumbnailBlob,
                metadata: {
                  originalName: file.name,
                  size: compressedBlob.size,
                  mimeType: 'image/jpeg',
                  width,
                  height,
                  createdAt: new Date().toISOString()
                }
              });
            }, 'image/jpeg', 0.7);
          }, 'image/jpeg', this.COMPRESSION_QUALITY);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
      img.src = URL.createObjectURL(file);
    });
  }

  // حفظ صورة جديدة
  async saveImage(file: File, patientId: number): Promise<StoredImage> {
    try {
      // التحقق من حجم الملف
      if (file.size > this.MAX_IMAGE_SIZE) {
        throw new Error(`حجم الصورة كبير جداً. الحد الأقصى ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`);
      }

      // ضغط الصورة
      const { compressed, thumbnail, metadata } = await this.compressImage(file);
      
      // إنشاء معرف فريد
      const imageId = `xray_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `${imageId}.jpg`;
      const thumbnailName = `${imageId}_thumb.jpg`;
      
      // تحويل Blob إلى Uint8Array
      const imageBuffer = new Uint8Array(await compressed.arrayBuffer());
      const thumbnailBuffer = new Uint8Array(await thumbnail.arrayBuffer());
      
      // حفظ الملفات
      const imagePath = await join(this.IMAGES_DIR, fileName);
      const thumbnailPath = await join(this.THUMBNAILS_DIR, thumbnailName);
      
      await writeFile(imagePath, imageBuffer, { dir: BaseDirectory.AppData });
      await writeFile(thumbnailPath, thumbnailBuffer, { dir: BaseDirectory.AppData });
      
      const fullMetadata: ImageMetadata = {
        ...metadata,
        id: imageId,
        patientId
      } as ImageMetadata;
      
      return {
        metadata: fullMetadata,
        filePath: imagePath,
        thumbnailPath
      };
    } catch (error) {
      console.error('خطأ في حفظ الصورة:', error);
      throw error;
    }
  }

  // تحميل صورة
  async loadImage(imageId: string): Promise<string> {
    try {
      const fileName = `${imageId}.jpg`;
      const imagePath = await join(this.IMAGES_DIR, fileName);
      
      const imageExists = await exists(imagePath, { dir: BaseDirectory.AppData });
      if (!imageExists) {
        throw new Error('الصورة غير موجودة');
      }
      
      const imageBuffer = await readBinaryFile(imagePath, { dir: BaseDirectory.AppData });
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('خطأ في تحميل الصورة:', error);
      throw error;
    }
  }

  // تحميل thumbnail
  async loadThumbnail(imageId: string): Promise<string> {
    try {
      const thumbnailName = `${imageId}_thumb.jpg`;
      const thumbnailPath = await join(this.THUMBNAILS_DIR, thumbnailName);
      
      const thumbnailExists = await exists(thumbnailPath, { dir: BaseDirectory.AppData });
      if (!thumbnailExists) {
        // إذا لم يوجد thumbnail، استخدم الصورة الأساسية
        return this.loadImage(imageId);
      }
      
      const thumbnailBuffer = await readBinaryFile(thumbnailPath, { dir: BaseDirectory.AppData });
      const blob = new Blob([thumbnailBuffer], { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('خطأ في تحميل thumbnail:', error);
      throw error;
    }
  }

  // حذف صورة
  async deleteImage(imageId: string): Promise<void> {
    try {
      const fileName = `${imageId}.jpg`;
      const thumbnailName = `${imageId}_thumb.jpg`;
      
      const imagePath = await join(this.IMAGES_DIR, fileName);
      const thumbnailPath = await join(this.THUMBNAILS_DIR, thumbnailName);
      
      // حذف الصورة الأساسية
      const imageExists = await exists(imagePath, { dir: BaseDirectory.AppData });
      if (imageExists) {
        await removeFile(imagePath, { dir: BaseDirectory.AppData });
      }
      
      // حذف thumbnail
      const thumbnailExists = await exists(thumbnailPath, { dir: BaseDirectory.AppData });
      if (thumbnailExists) {
        await removeFile(thumbnailPath, { dir: BaseDirectory.AppData });
      }
    } catch (error) {
      console.error('خطأ في حذف الصورة:', error);
      throw error;
    }
  }

  // تنظيف الذاكرة
  cleanupMemory(): void {
    // تنظيف Object URLs المؤقتة
    // يتم استدعاؤها عند إغلاق المكون أو تغيير المريض
  }
}

export const imageStorage = new ImageStorageManager();
