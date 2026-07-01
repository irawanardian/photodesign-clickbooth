export function downloadImage(imageUrl, filename = 'photobooth-result.png') {
  if (!imageUrl) return

  const link = document.createElement('a')
  link.href = imageUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
