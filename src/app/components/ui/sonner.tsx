"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          borderRadius: "16px",
        }
      }}
      style={
        {
          "--normal-bg": "#FAF7F2",
          "--normal-text": "#1A0A05",
          "--normal-border": "rgba(0, 130, 54, 0.2)",
          "--info-bg": "#FAF7F2",
          "--info-text": "#008236",
          "--info-border": "rgba(0, 130, 54, 0.2)",
          "--success-bg": "#FAF7F2",
          "--success-text": "#008236",
          "--success-border": "rgba(0, 130, 54, 0.2)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
