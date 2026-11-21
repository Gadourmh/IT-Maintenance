import React from "react";

const Card = ({ title, children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {title && <h2 className="text-xl font-semibold text-center mb-4">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;

