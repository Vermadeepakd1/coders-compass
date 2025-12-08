import React from 'react';

const Skeleton = ({ className }) => {
    return (
        <div className={`bg-gray-800/50 animate-pulse rounded ${className}`}></div>
    );
};
export default Skeleton;
