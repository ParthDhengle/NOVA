"use client";

import { useWindowControls } from '@/hooks/useElectronApi';
import { Minimize2, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from "@/components/layout/MainLayout";
import type { CSSProperties } from 'react';

const dragStyle: CSSProperties = {
  WebkitAppRegion: 'drag',
  userSelect: 'none'
} as CSSProperties;

const noDragStyle: CSSProperties = {
  WebkitAppRegion: 'no-drag'
} as CSSProperties;

export default function MainWindow() {
  const { close, minimize, contract } = useWindowControls();

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Window controls titlebar */}
      <div 
        className="flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border/50 shrink-0"
        style={dragStyle}
      >
        <span className="ml-3 text-sm font-medium text-foreground/80">
          Nova Chat Assistant
        </span>

        {/* Right side: buttons */}
        <div
          className="flex items-center space-x-1"
          style={noDragStyle}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={minimize}
            className="w-6 h-6 p-0 hover:bg-muted/50 rounded-none"
            title="Minimize"
          >
            <Minus size={12} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={contract}
            className="w-6 h-6 p-0 hover:bg-muted/50 rounded-none"
            title="Maximize"
          >
            <Minimize2 size={12} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={close}
            className="w-6 h-6 p-0 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-none"
            title="Close"
          >
            <X size={12} />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <MainLayout />
    </div>
  );
}