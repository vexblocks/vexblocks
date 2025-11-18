type FolderPlusIconProps = React.SVGProps<SVGSVGElement> & {
	className?: string
}

export const FolderPlusIcon = ({
	className,
	...props
}: FolderPlusIconProps) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		className={className}
		{...props}
	>
		<g clipPath="url(#clip0_54_7425)">
			<path
				d="M12.4141 5H21C21.5523 5 22 5.44772 22 6V13H20V7H12.4141L10.4141 9H4V19H14V21H3C2.45 21 2 20.55 2 20V4C2 3.44772 2.44772 3 3 3H10.4141L12.4141 5ZM4 7H9.58594L10.5859 6L9.58594 5H4V7Z"
				fill="white"
			/>
			<path
				d="M19.5293 15.3193C19.7059 14.8936 20.2943 14.8935 20.4707 15.3193L20.7237 15.9307C21.1556 16.9735 21.9616 17.8062 22.9746 18.2568L23.6924 18.5762C24.1027 18.759 24.1026 19.3562 23.6924 19.5391L22.9326 19.877C21.945 20.3162 21.1534 21.1195 20.7139 22.1279L20.4668 22.6934C20.2864 23.1075 19.7137 23.1075 19.5332 22.6934L19.2871 22.1279C18.8476 21.1193 18.0552 20.3163 17.0674 19.877L16.3076 19.5391C15.8975 19.3562 15.8974 18.759 16.3076 18.5762L17.0254 18.2568C18.0385 17.8062 18.8445 16.9735 19.2764 15.9307L19.5293 15.3193Z"
				fill="white"
			/>
		</g>
		<defs>
			<clipPath id="clip0_54_7425">
				<rect width="24" height="24" fill="white" />
			</clipPath>
		</defs>
	</svg>
)
