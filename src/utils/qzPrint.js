import qz from 'qz-tray'

const DNP_PRINTER_KEYWORDS = [
  'DNP',
  'RX1',
  'DS-RX1',
  'DS RX1',
  'Dai Nippon',
]

const PRINT_BLEED_RATIO = 0.03

function normalizePrinterName(name) {
  return String(name || '').toLowerCase()
}

function stripDataUrlPrefix(dataUrl) {
  return String(dataUrl || '').replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
}

function findPrinterByKeywords(printers = []) {
  return printers.find((printerName) => {
    const normalized = normalizePrinterName(printerName)

    return DNP_PRINTER_KEYWORDS.some((keyword) => {
      return normalized.includes(keyword.toLowerCase())
    })
  })
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Gagal membaca gambar untuk print.'))
    image.src = dataUrl
  })
}

async function createBleedImageDataUrl(imageDataUrl, bleedRatio = PRINT_BLEED_RATIO) {
  const image = await loadImageFromDataUrl(imageDataUrl)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const scale = 1 + bleedRatio
  const drawWidth = canvas.width * scale
  const drawHeight = canvas.height * scale
  const drawX = (canvas.width - drawWidth) / 2
  const drawY = (canvas.height - drawHeight) / 2

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

  return canvas.toDataURL('image/png')
}

export async function connectQzTray() {
  qz.api.setPromiseType((resolver) => new Promise(resolver))

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect()
  }

  return true
}

export async function getAvailablePrinters() {
  await connectQzTray()

  const printers = await qz.printers.find()

  return Array.isArray(printers) ? printers : [printers]
}

export async function findDnpPrinter() {
  const printers = await getAvailablePrinters()
  const printerName = findPrinterByKeywords(printers) || ''

  return {
    printers,
    printerName,
  }
}

export async function printImageWithQz(imageDataUrl, preferredPrinterName = '') {
  if (!imageDataUrl) {
    throw new Error('File gambar belum tersedia untuk dicetak.')
  }

  await connectQzTray()

  const printers = await getAvailablePrinters()
  const printerName = preferredPrinterName || findPrinterByKeywords(printers) || ''

  if (!printerName) {
    const printerList = printers.length ? printers.join(', ') : 'tidak ada printer terbaca'

    throw new Error(`Printer DNP RX1 tidak ditemukan. Printer terbaca: ${printerList}`)
  }

  const printReadyImageDataUrl = await createBleedImageDataUrl(imageDataUrl)
  const base64Image = stripDataUrlPrefix(printReadyImageDataUrl)

  const config = qz.configs.create(printerName, {
    units: 'in',
    size: {
      width: 4,
      height: 6,
    },
    orientation: 'portrait',
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    scaleContent: true,
    interpolation: 'bicubic',
    colorType: 'color',
    density: 300,
    jobName: 'Photodesign Clickbooth 4x6 Portrait Bleed',
  })

  const data = [
    {
      type: 'pixel',
      format: 'image',
      flavor: 'base64',
      data: base64Image,
    },
  ]

  await qz.print(config, data)

  return {
    printerName,
    printers,
  }
}
