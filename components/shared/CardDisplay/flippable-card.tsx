'use client';

import Image from 'next/image';
import React from 'react';
import './flippable-card.css';

interface FlippableCardProps {
  frontImage: string;
  backImage: string;
  width?: number;
  height?: number;
  alt?: string;
}

const FlippableCard: React.FC<FlippableCardProps> = ({
  frontImage,
  backImage,
  width = 223,
  height = 310,
  alt = 'Card image',
}) => {
  return (
    <div className="flippable-card-wrapper" style={{ width, height }}>
      <div className="flippable-card-inner">
        <div className="flippable-card-front">
          <Image src={frontImage} alt={alt} width={width} height={height} />
        </div>
        <div className="flippable-card-back">
          <Image src={backImage} alt={`${alt} - Back`} width={width} height={height} />
        </div>
      </div>
    </div>
  );
};

export default FlippableCard;
