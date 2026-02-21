import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
}

export const Input = ({ label, error, icon, prefix, suffix, className, id, ...props }: InputProps) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={id}
          className={clsx(
            'w-full py-2 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            prefix ? 'pl-9 pr-3' : suffix ? 'pl-3 pr-12' : 'px-3',
            error ? 'border-red-500' : 'border-slate-200',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-slate-400 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};
