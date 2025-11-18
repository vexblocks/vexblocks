"use client"

import Lottie, { type LottieComponentProps } from "lottie-react"

type LottiePlayerProps = {
	animationData: LottieComponentProps["animationData"]
	loop?: boolean
	autoplay?: boolean
	className?: string
	style?: React.CSSProperties
}

export function LottiePlayer({
	animationData,
	loop = true,
	autoplay = true,
	className,
	style,
}: LottiePlayerProps) {
	return (
		<Lottie
			animationData={animationData}
			loop={loop}
			autoplay={autoplay}
			className={className}
			style={style}
		/>
	)
}

