import React, { useState } from 'react';

const Tooltip = ({ text, tooltip, position }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = () => {
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  const handleClick = () => {
    setShowTooltip(!showTooltip)
  }

  return (
    <span
      className={`tooltip ${showTooltip ? 'tooltip-visible' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <span className="tooltip-text">{text}</span>
      {showTooltip && <span className={`${position === 'right' ? 'tooltip-right' : 'tooltip-bottom'}`}>{tooltip}</span>}
    </span>
  )
}

export default Tooltip