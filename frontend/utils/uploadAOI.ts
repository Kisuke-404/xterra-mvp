export function handleUploadAOI() {
  console.log("[v0] Upload AOI clicked")

  // Create a file input element
  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".geojson,.json,.shp,.kml"
  input.onchange = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("[v0] File selected:", file.name)
      alert(`File uploaded: ${file.name}\n\nThis will be processed and added to your AOI's or Projects table.`)
    }
  }
  input.click()
}
