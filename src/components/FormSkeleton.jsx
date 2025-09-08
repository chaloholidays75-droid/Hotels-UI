// components/FormSkeleton.jsx
import React from 'react';
import Skeleton from './Skeleton';

const FormSkeleton = ({ fieldCount = 5 }) => {
  return (
    <div className="form-skeleton">
      <Skeleton width="200px" height="24px" className="form-title" />
      {[...Array(fieldCount)].map((_, index) => (
        <div key={index} className="form-field-skeleton">
          <Skeleton width="120px" height="16px" className="label-skeleton" />
          <Skeleton width="100%" height="38px" className="input-skeleton" />
        </div>
      ))}
      <Skeleton width="150px" height="40px" className="button-skeleton" />
    </div>
  );
};

export default FormSkeleton;