import React, { useEffect } from "react";
import "./FlyingText.css";

const FlyingText = ({ text, onComplete }) => {
  useEffect(() => {
    const animationDuration = 3000;
    const flyOutTimer = setTimeout(() => {
      onComplete();
    }, animationDuration);
    return () => clearTimeout(flyOutTimer);
  }, [onComplete]);

  return <div className="flying-text">{text}</div>;
};

export default FlyingText;
