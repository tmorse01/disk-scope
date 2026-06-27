import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppRoute } from '../routes';
import type { BreadcrumbSegment } from './DsContextBar';

type ShellContextValue = {
  breadcrumbSegments: BreadcrumbSegment[];
  setBreadcrumbSegments: (segments: BreadcrumbSegment[]) => void;
  contextActions: ReactNode;
  setContextActions: (actions: ReactNode) => void;
  navigateTo: (route: AppRoute) => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

type ShellProviderProps = {
  children: ReactNode;
  navigateTo: (route: AppRoute) => void;
};

export function ShellProvider({ children, navigateTo }: ShellProviderProps) {
  const [breadcrumbSegments, setBreadcrumbSegments] = useState<BreadcrumbSegment[]>([]);
  const [contextActions, setContextActions] = useState<ReactNode>(null);

  const value = useMemo(
    () => ({
      breadcrumbSegments,
      setBreadcrumbSegments,
      contextActions,
      setContextActions,
      navigateTo,
    }),
    [breadcrumbSegments, contextActions, navigateTo],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShellContext(): ShellContextValue {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShellContext must be used within ShellProvider');
  }
  return context;
}

/** Sets shell breadcrumb/actions while mounted; clears on unmount. */
export function useShellOverrides(segments: BreadcrumbSegment[], actions: ReactNode = null): void {
  const { setBreadcrumbSegments, setContextActions } = useShellContext();

  useEffect(() => {
    setBreadcrumbSegments(segments);
    setContextActions(actions);

    return () => {
      setBreadcrumbSegments([]);
      setContextActions(null);
    };
  }, [segments, actions, setBreadcrumbSegments, setContextActions]);
}
