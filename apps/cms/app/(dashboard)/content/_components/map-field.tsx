"use client"

import {
	AdvancedMarker,
	APIProvider,
	Map as GoogleMap,
	type MapMouseEvent,
	useMap,
	useMapsLibrary,
} from "@vis.gl/react-google-maps"
import { AlertTriangle, MapPin, X } from "lucide-react"
import type { ErrorInfo, ReactNode } from "react"
import { Component, useCallback, useEffect, useRef } from "react"

export type MapValue = {
	lat: number
	lng: number
	address: string
	placeId?: string
	name?: string
	viewport?: {
		north: number
		south: number
		east: number
		west: number
	}
}

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
	onLocationSelect: (
		lat: number,
		lng: number,
		address: string,
		placeId?: string,
		name?: string,
		viewport?: MapValue["viewport"],
	) => void
	address?: string
}

function PlacesSearch({ onLocationSelect, address }: PlacesSearchProps) {
	const placesLib = useMapsLibrary("places")
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.value = address ?? ""
		}
	}, [address])

	useEffect(() => {
		if (!placesLib || !inputRef.current) return

		const autocomplete = new placesLib.Autocomplete(inputRef.current, {
			fields: ["geometry", "formatted_address", "place_id", "name"],
		})

		const listener = autocomplete.addListener("place_changed", () => {
			const place = autocomplete.getPlace()
			if (!place.geometry?.location) return
			const vp = place.geometry.viewport
			onLocationSelect(
				place.geometry.location.lat(),
				place.geometry.location.lng(),
				place.formatted_address ?? "",
				place.place_id,
				place.name,
				vp
					? {
							north: vp.getNorthEast().lat(),
							south: vp.getSouthWest().lat(),
							east: vp.getNorthEast().lng(),
							west: vp.getSouthWest().lng(),
						}
					: undefined,
			)
		})

		return () => {
			google.maps.event.removeListener(listener)
		}
	}, [placesLib, onLocationSelect])

	return (
		<input
			ref={inputRef}
			type="text"
			placeholder="Search for an address..."
			className="w-full rounded-lg border border-grey-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
		/>
	)
}

type MapFieldEditorProps = {
	value: MapValue | null
	onChange: (value: MapValue | null) => void
}

const MAP_ID = "cms-map-field"
const DEFAULT_CENTER = { lat: 52.52, lng: 13.405 }
const DEFAULT_ZOOM = 16
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

function MapEditorInner({ value, onChange }: MapFieldEditorProps) {
	const map = useMap(MAP_ID)
	const mapRef = useRef<google.maps.Map | null>(null)

	useEffect(() => {
		mapRef.current = map
	}, [map])

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

	const handleLocationSelect = useCallback(
		(
			lat: number,
			lng: number,
			address: string,
			placeId?: string,
			name?: string,
			viewport?: MapValue["viewport"],
		) => {
			if (viewport) {
				mapRef.current?.fitBounds({
					north: viewport.north,
					south: viewport.south,
					east: viewport.east,
					west: viewport.west,
				})
			} else {
				mapRef.current?.panTo({ lat, lng })
				mapRef.current?.setZoom(14)
			}
			onChange({ lat, lng, address, placeId, name, viewport })
		},
		[onChange],
	)

	return (
		<div className="space-y-3">
			<PlacesSearch
				onLocationSelect={handleLocationSelect}
				address={value?.address}
			/>

			<div className="overflow-hidden rounded-lg border border-grey-300">
				<GoogleMap
					id={MAP_ID}
					style={{ width: "100%", height: "560px" }}
					defaultCenter={
						value ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER
					}
					defaultZoom={value ? 16 : DEFAULT_ZOOM}
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
				<div className="bg-grey-50 flex items-start justify-between gap-3 rounded-lg border border-grey-200 p-3">
					<div className="flex min-w-0 items-start gap-2">
						<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
						<div className="min-w-0">
							<p className="text-grey-700 truncate text-sm">{value.address}</p>
							<p className="mt-0.5 font-mono text-xs text-grey-400">
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
				<p className="text-center text-xs text-grey-400">
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
