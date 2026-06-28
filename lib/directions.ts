export function openDirectionsFromCurrentLocation(destination: string) {
  if (typeof window === "undefined" || !destination.trim()) return

  const popup = window.open("about:blank", "_blank")
  const openMap = (origin?: string) => {
    const params = new URLSearchParams({
      api: "1",
      destination,
      travelmode: "driving",
    })
    if (origin) params.set("origin", origin)
    const url = `https://www.google.com/maps/dir/?${params.toString()}`
    if (popup) popup.location.href = url
    else window.open(url, "_blank", "noopener,noreferrer")
  }

  if (!navigator.geolocation) {
    openMap()
    return
  }

  navigator.geolocation.getCurrentPosition(
    position => openMap(`${position.coords.latitude},${position.coords.longitude}`),
    () => openMap(),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
}
