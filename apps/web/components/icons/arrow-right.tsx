type ArrowRightIconProps = React.SVGProps<SVGSVGElement> & {
	className?: string
}

export const ArrowRightIcon = ({
	className,
	...props
}: ArrowRightIconProps) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="9"
		viewBox="0 0 14 9"
		fill="none"
		className={className}
		{...props}
	>
		<path
			d="M9.33011e-05 4.90925L0 3.57598H10.7813L8.14813 0.942807L9.09093 0L13.3336 4.24265L9.09093 8.48531L8.14813 7.54245L10.7813 4.90931L9.33011e-05 4.90925Z"
			fill="currentColor"
			fillOpacity="0.7"
		/>
	</svg>
)
