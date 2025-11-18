type ShieldCheckIconProps = React.SVGProps<SVGSVGElement> & {
	className?: string
}

export const ShieldCheckIcon = ({
	className,
	...props
}: ShieldCheckIconProps) => (
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
			d="M16.5 23.3749L20.625 27.4999L27.5 17.8749M22 4.97559C17.8489 8.91768 12.3205 11.0798 6.59634 10.9999C5.86821 13.2182 5.49812 15.5383 5.50001 17.8731C5.50001 28.1251 12.5107 36.7381 22 39.1819C31.4893 36.7399 38.5 28.1269 38.5 17.8749C38.5 15.4733 38.115 13.1614 37.4037 10.9981H37.125C31.2657 10.9981 25.9417 8.71009 22 4.97559Z"
			stroke="white"
			strokeWidth="2.75"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
)
