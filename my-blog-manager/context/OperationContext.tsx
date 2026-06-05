"use client";

import React, { createContext, useContext, useState } from 'react';

export type OperationType =
  | 'POST'
  | 'CONFIG'
  | 'GALLERY'
  | 'FRIEND'
  | 'STEAM'
  | 'sync_photowall'
  | 'sync_friends'
  | 'sync_projects'
  | 'sync_steam'
  | 'create_moment';

export interface Operation {
  id: string;
  type: OperationType;
  label: string;
  description?: string;
  timestamp: string;
  payload?: any;
  value?: any;
}

interface OperationContextType {
  operations: Operation[];
  addOperation: (op: Omit<Operation, 'id' | 'timestamp'>) => void;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
}

const OperationContext = createContext<OperationContextType | undefined>(undefined);

export function OperationProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([]);

  const addOperation = (op: Omit<Operation, 'id' | 'timestamp'>) => {
    const newOp: Operation = {
      ...op,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOperations(prev => {
      const filtered = prev.filter(item => !(item.type === op.type && item.label === op.label));
      return [...filtered, newOp];
    });
  };

  const removeOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const clearOperations = () => setOperations([]);

  return (
    <OperationContext.Provider value={{ operations, addOperation, removeOperation, clearOperations }}>
      {children}
    </OperationContext.Provider>
  );
}

export const useOperations = () => {
  const context = useContext(OperationContext);
  if (!context) throw new Error("useOperations must be used within an OperationProvider");
  return context;
};
