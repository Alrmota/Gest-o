import React, { useState } from 'react';

interface SimpleTabsProps {
  children: React.ReactNode;
  defaultValue: string;
}

export function SimpleTabs({ children, defaultValue }: SimpleTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className="w-full">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab } as any);
        }
        return child;
      })}
    </div>
  );
}

export function TabList({ children, activeTab, setActiveTab }: any) {
  return <div className="flex border-b border-gray-200 mb-6">{
    React.Children.map(children, child => React.cloneElement(child, { activeTab, setActiveTab }))
  }</div>;
}

export function TabTrigger({ value, children, activeTab, setActiveTab }: any) {
  const isActive = activeTab === value;
  return (
    <button
      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${isActive ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

export function TabContent({ value, children, activeTab }: any) {
  if (activeTab !== value) return null;
  return <div>{children}</div>;
}
