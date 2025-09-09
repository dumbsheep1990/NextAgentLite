/**
 * 面包屑导航上下文 - 为全局布局提供面包屑信息
 */
import React, { createContext, useContext, useState } from 'react';

export interface BreadcrumbItem {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  clearBreadcrumbs: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

export const useBreadcrumb = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
};

interface BreadcrumbProviderProps {
  children: React.ReactNode;
}

export const BreadcrumbProvider: React.FC<BreadcrumbProviderProps> = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const clearBreadcrumbs = () => {
    setBreadcrumbs([]);
  };

  return (
    <BreadcrumbContext.Provider value={{
      breadcrumbs,
      setBreadcrumbs,
      clearBreadcrumbs
    }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};