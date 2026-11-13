import { ApiError } from './apiClient.js'

export async function validateReferenceImages(files, maxCount, allowEmpty = false) {
  if (!Array.isArray(files) || (!allowEmpty && !files.length) || files.length > maxCount) throw new ApiError('Chọn ' + (allowEmpty ? '0' : '1') + '–' + maxCount + ' ảnh.', 400)
  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) throw new ApiError('Ảnh cần JPEG/PNG/WebP, từ 1 byte đến 10 MiB.', 400)
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end))
    const type = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg' : [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value) ? 'image/png' : ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' ? 'image/webp' : null
    if (type !== file.type) throw new ApiError('Nội dung ảnh không khớp MIME.', 400)
  }
  return files
}
