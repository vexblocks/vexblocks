type CircleMinusIconProps = React.SVGProps<SVGSVGElement> & {
	className?: string
}

export const CircleMinusIcon = ({
	className,
	...props
}: CircleMinusIconProps) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="15"
		height="15"
		viewBox="0 0 15 15"
		fill="none"
		className={className}
		{...props}
	>
		<path
			d="M7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5C15 11.6421 11.6421 15 7.5 15ZM3.75 6.75V8.25H11.25V6.75H3.75Z"
			fill="#1A1A1A"
			fillOpacity="0.26"
		/>
	</svg>
)
