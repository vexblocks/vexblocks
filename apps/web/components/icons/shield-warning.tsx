type ShieldWarningIconProps = React.SVGProps<SVGSVGElement> & {
	className?: string
}

export const ShieldWarningIcon = ({
	className,
	...props
}: ShieldWarningIconProps) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="44"
		height="44"
		viewBox="0 0 44 44"
		fill="none"
		className={className}
		{...props}
	>
		<path
			d="M22 16.4999V23.3749M22 4.97559C17.8489 8.91768 12.3205 11.0798 6.59634 10.9999C5.86801 13.2188 5.49793 15.5396 5.50001 17.8749C5.50001 28.1269 12.5107 36.7399 22 39.1819C31.4893 36.7399 38.5 28.1269 38.5 17.8749C38.5 15.4733 38.115 13.1633 37.4037 10.9999H37.125C31.2657 10.9999 25.9417 8.70825 22 4.97559ZM22 28.8749H22.0147V28.8896H22V28.8749Z"
			stroke="white"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
)
