/**
 * @file header-context.tsx
 * @description Customizable header context and slot components for feature action injection.
 * @owner Platform UI Core
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

interface HeaderContextType {
  title: React.ReactNode | null;
  setTitle: (title: React.ReactNode | null) => void;
  actions: React.ReactNode | null;
  setActions: (actions: React.ReactNode | null) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<React.ReactNode | null>(null);
  const [actions, setActions] = useState<React.ReactNode | null>(null);

  const value = useMemo(
    () => ({ title, setTitle, actions, setActions }),
    [title, actions]
  );

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
}

/**
 * Declarative component for features to inject custom actions into the top main header.
 * Automatically clears actions when the component unmounts.
 */
export function HeaderActions({ children }: { children: React.ReactNode }) {
  const { setActions } = useHeader();

  useEffect(() => {
    setActions(children);
    return () => setActions(null);
  }, [children, setActions]);

  return null;
}

/**
 * Declarative component for features to override the top main header title.
 * Automatically clears custom title when the component unmounts.
 */
export function HeaderTitle({ children }: { children: React.ReactNode }) {
  const { setTitle } = useHeader();

  useEffect(() => {
    setTitle(children);
    return () => setTitle(null);
  }, [children, setTitle]);

  return null;
}
