type CircleCheckIconProps = React.SVGProps<SVGSVGElement> & {
	className?: string
}

export const CircleCheckIcon = ({
	className,
	...props
}: CircleCheckIconProps) => (
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
			d="M7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15ZM11.5928 5.59283L6.75 10.4356L3.59467 7.28032L4.65533 6.21968L6.75 8.31435L10.5322 4.53217L11.5928 5.59283Z"
			fill="#18B451"
		/>
	</svg>
)
