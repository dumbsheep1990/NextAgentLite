import { useCamera, useSigma } from '@react-sigma/core'
import { useCallback } from 'react'
import Button from '@/components/ui/Button'
import { ZoomInIcon, ZoomOutIcon, FullscreenIcon, RotateCwIcon, RotateCcwIcon, MaximizeIcon } from 'lucide-react'
import { controlButtonVariant } from '@/lib/constants'
import { useTranslation } from 'react-i18next';

/**
 * Component that provides zoom controls for the graph viewer.
 */
const ZoomControl = () => {
  const { zoomIn, zoomOut, reset } = useCamera({ duration: 200, factor: 1.5 })
  const sigma = useSigma()
  const { t } = useTranslation();

  const handleZoomIn = useCallback(() => zoomIn(), [zoomIn])
  const handleZoomOut = useCallback(() => zoomOut(), [zoomOut])
  const handleResetZoom = useCallback(() => {
    if (!sigma) return

    try {
      // First clear any custom bounding box and refresh
      sigma.setCustomBBox(null)
      sigma.refresh()

      // Get graph after refresh
      const graph = sigma.getGraph()

      // Check if graph has nodes before accessing them
      if (!graph?.order || graph.nodes().length === 0) {
        // Use reset() for empty graph case
        reset()
        return
      }

      sigma.getCamera().animate(
        { x: 0.5, y: 0.5, ratio: 1.1 },
        { duration: 1000 }
      )
    } catch (error) {
      console.error('Error resetting zoom:', error)
      // Use reset() as fallback on error
      reset()
    }
  }, [sigma, reset])

  const handleRotate = useCallback(() => {
    if (!sigma) return

    const camera = sigma.getCamera()
    const currentAngle = camera.angle
    const newAngle = currentAngle + Math.PI / 8

    camera.animate(
      { angle: newAngle },
      { duration: 200 }
    )
  }, [sigma])

  const handleRotateCounterClockwise = useCallback(() => {
    if (!sigma) return

    const camera = sigma.getCamera()
    const currentAngle = camera.angle
    const newAngle = currentAngle - Math.PI / 8

    camera.animate(
      { angle: newAngle },
      { duration: 200 }
    )
  }, [sigma])

  const handleFullscreen = useCallback(() => {
    try {
      const element = document.documentElement;
      
      if (!document.fullscreenElement) {
        // 进入全屏
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          (element as any).msRequestFullscreen();
        }
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('全屏操作失败:', error);
    }
  }, [])

  return (
    <>
      <Button
        variant={controlButtonVariant}
        onClick={handleRotate}
        tooltip={t('graphPanel.sideBar.zoomControl.rotateCamera')}
        size="icon"
      >
        <RotateCwIcon />
      </Button>
      <Button
        variant={controlButtonVariant}
        onClick={handleRotateCounterClockwise}
        tooltip={t('graphPanel.sideBar.zoomControl.rotateCameraCounterClockwise')}
        size="icon"
      >
        <RotateCcwIcon />
      </Button>
      <Button
        variant={controlButtonVariant}
        onClick={handleResetZoom}
        tooltip={t('graphPanel.sideBar.zoomControl.resetZoom')}
        size="icon"
      >
        <MaximizeIcon />
      </Button>
      <Button
        variant={controlButtonVariant}
        onClick={handleFullscreen}
        tooltip="全屏显示"
        size="icon"
      >
        <FullscreenIcon />
      </Button>
      <Button variant={controlButtonVariant} onClick={handleZoomIn} tooltip={t('graphPanel.sideBar.zoomControl.zoomIn')} size="icon">
        <ZoomInIcon />
      </Button>
      <Button variant={controlButtonVariant} onClick={handleZoomOut} tooltip={t('graphPanel.sideBar.zoomControl.zoomOut')} size="icon">
        <ZoomOutIcon />
      </Button>
    </>
  )
}

export default ZoomControl
