// components/Skeleton.jsx
import React from 'react';
import './Skeleton.css';

const Skeleton = ({ 
  type = 'text', 
  width, 
  height, 
  className = '', 
  style = {} 
}) => {
  const skeletonClass = `skeleton skeleton-${type} ${className}`;
  
  return (
    <div 
      className={skeletonClass.trim()} 
      style={{ width, height, ...style }}
    ></div>
  );
};

export default Skeleton;