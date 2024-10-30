// AccessibleAlert.js
import React, { useEffect, useState } from "react";

function AccessibleAlert({ message }) {
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    if (message) {
      console.log("message detected" + message);
      setAlertMessage(message);
      setTimeout(() => {
        setAlertMessage("");
      }, 3000);
    }
  }, [message]);

  return (
    <div>
      {/* ARIA Live Region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: "absolute",
          left: "-9999px",
        }}
      >
        {alertMessage}
      </div>
    </div>
  );
}

export default AccessibleAlert;
