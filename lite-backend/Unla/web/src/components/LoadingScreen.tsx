import { Spinner } from "@heroui/react";
import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="mb-8 text-2xl font-bold text-foreground">NextAgent 工具网关</div>
      <Spinner size="lg" color="primary" />
      <div className="mt-6 text-foreground/70">
        Loading application...
      </div>
    </div>
  );
};
