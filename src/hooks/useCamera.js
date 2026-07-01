import { useCallback, useEffect, useRef, useState } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [isCameraReady, setIsCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCameraReady(false)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setCameraError('')
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsCameraReady(true)
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError('Kamera tidak bisa dibuka. Cek permission kamera di browser.')
      setIsCameraReady(false)
    }
  }, [stopCamera])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    isCameraReady,
    cameraError,
    startCamera,
    stopCamera,
  }
}
