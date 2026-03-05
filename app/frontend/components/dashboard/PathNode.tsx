import { useState } from 'react'
import { ModalLink } from '@inertiaui/modal-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/shared/Tooltip'

const BILLBOARD_IMAGES = ['/path/1.png', '/path/2.png', '/path/3.png']

export default function PathNode({ index, interactive = true }: { index: number; interactive?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(index === 0)

  const starImage = (
    <img
      src="/path/star.png"
      fetchPriority="high"
      style={{ width: '100%', display: 'block', transform: `translateY(20px)` }}
    />
  )

  const content = (
    <div style={{ pointerEvents: 'auto' }} className="cursor-pointer">
      {index === 0 && interactive && (
        <ModalLink
          href="/projects/onboarding"
          className="outline-0"
          onStart={() => setShowTooltip(false)}
          onAfterLeave={() => setShowTooltip(true)}
        >
          {starImage}
        </ModalLink>
      )}
      {index === 0 && !interactive && starImage}
      {index === 3 && <img src="/path/slack.png" fetchPriority="high" style={{ width: '100%', display: 'block' }} />}

      {index !== 0 && index !== 3 && (
        <img
          src={BILLBOARD_IMAGES[index % BILLBOARD_IMAGES.length]}
          fetchPriority="high"
          style={{ width: '100%', display: 'block' }}
        />
      )}
    </div>
  )

  if (!interactive) return content

  return (
    <Tooltip side="top" gap={12} trackScroll alwaysShow={showTooltip}>
      <TooltipTrigger>{content}</TooltipTrigger>
      <TooltipContent>{index === 0 ? 'Start here!' : `Node ${index}`}</TooltipContent>
    </Tooltip>
  )
}
