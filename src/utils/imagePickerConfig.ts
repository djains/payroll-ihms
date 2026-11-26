import { CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';

/**
 * Standard compression options for Camera and Gallery:
 * - maxWidth: 1024px
 * - maxHeight: 1024px
 * - quality: 0.6
 *
 * This reduces image file size from 4-6 MB down to ~70-110 KB
 * while keeping text, facial details, and stamps crystal clear.
 */
export const COMPRESSED_CAMERA_OPTIONS: CameraOptions = {
  mediaType: 'photo',
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.6,
  saveToPhotos: false,
};

export const COMPRESSED_GALLERY_OPTIONS: ImageLibraryOptions = {
  mediaType: 'photo',
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.6,
  selectionLimit: 1,
};
