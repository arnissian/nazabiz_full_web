import type { CSSProperties } from "react";
import { Spin } from "antd";

export const Loader = ({
  height = "50vh",
  size = "large",
}: {
  height?: CSSProperties["height"];
  size?: "small" | "default" | "large";
}) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height }}>
    <Spin 
    className="text-primary"
 
    // size={size} 
    />
  </div>
);
