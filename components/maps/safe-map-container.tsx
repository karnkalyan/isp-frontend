"use client"

import {
  LeafletProvider,
  createLeafletContext,
  type LeafletContextInterface,
} from "@react-leaflet/core"
import { Map as LeafletMap, type MapOptions } from "leaflet"
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"
import { MapContainer as ReactLeafletMapContainer } from "react-leaflet"

type SafeMapContainerProps = ComponentProps<typeof ReactLeafletMapContainer>

type InitialMapProps = {
  bounds: SafeMapContainerProps["bounds"]
  boundsOptions: SafeMapContainerProps["boundsOptions"]
  center: SafeMapContainerProps["center"]
  options: MapOptions
  whenReady: SafeMapContainerProps["whenReady"]
  zoom: SafeMapContainerProps["zoom"]
}

/**
 * React-Leaflet 4's MapContainer callback closes over its initial null context.
 * React 19 may re-run callback refs during development, causing that callback
 * to initialize Leaflet twice on the same element. This component owns the map
 * instance in a ref and removes it in the callback-ref cleanup, making Strict
 * Mode, route transitions and Fast Refresh safe.
 */
export const SafeMapContainer = forwardRef<LeafletMap, SafeMapContainerProps>(
  function SafeMapContainer(
    {
      bounds,
      boundsOptions,
      center,
      children,
      className,
      id,
      placeholder,
      style,
      whenReady,
      zoom,
      ...options
    },
    forwardedRef,
  ) {
    const mapInstanceRef = useRef<LeafletMap | null>(null)
    const [context, setContext] = useState<LeafletContextInterface | null>(null)
    const [initial] = useState<InitialMapProps>(() => ({
      bounds,
      boundsOptions,
      center,
      options: options as MapOptions,
      whenReady,
      zoom,
    }))

    useImperativeHandle(forwardedRef, () => mapInstanceRef.current as LeafletMap, [context])

    const attachMap = useCallback((node: HTMLDivElement | null) => {
      if (!node || mapInstanceRef.current) return

      // A Fast Refresh can preserve the host node after replacing the old
      // component implementation. Its Leaflet stamp is then stale.
      if ((node as HTMLDivElement & { _leaflet_id?: number })._leaflet_id) {
        delete (node as HTMLDivElement & { _leaflet_id?: number })._leaflet_id
      }

      const map = new LeafletMap(node, initial.options)
      mapInstanceRef.current = map

      if (initial.center != null && initial.zoom != null) {
        map.setView(initial.center, initial.zoom)
      } else if (initial.bounds != null) {
        map.fitBounds(initial.bounds, initial.boundsOptions)
      }

      if (initial.whenReady) map.whenReady(initial.whenReady)
      setContext(createLeafletContext(map))

      return () => {
        if (mapInstanceRef.current !== map) return
        mapInstanceRef.current = null
        try {
          map.remove()
        } finally {
          delete (node as HTMLDivElement & { _leaflet_id?: number })._leaflet_id
        }
      }
    }, [initial])

    return (
      <div ref={attachMap} className={className} id={id} style={style}>
        {context ? (
          <LeafletProvider value={context}>{children as ReactNode}</LeafletProvider>
        ) : (
          placeholder ?? null
        )}
      </div>
    )
  },
)

export { SafeMapContainer as MapContainer }
