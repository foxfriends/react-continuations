import React from "react";

export function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="p-4 bg-black text-white flex items-center">Example</nav>
      <div className="grow">{children}</div>
    </div>
  );
}
