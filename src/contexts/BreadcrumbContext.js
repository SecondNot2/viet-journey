import React, { createContext, useContext, useState, useCallback } from "react";

const BreadcrumbContext = createContext({
  dynamicTitle: "",
  setDynamicTitle: () => {},
});

export const BreadcrumbProvider = ({ children }) => {
  const [dynamicTitle, setDynamicTitleState] = useState("");

  const setDynamicTitle = useCallback((title) => {
    setDynamicTitleState(title || "");
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ dynamicTitle, setDynamicTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
  }
  return context;
};

export default BreadcrumbContext;
