"use client"

import {
	AdvancedMarker,
	APIProvider,
	Map as GoogleMap,
	type MapMouseEvent,
	useMapsLibrary,
} from "@vis.gl/react-google-maps"
import { AlertTriangle, MapPin, X } from "lucide-react"
import type { ErrorInfo, ReactNode } from "react"
import { Component, useCallback, useEffect, useRef, useState } from "react"

export type MapValue = {
	lat: number
	lng: number
	address: string
	placeId?: string
}

// Error boundary to catch API errors without crashing the parent
class MapErrorBoundary extends Component<
	{ children: ReactNode },
	{ error: string | null }
> {
	constructor(props: { children: ReactNode }) {
		super(props)
		this.state = { error: null }
	}

	static getDerivedStateFromError(error: Error) {
		return { error: error.message }
	}

	componentDidCatch(_error: Error, _info: ErrorInfo) {}

	render() {
		if (this.state.error) {
			return (
				<div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700">
					<AlertTriangle className="h-4 w-4 shrink-0" />
					<span>
						Map unavailable. Check that the Google Maps API key is valid and has
						Maps JavaScript API + Places API enabled.
					</span>
				</div>
			)
		}
		return this.props.children
	}
}

type PlacesSearchProps = {
	onPlaceSelect: (place: google.maps.places.Place) => void
}

function PlacesSearch({ onPlaceSelect }: PlacesSearchProps) {
	const placesLib = useMapsLibrary("places")
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!placesLib || !containerRef.current) return

		const PlaceAutocompleteElement = (
			placesLib as google.maps.PlacesLibrary & {
				PlaceAutocompleteElement?: typeof google.maps.places.PlaceAutocompleteElement
			}
		).PlaceAutocompleteElement

		if (!PlaceAutocompleteElement) return

		const element = new PlaceAutocompleteElement({})
		element.style.width = "100%"
		containerRef.current.appendChild(element)

		const handler = async (e: Event) => {
			const placeSelectEvent =
				e as google.maps.places.PlaceAutocompletePlaceSelectEvent
			const place = placeSelectEvent.place
			await place.fetchFields({
				fields: ["location", "formattedAddress", "id"],
			})
			onPlaceSelect(place)
		}

		element.addEventListener("gmp-placeselect", handler)

		return () => {
			element.removeEventListener("gmp-placeselect", handler)
			element.remove()
		}
	}, [placesLib, onPlaceSelect])

	return (
		<div
			ref={containerRef}
			className="w-full [&>gmp-place-autocomplete]:w-full"
		/>
	)
}

type MapFieldEditorProps = {
	value: MapValue | null
	onChange: (value: MapValue | null) => void
}

const DEFAULT_CENTER = { lat: 52.52, lng: 13.405 }
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

function MapEditorInner({ value, onChange }: MapFieldEditorProps) {
	const [zoom, setZoom] = useState(value ? 14 : 10)
	const center = value ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER

	const handleMapClick = (e: MapMouseEvent) => {
		if (!e.detail.latLng) return
		const { lat, lng } = e.detail.latLng
		onChange({
			lat,
			lng,
			address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
			placeId: undefined,
		})
	}

	const handlePlaceSelect = useCallback(
		(place: google.maps.places.Place) => {
			if (!place.location) return
			setZoom(14)
			onChange({
				lat: place.location.lat(),
				lng: place.location.lng(),
				address: place.formattedAddress ?? "",
				placeId: place.id,
			})
		},
		[onChange],
	)

	return (
		<div className="space-y-3">
			<PlacesSearch onPlaceSelect={handlePlaceSelect} />

			<div className="overflow-hidden rounded-lg border border-grey-300">
				<GoogleMap
					style={{ width: "100%", height: "320px" }}
					center={center}
					zoom={zoom}
					gestureHandling="cooperative"
					mapId="cms-map-field"
					onClick={handleMapClick}
				>
					{value && (
						<AdvancedMarker position={{ lat: value.lat, lng: value.lng }} />
					)}
				</GoogleMap>
			</div>

			{value ? (
				<div className="flex items-start justify-between gap-3 rounded-lg border border-grey-200 bg-grey-50 p-3">
					<div className="flex min-w-0 items-start gap-2">
						<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
						<div className="min-w-0">
							<p className="truncate text-grey-700 text-sm">{value.address}</p>
							<p className="mt-0.5 font-mono text-grey-400 text-xs">
								{value.lat.toFixed(6)}, {value.lng.toFixed(6)}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => onChange(null)}
						className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-grey-200"
						title="Clear location"
					>
						<X className="h-4 w-4 text-grey-500" />
					</button>
				</div>
			) : (
				<p className="text-center text-grey-400 text-xs">
					Search for an address or click on the map to place a marker
				</p>
			)}
		</div>
	)
}

export function MapFieldEditor({ value, onChange }: MapFieldEditorProps) {
	if (!API_KEY) {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700">
				<AlertTriangle className="h-4 w-4 shrink-0" />
				<span>
					Set <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
					to enable map fields.
				</span>
			</div>
		)
	}

	return (
		<MapErrorBoundary>
			<APIProvider apiKey={API_KEY} libraries={["places"]}>
				<MapEditorInner value={value} onChange={onChange} />
			</APIProvider>
		</MapErrorBoundary>
	)
}
