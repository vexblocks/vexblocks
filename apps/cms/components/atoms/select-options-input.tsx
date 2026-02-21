"use client"

import { useEffect, useState } from "react"

type SelectOptionsInputProps = {
	id?: string
	value: string[]
	onChange: (options: string[]) => void
	className?: string
}

export function SelectOptionsInput({
	id,
	value,
	onChange,
	className,
}: SelectOptionsInputProps) {
	const joined = value.join(", ")
	const [raw, setRaw] = useState(joined)

	// Sync external value changes (e.g. when field type changes and resets options)
	useEffect(() => {
		setRaw(joined)
	}, [joined])

	const commit = () => {
		const options = raw
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean)
		onChange(options)
	}

	return (
		<input
			id={id}
			type="text"
			value={raw}
			onChange={(e) => setRaw(e.target.value)}
			onBlur={commit}
			placeholder="Option 1, Option 2, Option 3"
			className={
				className ?? "w-full rounded border border-grey-300 px-3 py-2 text-sm"
			}
		/>
	)
}
