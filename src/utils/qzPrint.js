import qz from 'qz-tray'

const DNP_PRINTER_KEYWORDS = [
  'DNP',
  'RX1',
  'DS-RX1',
  'DS RX1',
  'Dai Nippon',
]

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

  const base64Image = stripDataUrlPrefix(imageDataUrl)
  const config = qz.configs.create(printerName)

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
